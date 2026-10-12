const mongoose = require("mongoose");

const contributionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyMember",
      default: null,
    },
    memberName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    targetAmount: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    month: {
      type: String,
      default: () => new Date().toLocaleString("default", { month: "short" }),
    },
    year: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    type: {
      type: String,
      enum: ["family", "group"],
      default: "family",
    },
    status: {
      type: String,
      enum: ["Paid", "Pending", "Overdue"],
      default: "Paid",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contribution", contributionSchema);
