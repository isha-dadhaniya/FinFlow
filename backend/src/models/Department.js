const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    budget: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
    workspace: { type: String, default: "business" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Department", departmentSchema);
