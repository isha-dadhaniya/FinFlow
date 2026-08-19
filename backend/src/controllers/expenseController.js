const Expense = require("../models/Expense");
const Transaction = require("../models/Transaction");
const Account = require("../models/Account");

const getExpenses = async (req, res) => {
  try {
    const { module, category, startDate, endDate } = req.query;
    const filter = { userId: req.user.id };
    if (module) filter.module = module;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createExpense = async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, userId: req.user.id });

    // 1. Deduct expense amount from linked Bank Account balance EXCEPT for Cash
    const isCash = (expense.paymentMethod || "").toLowerCase() === "cash" || expense.account === "Cash";
    const targetAccount = expense.account;

    if (!isCash && targetAccount) {
      await Account.findOneAndUpdate(
        {
          userId: req.user.id,
          $or: [{ name: targetAccount }, { nickname: targetAccount }, { bankName: targetAccount }],
        },
        { $inc: { balance: -Math.abs(Number(expense.amount) || 0) } }
      );
    }

    // 2. Sync into Transaction collection
    await Transaction.create({
      userId: req.user.id,
      title: expense.title,
      type: "expense",
      amount: Number(expense.amount) || 0,
      category: expense.category || "General",
      date: expense.date || new Date(),
      paymentMethod: expense.paymentMethod || "Bank Transfer",
      module: expense.module || "personal",
      status: "Completed",
      notes: expense.notes || (targetAccount && !isCash ? `Deducted from ${targetAccount}` : ""),
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateExpense = async (req, res) => {
  try {
    const oldExpense = await Expense.findOne({ _id: req.params.id, userId: req.user.id });
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    // Revert old account deduction if not cash
    const oldIsCash = (oldExpense?.paymentMethod || "").toLowerCase() === "cash" || oldExpense?.account === "Cash";
    if (oldExpense && !oldIsCash && oldExpense.account) {
      await Account.findOneAndUpdate(
        {
          userId: req.user.id,
          $or: [{ name: oldExpense.account }, { nickname: oldExpense.account }, { bankName: oldExpense.account }],
        },
        { $inc: { balance: Math.abs(Number(oldExpense.amount) || 0) } }
      );
    }

    // Apply new account deduction if not cash
    const newIsCash = (expense.paymentMethod || "").toLowerCase() === "cash" || expense.account === "Cash";
    if (!newIsCash && expense.account) {
      await Account.findOneAndUpdate(
        {
          userId: req.user.id,
          $or: [{ name: expense.account }, { nickname: expense.account }, { bankName: expense.account }],
        },
        { $inc: { balance: -Math.abs(Number(expense.amount) || 0) } }
      );
    }

    // Sync corresponding Transaction
    if (oldExpense) {
      await Transaction.findOneAndUpdate(
        { userId: req.user.id, title: oldExpense.title, type: "expense", amount: oldExpense.amount },
        {
          title: expense.title,
          amount: Number(expense.amount) || 0,
          category: expense.category || "General",
          date: expense.date,
          paymentMethod: expense.paymentMethod,
          module: expense.module || "personal",
          notes: expense.notes,
        }
      );
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    // Refund the deleted expense back to the bank account balance EXCEPT for Cash
    const isCash = (expense.paymentMethod || "").toLowerCase() === "cash" || expense.account === "Cash";
    if (!isCash && expense.account) {
      await Account.findOneAndUpdate(
        {
          userId: req.user.id,
          $or: [{ name: expense.account }, { nickname: expense.account }, { bankName: expense.account }],
        },
        { $inc: { balance: Math.abs(Number(expense.amount) || 0) } }
      );
    }

    // Delete corresponding Transaction
    await Transaction.findOneAndDelete({
      userId: req.user.id,
      title: expense.title,
      type: "expense",
      amount: expense.amount,
    });

    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense };
