const express = require("express");
const router = express.Router();

const AIAnalysis =
  require("../models/AIAnalysis");

router.post("/", async (req, res) => {
  try {
    const analysis =
      new AIAnalysis(req.body);

    await analysis.save();

    res.status(201).json({
      success: true,
      analysis,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const analyses =
      await AIAnalysis.find()
        .sort({ createdAt: -1 });

    res.json({
      success: true,
      analyses,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;