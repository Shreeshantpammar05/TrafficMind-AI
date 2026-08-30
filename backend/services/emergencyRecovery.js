const EmergencyEvent =
  require("../models/EmergencyEvent");

const CameraConnection =
  require("../models/CameraConnection");

const EmergencyPropagation =
  require("../models/EmergencyPropagation");

const TrafficCamera =
  require("../models/TrafficCamera");

const OfficerEmergencyAlert =
  require("../models/OfficerEmergencyAlert");

const {
  recordEmergencyAudit,
} = require("./emergencyAuditService");

const ACTIVE_STATUSES = [
  "DETECTED",
  "TRACKING",
  "APPROACHING",
  "ACTIVE",
  "SEARCHING",
];

const SEARCH_TIMEOUT_MIN_SECONDS = 30;
const SEARCH_TIMEOUT_MAX_SECONDS = 180;
const SEARCH_GRACE_SECONDS = 20;

/*
 * PHASE 26
 *
 * Destination completion is intentionally conservative.
 * We only auto-complete when destination coordinates exist
 * and the current camera is close enough to that destination.
 */
const DESTINATION_REACHED_RADIUS_METERS = 250;

const normalizeSignature = (signature) =>
  Array.isArray(signature)
    ? signature
        .map(Number)
        .filter(Number.isFinite)
    : [];

function cosineSimilarity(a, b) {
  const first =
    normalizeSignature(a);

  const second =
    normalizeSignature(b);

  if (
    first.length === 0 ||
    second.length === 0 ||
    first.length !== second.length
  ) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (
    let i = 0;
    i < first.length;
    i += 1
  ) {
    dot +=
      first[i] * second[i];

    normA +=
      first[i] * first[i];

    normB +=
      second[i] * second[i];
  }

  if (
    normA <= 0 ||
    normB <= 0
  ) {
    return 0;
  }

  return (
    dot /
    (
      Math.sqrt(normA) *
      Math.sqrt(normB)
    )
  );
}

function clamp(
  value,
  min,
  max
) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

function toRadians(
  value
) {
  return (
    Number(value) *
    Math.PI /
    180
  );
}

