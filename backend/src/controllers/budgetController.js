const Budget = require("../models/Budget");
const Expense = require("../models/Expense");
const SplitExpense = require("../models/SplitExpense");

// Get monthly budget info — strictly filtered by module
const getBudgetStatus = async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();
    const mod = (req.query.module || "personal").toLowerCase();

    // STRICT: only fetch budgets matching this exact module
    const budgets = await Budget.find({ userId: req.user.id, month, year, module: mod });

    let overallBudget = budgets.find((b) => b.category === "Overall");
    if (!overallBudget) {
      overallBudget = { _id: "default", month, year, category: "Overall", limitAmount: 0, alertsEnabled: true, module: mod };
    }

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // STRICT: only count expenses that belong to this module
    let expenses = [];
    let splits = [];

    if (mod === "family") {
      // Family: count family-tagged expenses + shared split expenses
      expenses = await Expense.find({ userId: req.user.id, module: "family", date: { $gte: startOfMonth, $lte: endOfMonth } });
      try { splits = await SplitExpense.find({ userId: req.user.id, date: { $gte: startOfMonth, $lte: endOfMonth } }); } catch (_) {}
    } else {
      // Personal: count personal expenses only (including legacy ones without module field)
      expenses = await Expense.find({
        userId: req.user.id,
        module: { $in: ["personal", null, undefined] },
        date: { $gte: startOfMonth, $lte: endOfMonth },
      });
      // Also catch docs where module field doesn't exist at all
      const legacyExpenses = await Expense.find({
        userId: req.user.id,
        module: { $exists: false },
        date: { $gte: startOfMonth, $lte: endOfMonth },
      });
      // Merge without duplicates
      const ids = new Set(expenses.map(e => e._id.toString()));
      legacyExpenses.forEach(e => { if (!ids.has(e._id.toString())) expenses.push(e); });
    }

    const totalExpenseSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalSplitSpent = splits.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
    const totalSpent = totalExpenseSpent + totalSplitSpent;

    const categoryBreakdown = {};
    expenses.forEach((e) => { categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + (Number(e.amount) || 0); });
    splits.forEach((s) => { categoryBreakdown[s.category] = (categoryBreakdown[s.category] || 0) + (Number(s.totalAmount) || 0); });

    const categoryBudgets = budgets
      .filter((b) => b.category !== "Overall")
      .map((b) => ({
        _id: b._id,
        category: b.category,
        limitAmount: b.limitAmount,
        spentAmount: categoryBreakdown[b.category] || 0,
        remaining: Math.max(0, b.limitAmount - (categoryBreakdown[b.category] || 0)),
        percentUsed: Math.round(((categoryBreakdown[b.category] || 0) / (b.limitAmount || 1)) * 100),
      }));

    const totalLimit = overallBudget.limitAmount || 0;
    const remaining = Math.max(0, totalLimit - totalSpent);
    const percentUsed = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : (totalSpent > 0 ? 100 : 0);

    let status = "Normal";
    if (percentUsed >= 100) status = "Over-budget";
    else if (percentUsed >= 80) status = "Warning";

    res.status(200).json({ budget: overallBudget, budgets, categoryBudgets, totalLimit, totalSpent, remaining, percentUsed, status, categoryBreakdown });
  } catch (error) {
    console.error("getBudgetStatus error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Set / Update budget — strictly scoped by module
const setBudget = async (req, res) => {
  try {
    const { month, year, limitAmount, alertsEnabled, category, module: reqModule } = req.body;
    const now = new Date();

    const targetMonth = parseInt(month) || now.getMonth() + 1;
    const targetYear = parseInt(year) || now.getFullYear();
    const targetCategory = category || "Overall";
    const mod = (reqModule || "personal").toLowerCase();

    console.log(`[setBudget] module=${mod}, category=${targetCategory}, limit=${limitAmount}, month=${targetMonth}, year=${targetYear}`);

    // STRICT: find only budget with exact module match
    let budget = await Budget.findOne({
      userId: req.user.id,
      month: targetMonth,
      year: targetYear,
      category: targetCategory,
      module: mod,
    });

    if (budget) {
      budget.limitAmount = Number(limitAmount);
      if (alertsEnabled !== undefined) budget.alertsEnabled = alertsEnabled;
      await budget.save();
      console.log(`[setBudget] Updated existing budget ${budget._id} for module=${mod}`);
    } else {
      budget = await Budget.create({
        userId: req.user.id,
        month: targetMonth,
        year: targetYear,
        category: targetCategory,
        module: mod,
        limitAmount: Number(limitAmount),
        alertsEnabled: alertsEnabled !== undefined ? alertsEnabled : true,
      });
      console.log(`[setBudget] Created new budget ${budget._id} for module=${mod}`);
    }

    res.status(200).json(budget);
  } catch (error) {
    console.error("setBudget error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete budget entry
const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!budget) return res.status(404).json({ message: "Budget entry not found" });
    res.status(200).json({ message: "Budget entry deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Budget History — strictly filtered by module
const getBudgetHistory = async (req, res) => {
  try {
    const now = new Date();
    const mod = (req.query.module || "personal").toLowerCase();
    const history = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthName = d.toLocaleString("default", { month: "short", year: "numeric" });

      // STRICT module match
      const budget = await Budget.findOne({ userId: req.user.id, month: m, year: y, category: "Overall", module: mod });

      const startOfMonth = new Date(y, m - 1, 1);
      const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);

      let expenses = [];
      let splits = [];

      if (mod === "family") {
        expenses = await Expense.find({ userId: req.user.id, module: "family", date: { $gte: startOfMonth, $lte: endOfMonth } });
        try { splits = await SplitExpense.find({ userId: req.user.id, date: { $gte: startOfMonth, $lte: endOfMonth } }); } catch (_) {}
      } else {
        expenses = await Expense.find({
          userId: req.user.id,
          module: { $in: ["personal", null, undefined] },
          date: { $gte: startOfMonth, $lte: endOfMonth },
        });
        const legacyExpenses = await Expense.find({ userId: req.user.id, module: { $exists: false }, date: { $gte: startOfMonth, $lte: endOfMonth } });
        const ids = new Set(expenses.map(e => e._id.toString()));
        legacyExpenses.forEach(e => { if (!ids.has(e._id.toString())) expenses.push(e); });
      }

      const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) + splits.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);

      if (budget || totalSpent > 0) {
        const budgetAmount = budget ? budget.limitAmount : 0;
        const rem = Math.max(0, budgetAmount - totalSpent);
        const pctUsed = budgetAmount > 0 ? Math.round((totalSpent / budgetAmount) * 100) : (totalSpent > 0 ? 100 : 0);
        let st = "Normal";
        if (pctUsed >= 100) st = "Over-budget";
        else if (pctUsed >= 80) st = "Warning";
        history.push({ month: monthName, monthNum: m, year: y, budgetAmount, totalSpent, remaining: rem, percentUsed: pctUsed, status: st });
      }
    }

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBudgetStatus, setBudget, deleteBudget, getBudgetHistory };
