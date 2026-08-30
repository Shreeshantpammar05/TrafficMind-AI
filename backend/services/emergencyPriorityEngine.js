const EmergencyEvent =
  require("../models/EmergencyEvent");

const TrafficCamera =
  require("../models/TrafficCamera");

const CameraConnection =
  require("../models/CameraConnection");

const EmergencyPriorityConfig =
  require("../models/EmergencyPriorityConfig");

const DEFAULT_CONFIG = {
  vehicleScores: {
    ambulance: 100,
    fire_truck: 95,
    police_vehicle: 90,
  },

  incidentScores: {
    NONE: 10,
    LOW: 35,
    MEDIUM: 65,
    HIGH: 85,
    CRITICAL: 100,
  },

  congestionBands: [
    {
      label: "CRITICAL",
      minVehicles: 30,
      factor: 0.45,
      score: 100,
    },

    {
      label: "HIGH",
      minVehicles: 20,
      factor: 0.60,
      score: 80,
    },

    {
      label: "MEDIUM",
      minVehicles: 10,
      factor: 0.78,
      score: 60,
    },

    {
      label: "LOW",
      minVehicles: 5,
      factor: 0.90,
      score: 35,
    },

    {
      label: "CLEAR",
      minVehicles: 0,
      factor: 0.97,
      score: 10,
    },
  ],

  etaBands: [
    {
      label: "IMMINENT",
      maxSeconds: 45,
      score: 100,
    },

    {
      label: "VERY_SOON",
      maxSeconds: 90,
      score: 85,
    },

    {
      label: "SOON",
      maxSeconds: 180,
      score: 65,
    },

    {
      label: "NORMAL",
      maxSeconds: 360,
      score: 40,
    },

    {
      label: "DISTANT",
      maxSeconds:86400,
      score: 20,
    },
  ],

  routeDelayBands: [
    {
      label: "SEVERE_DELAY",
      maxRatio: 0.60,
      score: 100,
    },

    {
      label: "HIGH_DELAY",
      maxRatio: 0.40,
      score: 85,
    },

    {
      label: "MEDIUM_DELAY",
      maxRatio: 0.20,
      score: 65,
    },

    {
      label: "LOW_DELAY",
      maxRatio: 0.05,
      score: 35,
    },

    {
      label: "CLEAR_ROUTE",
      maxRatio:1,
      score: 10,
    },
  ],

  weights: {
    vehicle: 0.20,
    incident: 0.25,
    congestion: 0.20,
    routeDelay: 0.20,
    etaUrgency: 0.15,
  },

  priorityThresholds: {
    critical: 80,
    high: 55,
    medium: 30,
  },

  vehicleSpeedsKmh: {
    ambulance: 42,
    fire_truck: 38,
    police_vehicle: 45,
    default: 40,
  },

  phase19Prediction: {
    graphWeight: 0.30,
    distanceWeight: 0.25,
    directionWeight: 0.20,
    trafficWeight: 0.10,
    confidenceWeight: 0.15,

    softmaxTemperature: 0.25,

    distanceScoreBands: [
      {
        maxMeters: 500,
        score: 1,
      },

      {
        maxMeters: 1000,
        score: 0.92,
      },

      {
        maxMeters: 2000,
        score: 0.82,
      },

      {
        maxMeters: 3000,
        score: 0.68,
      },

      {
        maxMeters:
          Number.POSITIVE_INFINITY,
        score: 0.50,
      },
    ],

    shortDistanceMeters: 1500,

    graphPriorityReasonThreshold: 70,

    confidenceReasonThreshold: 0.80,
  },
};

const clamp = (
  value,
  min,
  max
) =>
  Math.max(
    min,
    Math.min(max, value)
  );

const normalize = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const round = (
  value,
  digits = 2
) => {
  const factor =
    10 ** digits;

  return (
    Math.round(
      Number(value || 0) *
        factor
    ) / factor
  );
};

