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

const EmergencyEvent =
  require(
    "../models/EmergencyEvent"
  );

const CameraConnection =
  require(
    "../models/CameraConnection"
  );

const TrafficCamera =
  require(
    "../models/TrafficCamera"
  );

const ACTIVE_EMERGENCY_STATUSES = [
  "DETECTED",
  "TRACKING",
  "APPROACHING",
  "ACTIVE",
  "SEARCHING",
];

const clamp = (
  value,
  minimum,
  maximum
) =>
  Math.max(
    minimum,
    Math.min(
      maximum,
      Number(value) || 0
    )
  );

const normalize = (
  value
) =>
  String(
    value || ""
  )
    .trim()
    .toLowerCase();

/*
 * =========================================================
 * BASE SIGNAL OPTIMIZATION
 * =========================================================
 */

async function calculateBaseSignalOptimization(
  cameraFilter = {},
  nearbyOptions = {}
) {
  const intelligence =
    await getMultiCameraIntelligence(
      cameraFilter
    );

  const prediction =
    await getPredictiveTrafficIntelligence(
      cameraFilter,
      nearbyOptions
    );

  let greenTime = 15;
  let action = "NORMAL FLOW";

  if (
    intelligence.accidentCameras
      .length > 0 ||
    intelligence.emergencyCameras
      .length > 0
  ) {
    greenTime = 90;
    action =
      "EMERGENCY PRIORITY";
  } else if (
    prediction.predictedRisk ===
    "CRITICAL"
  ) {
    greenTime = 90;
    action =
      "PREDICTIVE CRITICAL";
  } else if (
    prediction.predictedCongestion ===
    "HIGH"
  ) {
    greenTime = 60;
    action =
      "PREDICTIVE HIGH CONGESTION";
  } else if (
    intelligence.overallCongestion ===
    "HIGH"
  ) {
    greenTime = 60;
    action =
      "HIGH CONGESTION";
  } else if (
    intelligence.overallCongestion ===
    "MEDIUM"
  ) {
    greenTime = 30;
    action =
      "MODERATE CONGESTION";
  } else if (
    prediction.risingCameraCount > 0
  ) {
    greenTime = 30;
    action =
      "PROACTIVE TRAFFIC MONITORING";
  }

  return {
    intelligence,
    prediction,
    greenTime,
    action,
  };
}

/*
 * =========================================================
 * PHASE 23 — EMERGENCY CORRIDOR
 * =========================================================
 */

async function getActiveEmergency(
  emergencyId
) {
  const query = emergencyId
    ? {
        emergencyId,
        status: {
          $in:
            ACTIVE_EMERGENCY_STATUSES,
        },
      }
    : {
        status: {
          $in:
            ACTIVE_EMERGENCY_STATUSES,
        },
      };

  return EmergencyEvent.findOne(
    query
  )
    .sort({
      lastSeenAt: -1,
    })
    .lean();
}

async function getDownstreamCandidates(
  currentCameraId
) {
  if (!currentCameraId) {
    return [];
  }

  const connections =
    await CameraConnection.find({
      fromCameraId:
        currentCameraId,
      active: true,
    })
      .sort({
        priority: -1,
        distanceMeters: 1,
      })
      .lean();

  if (
    connections.length === 0
  ) {
    return [];
  }

  return Promise.all(
    connections.map(
      async (connection) => {
        const camera =
          await TrafficCamera.findOne(
            {
              cameraId:
                connection.toCameraId,
              status: "active",
            }
          ).lean();

        return {
          cameraId:
            connection.toCameraId,

          camera:
            camera || null,

          distanceMeters:
            Number(
              connection.distanceMeters
            ) || 0,

          connectionPriority:
            Number(
              connection.priority
            ) || 0,

          direction:
            connection.direction ||
            "UNKNOWN",

          roadName:
            connection.roadName ||
            "",

          bearing:
            connection.bearing ??
            null,

          trafficLevel:
            camera?.congestion ||
            "UNKNOWN",
        };
      }
    )
  );
}

