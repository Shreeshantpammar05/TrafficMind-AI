const latestDetection =
  require("../data/latestDetection");

function getTrafficIntelligence() {
  const vehicleCount =
    Number(latestDetection.vehicleCount) || 0;

  const congestion =
    latestDetection.congestion || "LOW";

  const emergencyDetected =
    latestDetection.emergencyDetected === true;

  const accidentDetected =
    latestDetection.accidentDetected === true;

  let density = "LOW";
  let flowStatus = "NORMAL";
  let riskLevel = "LOW";
  let priority = "NORMAL";
  let signalRecommendation =
    "Maintain normal signal timing";
  let trafficRecommendation =
    "Traffic flow is normal";

  // -----------------------------
  // Vehicle Density
  // -----------------------------

  if (vehicleCount >= 25) {
    density = "VERY HIGH";
  } else if (vehicleCount >= 15) {
    density = "HIGH";
  } else if (vehicleCount >= 5) {
    density = "MEDIUM";
  }

  // -----------------------------
  // Flow Status
  // -----------------------------

  if (congestion === "HIGH") {
    flowStatus = "SLOW";
  } else if (congestion === "MEDIUM") {
    flowStatus = "MODERATE";
  } else {
    flowStatus = "NORMAL";
  }

  // -----------------------------
  // Risk Level
  // -----------------------------

  if (
    accidentDetected ||
    emergencyDetected
  ) {
    riskLevel = "CRITICAL";
  } else if (
    congestion === "HIGH" ||
    vehicleCount >= 25
  ) {
    riskLevel = "HIGH";
  } else if (
    congestion === "MEDIUM" ||
    vehicleCount >= 10
  ) {
    riskLevel = "MEDIUM";
  }

  // -----------------------------
  // Priority
  // -----------------------------

  if (accidentDetected) {
    priority = "ACCIDENT RESPONSE";
  } else if (emergencyDetected) {
    priority = "EMERGENCY";
  } else if (
    congestion === "HIGH"
  ) {
    priority = "TRAFFIC CONTROL";
  }

  // -----------------------------
  // Signal Recommendation
  // -----------------------------

  if (accidentDetected) {
    signalRecommendation =
      "Prioritize emergency response";
  } else if (emergencyDetected) {
    signalRecommendation =
      "Activate emergency corridor";
  } else if (
    vehicleCount >= 25 ||
    congestion === "HIGH"
  ) {
    signalRecommendation =
      "Extend green time for high-density traffic";
  } else if (
    vehicleCount >= 10 ||
    congestion === "MEDIUM"
  ) {
    signalRecommendation =
      "Increase green time moderately";
  }

  // -----------------------------
  // Traffic Recommendation
  // -----------------------------

  if (accidentDetected) {
    trafficRecommendation =
      "Accident detected. Immediate traffic control required";
  } else if (emergencyDetected) {
    trafficRecommendation =
      "Emergency vehicle detected. Prioritize corridor clearance";
  } else if (
    congestion === "HIGH"
  ) {
    trafficRecommendation =
      "Severe congestion detected. Deploy traffic control measures";
  } else if (
    congestion === "MEDIUM"
  ) {
    trafficRecommendation =
      "Moderate congestion detected. Monitor traffic closely";
  }

  return {
    vehicleCount,
    congestion,
    density,
    flowStatus,
    riskLevel,
    priority,
    signalRecommendation,
    trafficRecommendation,
    emergencyDetected,
    accidentDetected,
  };
}

module.exports = {
  getTrafficIntelligence,
};