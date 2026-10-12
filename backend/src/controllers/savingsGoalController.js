const SavingsGoal = require("../models/SavingsGoal");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");

const getGoals = async (req, res) => {
  try {
    const { workspace } = req.query;
    const filter = { userId: req.user.id };
    if (workspace) filter.workspace = workspace;
    const goals = await SavingsGoal.find(filter).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createGoal = async (req, res) => {
  try {
    const goal = await SavingsGoal.create({ ...req.body, userId: req.user.id });
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateGoal = async (req, res) => {
  try {
    const goal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteGoal = async (req, res) => {
  try {
    const goal = await SavingsGoal.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    res.json({ message: "Goal deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addContribution = async (req, res) => {
  try {
    const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user.id });
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    const { amount, note, contributor, account } = req.body;
    const numAmount = Number(amount) || 0;

    let transaction = null;

    // 1. If a bank account is selected, deduct amount and record in Transactions
    if (account && account.trim() !== "" && account !== "Manual / Cash (No deduction)") {
      await Account.findOneAndUpdate(
        { userId: req.user.id, name: account },
        { $inc: { balance: -numAmount } }
      );

      transaction = await Transaction.create({
        userId: req.user.id,
        title: `Deposit: ${goal.name}`,
        type: "expense",
        amount: numAmount,
        category: "Savings & Investments",
        date: new Date(),
        paymentMethod: account,
        module: goal.workspace || "personal",
        status: "Completed",
        notes: note ? `${note} (Goal: ${goal.name})` : `Savings Goal deposit for "${goal.name}"`,
      });
    }

    // 2. Add contribution record to the goal
    goal.contributions.push({
      amount: numAmount,
      note: note || "",
      contributor: contributor || "",
      account: account || "",
      transactionId: transaction ? transaction._id : null,
      date: new Date(),
    });

    goal.currentAmount = goal.contributions.reduce((sum, c) => sum + c.amount, 0);
    await goal.save();

    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getGoals, createGoal, updateGoal, deleteGoal, addContribution };
