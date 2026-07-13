const express = require("express");
const router = express.Router();

const latestDetection =
  require("../data/latestDetection");

router.get("/", (req, res) => {

  const current =
    latestDetection.vehicleCount || 0;

  const predicted =
    current + Math.floor(Math.random() * 15);

  let forecast = "LOW";

  if (predicted >= 20)
    forecast = "MEDIUM";

  if (predicted >= 35)
    forecast = "HIGH";

  res.json({
    currentVehicles: current,
    predictedVehicles: predicted,
    forecast,
  });
});

module.exports = router;