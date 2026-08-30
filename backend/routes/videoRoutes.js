const express = require("express");
const router = express.Router();
const { exec } = require("child_process");

const {
  verifyToken,
} = require("../middleware/authMiddleware");

router.get(
  "/analyze-video",
  verifyToken,
  (req, res) => {
    exec(
      "python ai/video_detector.py",
      (error, stdout, stderr) => {
        if (error) {
          console.error(
            "Video AI Error:",
            stderr || error.message
          );

          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        try {
          const result =
            JSON.parse(stdout);

          res.json({
            success: true,
            ...result,
          });
        } catch (err) {
          console.error(
            "Video AI Parse Error:",
            err
          );

          res.status(500).json({
            success: false,
            error:
              "Failed to parse video AI output",
          });
        }
      }
    );
  }
);

module.exports = router;