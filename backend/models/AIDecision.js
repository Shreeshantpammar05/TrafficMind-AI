const mongoose = require("mongoose");

const aiDecisionSchema =
  new mongoose.Schema(
    {
      cameraId: {
        type: String,
        required: true,
        trim: true,
      },

      decision: {
        type: String,
        required: true,
      },

      priority: {
        type: String,
        required: true,
      },

      action: {
        type: String,
        required: true,
      },

      explanation: {
        type: String,
        required: true,
      },

      confidence: {
        type: Number,
        default: 0,
      },

      vehicleCount: {
        type: Number,
        default: 0,
      },

      congestion: {
        type: String,
        default: "LOW",
      },

      riskLevel: {
        type: String,
        default: "LOW",
      },
    },
    {
      timestamps: true,
    }
  );

aiDecisionSchema.index({
  cameraId: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "AIDecision",
  aiDecisionSchema
);