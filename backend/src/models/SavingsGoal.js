const mongoose = require("mongoose");

const contributionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  note: { type: String, default: "" },
  contributor: { type: String, default: "" },
  account: { type: String, default: "" },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
});

const savingsGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currentAmount: {
      type: Number,
      default: 0,
    },
    deadline: {
      type: Date,
    },
    icon: {
      type: String,
      default: "🎯",
    },
    color: {
      type: String,
      default: "#005B4F",
    },
    contributions: [contributionSchema],
    workspace: {
      type: String,
      enum: ["personal", "family", "business"],
      default: "personal",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SavingsGoal", savingsGoalSchema);
