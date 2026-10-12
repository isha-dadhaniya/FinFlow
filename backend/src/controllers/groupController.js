const mongoose = require("mongoose");
const SplitExpense = require("../models/SplitExpense");
const GroupContribution = require("../models/GroupContribution");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");

// Helper: deduct from bank account (supports ObjectId, name, nickname, or bankName)
const deductFromAccount = async (userId, accountIdentifier, amount) => {
  if (!accountIdentifier) return null;
  const numAmount = Math.abs(Number(amount) || 0);
  if (numAmount <= 0) return null;

  let query = { userId };
  if (mongoose.Types.ObjectId.isValid(accountIdentifier) && String(new mongoose.Types.ObjectId(accountIdentifier)) === String(accountIdentifier)) {
    query = { userId, _id: accountIdentifier };
  } else {
    const escaped = accountIdentifier.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    query = {
      userId,
      $or: [
        { name: accountIdentifier },
        { nickname: accountIdentifier },
        { bankName: accountIdentifier },
        { name: { $regex: new RegExp(`^${escaped}$`, "i") } },
        { nickname: { $regex: new RegExp(`^${escaped}$`, "i") } },
        { bankName: { $regex: new RegExp(`^${escaped}$`, "i") } },
      ],
    };
  }

  const updated = await Account.findOneAndUpdate(
    query,
    { $inc: { balance: -numAmount } },
    { returnDocument: "after" }
  );
  console.log(`[deductFromAccount] Deducted ₹${numAmount} from '${accountIdentifier}':`, updated ? `New balance: ₹${updated.balance} (Account: ${updated.name} - ${updated._id})` : "NOT FOUND");
  return updated;
};

// Helper: add back to bank account
const refundToAccount = async (userId, accountIdentifier, amount) => {
  if (!accountIdentifier) return null;
  const numAmount = Math.abs(Number(amount) || 0);
  if (numAmount <= 0) return null;

  let query = { userId };
  if (mongoose.Types.ObjectId.isValid(accountIdentifier) && String(new mongoose.Types.ObjectId(accountIdentifier)) === String(accountIdentifier)) {
    query = { userId, _id: accountIdentifier };
  } else {
    const escaped = accountIdentifier.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    query = {
      userId,
      $or: [
        { name: accountIdentifier },
        { nickname: accountIdentifier },
        { bankName: accountIdentifier },
        { name: { $regex: new RegExp(`^${escaped}$`, "i") } },
        { nickname: { $regex: new RegExp(`^${escaped}$`, "i") } },
        { bankName: { $regex: new RegExp(`^${escaped}$`, "i") } },
      ],
    };
  }

  const updated = await Account.findOneAndUpdate(
    query,
    { $inc: { balance: numAmount } },
    { returnDocument: "after" }
  );
  console.log(`[refundToAccount] Refunded ₹${numAmount} to '${accountIdentifier}':`, updated ? `New balance: ₹${updated.balance} (Account: ${updated.name} - ${updated._id})` : "NOT FOUND");
  return updated;
};

