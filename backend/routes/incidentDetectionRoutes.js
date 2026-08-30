const express = require("express");
const router = express.Router();

const latestDetection =
  require("../data/latestDetection");

router.get("/status", (req, res) => {
  const accidentDetected =
    latestDetection.accidentDetected;

  res.json({
    accidentDetected,

    accidentSeverity:
      latestDetection.accidentSeverity,

    alert: accidentDetected
      ? "ACCIDENT DETECTED"
      : "NO ACCIDENT"
  });
});

module.exports = router;