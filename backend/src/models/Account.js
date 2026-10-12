const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bankName: {
      type: String,
      default: "",
      trim: true,
    },
    accountHolderName: {
      type: String,
      default: "",
      trim: true,
    },
    accountNumber: {
      type: String,
      default: "",
      trim: true,
    },
    ifscCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    branchName: {
      type: String,
      default: "",
      trim: true,
    },
    nickname: {
      type: String,
      default: "",
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      default: "Savings",
    },
    balance: {
      type: Number,
      default: 0,
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    color: {
      type: String,
      default: "#005B4F",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    workspace: {
      type: String,
      enum: ["personal", "family", "business"],
      default: "personal",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Account", accountSchema);
