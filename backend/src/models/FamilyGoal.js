const mongoose = require("mongoose");

const familyGoalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    targetAmount: { type: Number, required: true, min: 0 },
    currentAmount: { type: Number, default: 0 },
    contributors: [{ name: String, amount: Number, date: { type: Date, default: Date.now } }],
    deadline: { type: Date },
    workspace: { type: String, default: "family" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FamilyGoal", familyGoalSchema);
