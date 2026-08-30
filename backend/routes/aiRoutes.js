const express = require("express");
const router = express.Router();
const { exec } = require("child_process");
const path = require("path");

const {
  verifyToken,
} = require("../middleware/authMiddleware");

router.get(
  "/analyze",
  verifyToken,
  (req, res) => {
    const pythonCommand =
      process.platform === "win32"
        ? "python"
        : "python3";

    if (!req.query.imagePath) {
      return res.status(400).json({
        success: false,
        error: "imagePath is required",
      });
    }

    const imagePath = path.resolve(
      req.query.imagePath
    );

    exec(
      `${pythonCommand} ai/traffic_detector.py "${imagePath}"`,
      (error, stdout, stderr) => {
        console.log(
          "========== STDOUT =========="
        );
        console.log(stdout);

        console.log(
          "========== STDERR =========="
        );
        console.log(stderr);

        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        try {
          const result = JSON.parse(stdout);

          res.json({
            success: true,
            ...result,
          });
        } catch (parseError) {
          console.error(
            "AI output parse error:",
            parseError
          );

          res.status(500).json({
            success: false,
            error: "Failed to parse AI output",
          });
        }
      }
    );
  }
);

module.exports = router;