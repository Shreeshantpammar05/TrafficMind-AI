const express = require("express");
const router = express.Router();
const { exec } = require("child_process");

router.get("/analyze-video", (req, res) => {
  exec(
    "python ai/video_detector.py",
    (error, stdout, stderr) => {

      if (error) {
        return res.status(500).json({
          error: error.message,
        });
      }

      try {
        const result =
          JSON.parse(stdout);

        res.json(result);

      } catch (err) {
        res.status(500).json({
          error:
            "Failed to parse video AI output",
        });
      }
    }
  );
});

module.exports = router;