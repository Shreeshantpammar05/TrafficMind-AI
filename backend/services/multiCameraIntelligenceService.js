const TrafficCamera =
  require("../models/TrafficCamera");

const CameraDetection =
  require("../models/CameraDetection");

async function getMultiCameraIntelligence(
  cameraFilter = {}
) {
  const cameras =
    await TrafficCamera.find({
      status: "active",
      aiEnabled: true,
      ...cameraFilter,
    })
      .select(
        "cameraId name location city district area latitude longitude status aiEnabled"
      )
      .lean();

  if (!cameras.length) {
    return {
      cameras: [],
      totalVehicles: 0,
      averageVehicles: 0,
      cameraCount: 0,
      overallCongestion: "LOW",
      overallRisk: "LOW",
      priorityCamera: null,
      accidentCameras: [],
      emergencyCameras: [],
      congestionCameras: [],
    };
  }

  const cameraIds =
    cameras.map(
      (camera) =>
        camera.cameraId
    );

  const detections =
    await CameraDetection.find({
      cameraId: {
        $in: cameraIds,
      },
    }).lean();

  const detectionMap =
    new Map();

  detections.forEach(
    (detection) => {
      detectionMap.set(
        detection.cameraId,
        detection
      );
    }
  );

  const cameraStates =
    cameras.map((camera) => {
      const detection =
        detectionMap.get(
          camera.cameraId
        ) || {};

      return {
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

        latitude:
          camera.latitude,

        longitude:
          camera.longitude,

        vehicleCount:
          Number(
            detection.vehicleCount
          ) || 0,

        congestion:
          detection.congestion ||
          "LOW",

        accidentDetected:
          detection.accidentDetected ===
          true,

        accidentSeverity:
          detection.accidentSeverity ||
          "NONE",

        emergencyDetected:
          detection.emergencyDetected ===
          true,

        confidence:
          Number(
            detection.averageConfidence
          ) || 0,

        recommendation:
          detection.recommendation ||
          "Traffic Flow Normal",

        detectedAt:
          detection.detectedAt ||
          null,
      };
    });

  const totalVehicles =
    cameraStates.reduce(
      (total, camera) =>
        total +
        camera.vehicleCount,
      0
    );

  const averageVehicles =
    cameraStates.length
      ? Math.round(
          totalVehicles /
            cameraStates.length
        )
      : 0;

  const accidentCameras =
    cameraStates.filter(
      (camera) =>
        camera.accidentDetected
    );

  const emergencyCameras =
    cameraStates.filter(
      (camera) =>
        camera.emergencyDetected
    );

  const congestionCameras =
    cameraStates.filter(
      (camera) =>
        camera.congestion ===
        "HIGH"
    );

  const hasCriticalEvent =
    accidentCameras.length > 0 ||
    emergencyCameras.length > 0;

  const hasHighCongestion =
    congestionCameras.length > 0;

  const hasMediumCongestion =
    cameraStates.some(
      (camera) =>
        camera.congestion ===
        "MEDIUM"
    );

  let overallCongestion =
    "LOW";

  if (hasHighCongestion) {
    overallCongestion =
      "HIGH";
  } else if (
    hasMediumCongestion
  ) {
    overallCongestion =
      "MEDIUM";
  }

  let overallRisk =
    "LOW";

  if (hasCriticalEvent) {
    overallRisk =
      "CRITICAL";
  } else if (
    hasHighCongestion ||
    totalVehicles >= 25
  ) {
    overallRisk =
      "HIGH";
  } else if (
    hasMediumCongestion ||
    totalVehicles >= 10
  ) {
    overallRisk =
      "MEDIUM";
  }

  const priorityCamera =
    [...cameraStates].sort(
      (a, b) => {
        const severityScore =
          (camera) => {
            if (
              camera.accidentDetected
            ) {
              return 5;
            }

            if (
              camera.emergencyDetected
            ) {
              return 4;
            }

            if (
              camera.congestion ===
              "HIGH"
            ) {
              return 3;
            }

            if (
              camera.congestion ===
              "MEDIUM"
            ) {
              return 2;
            }

            return 1;
          };

        const scoreDifference =
          severityScore(b) -
          severityScore(a);

        if (
          scoreDifference !==
          0
        ) {
          return scoreDifference;
        }

        return (
          b.vehicleCount -
          a.vehicleCount
        );
      }
    )[0] || null;

  return {
    cameras:
      cameraStates,

    totalVehicles,

    averageVehicles,

    cameraCount:
      cameraStates.length,

    overallCongestion,

    overallRisk,

    priorityCamera,

    accidentCameras,

    emergencyCameras,

    congestionCameras,
  };
}

module.exports = {
  getMultiCameraIntelligence,
};