function mergeDefaults(
  saved
) {
  const source =
    saved || {};

  return {
    ...DEFAULT_CONFIG,
    ...source,

    vehicleScores: {
      ...DEFAULT_CONFIG.vehicleScores,
      ...(source.vehicleScores ||
        {}),
    },

    incidentScores: {
      ...DEFAULT_CONFIG.incidentScores,
      ...(source.incidentScores ||
        {}),
    },

    congestionBands:
      Array.isArray(
        source.congestionBands
      ) &&
      source.congestionBands.length
        ? source.congestionBands
        : DEFAULT_CONFIG.congestionBands,

    etaBands:
      Array.isArray(
        source.etaBands
      ) &&
      source.etaBands.length
        ? source.etaBands
        : DEFAULT_CONFIG.etaBands,

    routeDelayBands:
      Array.isArray(
        source.routeDelayBands
      ) &&
      source.routeDelayBands.length
        ? source.routeDelayBands
        : DEFAULT_CONFIG.routeDelayBands,

    weights: {
      ...DEFAULT_CONFIG.weights,
      ...(source.weights || {}),
    },

    priorityThresholds: {
      ...DEFAULT_CONFIG.priorityThresholds,
      ...(source.priorityThresholds ||
        {}),
    },

    vehicleSpeedsKmh: {
      ...DEFAULT_CONFIG.vehicleSpeedsKmh,
      ...(source.vehicleSpeedsKmh ||
        {}),
    },

    phase19Prediction: {
      ...DEFAULT_CONFIG.phase19Prediction,
      ...(source.phase19Prediction ||
        {}),
    },
  };
}

async function getEmergencyPriorityConfig() {
  let config =
    await EmergencyPriorityConfig.findOne(
      {
        configKey:
          "default",
      }
    ).lean();

  if (!config) {
    const created =
      await EmergencyPriorityConfig.create(
        {
          configKey:
            "default",

          ...DEFAULT_CONFIG,
        }
      );

    config =
      created.toObject();
  }

  return mergeDefaults(
    config
  );
}

function getCongestionAssessment(
  camera,
  config
) {
  const count =
    Number(
      camera?.vehicleCount
    );

  if (
    Number.isFinite(
      count
    ) &&
    Array.isArray(
      config.congestionBands
    )
  ) {
    const bands =
      [
        ...config.congestionBands,
      ].sort(
        (a, b) =>
          Number(
            b.minVehicles
          ) -
          Number(
            a.minVehicles
          )
      );

    const match =
      bands.find(
        (band) =>
          count >=
          Number(
            band.minVehicles
          )
      );

    if (match) {
      return {
        label:
          match.label,

        score:
          clamp(
            Number(
              match.score
            ) || 0,
            0,
            100
          ),

        factor:
          clamp(
            Number(
              match.factor
            ) || 1,
            0,
            1
          ),

        vehicleCount:
          count,

        source:
          "vehicleCount",
      };
    }
  }

  return {
    label:
      "UNKNOWN",

    score: 0,

    factor: 1,

    vehicleCount:
      Number.isFinite(
        count
      )
        ? count
        : null,

    source:
      "unavailable",
  };
}

function getIncidentAssessment(
  camera,
  config
) {
  const label =
    normalize(
      camera?.accidentSeverity
    ) || "NONE";

  return {
    label,

    score:
      clamp(
        Number(
          config
            .incidentScores?.[
              label
            ] ??
            config
              .incidentScores?.NONE ??
            0
        ),
        0,
        100
      ),
  };
}

function getVehicleAssessment(
  vehicleType,
  config
) {
  const type =
    String(
      vehicleType ||
        ""
    )
      .trim()
      .toLowerCase();

  return {
    type,

    score:
      clamp(
        Number(
          config
            .vehicleScores?.[
              type
            ] || 0
        ),
        0,
        100
      ),
  };
}

function getVehicleSpeedKmh(
  vehicleType,
  config
) {
  const type =
    String(
      vehicleType ||
        ""
    )
      .trim()
      .toLowerCase();

  return Math.max(
    1,

    Number(
      config
        .vehicleSpeedsKmh?.[
          type
        ] ??
        config
          .vehicleSpeedsKmh?.default ??
        40
    )
  );
}

function calculateEtaSeconds({
  distanceMeters,
  vehicleType,
  congestionFactor,
  config,
}) {
  const distance =
    Number(
      distanceMeters
    );

  if (
    !Number.isFinite(
      distance
    ) ||
    distance <= 0
  ) {
    return null;
  }

  const baseSpeed =
    getVehicleSpeedKmh(
      vehicleType,
      config
    );

  const factor =
    clamp(
      Number(
        congestionFactor
      ),
      0.10,
      1
    );

  const speedMps =
    (
      baseSpeed *
      factor *
      1000
    ) / 3600;

  return speedMps >
    0
    ? Math.max(
        1,

        Math.round(
          distance /
            speedMps
        )
      )
    : null;
}

