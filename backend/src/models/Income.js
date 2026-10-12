const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema(
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
    source: {
      type: String,
      default: "Salary",
    },
    category: {
      type: String,
      default: "Salary",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    account: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    recurring: {
      type: Boolean,
      default: false,
    },
    frequency: {
      type: String,
      enum: ["once", "monthly", "quarterly", "yearly"],
      default: "once",
    },
    workspace: {
      type: String,
      enum: ["personal", "family", "business"],
      default: "personal",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Income", incomeSchema);
