const express = require("express");
const router = express.Router();
const { exec } = require("child_process");

const latestDetection =
  require("../data/latestDetection");

  

router.get("/analyze", (req, res) => {
  exec(
  "python ai/traffic_detector.py",
  (error, stdout, stderr) => {

    console.log("STDOUT:", stdout);
    console.log("STDERR:", stderr);

    if (error) {
      console.log("EXEC ERROR:", error);

      return res.status(500).json({
        error: error.message,
      });
    }

    try {
      const result =
        JSON.parse(stdout);

      res.json(result);

    } catch (err) {

      console.log(
        "JSON PARSE ERROR:",
        err
      );

      res.status(500).json({
        error:
          "Failed to parse AI output",
      });
    }
  }
);
});

module.exports = router;