function getBandScore(
  value,
  bands,
  key
) {
  const numeric =
    Number(value);

  if (
    !Number.isFinite(
      numeric
    ) ||
    !Array.isArray(
      bands
    ) ||
    bands.length ===
      0
  ) {
    return {
      label:
        "UNKNOWN",

      score: 0,
    };
  }

  const sorted =
    [
      ...bands,
    ].sort(
      (a, b) =>
        Number(
          a[key]
        ) -
        Number(
          b[key]
        )
    );

  const selected =
    sorted.find(
      (band) =>
        numeric <=
        Number(
          band[key]
        )
    ) ||
    sorted[
      sorted.length -
        1
    ];

  return {
    label:
      selected?.label ||
      "UNKNOWN",

    score:
      clamp(
        Number(
          selected?.score
        ) || 0,
        0,
        100
      ),
  };
}

function calculateRouteDelayAssessment({
  distanceMeters,
  vehicleType,
  congestionFactor,
  etaSeconds,
  config,
}) {
  const clearEta =
    calculateEtaSeconds({
      distanceMeters,
      vehicleType,

      congestionFactor:
        1,

      config,
    });

  if (
    clearEta == null ||
    etaSeconds == null
  ) {
    return {
      label:
        "UNKNOWN",

      score: 0,

      delayRatio:
        0,

      clearEtaSeconds:
        clearEta,
    };
  }

  const delayRatio =
    clamp(
      (
        etaSeconds -
        clearEta
      ) /
        clearEta,

      0,
      1
    );

  const band =
    getBandScore(
      delayRatio,

      config.routeDelayBands,

      "maxRatio"
    );

  return {
    label:
      band.label,

    score:
      band.score,

    delayRatio:
      round(
        delayRatio,
        4
      ),

    clearEtaSeconds:
      clearEta,
  };
}

function resolvePriority(
  score,
  config
) {
  const thresholds =
    config.priorityThresholds;

  if (
    score >=
    Number(
      thresholds.critical
    )
  ) {
    return "CRITICAL";
  }

  if (
    score >=
    Number(
      thresholds.high
    )
  ) {
    return "HIGH";
  }

  if (
    score >=
    Number(
      thresholds.medium
    )
  ) {
    return "MEDIUM";
  }

  return "NORMAL";
}

function buildReasons({
  vehicle,
  incident,
  congestion,
  routeDelay,
  etaUrgency,
  priority,
}) {
  const reasons =
    [];

  if (
    vehicle.score >=
    90
  ) {
    reasons.push(
      `${
        vehicle.type ||
        "emergency vehicle"
      } has high emergency priority`
    );
  }

  if (
    incident.score >=
    80
  ) {
    reasons.push(
      `${incident.label} incident severity`
    );
  }

  if (
    congestion.score >=
    80
  ) {
    reasons.push(
      `${congestion.label.toLowerCase()} traffic congestion`
    );
  }

  if (
    routeDelay.score >=
    80
  ) {
    reasons.push(
      `${routeDelay.label
        .toLowerCase()
        .replace(
          /_/g,
          " "
        )} route delay`
    );
  }

  if (
    etaUrgency.score >=
    85
  ) {
    reasons.push(
      "emergency arrival is time-critical"
    );
  }

  if (
    reasons.length ===
    0
  ) {
    reasons.push(
      "priority derived from current emergency conditions"
    );
  }

  reasons.push(
    `final priority ${priority}`
  );

  return reasons;
}