// Expense Split Calculator
const getSplits = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    const query = { userId: req.user.id };

    if (category) query.category = category;
    if (status === "Settled") query.isSettled = true;
    if (status === "Pending") query.isSettled = false;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { paidBy: { $regex: search, $options: "i" } },
        { "participants.name": { $regex: search, $options: "i" } },
      ];
    }

    const splits = await SplitExpense.find(query).sort({ date: -1 });
    res.status(200).json(splits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createSplit = async (req, res) => {
  try {
    const { title, totalAmount, category, date, paidBy, splitType, participants, paymentMethod, account } = req.body;

    const amountVal = Number(totalAmount) || 0;
    const rawParticipants = participants || [];
    
    let processedParticipants = [];
    if (splitType === "equal" && rawParticipants.length > 0) {
      const share = Number((amountVal / rawParticipants.length).toFixed(2));
      processedParticipants = rawParticipants.map((p) => ({
        name: typeof p === "string" ? p : p.name,
        amount: share,
        percentage: Number((100 / rawParticipants.length).toFixed(1)),
        isSettled: typeof p === "object" ? Boolean(p.isSettled) : false,
      }));
    } else if (splitType === "percentage" && rawParticipants.length > 0) {
      processedParticipants = rawParticipants.map((p) => {
        const pct = Number(p.percentage) || 0;
        const share = Number(((amountVal * pct) / 100).toFixed(2));
        return {
          name: p.name,
          amount: share,
          percentage: pct,
          isSettled: Boolean(p.isSettled),
        };
      });
    } else {
      processedParticipants = rawParticipants.map((p) => ({
        name: p.name,
        amount: Number(p.amount) || 0,
        percentage: amountVal > 0 ? Number(((Number(p.amount) / amountVal) * 100).toFixed(1)) : 0,
        isSettled: Boolean(p.isSettled),
      }));
    }

    const isAllSettled = processedParticipants.length > 0 && processedParticipants.every((p) => p.isSettled);

    const isCash = (paymentMethod || "").toLowerCase() === "cash";
    let targetAccount = isCash ? null : (account || null);

    // Automatic fallback: if payment is not cash and account wasn't passed, find the user's family bank account
    if (!isCash && !targetAccount) {
      const familyAcc = await Account.findOne({ userId: req.user.id, workspace: "family" }).sort({ createdAt: -1 });
      if (familyAcc) {
        targetAccount = familyAcc._id.toString();
      }
    }

    // Deduct from bank account if not cash
    let linkedAccountLabel = targetAccount;
    if (!isCash && targetAccount && amountVal > 0) {
      const updatedAcc = await deductFromAccount(req.user.id, targetAccount, amountVal);
      if (updatedAcc) {
        linkedAccountLabel = updatedAcc.nickname || updatedAcc.name || updatedAcc.bankName;
      }
    }

    const split = await SplitExpense.create({
      userId: req.user.id,
      title: title || "Shared Expense",
      totalAmount: amountVal,
      category: category || "Household",
      date: date || new Date(),
      paidBy: paidBy || "You",
      splitType: splitType || "equal",
      participants: processedParticipants,
      isSettled: isAllSettled,
      paymentMethod: paymentMethod || "Bank Transfer",
      account: linkedAccountLabel,
    });

    // Sync into Transaction collection with module: 'family'
    try {
      await Transaction.create({
        userId: req.user.id,
        title: split.title,
        type: "expense",
        amount: amountVal,
        category: split.category,
        date: split.date,
        paymentMethod: split.paymentMethod,
        module: "family",
        status: "Completed",
        notes: linkedAccountLabel && !isCash ? `Deducted from ${linkedAccountLabel}` : "Family Shared Expense",
      });
    } catch (tErr) {
      console.error("Transaction sync error:", tErr);
    }

    res.status(201).json(split);
  } catch (error) {
    console.error("createSplit error:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateSplit = async (req, res) => {
  try {
    const { title, totalAmount, category, date, paidBy, splitType, participants, paymentMethod, account } = req.body;
    const amountVal = Number(totalAmount) || 0;
    const rawParticipants = participants || [];

    // Get old split to revert old deduction
    const oldSplit = await SplitExpense.findOne({ _id: req.params.id, userId: req.user.id });
    if (!oldSplit) return res.status(404).json({ message: "Split expense not found" });

    // Revert old bank deduction if applicable
    const oldIsCash = (oldSplit.paymentMethod || "").toLowerCase() === "cash";
    if (!oldIsCash && oldSplit.account && oldSplit.totalAmount > 0) {
      await refundToAccount(req.user.id, oldSplit.account, oldSplit.totalAmount);
    }

    let processedParticipants = [];
    if (splitType === "equal" && rawParticipants.length > 0) {
      const share = Number((amountVal / rawParticipants.length).toFixed(2));
      processedParticipants = rawParticipants.map((p) => ({
        name: typeof p === "string" ? p : p.name,
        amount: share,
        percentage: Number((100 / rawParticipants.length).toFixed(1)),
        isSettled: typeof p === "object" ? Boolean(p.isSettled) : false,
      }));
    } else if (splitType === "percentage") {
      processedParticipants = rawParticipants.map((p) => ({
        name: p.name,
        amount: Number(((amountVal * (Number(p.percentage) || 0)) / 100).toFixed(2)),
        percentage: Number(p.percentage) || 0,
        isSettled: Boolean(p.isSettled),
      }));
    } else {
      processedParticipants = rawParticipants.map((p) => ({
        name: p.name,
        amount: Number(p.amount) || 0,
        percentage: amountVal > 0 ? Number(((Number(p.amount) / amountVal) * 100).toFixed(1)) : 0,
        isSettled: Boolean(p.isSettled),
      }));
    }

    const isAllSettled = processedParticipants.length > 0 && processedParticipants.every((p) => p.isSettled);
    const isCash = (paymentMethod || "").toLowerCase() === "cash";
    let targetAccount = isCash ? null : (account || null);

    // Automatic fallback: if payment is not cash and account wasn't passed, find the user's family bank account
    if (!isCash && !targetAccount) {
      const familyAcc = await Account.findOne({ userId: req.user.id, workspace: "family" }).sort({ createdAt: -1 });
      if (familyAcc) {
        targetAccount = familyAcc._id.toString();
      }
    }

    // Apply new bank deduction if not cash
    let linkedAccountLabel = targetAccount;
    if (!isCash && targetAccount && amountVal > 0) {
      const updatedAcc = await deductFromAccount(req.user.id, targetAccount, amountVal);
      if (updatedAcc) {
        linkedAccountLabel = updatedAcc.nickname || updatedAcc.name || updatedAcc.bankName;
      }
    }

    const split = await SplitExpense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        title,
        totalAmount: amountVal,
        category,
        date,
        paidBy,
        splitType,
        participants: processedParticipants,
        isSettled: isAllSettled,
        paymentMethod: paymentMethod || "Bank Transfer",
        account: linkedAccountLabel,
      },
      { returnDocument: "after" }
    );

    res.status(200).json(split);
  } catch (error) {
    console.error("updateSplit error:", error);
    res.status(500).json({ message: error.message });
  }
};

const toggleSettlement = async (req, res) => {
  try {
    const { participantIndex } = req.body;
    const split = await SplitExpense.findOne({ _id: req.params.id, userId: req.user.id });

    if (!split) return res.status(404).json({ message: "Split expense not found" });

    if (participantIndex !== undefined && split.participants[participantIndex]) {
      split.participants[participantIndex].isSettled = !split.participants[participantIndex].isSettled;
    } else {
      split.isSettled = !split.isSettled;
      split.participants.forEach((p) => (p.isSettled = split.isSettled));
    }

    // Check if all are settled
    split.isSettled = split.participants.every((p) => p.isSettled);

    await split.save();
    res.status(200).json(split);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteSplit = async (req, res) => {
  try {
    const split = await SplitExpense.findOne({ _id: req.params.id, userId: req.user.id });
    if (!split) return res.status(404).json({ message: "Split expense not found" });

    // Refund bank account balance if it was deducted
    const isCash = (split.paymentMethod || "").toLowerCase() === "cash";
    if (!isCash && split.account && split.totalAmount > 0) {
      await refundToAccount(req.user.id, split.account, split.totalAmount);
    }

    await SplitExpense.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.status(200).json({ message: "Split expense deleted" });
  } catch (error) {
    console.error("deleteSplit error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Group Contributions
const getGroupContributions = async (req, res) => {
  try {
    const contributions = await GroupContribution.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(contributions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createGroupContribution = async (req, res) => {
  try {
    const { groupName, memberName, targetAmount, contributedAmount, status } = req.body;
    const target = Number(targetAmount) || 0;
    const contributed = Number(contributedAmount) || 0;

    let computedStatus = status;
    if (!computedStatus) {
      if (contributed >= target && target > 0) computedStatus = "Completed";
      else if (contributed > 0) computedStatus = "Partial";
      else computedStatus = "Pending";
    }

    const contribution = await GroupContribution.create({
      userId: req.user.id,
      groupName: groupName || "Trip & Event",
      memberName,
      targetAmount: target,
      contributedAmount: contributed,
      status: computedStatus,
    });

    res.status(201).json(contribution);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSplits,
  createSplit,
  updateSplit,
  toggleSettlement,
  deleteSplit,
  getGroupContributions,
  createGroupContribution,
};
