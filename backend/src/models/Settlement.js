const mongoose = require("mongoose");

const settlementSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fromMember: { type: String, required: true },
    toMember: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "settled"], default: "pending" },
    settledDate: { type: Date, default: null },
    workspace: { type: String, default: "family" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settlement", settlementSchema);
