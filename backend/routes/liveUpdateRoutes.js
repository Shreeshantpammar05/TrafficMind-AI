const Incident =
  require("../models/Incident");
const express = require("express");
const router = express.Router();

const latestDetection =
  require("../data/latestDetection");

router.post("/live-update",
async (req, res) => {

  latestDetection.vehicleCount =
    req.body.vehicleCount;

  latestDetection.congestion =
    req.body.congestion;

  latestDetection.recommendation =
    req.body.recommendation;

    latestDetection.emergencyDetected =
  req.body.emergencyDetected || false;

    if (
  req.body.congestion === "HIGH" &&
  req.body.vehicleCount >= 15
) {
  latestDetection.incidentDetected = true;
} else {
  latestDetection.incidentDetected = false;
}

if (
  latestDetection.incidentDetected
) {


  const recentIncident =
    await Incident.findOne({
      incidentType:
        "Traffic Congestion",
    })
      .sort({ createdAt: -1 });

  const fiveMinutesAgo =
    new Date(
      Date.now() - 5 * 60 * 1000
    );

  if (
    !recentIncident ||
    recentIncident.createdAt <
      fiveMinutesAgo
  ) {

    await Incident.create({
      location:
        "AI Camera Zone",

      incidentType:
        "Traffic Congestion",

      severity: "High",

      description:
        `Auto-created by AI. Vehicle Count: ${req.body.vehicleCount}`,
    });

    latestDetection.latestAlert = {
  title: "Traffic Congestion Detected",
  severity: "High",
  location: "AI Camera Zone",
  time: new Date().toLocaleTimeString()
};

  }
}

  res.json({
    success: true,
    message: "Live data updated"
  });

});

module.exports = router;