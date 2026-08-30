const mongoose = require("mongoose");
require("dotenv").config();

const AIModelEvaluation =
  require("../models/AIModelEvaluation");

async function saveEvaluation() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "✅ MongoDB Connected"
    );

    await AIModelEvaluation.findOneAndUpdate(
      {
        modelName:
          "accident_detector.pt",
      },
      {
        modelName:
          "accident_detector.pt",

        modelType:
          "Accident Detection",

        datasetImages: 157,

        instances: 160,

        precision: 0.945,

        recall: 0.962,

        map50: 0.975,

        map50_95: 0.873,

        inferenceTimeMs: 70.8,

        evaluatedAt: new Date(),
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    console.log(
      "✅ Real model evaluation saved"
    );

    await mongoose.disconnect();

    console.log(
      "MongoDB connection closed"
    );
  } catch (error) {
    console.error(
      "❌ Evaluation save failed:",
      error
    );

    process.exit(1);
  }
}

saveEvaluation();