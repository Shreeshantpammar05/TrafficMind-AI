const mongoose = require("mongoose");

const OfficerEmergencyAlertSchema =
  new mongoose.Schema(
    {
      emergencyId: {
        type: String,
        required: true,
        index: true,
      },

      recipientUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      recipientName: {
        type: String,
        required: true,
        trim: true,
      },

      officerType: {
        type: String,
        enum: [
          "main_officer",
          "sub_officer",
        ],
        required: true,
        index: true,
      },

      jurisdictionDistrict: {
        type: String,
        default: "",
        trim: true,
        index: true,
      },

      jurisdictionArea: {
        type: String,
        default: "",
        trim: true,
        index: true,
      },

      emergencyType: {
        type: String,
        required: true,
        trim: true,
      },

      priority: {
        type: String,
        enum: [
          "CRITICAL",
          "HIGH",
          "MEDIUM",
        ],
        default: "CRITICAL",
      },

      currentCameraId: {
        type: String,
        required: true,
        trim: true,
      },

      nextCameraId: {
        type: String,
        default: "",
        trim: true,
      },

      etaSeconds: {
        type: Number,
        default: null,
      },

      etaAt: {
        type: Date,
        default: null,
      },

      locationName: {
        type: String,
        default: "",
        trim: true,
      },

      latitude: {
        type: Number,
        default: null,
      },

      longitude: {
        type: Number,
        default: null,
      },

      distanceMeters: {
        type: Number,
        default: null,
      },

      source: {
        type: String,
        enum: [
          "AI_EMERGENCY",
          "PROPAGATION",
          "HANDOFF",
        ],
        default: "AI_EMERGENCY",
      },

      status: {
        type: String,
        enum: [
          "SENT",
          "ACKNOWLEDGED",
          "RESPONDING",
          "RESOLVED",
        ],
        default: "SENT",
        index: true,
      },

      isRead: {
        type: Boolean,
        default: false,
        index: true,
      },

      sentAt: {
        type: Date,
        default: Date.now,
      },

      acknowledgedAt: {
        type: Date,
        default: null,
      },

      resolvedAt: {
        type: Date,
        default: null,
      },

      notes: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      timestamps: true,
    }
  );

OfficerEmergencyAlertSchema.index(
  {
    emergencyId: 1,
    recipientUserId: 1,
  },
  {
    unique: true,
  }
);

module.exports =
  mongoose.models.OfficerEmergencyAlert ||
  mongoose.model(
    "OfficerEmergencyAlert",
    OfficerEmergencyAlertSchema
  );