function haversineDistanceMeters({
  latitude1,
  longitude1,
  latitude2,
  longitude2,
}) {
  const lat1 =
    Number(latitude1);

  const lon1 =
    Number(longitude1);

  const lat2 =
    Number(latitude2);

  const lon2 =
    Number(longitude2);

  if (
    ![
      lat1,
      lon1,
      lat2,
      lon2,
    ].every(
      Number.isFinite
    )
  ) {
    return null;
  }

  const earthRadiusMeters =
    6371000;

  const deltaLat =
    toRadians(
      lat2 - lat1
    );

  const deltaLon =
    toRadians(
      lon2 - lon1
    );

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(
      toRadians(lat1)
    ) *
      Math.cos(
        toRadians(lat2)
      ) *
      Math.sin(deltaLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return (
    earthRadiusMeters *
    c
  );
}

/*
 * =========================================================
 * PHASE 20 — SEARCH CANDIDATES
 * =========================================================
 */

async function getSearchCandidates(
  event
) {
  if (!event?.currentCameraId) {
    return [];
  }

  const graphConnections =
    await CameraConnection.find({
      fromCameraId:
        event.currentCameraId,
      active: true,
    })
      .sort({
        priority: -1,
        distanceMeters: 1,
      })
      .lean();

  const candidates =
    new Map();

  for (
    const connection of
      graphConnections
  ) {
    candidates.set(
      connection.toCameraId,
      {
        cameraId:
          connection.toCameraId,
        source:
          "GRAPH",
        distanceMeters:
          connection.distanceMeters ??
          null,
        priorityScore:
          connection.priority ??
          0,
        roadName:
          connection.roadName ||
          "",
      }
    );
  }

  const propagated =
    await EmergencyPropagation.find({
      emergencyId:
        event.emergencyId,
      active: true,
      cameraId: {
        $ne:
          event.currentCameraId,
      },
    })
      .sort({
        priorityScore: -1,
        distanceMeters: 1,
      })
      .lean();

  for (
    const record of
      propagated
  ) {
    const cameraId =
      String(
        record.cameraId ||
          ""
      ).trim();

    if (!cameraId) {
      continue;
    }

    if (
      !candidates.has(
        cameraId
      )
    ) {
      candidates.set(
        cameraId,
        {
          cameraId,
          source:
            "PROPAGATION",
          distanceMeters:
            record.distanceMeters ??
            null,
          priorityScore:
            record.priorityScore ??
            0,
          roadName:
            "",
        }
      );
    }
  }

  const candidateIds =
    [...candidates.keys()];

  if (
    !candidateIds.length
  ) {
    return [];
  }

  const cameras =
    await TrafficCamera.find({
      cameraId: {
        $in:
          candidateIds,
      },
      status: "active",
    })
      .select(
        "cameraId name location city district area latitude longitude status aiEnabled"
      )
      .lean();

  const cameraMap =
    new Map(
      cameras.map(
        (camera) => [
          camera.cameraId,
          camera,
        ]
      )
    );

  return [
    ...candidates.values(),
  ]
    .map(
      (candidate) => ({
        ...candidate,
        camera:
          cameraMap.get(
            candidate.cameraId
          ) || null,
      })
    )
    .filter(
      (candidate) =>
        !!candidate.camera
    )
    .sort(
      (a, b) =>
        b.priorityScore -
        a.priorityScore
    );
}

/*
 * =========================================================
 * PHASE 26 — DESTINATION CHECK
 * =========================================================
 */

async function evaluateDestinationReached(
  event
) {
  if (
    !event?.destination
  ) {
    return {
      reached: false,
      reason:
        "Destination is not available.",
      distanceMeters:
        null,
      camera: null,
    };
  }

  const destinationLatitude =
    Number(
      event.destination.latitude
    );

  const destinationLongitude =
    Number(
      event.destination.longitude
    );

  if (
    !Number.isFinite(
      destinationLatitude
    ) ||
    !Number.isFinite(
      destinationLongitude
    ) ||
    !event.currentCameraId
  ) {
    return {
      reached: false,
      reason:
        "Destination coordinates or current camera are unavailable.",
      distanceMeters:
        null,
      camera: null,
    };
  }

  const camera =
    await TrafficCamera.findOne({
      cameraId:
        event.currentCameraId,
      status: "active",
    }).lean();

  if (!camera) {
    return {
      reached: false,
      reason:
        "Current emergency camera was not found.",
      distanceMeters:
        null,
      camera: null,
    };
  }

  const distanceMeters =
    haversineDistanceMeters({
      latitude1:
        camera.latitude,
      longitude1:
        camera.longitude,
      latitude2:
        destinationLatitude,
      longitude2:
        destinationLongitude,
    });

  if (
    distanceMeters ===
    null
  ) {
    return {
      reached: false,
      reason:
        "Camera/destination coordinates are invalid.",
      distanceMeters:
        null,
      camera,
    };
  }

  const reached =
    distanceMeters <=
    DESTINATION_REACHED_RADIUS_METERS;

  return {
    reached,
    reason: reached
      ? `Current camera is within ${DESTINATION_REACHED_RADIUS_METERS} meters of the destination.`
      : `Current camera is ${Math.round(distanceMeters)} meters from the destination.`,
    distanceMeters,
    camera,
  };
}

/*
 * =========================================================
 * PHASE 26 — RELEASE CORRIDOR
 * =========================================================
 */

async function releaseEmergencyCorridor(
  emergencyId
) {
  const result =
    await EmergencyPropagation.updateMany(
      {
        emergencyId,
        active: true,
      },
      {
        $set: {
          active: false,
          updatedAt:
            new Date(),
        },
      }
    );

  return {
    released:
      result.modifiedCount ||
      0,
  };
}

/*
 * =========================================================
 * PHASE 26 — RELEASE OFFICER RESPONSIBILITY
 * =========================================================
 */

async function resolveOfficerAlerts(
  emergencyId
) {
  const result =
    await OfficerEmergencyAlert.updateMany(
      {
        emergencyId,
        status: {
          $ne:
            "RESOLVED",
        },
      },
      {
        $set: {
          status:
            "RESOLVED",
          isRead:
            true,
          resolvedAt:
            new Date(),
          notes:
            "Emergency event completed; officer responsibility released.",
        },
      }
    );

  return {
    resolved:
      result.modifiedCount ||
      0,
  };
}

/*
 * =========================================================
 * PHASE 26 — COMPLETE EMERGENCY
 * =========================================================
 */

async function completeEmergency({
  emergencyId,
  reason =
    "Emergency event completed.",
  source = "SYSTEM",
  actorUserId = null,
  actorRole = "",
}) {
  const event =
    await EmergencyEvent.findOne({
      emergencyId,
    });

  if (!event) {
    throw new Error(
      "Emergency event not found"
    );
  }

  if (
    event.status ===
      "COMPLETED" ||
    event.status ===
      "CANCELLED"
  ) {
    return {
      completed: false,
      alreadyFinal:
        true,
      event,
      corridor:
        {
          released: 0,
        },
      officers:
        {
          resolved: 0,
        },
    };
  }

  event.status =
    "COMPLETED";

  event.completedAt =
    new Date();

  event.lastSeenAt =
    new Date();

  await event.save();

  const corridor =
    await releaseEmergencyCorridor(
      emergencyId
    );

  const officers =
    await resolveOfficerAlerts(
      emergencyId
    );

  await recordEmergencyAudit({
    emergencyId,
    action:
      "EMERGENCY_COMPLETED",
    source,
    cameraId:
      event.currentCameraId,
    previousCameraId:
      event.previousCameraId,
    status:
      event.status,
    priority:
      event.priority,
    priorityScore:
      event.priorityScore,
    confidence:
      event.confidence,
    reason,
    actorUserId,
    actorRole,
    metadata: {
      corridorReleased:
        corridor.released,
      officerAlertsResolved:
        officers.resolved,
    },
  });

  return {
    completed: true,
    alreadyFinal:
      false,
    event,
    corridor,
    officers,
  };
}

/*
 * =========================================================
 * PHASE 26 — CANCEL EMERGENCY
 * =========================================================
 */

async function cancelEmergency({
  emergencyId,
  reason =
    "Emergency event cancelled.",
  source = "SYSTEM",
  actorUserId = null,
  actorRole = "",
}) {
  const event =
    await EmergencyEvent.findOne({
      emergencyId,
    });

  if (!event) {
    throw new Error(
      "Emergency event not found"
    );
  }

  if (
    event.status ===
      "COMPLETED" ||
    event.status ===
      "CANCELLED"
  ) {
    return {
      cancelled: false,
      alreadyFinal:
        true,
      event,
      corridor:
        {
          released: 0,
        },
      officers:
        {
          resolved: 0,
        },
    };
  }

  event.status =
    "CANCELLED";

  event.completedAt =
    new Date();

  event.lastSeenAt =
    new Date();

  await event.save();

  const corridor =
    await releaseEmergencyCorridor(
      emergencyId
    );

  const officers =
    await resolveOfficerAlerts(
      emergencyId
    );

  await recordEmergencyAudit({
    emergencyId,
    action:
      "EMERGENCY_CANCELLED",
    source,
    cameraId:
      event.currentCameraId,
    previousCameraId:
      event.previousCameraId,
    status:
      event.status,
    priority:
      event.priority,
    priorityScore:
      event.priorityScore,
    confidence:
      event.confidence,
    reason,
    actorUserId,
    actorRole,
    metadata: {
      corridorReleased:
        corridor.released,
      officerAlertsResolved:
        officers.resolved,
    },
  });

  return {
    cancelled: true,
    alreadyFinal:
      false,
    event,
    corridor,
    officers,
  };
}

/*
 * =========================================================
 * PHASE 26 — COMPLETION EVALUATION
 * =========================================================
 */

async function evaluateCompletion(
  emergencyId
) {
  const event =
    await EmergencyEvent.findOne({
      emergencyId,
      status: {
        $in:
          ACTIVE_STATUSES,
      },
    }).lean();

  if (!event) {
    return {
      found: false,
      completed: false,
      reason:
        "Active emergency event not found",
    };
  }

  const destination =
    await evaluateDestinationReached(
      event
    );

  return {
    found: true,
    completed:
      destination.reached,
    reason:
      destination.reason,
    distanceMeters:
      destination.distanceMeters,
    currentCameraId:
      event.currentCameraId ||
      "",
    status:
      event.status,
    destinationAvailable:
      Boolean(
        Number.isFinite(
          Number(
            event.destination
              ?.latitude
          )
        ) &&
        Number.isFinite(
          Number(
            event.destination
              ?.longitude
          )
        )
      ),
  };
}

/*
 * =========================================================
 * PHASE 20 — RECOVERY STATUS
 * =========================================================
 */

async function evaluateRecovery(
  emergencyId
) {
  const event =
    await EmergencyEvent.findOne({
      emergencyId,
      status: {
        $in:
          ACTIVE_STATUSES,
      },
    }).lean();

  if (!event) {
    return {
      found: false,
      reason:
        "Active emergency event not found",
    };
  }

  /*
   * Phase 26 completion check comes before
   * declaring the vehicle lost.
   */
  const completion =
    await evaluateCompletion(
      emergencyId
    );

  if (
    completion.completed
  ) {
    return {
      found: true,
      searching: false,
      recovered: false,
      completed: true,
      completionReason:
        completion.reason,
      event,
      elapsedSeconds: 0,
      timeoutSeconds: 0,
      candidates: [],
    };
  }

  if (!event.currentCameraId) {
    return {
      found: true,
      searching: false,
      recovered: false,
      completed: false,
      reason:
        "Emergency has no current camera",
      event,
      candidates: [],
    };
  }

  const lastSeen =
    event.lastSeenAt ||
    event.updatedAt ||
    event.startedAt;

  const elapsedSeconds =
    Math.max(
      0,
      (
        Date.now() -
        new Date(
          lastSeen
        ).getTime()
      ) /
        1000
    );

  const connections =
    await CameraConnection.find({
      fromCameraId:
        event.currentCameraId,
      active: true,
    })
      .sort({
        priority: -1,
        distanceMeters: 1,
      })
      .lean();

  const positiveDistances =
    connections
      .map(
        (item) =>
          Number(
            item.distanceMeters
          ) || 0
      )
      .filter(
        (value) =>
          value > 0
      );

  const nearestDistance =
    positiveDistances.length >
    0
      ? Math.min(
          ...positiveDistances
        )
      : 500;

  const estimatedTravelSeconds =
    nearestDistance /
    12;

  const timeoutSeconds =
    clamp(
      estimatedTravelSeconds +
        SEARCH_GRACE_SECONDS,
      SEARCH_TIMEOUT_MIN_SECONDS,
      SEARCH_TIMEOUT_MAX_SECONDS
    );

  const timedOut =
    elapsedSeconds >=
    timeoutSeconds;

  if (
    !timedOut &&
    event.status !==
      "SEARCHING"
  ) {
    return {
      found: true,
      searching: false,
      recovered: false,
      completed: false,
      event,
      elapsedSeconds:
        Number(
          elapsedSeconds.toFixed(
            1
          )
        ),
      timeoutSeconds:
        Number(
          timeoutSeconds.toFixed(
            1
          )
        ),
      candidates: [],
    };
  }

  let updatedEvent =
    event;

  if (
    event.status !==
    "SEARCHING"
  ) {
    updatedEvent =
      await EmergencyEvent.findOneAndUpdate(
        {
          emergencyId,
          status: {
            $in: [
              "DETECTED",
              "TRACKING",
              "APPROACHING",
              "ACTIVE",
            ],
          },
        },
        {
          $set: {
            status:
              "SEARCHING",
          },
        },
        {
          new: true,
        }
      ).lean();

    console.log(
      "🔎 Emergency SEARCHING:",
      emergencyId,
      "| Last:",
      event.currentCameraId,
      "| elapsed:",
      Math.round(
        elapsedSeconds
      ),
      "s"
    );

    await recordEmergencyAudit({
      emergencyId,
      action:
        "RECOVERY_SEARCH_STARTED",
      source:
        "SYSTEM",
      cameraId:
        event.currentCameraId,
      previousCameraId:
        event.previousCameraId,
      status:
        "SEARCHING",
      priority:
        event.priority,
      priorityScore:
        event.priorityScore,
      confidence:
        event.confidence,
      reason:
        `No new confirmation within the expected camera handoff window; recovery search started.`,
      metadata: {
        elapsedSeconds,
        timeoutSeconds,
      },
    });
  }

  const candidates =
    await getSearchCandidates(
      updatedEvent
    );

  return {
    found: true,
    searching: true,
    recovered: false,
    completed: false,
    event: updatedEvent,
    elapsedSeconds:
      Number(
        elapsedSeconds.toFixed(
          1
        )
      ),
    timeoutSeconds:
      Number(
        timeoutSeconds.toFixed(
          1
        )
      ),
    candidates,
  };
}

/*
 * =========================================================
 * PHASE 20 — AI RECOVERY
 * =========================================================
 */

async function recoverEmergency({
  emergencyId,
  cameraId,
  vehicleType,
  confidence,
  appearanceSignature,
}) {
  const event =
    await EmergencyEvent.findOne({
      emergencyId,
      status: {
        $in: [
          "SEARCHING",
          "TRACKING",
          "APPROACHING",
          "ACTIVE",
        ],
      },
    });

  if (!event) {
    throw new Error(
      "Active emergency event not found"
    );
  }

  const camera =
    await TrafficCamera.findOne({
      cameraId,
      status: "active",
    }).lean();

  if (!camera) {
    throw new Error(
      "Recovery camera not found"
    );
  }

  if (
    vehicleType &&
    String(vehicleType).trim() !==
      String(
        event.vehicleType
      ).trim()
  ) {
    return {
      recovered: false,
      reason:
        "Vehicle type mismatch",
      similarity: 0,
    };
  }

  const incoming =
    normalizeSignature(
      appearanceSignature
    );

  const stored =
    normalizeSignature(
      event.appearanceSignature
    );

  const similarity =
    cosineSimilarity(
      stored,
      incoming
    );

  const recoveryConfidence =
    Number(confidence) || 0;

  const identityScore =
    stored.length > 0 &&
    incoming.length > 0
      ? similarity
      : recoveryConfidence;

  if (
    identityScore < 0.72
  ) {
    return {
      recovered: false,
      reason:
        "Same-vehicle confidence below recovery threshold",
      similarity:
        Number(
          similarity.toFixed(
            4
          )
        ),
      recoveryConfidence:
        Number(
          recoveryConfidence.toFixed(
            4
          )
        ),
    };
  }

  const previousCameraId =
    event.currentCameraId;

  event.previousCameraId =
    previousCameraId || "";

  event.currentCameraId =
    cameraId;

  event.status =
    "TRACKING";

  event.lastSeenAt =
    new Date();

  event.reidMatchScore =
    Number(
      identityScore.toFixed(
        4
      )
    );

  if (
    incoming.length > 0
  ) {
    event.appearanceSignature =
      incoming;
  }

  await event.save();

  await recordEmergencyAudit({
    emergencyId:
      event.emergencyId,
    action:
      "EMERGENCY_RECOVERED",
    source:
      "AI",
    cameraId:
      event.currentCameraId,
    previousCameraId,
    status:
      event.status,
    priority:
      event.priority,
    priorityScore:
      event.priorityScore,
    confidence:
      recoveryConfidence,
    reason:
      "Same emergency vehicle re-acquired during recovery.",
    metadata: {
      similarity:
        Number(
          similarity.toFixed(
            4
          )
        ),
      identityScore:
        Number(
          identityScore.toFixed(
            4
          )
        ),
      reidMethod:
        "HSV_APPEARANCE",
    },
  });

  return {
    recovered: true,
    reason:
      "Same emergency vehicle re-acquired",
    similarity:
      Number(
        similarity.toFixed(
          4
        )
      ),
    recoveryConfidence:
      Number(
        recoveryConfidence.toFixed(
          4
        )
      ),
    previousCameraId,
    currentCameraId:
      cameraId,
    event,
  };
}

module.exports = {
  evaluateRecovery,
  recoverEmergency,
  getSearchCandidates,
  evaluateCompletion,
  completeEmergency,
  cancelEmergency,
  releaseEmergencyCorridor,
  resolveOfficerAlerts,
  evaluateDestinationReached,
  DESTINATION_REACHED_RADIUS_METERS,
};
