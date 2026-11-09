const mongoose = require("mongoose");

const emergencyEventSchema =
  new mongoose.Schema(
    {
      emergencyId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
      },

      vehicleType: {
        type: String,
        enum: [
          "ambulance",
          "fire_truck",
          "police_vehicle",
        ],
        required: true,
      },

      source: {
        type: String,
        enum: [
          "WORKER_DECLARED",
          "AI_DETECTED",
        ],
        required: true,
      },

      sourceMode: {
        type: String,
        enum: ["LIVE", "DEMO"],
        default: "LIVE",
        index: true,
      },

      status: {
        type: String,
        enum: [
          "DETECTED",
          "TRACKING",
          "APPROACHING",
          "ACTIVE",
          "SEARCHING",
          "COMPLETED",
          "CANCELLED",
        ],
        default: "DETECTED",
        index: true,
      },

      /*
       * =====================================================
       * PHASE 22 — DYNAMIC PRIORITY
       * =====================================================
       */

      priority: {
        type: String,
        enum: [
          "NORMAL",
          "MEDIUM",
          "HIGH",
          "CRITICAL",
        ],
        default: "CRITICAL",
        index: true,
      },

      priorityScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      priorityBreakdown: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },

      priorityReasons: {
        type: [String],
        default: [],
      },

      priorityUpdatedAt: {
        type: Date,
        default: null,
      },

      currentCameraId: {
        type: String,
        trim: true,
        default: "",
        index: true,
      },

      previousCameraId: {
        type: String,
        trim: true,
        default: "",
      },

      startLocation: {
        name: {
          type: String,
          trim: true,
          default: "",
        },

        latitude: {
          type: Number,
          default: null,
        },

        longitude: {
          type: Number,
          default: null,
        },
      },

      destination: {
        name: {
          type: String,
          trim: true,
          default: "",
        },

        latitude: {
          type: Number,
          default: null,
        },

        longitude: {
          type: Number,
          default: null,
        },
      },

      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
      },

      /*
       * =====================================================
       * PHASE 17 — VISUAL RE-IDENTIFICATION
       * =====================================================
       */

      appearanceSignature: {
        type: [Number],
        default: [],
      },

      reidMatchScore: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
      },

      reidMethod: {
        type: String,
        trim: true,
        default: "",
      },

      startedAt: {
        type: Date,
        default: Date.now,
      },

      lastSeenAt: {
        type: Date,
        default: Date.now,
      },

      completedAt: {
        type: Date,
        default: null,
      },

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      routeCameraIds: {
        type: [String],
        default: [],
      },

      notes: {
        type: String,
        trim: true,
        default: "",
      },
    },

    {
      timestamps: true,
    }
  );

emergencyEventSchema.index({
  status: 1,
  lastSeenAt: -1,
});

emergencyEventSchema.index({
  priority: 1,
  status: 1,
  priorityUpdatedAt: -1,
});

module.exports =
  mongoose.models.EmergencyEvent ||
  mongoose.model(
    "EmergencyEvent",
    emergencyEventSchema
  );