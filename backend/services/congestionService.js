const latestDetection =
  require("../data/latestDetection");

const {
  getCongestionDetails,
} = require("./congestionService");

function getTrafficIntelligence() {
  const vehicleCount =
    Number(
      latestDetection.vehicleCount
    ) || 0;

  const congestionData =
    getCongestionDetails(
      vehicleCount
    );

  const emergencyDetected =
    latestDetection.emergencyDetected ===
    true;

  const accidentDetected =
    latestDetection.accidentDetected ===
    true;

  let riskLevel = "LOW";
  let priority = "NORMAL";

  let signalRecommendation =
    "Maintain normal signal timing";

  let trafficRecommendation =
    "Traffic flow is normal";

  // -----------------------------
  // Risk Level
  // -----------------------------

  if (
    accidentDetected ||
    emergencyDetected
  ) {
    riskLevel = "CRITICAL";
  } else if (
    congestionData.congestion ===
      "HIGH" ||
    vehicleCount >= 25
  ) {
    riskLevel = "HIGH";
  } else if (
    congestionData.congestion ===
      "MEDIUM" ||
    vehicleCount >= 10
  ) {
    riskLevel = "MEDIUM";
  }

  // -----------------------------
  // Priority
  // -----------------------------

  if (accidentDetected) {
    priority =
      "ACCIDENT RESPONSE";
  } else if (emergencyDetected) {
    priority = "EMERGENCY";
  } else if (
    congestionData.congestion ===
    "HIGH"
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
    congestionData.congestion ===
      "HIGH" ||
    vehicleCount >= 25
  ) {
    signalRecommendation =
      "Extend green time for high-density traffic";
  } else if (
    congestionData.congestion ===
      "MEDIUM" ||
    vehicleCount >= 10
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
    congestionData.congestion ===
    "HIGH"
  ) {
    trafficRecommendation =
      "Severe congestion detected. Deploy traffic control measures";
  } else if (
    congestionData.congestion ===
    "MEDIUM"
  ) {
    trafficRecommendation =
      "Moderate congestion detected. Monitor traffic closely";
  }

  return {
    vehicleCount,

    congestion:
      congestionData.congestion,

    density:
      congestionData.density,

    flowStatus:
      congestionData.flowStatus,

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