const TrafficCamera =
  require("../models/TrafficCamera");

const CameraDetectionHistory =
  require(
    "../models/CameraDetectionHistory"
  );

const HISTORY_LIMIT = 8;

const NEARBY_RADIUS_KM = 5;

function getTrendLabel(
  previousCount,
  currentCount
) {
  if (
    previousCount == null ||
    currentCount == null
  ) {
    return "STABLE";
  }

  const difference =
    currentCount -
    previousCount;

  if (difference >= 5) {
    return "RISING FAST";
  }

  if (difference >= 2) {
    return "RISING";
  }

  if (difference <= -5) {
    return "FALLING FAST";
  }

  if (difference <= -2) {
    return "FALLING";
  }

  return "STABLE";
}

function getPredictedCongestion(
  latest,
  averageRecent,
  trend
) {
  if (
    latest.accidentDetected ||
    latest.emergencyDetected
  ) {
    return "HIGH";
  }

  const trendBoost =
    trend === "RISING FAST"
      ? 5
      : trend === "RISING"
      ? 2
      : 0;

  const projectedVehicles =
    Math.round(
      averageRecent +
        trendBoost
    );

  if (
    latest.congestion ===
      "HIGH" ||
    projectedVehicles >= 25
  ) {
    return "HIGH";
  }

  if (
    latest.congestion ===
      "MEDIUM" ||
    projectedVehicles >= 10
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

function calculateDistanceKm(
  lat1,
  lon1,
  lat2,
  lon2
) {
  const toRadians = (value) =>
    (value * Math.PI) / 180;

  const earthRadiusKm = 6371;

  const dLat = toRadians(
    lat2 - lat1
  );

  const dLon = toRadians(
    lon2 - lon1
  );

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(
      toRadians(lat1)
    ) *
      Math.cos(
        toRadians(lat2)
      ) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return (
    earthRadiusKm * c
  );
}

async function getPredictiveTrafficIntelligence(
  cameraFilter = {},
  nearbyOptions = {}
) {
  const {
    includeNearby = false,
    nearbyArea = "",
  } = nearbyOptions;

  let cameras =
    await TrafficCamera.find({
      status: "active",
      aiEnabled: true,
      ...cameraFilter,
    })
      .select(
        "cameraId name location city district area latitude longitude"
      )
      .lean();

  let nearbyCameras = [];

  /*
   * Nearby cameras are only enabled when the
   * caller explicitly requests them.
   */
  if (
    includeNearby &&
    nearbyArea
  ) {
    const localCameras =
      cameras.filter(
        (camera) =>
          camera.area ===
          nearbyArea
      );

    if (
      localCameras.length > 0
    ) {
      const allCameras =
        await TrafficCamera.find({
          status: "active",
          aiEnabled: true,
          _id: {
            $nin:
              localCameras.map(
                (camera) =>
                  camera._id
              ),
          },
        })
          .select(
            "cameraId name location city district area latitude longitude"
          )
          .lean();

      nearbyCameras =
        allCameras.filter(
          (camera) => {
            if (
              !Number.isFinite(
                Number(
                  camera.latitude
                )
              ) ||
              !Number.isFinite(
                Number(
                  camera.longitude
                )
              )
            ) {
              return false;
            }

            return localCameras.some(
              (localCamera) => {
                if (
                  !Number.isFinite(
                    Number(
                      localCamera.latitude
                    )
                  ) ||
                  !Number.isFinite(
                    Number(
                      localCamera.longitude
                    )
                  )
                ) {
                  return false;
                }

                const distance =
                  calculateDistanceKm(
                    Number(
                      localCamera.latitude
                    ),
                    Number(
                      localCamera.longitude
                    ),
                    Number(
                      camera.latitude
                    ),
                    Number(
                      camera.longitude
                    )
                  );

                return (
                  distance <=
                  NEARBY_RADIUS_KM
                );
              }
            );
          }
        );

      cameras = [
        ...localCameras,
        ...nearbyCameras,
      ];
    }
  }

  const cameraPredictions = [];

  for (
    const camera of cameras
  ) {
    const history =
      await CameraDetectionHistory.find({
        cameraId:
          camera.cameraId,
      })
        .sort({
          detectedAt: -1,
        })
        .limit(
          HISTORY_LIMIT
        )
        .lean();

    if (!history.length) {
      cameraPredictions.push({
        cameraId:
          camera.cameraId,

        name:
          camera.name,

        location:
          camera.location,

        city:
          camera.city,

        district:
          camera.district,

        area:
          camera.area,

        currentVehicles: 0,

        recentAverageVehicles: 0,

        trend: "NO DATA",

        predictedCongestion:
          "LOW",

        currentCongestion:
          "LOW",

        riskLevel: "LOW",

        confidence: 0,

        emergencyDetected:
          false,

        accidentDetected:
          false,

        accidentSeverity:
          "NONE",

        observedAt: null,

        observations: 0,

        nearby:
          includeNearby &&
          nearbyCameras.some(
            (nearCamera) =>
              nearCamera.cameraId ===
              camera.cameraId
          ),
      });

      continue;
    }

    const orderedHistory =
      [...history].reverse();

    const latest =
      orderedHistory[
        orderedHistory.length - 1
      ];

    const previous =
      orderedHistory.length > 1
        ? orderedHistory[
            orderedHistory.length - 2
          ]
        : null;

    const counts =
      orderedHistory.map(
        (item) =>
          Number(
            item.vehicleCount
          ) || 0
      );

    const recentAverage =
      counts.length
        ? Math.round(
            counts.reduce(
              (sum, value) =>
                sum + value,
              0
            ) /
              counts.length
          )
        : 0;

    const trend =
      getTrendLabel(
        previous?.vehicleCount,
        latest.vehicleCount
      );

    const predictedCongestion =
      getPredictedCongestion(
        latest,
        recentAverage,
        trend
      );

    let riskLevel =
      "LOW";

    if (
      latest.accidentDetected ||
      latest.emergencyDetected
    ) {
      riskLevel =
        "CRITICAL";
    } else if (
      predictedCongestion ===
      "HIGH"
    ) {
      riskLevel =
        "HIGH";
    } else if (
      predictedCongestion ===
      "MEDIUM"
    ) {
      riskLevel =
        "MEDIUM";
    }

    const confidence =
      Number(
        latest.averageConfidence
      ) || 0;

    cameraPredictions.push({
      cameraId:
        camera.cameraId,

      name:
        camera.name,

      location:
        camera.location,

      city:
        camera.city,

      district:
        camera.district,

      area:
        camera.area,

      currentVehicles:
        Number(
          latest.vehicleCount
        ) || 0,

      recentAverageVehicles:
        recentAverage,

      trend,

      predictedCongestion,

      currentCongestion:
        latest.congestion ||
        "LOW",

      riskLevel,

      confidence,

      emergencyDetected:
        latest.emergencyDetected ===
        true,

      accidentDetected:
        latest.accidentDetected ===
        true,

      accidentSeverity:
        latest.accidentSeverity ||
        "NONE",

      observedAt:
        latest.detectedAt,

      observations:
        orderedHistory.length,

      nearby:
        includeNearby &&
        nearbyCameras.some(
          (nearCamera) =>
            nearCamera.cameraId ===
            camera.cameraId
        ),
    });
  }

  const totalCurrentVehicles =
    cameraPredictions.reduce(
      (sum, camera) =>
        sum +
        camera.currentVehicles,
      0
    );

  const risingCameras =
    cameraPredictions.filter(
      (camera) =>
        camera.trend ===
          "RISING" ||
        camera.trend ===
          "RISING FAST"
    );

  const highPredictedCameras =
    cameraPredictions.filter(
      (camera) =>
        camera.predictedCongestion ===
        "HIGH"
    );

  const criticalCameras =
    cameraPredictions.filter(
      (camera) =>
        camera.riskLevel ===
        "CRITICAL"
    );

  const predictedCongestion =
    highPredictedCameras.length >
    0
      ? "HIGH"
      : cameraPredictions.some(
          (camera) =>
            camera.predictedCongestion ===
            "MEDIUM"
        )
      ? "MEDIUM"
      : "LOW";

  const predictedRisk =
    criticalCameras.length > 0
      ? "CRITICAL"
      : predictedCongestion ===
        "HIGH"
      ? "HIGH"
      : predictedCongestion ===
        "MEDIUM"
      ? "MEDIUM"
      : "LOW";

  const priorityCamera =
    [...cameraPredictions].sort(
      (a, b) => {
        const score =
          (camera) => {
            if (
              camera.riskLevel ===
              "CRITICAL"
            ) {
              return 5;
            }

            if (
              camera.predictedCongestion ===
              "HIGH"
            ) {
              return 4;
            }

            if (
              camera.trend ===
              "RISING FAST"
            ) {
              return 3;
            }

            if (
              camera.trend ===
              "RISING"
            ) {
              return 2;
            }

            return 1;
          };

        const difference =
          score(b) -
          score(a);

        if (
          difference !== 0
        ) {
          return difference;
        }

        return (
          b.currentVehicles -
          a.currentVehicles
        );
      }
    )[0] || null;

  return {
    success: true,

    cameraCount:
      cameraPredictions.length,

    totalCurrentVehicles,

    predictedCongestion,

    predictedRisk,

    risingCameraCount:
      risingCameras.length,

    highPredictedCameraCount:
      highPredictedCameras.length,

    criticalCameraCount:
      criticalCameras.length,

    priorityCamera,

    nearbyRadiusKm:
      includeNearby
        ? NEARBY_RADIUS_KM
        : 0,

    nearbyCameraCount:
      nearbyCameras.length,

    cameras:
      cameraPredictions,
  };
}

module.exports = {
  getPredictiveTrafficIntelligence,
};