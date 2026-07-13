const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema(
  {
    area: String,
    vehicleCount: Number,
    time: String,
    weather: String,
    risk: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Prediction",
  predictionSchema
);