const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    gstNumber: { type: String, default: "" },
    contact: { type: String, default: "" },
    email: { type: String, default: "" },
    category: { type: String, default: "General" },
    totalSpending: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    workspace: { type: String, default: "business" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);
