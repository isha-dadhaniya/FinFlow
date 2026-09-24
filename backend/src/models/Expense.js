const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      default: "General",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      default: "Bank Transfer",
    },
    account: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    module: {
      type: String,
      enum: ["personal", "family", "business", "group"],
      default: "personal",
    },
    paidBy: {
      type: String,
      default: "You",
    },
    receipt: {
      type: String,
      default: "",
    },
    gstRate: {
      type: Number,
      default: 0,
    },
    gstAmount: {
      type: Number,
      default: 0,
    },
    department: {
      type: String,
      default: "General",
    },
    vendor: {
      type: String,
      default: "",
    },
    isAccountDeducted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);
