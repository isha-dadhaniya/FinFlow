const mongoose = require("mongoose");

const emiPaymentSchema = new mongoose.Schema({
  dueDate: { type: Date, required: true },
  paidDate: { type: Date, default: null },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["upcoming", "due", "paid", "overdue"],
    default: "upcoming",
  },
  paymentMethod: { type: String, default: "" },
  paymentProof: { type: String, default: "" },
  markedByUser: { type: Boolean, default: false },
});

const loanSchema = new mongoose.Schema(
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
    loanType: {
      type: String,
      default: "Personal Loan",
    },
    lender: {
      type: String,
      default: "",
    },
    principal: {
      type: Number,
      required: true,
      min: 0,
    },
    interestRate: {
      type: Number,
      default: 0,
    },
    tenure: {
      type: Number, // in months
      required: true,
    },
    emi: {
      type: Number,
      required: true,
    },
    emiDay: {
      type: Number,
      default: 1, // 1st of every month
    },
    autoDebit: {
      type: Boolean,
      default: false, // User permission for auto-debit
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    paymentAccount: {
      type: String,
      default: "",
    },
    startDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
    },
    totalInterest: {
      type: Number,
      default: 0,
    },
    totalPayable: {
      type: Number,
      default: 0,
    },
    paidEmis: {
      type: Number,
      default: 0,
    },
    remainingEmis: {
      type: Number,
      default: 0,
    },
    outstandingAmount: {
      type: Number,
      default: 0,
    },
    emiSchedule: [emiPaymentSchema],
    status: {
      type: String,
      enum: ["active", "completed", "defaulted"],
      default: "active",
    },
    workspace: {
      type: String,
      enum: ["personal", "family", "business"],
      default: "personal",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Loan", loanSchema);
