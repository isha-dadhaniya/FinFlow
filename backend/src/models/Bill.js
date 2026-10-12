const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      default: "Other",
    },
    dueDate: {
      type: Date,
      required: true,
    },
    frequency: {
      type: String,
      enum: ["once", "monthly", "quarterly", "yearly"],
      default: "monthly",
    },
    status: {
      type: String,
      enum: ["upcoming", "due", "paid", "overdue"],
      default: "upcoming",
    },
    account: {
      type: String,
      default: "",
    },
    reminder: {
      type: Boolean,
      default: true,
    },
    autopay: {
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

module.exports = mongoose.model("Bill", billSchema);
