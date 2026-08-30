const mongoose = require("mongoose");

const cameraDetectionHistorySchema =
  new mongoose.Schema(
    {
      cameraId: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      vehicleCount: {
        type: Number,
        default: 0,
        min: 0,
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
        min: 0,
        max: 1,
      },

      maxConfidence: {
        type: Number,
        default: 0,
        min: 0,
        max: 1,
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
        trim: true,
      },

      recommendation: {
        type: String,
        default: "Traffic Flow Normal",
        trim: true,
      },

      detectedAt: {
        type: Date,
        default: Date.now,
        index: true,
      },
    },
    {
      timestamps: true,
    }
  );

cameraDetectionHistorySchema.index({
  cameraId: 1,
  detectedAt: -1,
});

module.exports = mongoose.model(
  "CameraDetectionHistory",
  cameraDetectionHistorySchema
);