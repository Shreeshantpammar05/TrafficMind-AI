const mongoose = require("mongoose");

const cameraDetectionSchema =
  new mongoose.Schema(
    {
      cameraId: {
        type: String,
        required: true,
        trim: true,
      },

      vehicleCount: {
        type: Number,
        default: 0,
      },

      congestion: {
        type: String,
        enum: [
          "LOW",
          "MEDIUM",
          "HIGH",
        ],
        default: "LOW",
      },

      averageConfidence: {
        type: Number,
        default: 0,
      },

      maxConfidence: {
        type: Number,
        default: 0,
      },

      emergencyDetected: {
        type: Boolean,
        default: false,
      },

      accidentDetected: {
        type: Boolean,
        default: false,
      },

      accidentSeverity: {
        type: String,
        default: "NONE",
      },

      recommendation: {
        type: String,
        default: "Traffic Flow Normal",
      },

      detectedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );

cameraDetectionSchema.index(
  { cameraId: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "CameraDetection",
  cameraDetectionSchema
);