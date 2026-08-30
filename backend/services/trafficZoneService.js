const {
  getTrafficIntelligence,
} = require("./trafficIntelligenceService");

function getTrafficZoneStatus(zoneName) {
  const intelligence =
    getTrafficIntelligence();

  let zoneStatus = "NORMAL";
  let action = "Normal traffic monitoring";

  if (
    intelligence.accidentDetected
  ) {
    zoneStatus = "CRITICAL";
    action =
      "Immediate incident response required";
  } else if (
    intelligence.emergencyDetected
  ) {
    zoneStatus = "EMERGENCY";
    action =
      "Emergency corridor priority required";
  } else if (
    intelligence.congestion === "HIGH"
  ) {
    zoneStatus = "HIGH";
    action =
      "Traffic control and signal optimization required";
  } else if (
    intelligence.congestion === "MEDIUM"
  ) {
    zoneStatus = "MEDIUM";
    action =
      "Traffic monitoring and moderate signal optimization";
  }

  return {
    zone: zoneName,
    status: zoneStatus,
    action,
    vehicleCount:
      intelligence.vehicleCount,
    congestion:
      intelligence.congestion,
    density:
      intelligence.density,
    riskLevel:
      intelligence.riskLevel,
    priority:
      intelligence.priority,
  };
}

module.exports = {
  getTrafficZoneStatus,
};