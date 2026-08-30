const express = require("express");

const router = express.Router();

const EmergencyEvent =
  require("../models/EmergencyEvent");

const CameraConnection =
  require("../models/CameraConnection");

const TrafficCamera =
  require("../models/TrafficCamera");

const {
  verifyToken,
} = require("../middleware/authMiddleware");

const {
  getEmergencyPriorityConfig,
} = require("../services/emergencyPriorityEngine");

// =========================================================
// PHASE 19
// PREDICTIVE NEXT-CAMERA INTELLIGENCE
// =========================================================
//
// Prediction is intentionally explainable.
//
// Inputs:
// - Camera graph priority
// - Connection distance
// - Direction
// - Bearing
// - Current traffic density where available
// - Vehicle type
// - Current emergency confidence
//
// Output:
// - Ranked downstream cameras
// - Probability
// - ETA
// - Explanation factors
// =========================================================

const ACTIVE_STATUSES = [
  "DETECTED",
  "TRACKING",
  "APPROACHING",
  "ACTIVE",
  "SEARCHING",
];

// =========================================================
// Utility
// =========================================================

const clamp = (
  value,
  min,
  max
) => Math.max(
  min,
  Math.min(max, value)
);

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const round = (
  value,
  digits = 2
) => {
  const factor =
    10 ** digits;

  return Math.round(
    value * factor
  ) / factor;
};

// =========================================================
// Estimated emergency speed
// =========================================================
//
// This is an explainable baseline.
// Later phases can replace this with
// learned speed prediction.
//
// km/h baseline by emergency vehicle.
// =========================================================

const getBaseSpeedKmh = (
  vehicleType,
  config
) => {
  const type =
    normalize(vehicleType);

  return Math.max(
    1,
    Number(
      config?.vehicleSpeedsKmh?.[
        type
      ] ??
        config?.vehicleSpeedsKmh?.default ??
        40
    )
  );
};

// =========================================================
// Traffic adjustment
// =========================================================

const getTrafficFactor = (
  camera,
  config
) => {
  const vehicleCount =
    Number(
      camera?.vehicleCount
    );

  if (
    Number.isFinite(
      vehicleCount
    ) &&
    Array.isArray(
      config?.congestionBands
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
          vehicleCount >=
          Number(
            band.minVehicles
          )
      );

    if (match) {
      return {
        factor:
          Math.max(
            0,
            Math.min(
              1,
              Number(
                match.factor
              ) || 1
            )
          ),
        label:
          match.label ||
          "UNKNOWN",
      };
    }
  }

  return {
    factor: 1,
    label: "UNKNOWN",
  };
};

// =========================================================
// Direction consistency
// =========================================================

const getDirectionScore = (
  connection
) => {
  if (
    connection?.direction &&
    connection.direction !==
      "UNKNOWN"
  ) {
    return 1;
  }

  if (
    Number.isFinite(
      Number(connection?.bearing)
    )
  ) {
    return 0.85;
  }

  return 0.55;
};

// =========================================================
// Distance score
// =========================================================

const getDistanceScore = (
  distanceMeters,
  config
) => {
  const distance =
    Number(
      distanceMeters
    );

  if (
    !Number.isFinite(
      distance
    ) ||
    distance < 0
  ) {
    return 0.5;
  }

  const bands =
    Array.isArray(
      config?.phase19Prediction?.distanceScoreBands
    )
      ? [
          ...config.phase19Prediction.distanceScoreBands,
        ].sort(
          (a, b) =>
            Number(
              a.maxMeters
            ) -
            Number(
              b.maxMeters
            )
        )
      : [];

  const match =
    bands.find(
      (band) =>
        distance <=
        Number(
          band.maxMeters
        )
    );

  return Math.max(
    0,
    Math.min(
      1,
      Number(
        match?.score ?? 0.5
      )
    )
  );
};

// =========================================================
// Graph priority score
// =========================================================

const getPriorityScore = (
  priority
) => {
  const value =
    Number(priority);

  if (
    !Number.isFinite(
      value
    )
  ) {
    return 0.5;
  }

  return clamp(
    value / 100,
    0,
    1
  );
};

// =========================================================
// Calculate raw prediction score
// =========================================================

