const Expense = require("../models/Expense");
const Transaction = require("../models/Transaction");
const Account = require("../models/Account");
const mongoose = require("mongoose");

const escapeRegex = (string) => {
  return string ? string.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&") : "";
};

const adjustAccountForExpense = async (userId, targetAccount, deltaAmount, module = null) => {
  if (!userId || deltaAmount === 0) return null;

  const isObjectId = targetAccount && mongoose.Types.ObjectId.isValid(targetAccount);
  const orConditions = [];

  if (isObjectId) {
    orConditions.push({ _id: targetAccount });
  }

  // Payment methods and generic terms that are NOT unique bank account names
  const genericMethods = [
    "bank transfer",
    "corporate card",
    "credit card",
    "debit card",
    "net banking",
    "upi",
    "online",
    "card",
    "other",
    "petty cash",
    "cash",
  ];

  const targetStr = (typeof targetAccount === "string" ? targetAccount.trim() : "");
  const isGeneric = !targetStr || genericMethods.includes(targetStr.toLowerCase());

  if (targetStr && !isGeneric) {
    const escaped = escapeRegex(targetStr);
    orConditions.push({ name: targetStr });
    orConditions.push({ nickname: targetStr });
    orConditions.push({ bankName: targetStr });
    orConditions.push({ name: new RegExp(`^${escaped}$`, "i") });
    orConditions.push({ nickname: new RegExp(`^${escaped}$`, "i") });
    orConditions.push({ bankName: new RegExp(`^${escaped}$`, "i") });
  }

  let account = null;

  // 1. Try finding by explicit name/ID within the specific workspace (e.g. "business")
  if (module && orConditions.length > 0) {
    account = await Account.findOne({ userId, workspace: module, $or: orConditions });
  }

  // 2. Try finding by explicit name/ID across all user accounts
  if (!account && orConditions.length > 0) {
    account = await Account.findOne({ userId, $or: orConditions });
  }

  // 3. Fallback: Find the default or primary account within the specific workspace
  if (!account && module) {
    account = await Account.findOne({ userId, workspace: module }).sort({ isDefault: -1, createdAt: 1 });
  }

  // 4. Fallback: Find the user's primary/default bank account across ANY workspace
  if (!account) {
    account = await Account.findOne({ userId }).sort({ isDefault: -1, createdAt: 1 });
  }

  // Apply balance adjustment directly and save
  if (account) {
    account.balance = (Number(account.balance) || 0) + deltaAmount;
    await account.save();
    return account;
  }

  return null;
};

