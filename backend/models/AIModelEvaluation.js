const mongoose = require("mongoose");

const aiModelEvaluationSchema =
  new mongoose.Schema(
    {
      modelName: {
        type: String,
        required: true,
      },

      modelType: {
        type: String,
        required: true,
      },

      datasetImages: {
        type: Number,
        default: 0,
      },

      instances: {
        type: Number,
        default: 0,
      },

      precision: {
        type: Number,
        default: 0,
      },

      recall: {
        type: Number,
        default: 0,
      },

      map50: {
        type: Number,
        default: 0,
      },

      map50_95: {
        type: Number,
        default: 0,
      },

      inferenceTimeMs: {
        type: Number,
        default: 0,
      },

      evaluatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "AIModelEvaluation",
  aiModelEvaluationSchema
);