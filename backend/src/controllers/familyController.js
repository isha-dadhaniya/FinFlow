const FamilyMember = require("../models/FamilyMember");
const Contribution = require("../models/Contribution");
const Expense = require("../models/Expense");
// Family Controller updated

// Family Members CRUD
const getMembers = async (req, res) => {
  try {
    const members = await FamilyMember.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createMember = async (req, res) => {
  try {
    const { name, relationship, email, role, spendingLimit, avatar } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Member name is required" });
    }
    const member = await FamilyMember.create({
      userId: req.user.id,
      name: name.trim(),
      relationship: relationship || "Other",
      email: email ? email.trim() : "",
      role: role || "Member",
      spendingLimit: spendingLimit ? Number(spendingLimit) : 0,
      avatar: avatar || "",
    });
    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateMember = async (req, res) => {
  try {
    const member = await FamilyMember.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.status(200).json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteMember = async (req, res) => {
  try {
    const member = await FamilyMember.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.status(200).json({ message: "Member removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Family Contributions
const getContributions = async (req, res) => {
  try {
    const contributions = await Contribution.find({ userId: req.user.id, type: "family" }).sort({ date: -1 });
    res.status(200).json(contributions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createContribution = async (req, res) => {
  try {
    const { memberId, memberName, amount, targetAmount, date, status } = req.body;
    const contribution = await Contribution.create({
      userId: req.user.id,
      memberId: memberId || null,
      memberName,
      amount,
      targetAmount: targetAmount || amount,
      date: date || new Date(),
      type: "family",
      status: status || "Paid",
    });
    res.status(201).json(contribution);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
  getContributions,
  createContribution,
};
