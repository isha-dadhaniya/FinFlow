const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    gstNumber: { type: String, default: "" },
    contact: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^\d{10}$/.test(v);
        },
        message: "Contact number must be exactly 10 digits",
      },
    },
    email: { type: String, default: "" },
    category: { type: String, default: "General" },
    totalSpending: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    workspace: { type: String, default: "business" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);
