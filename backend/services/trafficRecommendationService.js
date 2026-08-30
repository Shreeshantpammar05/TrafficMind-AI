function generateTrafficRecommendation({
  congestion,
  riskLevel,
  emergencyDetected,
  accidentDetected,
  vehicleCount,
  priorityCamera,
}) {
  if (accidentDetected) {
    return {
      priority: "CRITICAL",
      action:
        priorityCamera
          ? `Accident detected near ${priorityCamera.name}. Deploy emergency response and clear the affected corridor.`
          : "Deploy emergency response and clear the affected corridor.",
    };
  }

  if (emergencyDetected) {
    return {
      priority: "CRITICAL",
      action:
        priorityCamera
          ? `Emergency detected near ${priorityCamera.name}. Activate emergency corridor and prioritize signal clearance.`
          : "Activate emergency corridor and prioritize signal clearance.",
    };
  }

  if (congestion === "HIGH") {
    return {
      priority: "HIGH",
      action:
        vehicleCount >= 25
          ? priorityCamera
            ? `High traffic density at ${priorityCamera.name}. Deploy traffic officers and extend green time on the affected approach.`
            : "Deploy traffic officers and extend green time on high-density approaches."
          : priorityCamera
          ? `High congestion detected at ${priorityCamera.name}. Increase green time and monitor congestion closely.`
          : "Increase green time and monitor congestion closely.",
    };
  }

  if (congestion === "MEDIUM") {
    return {
      priority: "MEDIUM",
      action:
        priorityCamera
          ? `Moderate congestion detected at ${priorityCamera.name}. Apply moderate signal optimization and continue monitoring.`
          : "Monitor traffic and apply moderate signal optimization.",
    };
  }

  if (riskLevel === "MEDIUM") {
    return {
      priority: "MEDIUM",
      action:
        "Maintain normal flow while monitoring traffic risk.",
    };
  }

  return {
    priority: "NORMAL",
    action:
      "Maintain normal traffic operations.",
  };
}

module.exports = {
  generateTrafficRecommendation,
};