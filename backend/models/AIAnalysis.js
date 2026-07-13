const mongoose = require("mongoose");

const aiAnalysisSchema = new mongoose.Schema(
  {
    vehicleCount: Number,
    congestion: String,
    recommendation: String,
    imageUrl: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "AIAnalysis",
  aiAnalysisSchema
);