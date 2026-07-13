const express = require("express");
const router = express.Router();

const latestDetection =
  require("../data/latestDetection");

router.get("/status", (req, res) => {

  const emergencyDetected =
    latestDetection.emergencyDetected;

  res.json({
    emergencyDetected,
    priority: emergencyDetected
      ? "GREEN CORRIDOR ACTIVATED"
      : "NORMAL TRAFFIC FLOW"
  });

});

module.exports = router;