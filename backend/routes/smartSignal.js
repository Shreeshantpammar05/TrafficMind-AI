const express = require("express");
const router = express.Router();

router.get("/multi-lane", (req, res) => {

  const latestDetection =
  require("../data/latestDetection");

 const totalVehicles =
  latestDetection.vehicleCount || 0;

const lanes = {
  north: Math.round(totalVehicles * 0.4),
  south: Math.round(totalVehicles * 0.3),
  east: Math.round(totalVehicles * 0.2),
  west: Math.round(totalVehicles * 0.1),
};

  const maxLane = Object.keys(lanes).reduce(
    (a, b) =>
      lanes[a] > lanes[b] ? a : b
  );

  let greenTime = {};

Object.keys(lanes).forEach((lane) => {

  if (lanes[lane] < 10) {
    greenTime[lane] = 15;
  }
  else if (lanes[lane] < 25) {
    greenTime[lane] = 30;
  }
  else {
    greenTime[lane] = 60;
  }

});

res.json({
  lanes,
  greenTime,
  priorityLane: maxLane,
});
});

module.exports = router;