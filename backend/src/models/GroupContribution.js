const mongoose = require("mongoose");

const groupContributionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    groupName: {
      type: String,
      required: true,
      default: "General Group",
    },
    memberName: {
      type: String,
      required: true,
    },
    targetAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    contributedAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Partial", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GroupContribution", groupContributionSchema);