function getCorridorAction({
  priority,
  priorityScore,
  etaSeconds,
  congestion,
  isCurrent,
  isPredicted,
}) {
  const normalizedPriority =
    normalize(priority);

  const score =
    clamp(
      priorityScore,
      0,
      100
    );

  const eta =
    Number.isFinite(
      Number(etaSeconds)
    )
      ? Number(
          etaSeconds
        )
      : null;

  const normalizedCongestion =
    normalize(
      congestion
    );

  if (
    isCurrent &&
    (
      normalizedPriority ===
        "critical" ||
      score >= 80
    )
  ) {
    return {
      action:
        "PRIORITIZE_EMERGENCY",
      intensity:
        "CRITICAL",
      reason:
        "Emergency is currently at this camera and requires immediate signal priority.",
    };
  }

  if (
    isPredicted &&
    eta !== null &&
    eta <= 30
  ) {
    return {
      action:
        "EXTEND_GREEN",
      intensity:
        "HIGH",
      reason:
        "Emergency arrival is within 30 seconds; extend the compatible green phase.",
    };
  }

  if (
    isPredicted &&
    eta !== null &&
    eta <= 90
  ) {
    return {
      action:
        "PREPARE_NEXT_PHASE",
      intensity:
        "MEDIUM",
      reason:
        "Emergency is approaching this downstream junction; prepare the next signal phase.",
    };
  }

  if (
    normalizedCongestion ===
    "high"
  ) {
    return {
      action:
        "PRIORITIZE_EMERGENCY",
      intensity:
        "HIGH",
      reason:
        "Downstream congestion is high, so emergency passage receives priority.",
    };
  }

  return {
    action:
      "HOLD_NORMAL",
    intensity:
      "LOW",
    reason:
      "No immediate emergency signal intervention is required yet.",
  };
}

async function calculateGreenCorridor(
  cameraFilter = {},
  nearbyOptions = {},
  requestedEmergencyId = ""
) {
  const emergency =
    await getActiveEmergency(
      requestedEmergencyId
    );

  if (!emergency) {
    return {
      active: false,
      emergencyId: "",
      recommendation:
        "HOLD_NORMAL",
      signalTime: 15,
      currentCameraId: "",
      nextCameraId: null,
      corridorCameras: [],
      reasons: [
        "No active emergency event is available.",
      ],
    };
  }

  const currentCamera =
    await TrafficCamera.findOne(
      {
        cameraId:
          emergency.currentCameraId,
        status: "active",
        ...cameraFilter,
      }
    ).lean();

  /*
   * Government sub-officers must not receive
   * out-of-jurisdiction corridor recommendations.
   */
  if (
    !currentCamera &&
    Object.keys(
      cameraFilter
    ).length > 0
  ) {
    return {
      active: true,
      emergencyId:
        emergency.emergencyId,
      recommendation:
        "HOLD_NORMAL",
      signalTime: 15,
      currentCameraId:
        emergency.currentCameraId ||
        "",
      nextCameraId: null,
      corridorCameras: [],
      reasons: [
        "Emergency exists, but its current camera is outside the requesting jurisdiction.",
      ],
    };
  }

  const candidates =
    await getDownstreamCandidates(
      emergency.currentCameraId
    );

  const currentPriorityScore =
    Number(
      emergency.priorityScore
    ) || 0;

  const currentDecision =
    getCorridorAction({
      priority:
        emergency.priority,
      priorityScore:
        currentPriorityScore,
      etaSeconds: 0,
      congestion:
        currentCamera
          ?.congestion,
      isCurrent: true,
      isPredicted: false,
    });

  const corridorCameras = [];

  if (
    emergency.currentCameraId
  ) {
    corridorCameras.push({
      cameraId:
        emergency.currentCameraId,

      role: "CURRENT",

      etaSeconds: 0,

      distanceMeters: 0,

      priorityScore:
        currentPriorityScore,

      action:
        currentDecision.action,

      intensity:
        currentDecision.intensity,

      reason:
        currentDecision.reason,

      trafficLevel:
        currentCamera
          ?.congestion ||
        "UNKNOWN",
    });
  }

  /*
   * Build downstream recommendations from graph-connected
   * cameras. This is a recommendation layer only.
   */
  for (
    let index = 0;
    index <
      candidates.length;
    index += 1
  ) {
    const candidate =
      candidates[index];

    const speedKmh =
      emergency.vehicleType ===
      "ambulance"
        ? 42
        : emergency.vehicleType ===
          "fire_truck"
        ? 38
        : 45;

    const distance =
      Number(
        candidate.distanceMeters
      ) || 0;

    const speedMps =
      (speedKmh * 1000) /
      3600;

    const etaSeconds =
      speedMps > 0
        ? Math.max(
            1,
            Math.round(
              distance /
                speedMps
            )
          )
        : null;

    const decision =
      getCorridorAction({
        priority:
          emergency.priority,
        priorityScore:
          currentPriorityScore,
        etaSeconds,
        congestion:
          candidate
            .trafficLevel,
        isCurrent: false,
        isPredicted:
          index === 0,
      });

    corridorCameras.push({
      cameraId:
        candidate.cameraId,

      role:
        index === 0
          ? "NEXT_EXPECTED"
          : "DOWNSTREAM",

      etaSeconds,

      distanceMeters:
        distance,

      connectionPriority:
        candidate
          .connectionPriority,

      direction:
        candidate.direction,

      roadName:
        candidate.roadName,

      priorityScore:
        currentPriorityScore,

      action:
        decision.action,

      intensity:
        decision.intensity,

      reason:
        decision.reason,

      trafficLevel:
        candidate
          .trafficLevel,
    });
  }

  const nextCamera =
    corridorCameras.find(
      (item) =>
        item.role ===
        "NEXT_EXPECTED"
    ) || null;

  let recommendation =
    currentDecision.action;

  let signalTime =
    currentDecision.action ===
    "PRIORITIZE_EMERGENCY"
      ? 90
      : 15;

  if (
    nextCamera &&
    nextCamera.action ===
      "EXTEND_GREEN"
  ) {
    recommendation =
      "EXTEND_GREEN";

    signalTime = 60;
  } else if (
    nextCamera &&
    nextCamera.action ===
      "PREPARE_NEXT_PHASE"
  ) {
    recommendation =
      "PREPARE_NEXT_PHASE";

    signalTime = 45;
  }

  const reasons = [
    `Emergency ${emergency.emergencyId} is ${emergency.priority || "ACTIVE"} priority.`,
  ];

  if (
    emergency.currentCameraId
  ) {
    reasons.push(
      `Current camera: ${emergency.currentCameraId}.`
    );
  }

  if (nextCamera) {
    reasons.push(
      `Next expected camera: ${nextCamera.cameraId}.`
    );

    if (
      Number.isFinite(
        Number(
          nextCamera.etaSeconds
        )
      )
    ) {
      reasons.push(
        `Estimated arrival at ${nextCamera.cameraId}: ${nextCamera.etaSeconds} seconds.`
      );
    }
  }

  if (
    currentCamera?.congestion
  ) {
    reasons.push(
      `Current traffic state: ${currentCamera.congestion}.`
    );
  }

  reasons.push(
    "Signal actions are recommendations; physical signal control is not performed in Phase 23."
  );

  return {
    active: true,

    emergencyId:
      emergency.emergencyId,

    vehicleType:
      emergency.vehicleType,

    status:
      emergency.status,

    priority:
      emergency.priority,

    priorityScore:
      currentPriorityScore,

    currentCameraId:
      emergency.currentCameraId ||
      "",

    nextCameraId:
      nextCamera
        ?.cameraId ||
      null,

    etaSeconds:
      nextCamera
        ?.etaSeconds ??
      null,

    recommendation,

    signalTime,

    corridorCameras,

    reasons,

    model: {
      type:
        "EMERGENCY_CORRIDOR_SIGNAL_RECOMMENDATION",

      explainable: true,

      physicalControl:
        false,
    },
  };
}

