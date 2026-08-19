const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    client: { type: String, default: "" },
    budget: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    employees: [{ type: String }],
    expenses: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "completed", "on-hold"], default: "active" },
    workspace: { type: String, default: "business" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
