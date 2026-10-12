const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: {
      type: Number, // 1 to 12
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
      default: "Overall",
    },
    limitAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    alertsEnabled: {
      type: Boolean,
      default: true,
    },
    module: {
      type: String,
      enum: ["personal", "family", "business", "group"],
      default: "personal",
      required: true,
    },
  },
  { timestamps: true }
);

// Enforce uniqueness: one budget per user+month+year+category+module
budgetSchema.index({ userId: 1, month: 1, year: 1, category: 1, module: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);