const calculatePredictionScore = ({
  connection,
  trafficFactor,
  emergencyConfidence,
  config,
}) => {
  const graphScore =
    getPriorityScore(
      connection.priority
    );

  const distanceScore =
    getDistanceScore(
      connection.distanceMeters,
      config
    );

  const directionScore =
    getDirectionScore(
      connection
    );

  const trafficScore =
    trafficFactor.factor;

  const confidenceScore =
    clamp(
      Number(
        emergencyConfidence
      ) || 0,
      0,
      1
    );

  const weights =
    config?.phase19Prediction ||
    {};

  const totalWeight =
    [
      weights.graphWeight,
      weights.distanceWeight,
      weights.directionWeight,
      weights.trafficWeight,
      weights.confidenceWeight,
    ].reduce(
      (sum, value) =>
        sum +
        Number(
          value || 0
        ),
      0
    ) || 1;

  const score =
    (
      graphScore *
        Number(
          weights.graphWeight ||
            0
        ) +
      distanceScore *
        Number(
          weights.distanceWeight ||
            0
        ) +
      directionScore *
        Number(
          weights.directionWeight ||
            0
        ) +
      trafficScore *
        Number(
          weights.trafficWeight ||
            0
        ) +
      confidenceScore *
        Number(
          weights.confidenceWeight ||
            0
        )
    ) /
    totalWeight;

  return clamp(
    score,
    0,
    1
  );
};

// =========================================================
// ETA
// =========================================================

const calculateEtaSeconds = ({
  distanceMeters,
  vehicleType,
  congestionFactor,
  config,
}) => {
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
    getBaseSpeedKmh(
      vehicleType,
      config
    );

  const factor =
    Math.max(
      0.10,
      Math.min(
        1,
        Number(
          congestionFactor ?? 1
        )
      )
    );

  const speedMps =
    (
      baseSpeed *
      factor *
      1000
    ) / 3600;

  return speedMps > 0
    ? Math.max(
        1,
        Math.round(
          distance /
            speedMps
        )
      )
    : null;
};

// =========================================================
// MAIN PREDICTION
// =========================================================

