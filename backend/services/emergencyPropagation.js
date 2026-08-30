const EmergencyEvent =
  require("../models/EmergencyEvent");

const TrafficCamera =
  require("../models/TrafficCamera");

const EmergencyPropagation =
  require("../models/EmergencyPropagation");

/*
 * =========================================================
 * PHASE 18 CONFIGURATION
 * =========================================================
 *
 * Default emergency awareness radius:
 * 5 kilometers.
 */

const PROPAGATION_RADIUS_METERS =
  Math.max(
    100,
    Number(
      process.env
        .EMERGENCY_PROPAGATION_RADIUS_METERS ||
        5000
    )
  );

/*
 * CRITICAL:
 * 0 - 1 km
 */

const CRITICAL_RADIUS_METERS =
  Math.max(
    50,
    Math.min(
      PROPAGATION_RADIUS_METERS,
      Number(
        process.env
          .EMERGENCY_CRITICAL_RADIUS_METERS ||
          1000
      )
    )
  );

/*
 * HIGH:
 * 1 - 2.5 km
 */

const HIGH_RADIUS_METERS =
  Math.max(
    CRITICAL_RADIUS_METERS,
    Math.min(
      PROPAGATION_RADIUS_METERS,
      Number(
        process.env
          .EMERGENCY_HIGH_RADIUS_METERS ||
          2500
      )
    )
  );

/*
 * =========================================================
 * GEO HELPERS
 * =========================================================
 */

const toRadians = (
  degrees
) =>
  (degrees * Math.PI) /
  180;

/*
 * Haversine distance between two coordinates.
 *
 * Result: meters.
 */

const haversineMeters = (
  lat1,
  lon1,
  lat2,
  lon2
) => {
  const R = 6371000;

  const dLat =
    toRadians(
      lat2 - lat1
    );

  const dLon =
    toRadians(
      lon2 - lon1
    );

  const a =
    Math.sin(
      dLat / 2
    ) ** 2 +
    Math.cos(
      toRadians(lat1)
    ) *
      Math.cos(
        toRadians(lat2)
      ) *
      Math.sin(
        dLon / 2
      ) ** 2;

  return (
    2 *
    R *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
};

/*
 * =========================================================
 * ZONE CALCULATION
 * =========================================================
 */

const getZone = (
  distanceMeters
) => {
  if (
    distanceMeters <=
    CRITICAL_RADIUS_METERS
  ) {
    return "CRITICAL";
  }

  if (
    distanceMeters <=
    HIGH_RADIUS_METERS
  ) {
    return "HIGH";
  }

  return "AWARE";
};

/*
 * =========================================================
 * PRIORITY SCORE
 * =========================================================
 *
 * Closest camera gets the highest score.
 *
 * 0m   -> approximately 100
 * 5000m -> 0
 */

const getPriorityScore = (
  distanceMeters
) => {
  if (
    distanceMeters >=
    PROPAGATION_RADIUS_METERS
  ) {
    return 0;
  }

  const normalized =
    1 -
    distanceMeters /
      PROPAGATION_RADIUS_METERS;

  return Math.round(
    normalized * 100
  );
};

/*
 * =========================================================
 * CALCULATE 5 KM PROPAGATION
 * =========================================================
 *
 * Finds all active cameras inside the emergency
 * awareness radius around the current emergency camera.
 *
 * NOTE:
 * This is geographic awareness.
 *
 * Camera-to-camera road movement is handled separately
 * by the CameraConnection graph.
 */

async function calculatePropagation(
  emergency
) {
  if (
    !emergency ||
    !emergency.currentCameraId
  ) {
    return {
      emergencyId:
        emergency?.emergencyId ||
        "",

      currentCamera: null,

      radiusMeters:
        PROPAGATION_RADIUS_METERS,

      cameras: [],
    };
  }

  /*
   * Find current emergency camera.
   */

  const currentCamera =
    await TrafficCamera.findOne({
      cameraId:
        emergency.currentCameraId,

      status: "active",
    }).lean();

  if (!currentCamera) {
    throw new Error(
      `Current emergency camera not found: ${emergency.currentCameraId}`
    );
  }

  /*
   * Get all active cameras.
   */

  const activeCameras =
    await TrafficCamera.find({
      status: "active",

      cameraId: {
        $ne:
          emergency.currentCameraId,
      },
    }).lean();

  /*
   * Calculate distance to every active camera.
   */

  const cameras =
    activeCameras
      .filter(
        (camera) =>
          Number.isFinite(
            Number(
              camera.latitude
            )
          ) &&
          Number.isFinite(
            Number(
              camera.longitude
            )
          )
      )
      .map((camera) => {
        const distanceMeters =
          haversineMeters(
            Number(
              currentCamera.latitude
            ),

            Number(
              currentCamera.longitude
            ),

            Number(
              camera.latitude
            ),

            Number(
              camera.longitude
            )
          );

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

          distanceMeters:
            Math.round(
              distanceMeters
            ),

          zone:
            getZone(
              distanceMeters
            ),

          priorityScore:
            getPriorityScore(
              distanceMeters
            ),

          aiEnabled:
            camera.aiEnabled !==
            false,
        };
      })
      .filter(
        (camera) =>
          camera.distanceMeters <=
          PROPAGATION_RADIUS_METERS
      )
      .sort(
        (a, b) =>
          b.priorityScore -
          a.priorityScore
      );

  return {
    emergencyId:
      emergency.emergencyId,

    currentCamera: {
      cameraId:
        currentCamera.cameraId,

      name:
        currentCamera.name,

      location:
        currentCamera.location,

      city:
        currentCamera.city,

      district:
        currentCamera.district,

      area:
        currentCamera.area,

      latitude:
        currentCamera.latitude,

      longitude:
        currentCamera.longitude,
    },

    radiusMeters:
      PROPAGATION_RADIUS_METERS,

    cameras,
  };
}

/*
 * =========================================================
 * SYNC PROPAGATION TO MONGODB
 * =========================================================
 */

async function syncPropagation(
  emergency
) {
  const result =
    await calculatePropagation(
      emergency
    );

  const now =
    new Date();

  const affectedIds =
    new Set(
      result.cameras.map(
        (camera) =>
          camera.cameraId
      )
    );

  /*
   * Create/update propagation records.
   */

  const operations =
    result.cameras.map(
      (camera) => ({
        updateOne: {
          filter: {
            emergencyId:
              emergency.emergencyId,

            cameraId:
              camera.cameraId,
          },

          update: {
            $set: {
              distanceMeters:
                camera.distanceMeters,

              zone:
                camera.zone,

              priorityScore:
                camera.priorityScore,

              active:
                true,

              lastUpdatedAt:
                now,

              notifiedAt:
                now,
            },

            $setOnInsert: {
              firstDetectedAt:
                now,
            },
          },

          upsert:
            true,
        },
      })
    );

  if (
    operations.length >
    0
  ) {
    await EmergencyPropagation.bulkWrite(
      operations
    );
  }

  /*
   * Cameras that are no longer inside the
   * radius become inactive.
   */

  await EmergencyPropagation.updateMany(
    {
      emergencyId:
        emergency.emergencyId,

      cameraId: {
        $nin:
          [...affectedIds],
      },

      active:
        true,
    },

    {
      $set: {
        active:
          false,

        lastUpdatedAt:
          now,
      },
    }
  );

  return result;
}

module.exports = {
  PROPAGATION_RADIUS_METERS,

  calculatePropagation,

  syncPropagation,
};