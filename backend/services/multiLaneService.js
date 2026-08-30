const {
  getMultiCameraIntelligence,
} = require(
  "./multiCameraIntelligenceService"
);

const {
  getPredictiveTrafficIntelligence,
} = require(
  "./predictiveTrafficService"
);

async function calculateLaneOptimization() {
  const intelligence =
    await getMultiCameraIntelligence();

  const prediction =
    await getPredictiveTrafficIntelligence();

  const cameras =
    intelligence.cameras || [];

  if (!cameras.length) {
    return {
      success: true,
      lanes: {},
      greenTime: {},
      priorityLane: null,
      congestion:
        intelligence.overallCongestion,
      density: "LOW",
      riskLevel:
        intelligence.overallRisk,
      priority: "NORMAL",
      totalVehicles: 0,
      cameraCount: 0,
      priorityCamera: null,
      predictedCongestion:
        prediction.predictedCongestion,
      predictedRisk:
        prediction.predictedRisk,
      risingCameraCount:
        prediction.risingCameraCount,
      predictiveAction:
        "No active camera data available.",
    };
  }

  /*
   * Each active camera represents a monitored
   * traffic approach.
   */

  const lanes = {};

  cameras.forEach(
    (camera) => {
      lanes[camera.cameraId] =
        camera.vehicleCount;
    }
  );

  const priorityCamera =
    intelligence.priorityCamera;

  const predictivePriorityCamera =
    prediction.priorityCamera;

  /*
   * Prefer predictive priority when a camera
   * is rapidly rising or predicted HIGH.
   */

  const finalPriorityCamera =
    predictivePriorityCamera &&
    (
      predictivePriorityCamera.trend ===
        "RISING FAST" ||
      predictivePriorityCamera.predictedCongestion ===
        "HIGH"
    )
      ? predictivePriorityCamera
      : priorityCamera;

  const priorityLane =
    finalPriorityCamera?.cameraId ||
    null;

  const greenTime = {};

  cameras.forEach(
    (camera) => {
      let time = 15;

      if (
        camera.accidentDetected ||
        camera.emergencyDetected
      ) {
        time = 90;
      } else if (
        camera.congestion ===
          "HIGH" ||
        camera.vehicleCount >= 25
      ) {
        time = 60;
      } else if (
        camera.congestion ===
          "MEDIUM" ||
        camera.vehicleCount >= 10
      ) {
        time = 30;
      }

      greenTime[
        camera.cameraId
      ] = time;
    }
  );

  /*
   * Predictive optimization:
   * If traffic is rising quickly or predicted
   * to become HIGH, prepare the approach early.
   */

  if (
    predictivePriorityCamera
  ) {
    const predictiveId =
      predictivePriorityCamera.cameraId;

    if (
      predictivePriorityCamera.trend ===
      "RISING FAST"
    ) {
      greenTime[predictiveId] = Math.max(
        greenTime[predictiveId] || 15,
        45
      );
    }

    if (
      predictivePriorityCamera.predictedCongestion ===
      "HIGH"
    ) {
      greenTime[predictiveId] = Math.max(
        greenTime[predictiveId] || 15,
        60
      );
    }

    if (
      predictivePriorityCamera.riskLevel ===
      "CRITICAL"
    ) {
      greenTime[predictiveId] = 90;
    }
  }

  /*
   * Immediate emergency/accident response
   * always overrides predictive timing.
   */

  if (
    priorityCamera &&
    (
      priorityCamera.accidentDetected ||
      priorityCamera.emergencyDetected
    )
  ) {
    greenTime[
      priorityCamera.cameraId
    ] = 90;
  }

  let density = "LOW";

  if (
    intelligence.totalVehicles >= 25
  ) {
    density = "VERY HIGH";
  } else if (
    intelligence.totalVehicles >= 15
  ) {
    density = "HIGH";
  } else if (
    intelligence.totalVehicles >= 5
  ) {
    density = "MEDIUM";
  }

  let priority = "NORMAL";

  if (
    intelligence.accidentCameras
      .length
  ) {
    priority =
      "ACCIDENT RESPONSE";
  } else if (
    intelligence.emergencyCameras
      .length
  ) {
    priority =
      "EMERGENCY";
  } else if (
    prediction.predictedRisk ===
    "CRITICAL"
  ) {
    priority =
      "PREDICTIVE CRITICAL";
  } else if (
    prediction.predictedCongestion ===
    "HIGH"
  ) {
    priority =
      "PREDICTIVE TRAFFIC CONTROL";
  } else if (
    intelligence.congestionCameras
      .length
  ) {
    priority =
      "TRAFFIC CONTROL";
  } else if (
    prediction.risingCameraCount > 0
  ) {
    priority =
      "PROACTIVE MONITORING";
  }

  let predictiveAction =
    "Maintain normal signal timing.";

  if (
    prediction.predictedRisk ===
    "CRITICAL"
  ) {
    predictiveAction =
      "Prepare immediate response for predicted critical traffic conditions.";
  } else if (
    prediction.predictedCongestion ===
    "HIGH"
  ) {
    predictiveAction =
      "Prepare extended green time for the predicted high-congestion approach.";
  } else if (
    prediction.risingCameraCount > 0
  ) {
    predictiveAction =
      "Monitor rising traffic and prepare proactive signal optimization.";
  }

  return {
    success: true,

    lanes,

    greenTime,

    priorityLane,

    congestion:
      intelligence.overallCongestion,

    density,

    riskLevel:
      intelligence.overallRisk,

    priority,

    totalVehicles:
      intelligence.totalVehicles,

    averageVehicles:
      intelligence.averageVehicles,

    cameraCount:
      intelligence.cameraCount,

    priorityCamera:
      finalPriorityCamera,

    accidentCameras:
      intelligence.accidentCameras,

    emergencyCameras:
      intelligence.emergencyCameras,

    congestionCameras:
      intelligence.congestionCameras,

    predictedCongestion:
      prediction.predictedCongestion,

    predictedRisk:
      prediction.predictedRisk,

    risingCameraCount:
      prediction.risingCameraCount,

    highPredictedCameraCount:
      prediction.highPredictedCameraCount,

    predictivePriorityCamera:
      prediction.priorityCamera,

    predictiveAction,
  };
}

module.exports = {
  calculateLaneOptimization,
};