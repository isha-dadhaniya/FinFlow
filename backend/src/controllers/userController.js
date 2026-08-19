const User = require("../models/User");
const bcrypt = require("bcryptjs");

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, mobile, address, dob } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, mobile, address, dob },
      { new: true }
    ).select("-password");

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@\-_!#$%^&*(),.?":{}|<>])/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: "Password must contain uppercase, lowercase, digit, and special character (@, -, _, etc.)"
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const Expense = require("../models/Expense");
const Budget = require("../models/Budget");
const SplitExpense = require("../models/SplitExpense");
const Transaction = require("../models/Transaction");

const deleteProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    await User.findByIdAndDelete(userId);
    await Expense.deleteMany({ userId });
    await Budget.deleteMany({ userId });
    await SplitExpense.deleteMany({ userId });
    await Transaction.deleteMany({ userId });

    res.status(200).json({ message: "Account and profile deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteProfile,
};
