const {
  getPredictiveTrafficIntelligence,
} = require(
  "./predictiveTrafficService"
);

async function getAIDecision({
  cameraId,
  detection = null,
} = {}) {
  const currentDetection =
    detection || {};

  const vehicleCount =
    Number(
      currentDetection.vehicleCount
    ) || 0;

  const congestion =
    currentDetection.congestion ||
    "LOW";

  const emergencyDetected =
    currentDetection.emergencyDetected ===
    true;

  const accidentDetected =
    currentDetection.accidentDetected ===
    true;

  const averageConfidence =
    Number(
      currentDetection.averageConfidence
    ) || 0;

  const maxConfidence =
    Number(
      currentDetection.maxConfidence
    ) || 0;

  /*
   * Find this camera's predictive state.
   */
  let predictiveCamera = null;

  if (cameraId) {
    try {
      const predictive =
        await getPredictiveTrafficIntelligence();

      predictiveCamera =
        predictive.cameras?.find(
          (camera) =>
            camera.cameraId ===
            cameraId
        ) || null;
    } catch (error) {
      console.log(
        "Predictive decision lookup error:",
        error
      );
    }
  }

  const predictedCongestion =
    predictiveCamera
      ?.predictedCongestion ||
    congestion;

  const predictedRisk =
    predictiveCamera
      ?.riskLevel ||
    "LOW";

  const trend =
    predictiveCamera?.trend ||
    "STABLE";

  const confidence =
    averageConfidence;

  let confidenceQuality =
    "LOW";

  if (confidence >= 0.9) {
    confidenceQuality = "HIGH";
  } else if (confidence >= 0.7) {
    confidenceQuality = "MEDIUM";
  }

  let decision =
    "MONITOR";

  let priority =
    "NORMAL";

  let action =
    "Continue normal traffic monitoring.";

  let explanation =
    "Traffic conditions are currently stable.";

  /*
   * Immediate physical events always
   * have highest priority.
   */
  if (accidentDetected) {
    decision =
      "ACCIDENT RESPONSE";

    priority =
      "CRITICAL";

    action =
      "Activate incident response and prioritize emergency access.";

    explanation =
      "The selected camera currently reports an accident.";
  } else if (
    emergencyDetected
  ) {
    decision =
      "EMERGENCY CORRIDOR";

    priority =
      "CRITICAL";

    action =
      "Clear and prioritize the emergency corridor.";

    explanation =
      "The selected camera currently reports an emergency condition.";
  }

  /*
   * Predictive critical condition.
   */
  else if (
    predictedRisk ===
    "CRITICAL"
  ) {
    decision =
      "PREDICTIVE CRITICAL";

    priority =
      "CRITICAL";

    action =
      "Prepare emergency traffic control for the predicted critical condition.";

    explanation =
      "Recent camera history indicates a critical traffic risk is developing.";
  }

  /*
   * Current or predicted HIGH.
   */
  else if (
    congestion === "HIGH" ||
    predictedCongestion ===
      "HIGH"
  ) {
    decision =
      trend ===
        "RISING FAST"
        ? "PREDICTIVE TRAFFIC CONTROL"
        : "TRAFFIC CONTROL";

    priority =
      "HIGH";

    action =
      "Increase green time and prepare traffic control measures.";

    explanation =
      predictedCongestion ===
        "HIGH" &&
      congestion !== "HIGH"
        ? "Recent traffic history indicates congestion is likely to become HIGH."
        : "High traffic congestion requires active intervention.";
  }

  /*
   * Current or predicted MEDIUM.
   */
  else if (
    congestion ===
      "MEDIUM" ||
    predictedCongestion ===
      "MEDIUM"
  ) {
    decision =
      "TRAFFIC MONITORING";

    priority =
      "MEDIUM";

    action =
      "Monitor traffic and apply moderate signal optimization.";

    explanation =
      trend ===
        "RISING" ||
      trend ===
        "RISING FAST"
        ? "Traffic is increasing and requires proactive monitoring."
        : "Traffic density is elevated but remains manageable.";
  }

  /*
   * Predictive rising traffic.
   */
  else if (
    trend ===
      "RISING" ||
    trend ===
      "RISING FAST"
  ) {
    decision =
      "PROACTIVE MONITORING";

    priority =
      "MEDIUM";

    action =
      "Prepare signal optimization before congestion increases.";

    explanation =
      "Recent camera history shows traffic is rising.";
  }

  if (
    confidenceQuality ===
    "LOW"
  ) {
    explanation +=
      " AI confidence is currently low, so operator verification is recommended.";
  }

  return {
    decision,

    priority,

    action,

    explanation,

    confidence,

    maxConfidence,

    confidenceQuality,

    cameraId,

    vehicleCount,

    congestion,

    predictedCongestion,

    predictedRisk,

    trend,

    riskLevel:
      accidentDetected ||
      emergencyDetected
        ? "CRITICAL"
        : predictedRisk !== "LOW"
        ? predictedRisk
        : "LOW",

    accidentDetected,

    emergencyDetected,

    predictiveCamera:
      predictiveCamera
        ? {
            cameraId:
              predictiveCamera.cameraId,

            name:
              predictiveCamera.name,

            location:
              predictiveCamera.location,

            currentVehicles:
              predictiveCamera.currentVehicles,

            recentAverageVehicles:
              predictiveCamera.recentAverageVehicles,

            trend:
              predictiveCamera.trend,

            predictedCongestion:
              predictiveCamera.predictedCongestion,

            riskLevel:
              predictiveCamera.riskLevel,

            observations:
              predictiveCamera.observations,
          }
        : null,
  };
}

module.exports = {
  getAIDecision,
};