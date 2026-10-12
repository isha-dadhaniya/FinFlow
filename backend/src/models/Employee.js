const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    employeeId: { type: String, default: "" },
    department: { type: String, default: "" },
    designation: { type: String, default: "" },
    manager: { type: String, default: "" },
    joiningDate: { type: Date },
    expenseLimit: { type: Number, default: 0 },
    paymentAccount: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    role: { type: String, enum: ["Owner", "Admin", "Finance", "Manager", "Employee", "Accountant"], default: "Employee" },
    workspace: { type: String, default: "business" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
