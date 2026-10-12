const mongoose = require("mongoose");

const familyMemberSchema = new mongoose.Schema(
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
    relationship: {
      type: String,
      default: "Other",
    },
    email: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      default: "Member",
    },
    spendingLimit: {
      type: Number,
      default: 0,
    },
    avatar: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

if (mongoose.models.FamilyMember) {
  delete mongoose.models.FamilyMember;
}

module.exports = mongoose.model("FamilyMember", familyMemberSchema);
