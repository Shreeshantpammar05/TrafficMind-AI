const express = require("express");
const router = express.Router();

const latestDetection =
  require("../data/latestDetection");

router.get("/status", (req, res) => {

  res.json({
    incidentDetected:
      latestDetection.incidentDetected,

    alert:
      latestDetection.incidentDetected
        ? "POSSIBLE TRAFFIC INCIDENT DETECTED"
        : "NO INCIDENT DETECTED"
  });

});

module.exports = router;