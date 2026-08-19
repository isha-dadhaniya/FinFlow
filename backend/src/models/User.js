const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobile: {
      type: String,
    },
    address: {
      type: String,
      default: "",
    },
    dob: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    selectedModes: {
      type: [
        {
          type: String,
          enum: ["personal", "family", "business"],
        },
      ],
      default: [],
    },
    defaultMode: {
      type: String,
      enum: ["personal", "family", "business"],
      default: null,
    },
    // Keep accountType for backward compatibility during migration
    accountType: {
      type: String,
      enum: ["personal", "family", "business"],
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
