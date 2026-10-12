const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  percentage: { type: Number, default: 0 },
  isSettled: { type: Boolean, default: false },
});

const splitExpenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      default: "Household",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    paidBy: {
      type: String,
      required: true,
      default: "You",
    },
    splitType: {
      type: String,
      enum: ["equal", "percentage", "custom"],
      default: "equal",
    },
    participants: [participantSchema],
    isSettled: {
      type: Boolean,
      default: false,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Bank Transfer", "Credit Card", "Debit Card", "Net Banking", "Other"],
      default: "Bank Transfer",
    },
    account: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SplitExpense", splitExpenseSchema);
