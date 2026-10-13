const mongoose = require("mongoose");

const reimbursementSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    employeeName: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, default: "" },
    category: { type: String, default: "Other" },
    receipts: [{ type: String }],
    status: { type: String, enum: ["Draft", "Submitted", "Under Review", "Approved", "Rejected", "Paid"], default: "Draft" },
    submittedDate: { type: Date },
    approvedDate: { type: Date },
    paidDate: { type: Date },
    workspace: { type: String, default: "business" },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    projectName: { type: String, default: "" },
    claimType: { type: String, enum: ["claim", "project_expense"], default: "claim" },
    rejectionReason: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reimbursement", reimbursementSchema);