const getExpenses = async (req, res) => {
  try {
    const { module, workspace, category, startDate, endDate } = req.query;
    const activeModule = module || workspace;
    const filter = { userId: req.user.id };
    if (activeModule) {
      if (activeModule === "personal") {
        filter.module = { $in: ["personal", null, undefined, ""] };
      } else {
        filter.module = activeModule;
      }
    }
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
    const expenseData = { ...req.body, userId: req.user.id };
    const activeModule = expenseData.module || (req.query && req.query.module) || "personal";
    expenseData.module = activeModule;

    // Check if this is an explicit cash transaction
    const isCash =
      (expenseData.paymentMethod || "").toLowerCase() === "cash" ||
      (expenseData.paymentMethod || "").toLowerCase() === "petty cash" ||
      (expenseData.account || "").toLowerCase() === "cash" ||
      (expenseData.account || "").toLowerCase() === "petty cash" ||
      expenseData.account === "Cash Drawer / Petty Cash (No Bank Deduction)";

    const amount = Number(expenseData.amount) || 0;
    const targetAccount = isCash ? null : (expenseData.account || expenseData.paymentMethod);

    let updatedAccount = null;
    if (!isCash && amount > 0) {
      updatedAccount = await adjustAccountForExpense(req.user.id, targetAccount, -amount, activeModule);
      if (updatedAccount) {
        expenseData.account = updatedAccount.nickname || updatedAccount.name || updatedAccount.bankName;
        expenseData.isAccountDeducted = true;
      }
    }

    const expense = await Expense.create(expenseData);

    // 2. Sync into Transaction collection
    await Transaction.create({
      userId: req.user.id,
      title: expense.title,
      type: "expense",
      amount: amount,
      category: expense.category || "General",
      date: expense.date || new Date(),
      paymentMethod: updatedAccount
        ? (updatedAccount.nickname || updatedAccount.name || updatedAccount.bankName)
        : (expense.paymentMethod || (activeModule === "business" ? "Corporate Bank" : "Bank Transfer")),
      module: activeModule,
      status: "Completed",
      notes: expense.notes || (updatedAccount ? `Deducted from ${updatedAccount.nickname || updatedAccount.name || updatedAccount.bankName}` : ""),
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateExpense = async (req, res) => {
  try {
    const oldExpense = await Expense.findOne({ _id: req.params.id, userId: req.user.id });
    if (!oldExpense) return res.status(404).json({ message: "Expense not found" });

    const activeModule = req.body.module || oldExpense.module || "personal";
    const updateData = { ...req.body, module: activeModule };

    // Check if old expense was ever deducted from a bank account
    const oldWasDeducted = Boolean(oldExpense.isAccountDeducted);

    const oldIsCash =
      (oldExpense.paymentMethod || "").toLowerCase() === "cash" ||
      (oldExpense.paymentMethod || "").toLowerCase() === "petty cash" ||
      (oldExpense.account || "").toLowerCase() === "cash" ||
      (oldExpense.account || "").toLowerCase() === "petty cash" ||
      oldExpense.account === "Cash Drawer / Petty Cash (No Bank Deduction)";

    const oldAmount = Number(oldExpense.amount) || 0;
    const oldTarget = oldIsCash ? null : (oldExpense.account || oldExpense.paymentMethod);

    console.log("=== UPDATE EXPENSE DEBUG ===");
    console.log("Old expense:", { title: oldExpense.title, amount: oldAmount, account: oldExpense.account, paymentMethod: oldExpense.paymentMethod, isAccountDeducted: oldExpense.isAccountDeducted, oldIsCash, oldWasDeducted });
    console.log("Request body:", { amount: req.body.amount, account: req.body.account, paymentMethod: req.body.paymentMethod, module: req.body.module });

    // Step 1: ONLY revert/refund if old expense was ACTUALLY deducted previously
    if (oldWasDeducted && !oldIsCash && oldAmount > 0) {
      console.log("Step 1: Refunding old amount:", oldAmount, "to:", oldTarget);
      await adjustAccountForExpense(req.user.id, oldTarget, oldAmount, oldExpense.module);
    } else {
      console.log("Step 1: SKIPPING refund (oldWasDeducted:", oldWasDeducted, ", oldIsCash:", oldIsCash, ")");
    }

    // Step 2: Apply new deduction if new expense is not cash
    const newPaymentMethod = updateData.paymentMethod || oldExpense.paymentMethod || "";
    const newAccountField = updateData.account !== undefined ? updateData.account : (oldExpense.account || "");

    const newIsCash =
      newPaymentMethod.toLowerCase() === "cash" ||
      newPaymentMethod.toLowerCase() === "petty cash" ||
      newAccountField.toLowerCase() === "cash" ||
      newAccountField.toLowerCase() === "petty cash" ||
      newAccountField === "Cash Drawer / Petty Cash (No Bank Deduction)";

    const newAmount = Number(updateData.amount !== undefined ? updateData.amount : oldExpense.amount) || 0;
    const newTarget = newIsCash
      ? null
      : (updateData.account !== undefined ? updateData.account : oldExpense.account) ||
        updateData.paymentMethod ||
        oldExpense.paymentMethod;

    console.log("Step 2: New deduction check:", { newIsCash, newAmount, newTarget, newPaymentMethod, newAccountField });

    let updatedAccount = null;
    if (!newIsCash && newAmount > 0) {
      console.log("Step 2: DEDUCTING", newAmount, "from account:", newTarget, "module:", activeModule);
      updatedAccount = await adjustAccountForExpense(req.user.id, newTarget, -newAmount, activeModule);
      console.log("Step 2: adjustAccountForExpense returned:", updatedAccount ? { name: updatedAccount.name, nickname: updatedAccount.nickname, balance: updatedAccount.balance } : "NULL - NO ACCOUNT FOUND!");
      updateData.isAccountDeducted = Boolean(updatedAccount);
      if (updatedAccount) {
        updateData.account = updatedAccount.nickname || updatedAccount.name || updatedAccount.bankName;
      }
    } else {
      console.log("Step 2: SKIPPING deduction (newIsCash:", newIsCash, ", newAmount:", newAmount, ")");
      updateData.isAccountDeducted = false;
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateData,
      { new: true }
    );

    console.log("Step 3: Expense saved:", { title: expense.title, amount: expense.amount, account: expense.account, isAccountDeducted: expense.isAccountDeducted });
    console.log("=== END UPDATE EXPENSE DEBUG ===");

    // Sync corresponding Transaction — upsert so old expenses without a Transaction also get one
    const accountDisplayName = updatedAccount
      ? (updatedAccount.nickname || updatedAccount.name || updatedAccount.bankName)
      : (expense.account || expense.paymentMethod);

    console.log("Step 4: Syncing Transaction with paymentMethod:", accountDisplayName);

    await Transaction.findOneAndUpdate(
      { userId: req.user.id, title: oldExpense.title, type: "expense" },
      {
        title: expense.title,
        type: "expense",
        amount: newAmount,
        category: expense.category || "General",
        date: expense.date || new Date(),
        paymentMethod: accountDisplayName,
        module: activeModule,
        status: "Completed",
        notes: expense.notes || `Deducted from ${accountDisplayName}`,
      },
      { upsert: true, new: true }
    );

    res.json(expense);
  } catch (error) {
    console.error("UPDATE EXPENSE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    // ONLY refund if it was actually deducted from the bank account previously
    const wasDeducted = Boolean(expense.isAccountDeducted);
    const isCash =
      (expense.paymentMethod || "").toLowerCase() === "cash" ||
      (expense.paymentMethod || "").toLowerCase() === "petty cash" ||
      (expense.account || "").toLowerCase() === "cash" ||
      (expense.account || "").toLowerCase() === "petty cash" ||
      expense.account === "Cash Drawer / Petty Cash (No Bank Deduction)";

    const amount = Number(expense.amount) || 0;
    const target = isCash ? null : (expense.account || expense.paymentMethod);

    if (wasDeducted && !isCash && amount > 0) {
      await adjustAccountForExpense(req.user.id, target, amount, expense.module);
    }

    // Delete corresponding Transaction
    await Transaction.findOneAndDelete({
      userId: req.user.id,
      title: expense.title,
      type: "expense",
      amount: expense.amount,
    });

    res.json({ message: "Expense deleted and bank balance restored" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reconcileExpenses = async (req, res) => {
  try {
    const { module = "business" } = req.body || {};
    const userId = req.user.id;

    // Find all expenses in this workspace that haven't been deducted from a bank account yet
    const unDeducted = await Expense.find({
      userId,
      module,
      isAccountDeducted: { $ne: true },
    });

    let totalDeducted = 0;
    let count = 0;

    for (const exp of unDeducted) {
      const isCash =
        (exp.paymentMethod || "").toLowerCase() === "cash" ||
        (exp.paymentMethod || "").toLowerCase() === "petty cash" ||
        (exp.account || "").toLowerCase() === "cash" ||
        (exp.account || "").toLowerCase() === "petty cash" ||
        exp.account === "Cash Drawer / Petty Cash (No Bank Deduction)";

      if (isCash) continue;

      const numAmount = Number(exp.amount) || 0;
      if (numAmount <= 0) continue;

      const targetAccount = exp.account || exp.paymentMethod;
      const updatedAccount = await adjustAccountForExpense(userId, targetAccount, -numAmount, module);

      if (updatedAccount) {
        exp.isAccountDeducted = true;
        exp.account = updatedAccount.nickname || updatedAccount.name || updatedAccount.bankName;
        await exp.save();

        // Also ensure matching Transaction exists
        await Transaction.findOneAndUpdate(
          { userId, title: exp.title, type: "expense", amount: exp.amount },
          {
            title: exp.title,
            type: "expense",
            amount: exp.amount,
            category: exp.category || "General",
            date: exp.date || new Date(),
            paymentMethod: updatedAccount.nickname || updatedAccount.name || updatedAccount.bankName,
            module,
            status: "Completed",
            notes: exp.notes || `Deducted from ${updatedAccount.nickname || updatedAccount.name || updatedAccount.bankName}`,
          },
          { upsert: true }
        );

        totalDeducted += numAmount;
        count++;
      }
    }

    res.json({
      message: `Successfully reconciled ${count} old expense(s), deducting ₹${totalDeducted.toLocaleString("en-IN")} from corporate bank account.`,
      count,
      totalDeducted,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense, reconcileExpenses };
