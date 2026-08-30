const mongoose = require("mongoose");

const emergencyAuditLogSchema =
  new mongoose.Schema(
    {
      emergencyId: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      action: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      source: {
        type: String,
        enum: [
          "SYSTEM",
          "AI",
          "WORKER",
          "OFFICER",
          "SIGNAL",
        ],
        default: "SYSTEM",
        index: true,
      },

      cameraId: {
        type: String,
        default: "",
        trim: true,
        index: true,
      },

      previousCameraId: {
        type: String,
        default: "",
        trim: true,
      },

      nextCameraId: {
        type: String,
        default: "",
        trim: true,
      },

      status: {
        type: String,
        default: "",
        trim: true,
      },

      priority: {
        type: String,
        default: "",
        trim: true,
      },

      priorityScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: null,
      },

      decision: {
        type: String,
        default: "",
        trim: true,
      },

      reason: {
        type: String,
        default: "",
        trim: true,
      },

      etaSeconds: {
        type: Number,
        min: 0,
        default: null,
      },

      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },

      actorUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      actorRole: {
        type: String,
        default: "",
        trim: true,
      },

      eventAt: {
        type: Date,
        default: Date.now,
        index: true,
      },
    },
    {
      timestamps: true,
    }
  );

emergencyAuditLogSchema.index({
  emergencyId: 1,
  eventAt: -1,
});

emergencyAuditLogSchema.index({
  emergencyId: 1,
  action: 1,
  eventAt: -1,
});

module.exports =
  mongoose.models.EmergencyAuditLog ||
  mongoose.model(
    "EmergencyAuditLog",
    emergencyAuditLogSchema
  );
