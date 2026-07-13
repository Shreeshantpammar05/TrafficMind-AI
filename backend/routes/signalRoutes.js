const express = require("express");
const router = express.Router();

const latestDetection =
  require("../data/latestDetection");

router.get("/status", (req, res) => {

  const vehicleCount =
    latestDetection.vehicleCount;

  const congestion =
    latestDetection.congestion;

  const recommendation =
    latestDetection.recommendation;

  let signalTime = 15;

  if (
    vehicleCount >= 5 &&
    vehicleCount < 15
  ) {
    signalTime = 30;
  } else if (
    vehicleCount >= 15
  ) {
    signalTime = 60;
  }

  if (latestDetection.emergencyDetected) {

  signalTime = 90;

}

  res.json({
    vehicleCount,
    congestion,
    signalTime,
    recommendation,
  });
});

module.exports = router;