const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: [
        "citizen",
        "government",
        "admin",
      ],
      default: "citizen",
    },

    governmentProof: {
      type: String,
      default: "",
      trim: true,
    },

    governmentOfficerType: {
      type: String,
      enum: [
        "",
        "main_officer",
        "sub_officer",
      ],
      default: "",
    },

    /*
     * Phase 3:
     * Government officer jurisdiction.
     */
    jurisdictionDistrict: {
      type: String,
      default: "",
      trim: true,
    },

    jurisdictionArea: {
      type: String,
      default: "",
      trim: true,
    },

    verificationStatus: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "User",
  userSchema
);