/*
 * =========================================================
 * PUBLIC SERVICE
 * =========================================================
 */

async function calculateSignalOptimization(
  cameraFilter = {},
  nearbyOptions = {},
  options = {}
) {
  const base =
    await calculateBaseSignalOptimization(
      cameraFilter,
      nearbyOptions
    );

  const greenCorridor =
    await calculateGreenCorridor(
      cameraFilter,
      nearbyOptions,
      options.emergencyId || ""
    );

  /*
   * Emergency corridor recommendations take precedence
   * over normal traffic optimization.
   */
  let greenTime =
    base.greenTime;

  let action =
    base.action;

  let recommendation =
    "Maintain normal signal timing";

  if (
    greenCorridor.active
  ) {
    greenTime =
      greenCorridor.signalTime;

    action =
      greenCorridor.recommendation;

    recommendation =
      greenCorridor
        .recommendation;
  } else if (
    base.intelligence
      .priorityCamera
      ?.recommendation
  ) {
    recommendation =
      base.intelligence
        .priorityCamera
        .recommendation;
  }

  return {
    greenTime,
    action,

    recommendation,

    congestion:
      base.intelligence
        .overallCongestion,

    riskLevel:
      base.intelligence
        .overallRisk,

    priority:
      base.intelligence
        .priorityCamera
        ? "CAMERA PRIORITY"
        : "NORMAL",

    vehicleCount:
      base.intelligence
        .totalVehicles,

    cameraCount:
      base.intelligence
        .cameraCount,

    priorityCamera:
      base.intelligence
        .priorityCamera,

    predictedCongestion:
      base.prediction
        .predictedCongestion,

    predictedRisk:
      base.prediction
        .predictedRisk,

    risingCameraCount:
      base.prediction
        .risingCameraCount,

    nearbyCameraCount:
      base.prediction
        .nearbyCameraCount,

    predictiveAction:
      base.prediction
        .priorityCamera
        ? `Monitor ${base.prediction.priorityCamera.name} proactively.`
        : "No predictive priority detected.",

    greenCorridor,
  };
}

module.exports = {
  calculateSignalOptimization,
};