async function calculateEmergencyPriority(
  emergencyOrId
) {
  const event =
    typeof emergencyOrId ===
    "string"
      ? await EmergencyEvent.findOne(
          {
            emergencyId:
              emergencyOrId,
          }
        )
      : emergencyOrId;

  if (!event) {
    throw new Error(
      "Emergency event not found"
    );
  }

  const config =
    await getEmergencyPriorityConfig();

  let camera = null;

  if (
    event.currentCameraId
  ) {
    camera =
      await TrafficCamera.findOne(
        {
          cameraId:
            event.currentCameraId,

          status:
            "active",
        }
      ).lean();
  }

  const nextConnection =
    event.currentCameraId
      ? await CameraConnection.findOne(
          {
            fromCameraId:
              event.currentCameraId,

            active:
              true,
          }
        )
          .sort({
            priority:
              -1,

            distanceMeters:
              1,
          })
          .lean()
      : null;

  const congestion =
    getCongestionAssessment(
      camera,
      config
    );

  const incident =
    getIncidentAssessment(
      camera,
      config
    );

  const vehicle =
    getVehicleAssessment(
      event.vehicleType,
      config
    );

  const etaSeconds =
    nextConnection
      ? calculateEtaSeconds({
          distanceMeters:
            nextConnection.distanceMeters,

          vehicleType:
            event.vehicleType,

          congestionFactor:
            congestion.factor,

          config,
        })
      : null;

  const routeDelay =
    calculateRouteDelayAssessment({
      distanceMeters:
        nextConnection?.distanceMeters,

      vehicleType:
        event.vehicleType,

      congestionFactor:
        congestion.factor,

      etaSeconds,

      config,
    });

  const etaUrgency =
    getBandScore(
      etaSeconds,

      config.etaBands,

      "maxSeconds"
    );

  const weights =
    config.weights;

  const totalWeight =
    Object.values(
      weights
    ).reduce(
      (
        sum,
        value
      ) =>
        sum +
        Number(
          value ||
            0
        ),

      0
    ) || 1;

  const weightedScore =
    (
      vehicle.score *
        Number(
          weights.vehicle ||
            0
        ) +

      incident.score *
        Number(
          weights.incident ||
            0
        ) +

      congestion.score *
        Number(
          weights.congestion ||
            0
        ) +

      routeDelay.score *
        Number(
          weights.routeDelay ||
            0
        ) +

      etaUrgency.score *
        Number(
          weights.etaUrgency ||
            0
        )
    ) /
    totalWeight;

  const priorityScore =
    round(
      clamp(
        weightedScore,
        0,
        100
      ),
      1
    );

  const priority =
    resolvePriority(
      priorityScore,
      config
    );

  const reasons =
    buildReasons({
      vehicle,
      incident,
      congestion,
      routeDelay,
      etaUrgency,
      priority,
    });

  return {
    priority,

    priorityScore,

    etaSeconds,

    nextCameraId:
      nextConnection?.toCameraId ||
      "",

    breakdown: {
      vehicle: {
        type:
          vehicle.type,

        score:
          round(
            vehicle.score,
            1
          ),

        weight:
          Number(
            weights.vehicle ||
              0
          ),
      },

      incident: {
        severity:
          incident.label,

        score:
          round(
            incident.score,
            1
          ),

        weight:
          Number(
            weights.incident ||
              0
          ),
      },

      congestion: {
        level:
          congestion.label,

        vehicleCount:
          congestion.vehicleCount,

        score:
          round(
            congestion.score,
            1
          ),

        factor:
          round(
            congestion.factor,
            3
          ),

        weight:
          Number(
            weights.congestion ||
              0
          ),
      },

      routeDelay: {
        level:
          routeDelay.label,

        score:
          round(
            routeDelay.score,
            1
          ),

        delayRatio:
          routeDelay.delayRatio,

        clearEtaSeconds:
          routeDelay.clearEtaSeconds,

        etaSeconds,

        weight:
          Number(
            weights.routeDelay ||
              0
          ),
      },

      etaUrgency: {
        level:
          etaUrgency.label,

        score:
          round(
            etaUrgency.score,
            1
          ),

        etaSeconds,

        weight:
          Number(
            weights.etaUrgency ||
              0
          ),
      },
    },

    reasons,

    configVersion:
      config.version ||
      1,
  };
}

async function applyEmergencyPriority(
  emergencyId
) {
  const event =
    await EmergencyEvent.findOne(
      {
        emergencyId,
      }
    );

  if (!event) {
    throw new Error(
      "Emergency event not found"
    );
  }

  const result =
    await calculateEmergencyPriority(
      event
    );

  event.priority =
    result.priority;

  event.priorityScore =
    result.priorityScore;

  event.priorityBreakdown =
    result.breakdown;

  event.priorityReasons =
    result.reasons;

  event.priorityUpdatedAt =
    new Date();

  await event.save();

  return {
    event,

    priority:
      result,
  };
}

module.exports = {
  DEFAULT_CONFIG,
  getEmergencyPriorityConfig,
  calculateEmergencyPriority,
  applyEmergencyPriority,
  resolvePriority,
  getVehicleSpeedKmh,
  calculateEtaSeconds,
};