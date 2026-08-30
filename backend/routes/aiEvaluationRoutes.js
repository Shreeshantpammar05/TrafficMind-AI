const express = require("express");

const router = express.Router();

const {
  verifyToken,
} = require("../middleware/authMiddleware");

const AIModelEvaluation =
  require("../models/AIModelEvaluation");

router.get(
  "/",
  verifyToken,
  async (req, res) => {
    try {
      const evaluations =
        await AIModelEvaluation.find()
          .sort({ evaluatedAt: -1 });

      res.json({
        success: true,
        evaluations,
      });
    } catch (error) {
      console.error(
        "AI Evaluation Fetch Error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Failed to fetch AI evaluations",
      });
    }
  }
);

module.exports = router;