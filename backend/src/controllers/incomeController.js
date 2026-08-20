const Income = require("../models/Income");
const Transaction = require("../models/Transaction");
const Account = require("../models/Account");

const getIncomes = async (req, res) => {
  try {
    const { workspace, module, category, startDate, endDate } = req.query;
    const activeWorkspace = workspace || module;
    const filter = { userId: req.user.id };
    if (activeWorkspace) {
      if (activeWorkspace === "personal") {
        filter.workspace = { $in: ["personal", null, undefined, ""] };
      } else {
        filter.workspace = activeWorkspace;
      }
    }
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    const incomes = await Income.find(filter).sort({ date: -1 });
    res.json(incomes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createIncome = async (req, res) => {
  try {
    const income = await Income.create({ ...req.body, userId: req.user.id });

    // 1. Automatically increment the linked Bank Account balance
    if (income.account) {
      await Account.findOneAndUpdate(
        { userId: req.user.id, name: income.account },
        { $inc: { balance: income.amount } }
      );
    }

    // 2. Sync into Transaction collection
    await Transaction.create({
      userId: req.user.id,
      title: income.title,
      type: "income",
      amount: Number(income.amount) || 0,
      category: income.source || income.category || "Salary",
      date: income.date || new Date(),
      paymentMethod: income.account || "Bank Transfer",
      module: income.workspace || "personal",
      status: "Completed",
      notes: income.notes || (income.account ? `Deposited to ${income.account}` : ""),
    });

    res.status(201).json(income);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateIncome = async (req, res) => {
  try {
    const oldIncome = await Income.findOne({ _id: req.params.id, userId: req.user.id });
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!income) return res.status(404).json({ message: "Income not found" });

    // Adjust bank balance difference
    if (oldIncome && income.account) {
      const diff = (Number(income.amount) || 0) - (Number(oldIncome.amount) || 0);
      if (diff !== 0) {
        await Account.findOneAndUpdate(
          { userId: req.user.id, name: income.account },
          { $inc: { balance: diff } }
        );
      }
    }

    // Sync corresponding Transaction
    if (oldIncome) {
      await Transaction.findOneAndUpdate(
        { userId: req.user.id, title: oldIncome.title, type: "income" },
        {
          title: income.title,
          amount: Number(income.amount) || 0,
          category: income.source || income.category || "Salary",
          date: income.date,
          paymentMethod: income.account || "Bank Transfer",
          module: income.workspace || "personal",
          notes: income.notes,
        }
      );
    }

    res.json(income);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteIncome = async (req, res) => {
  try {
    const income = await Income.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!income) return res.status(404).json({ message: "Income not found" });

    // Deduct the deleted income from the bank account balance
    if (income.account) {
      await Account.findOneAndUpdate(
        { userId: req.user.id, name: income.account },
        { $inc: { balance: -(Number(income.amount) || 0) } }
      );
    }

    // Delete corresponding Transaction
    await Transaction.findOneAndDelete({
      userId: req.user.id,
      title: income.title,
      type: "income",
    });

    res.json({ message: "Income deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getIncomes, createIncome, updateIncome, deleteIncome };
