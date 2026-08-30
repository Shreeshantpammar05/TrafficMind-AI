const mongoose = require("mongoose");

/*
 * Phase 18
 *
 * Stores which cameras are currently inside the
 * emergency awareness radius and when they were notified.
 *
 * One record per emergency + affected camera.
 */

const emergencyPropagationSchema =
  new mongoose.Schema(
    {
      emergencyId: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      cameraId: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      distanceMeters: {
        type: Number,
        required: true,
        min: 0,
      },

      zone: {
        type: String,
        enum: [
          "CRITICAL",
          "HIGH",
          "AWARE",
        ],
        default: "AWARE",
      },

      priorityScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      active: {
        type: Boolean,
        default: true,
        index: true,
      },

      firstDetectedAt: {
        type: Date,
        default: Date.now,
      },

      lastUpdatedAt: {
        type: Date,
        default: Date.now,
      },

      notifiedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

emergencyPropagationSchema.index(
  {
    emergencyId: 1,
    cameraId: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "EmergencyPropagation",
  emergencyPropagationSchema
);