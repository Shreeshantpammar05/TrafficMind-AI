const express = require("express");

const router = express.Router();

const latestDetection =
  require("../data/latestDetection");

router.get("/", (req, res) => {
  const current =
    latestDetection.vehicleCount || 0;

  res.json({
    currentVehicles: current,
    predictedVehicles: null,
    forecast: "UNAVAILABLE",
  });
});

module.exports = router;