router.get(
  "/:emergencyId",
  verifyToken,
  async (req, res) => {
    try {
      const emergencyId =
        String(
          req.params.emergencyId ||
            ""
        ).trim();

      if (!emergencyId) {
        return res.status(400).json({
          success: false,
          error:
            "Emergency ID is required",
        });
      }

      const event =
        await EmergencyEvent.findOne({
          emergencyId,
          status: {
            $in:
              ACTIVE_STATUSES,
          },
        }).lean();

      if (!event) {
        return res.status(404).json({
          success: false,
          error:
            "Active emergency event not found",
        });
      }

      const priorityConfig =
        await getEmergencyPriorityConfig();

      if (!event.currentCameraId) {
        return res.json({
          success: true,
          emergencyId,
          currentCameraId: "",
          predictedNextCamera: null,
          predictions: [],
          message:
            "Emergency has no current camera",
        });
      }

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

      if (
        connections.length === 0
      ) {
        return res.json({
          success: true,
          emergencyId,
          currentCameraId:
            event.currentCameraId,
          predictedNextCamera:
            null,
          predictions: [],
          message:
            "No downstream camera connections found",
        });
      }

      const destinationLat =
        Number(
          event.destination?.latitude
        );

      const destinationLon =
        Number(
          event.destination?.longitude
        );

      const hasDestination =
        Number.isFinite(
          destinationLat
        ) &&
        Number.isFinite(
          destinationLon
        );

      const predictions =
        await Promise.all(
          connections.map(
            async (
              connection
            ) => {
              const camera =
                await TrafficCamera.findOne(
                  {
                    cameraId:
                      connection.toCameraId,
                    status: "active",
                  }
                ).lean();

              const traffic =
                getTrafficFactor(
                  camera,
                  priorityConfig
                );

              const score =
                calculatePredictionScore({
                  connection,
                  trafficFactor:
                    traffic,
                  emergencyConfidence:
                    event.confidence,
                  config:
                    priorityConfig,
                });

             const etaSeconds =
  calculateEtaSeconds({
    distanceMeters:
      connection.distanceMeters,

    vehicleType:
      event.vehicleType,

    congestionFactor:
      traffic?.factor ?? 1,

    config:
      priorityConfig,
  });

              const factors = [];

              if (
                Number(
                  connection.priority
                ) >=
                  Number(
                    priorityConfig
                      ?.phase19Prediction
                      ?.graphPriorityReasonThreshold ??
                      70
                  )
              ) {
                factors.push(
                  "high graph priority"
                );
              }

              if (
                Number(
                  connection.distanceMeters
                ) <=
                  Number(
                    priorityConfig
                      ?.phase19Prediction
                      ?.shortDistanceMeters ??
                      1500
                  )
              ) {
                factors.push(
                  "short downstream distance"
                );
              }

              if (
                connection.direction &&
                connection.direction !==
                  "UNKNOWN"
              ) {
                factors.push(
                  `direction ${connection.direction}`
                );
              }

              if (
                traffic.label !==
                "UNKNOWN"
              ) {
                factors.push(
                  `${traffic.label.toLowerCase()} traffic`
                );
              }

              if (
                event.confidence >=
                Number(
                  priorityConfig
                    ?.phase19Prediction
                    ?.confidenceReasonThreshold ??
                    0.8
                )
              ) {
                factors.push(
                  "high emergency detection confidence"
                );
              }

              return {
                cameraId:
                  connection.toCameraId,

                camera:
                  camera || null,

                probability: 0,

                rawScore:
                  round(
                    score,
                    4
                  ),

                etaSeconds,

                etaText:
                  etaSeconds === null
                    ? "ETA unavailable"
                    : `${Math.floor(
                        etaSeconds /
                          60
                      )}m ${etaSeconds % 60}s`,

                distanceMeters:
                  connection.distanceMeters,

                direction:
                  connection.direction ||
                  "UNKNOWN",

                bearing:
                  connection.bearing ??
                  null,

                roadName:
                  connection.roadName ||
                  "",

                connectionPriority:
                  connection.priority ??
                  50,

                trafficLevel:
                  traffic.label,

                factors,
                
                destinationRelevant:
                  hasDestination,
              };
            }
          )
        );

      // =====================================================
      // Softmax-like normalization
      // Keeps probabilities meaningful while avoiding
      // falsely claiming exact ML probabilities.
      // =====================================================

      const temperature =
        Number(
          priorityConfig
            ?.phase19Prediction
            ?.softmaxTemperature
        ) || 0.25;

      const exponentials =
        predictions.map(
          (item) =>
            Math.exp(
              item.rawScore /
                temperature
            )
        );

      const total =
        exponentials.reduce(
          (sum, value) =>
            sum + value,
          0
        );

      predictions.forEach(
        (item, index) => {
          item.probability =
            total > 0
              ? round(
                  exponentials[index] /
                    total,
                  4
                )
              : 0;
        }
      );

      predictions.sort(
        (a, b) =>
          b.probability -
          a.probability
      );

      predictions.forEach(
        (item, index) => {
          item.rank =
            index + 1;
        }
      );

      const topPrediction =
        predictions[0] || null;

      return res.json({
        success: true,

        phase: 19,

        emergencyId,

        vehicleType:
          event.vehicleType,

        emergencyStatus:
          event.status,

        currentCameraId:
          event.currentCameraId,

        confidence:
          event.confidence,

        predictedNextCamera:
          topPrediction
            ? {
                cameraId:
                  topPrediction.cameraId,

                probability:
                  topPrediction.probability,

                probabilityPercent:
                  round(
                    topPrediction.probability *
                      100,
                    1
                  ),

                etaSeconds:
                  topPrediction.etaSeconds,

                etaText:
                  topPrediction.etaText,

                distanceMeters:
                  topPrediction.distanceMeters,

                roadName:
                  topPrediction.roadName,

                direction:
                  topPrediction.direction,

                trafficLevel:
                  topPrediction.trafficLevel,

                factors:
                  topPrediction.factors,
              }
            : null,

        predictions,

        model: {
          type:
            "EXPLAINABLE_GRAPH_SCORE",

          configVersion:
            priorityConfig.version ||
            1,
          description:
            "Weighted downstream-camera prediction using graph priority, distance, direction, traffic state and emergency confidence.",
          learnedModel:
            false,
        },
      });
    } catch (error) {
      console.error(
        "Phase 19 Prediction Error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to generate next-camera prediction",
      });
    }
  }
);

module.exports = router;