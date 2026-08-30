const express = require("express");

const router = express.Router();

const CameraConnection =
  require("../models/CameraConnection");

const TrafficCamera =
  require("../models/TrafficCamera");

const {
  verifyToken,
} = require("../middleware/authMiddleware");

const MANAGEMENT_ROLES = [
  "admin",
  "government",
];

/*
 * =========================================================
 * GEO HELPERS
 * =========================================================
 */

const toRadians = (degrees) =>
  (degrees * Math.PI) / 180;

const toDegrees = (radians) =>
  (radians * 180) / Math.PI;

const haversineMeters = (
  lat1,
  lon1,
  lat2,
  lon2
) => {
  const R = 6371000;

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

  return (
    2 *
    R *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
};

const calculateBearing = (
  lat1,
  lon1,
  lat2,
  lon2
) => {
  const phi1 =
    toRadians(lat1);

  const phi2 =
    toRadians(lat2);

  const deltaLambda =
    toRadians(
      lon2 - lon1
    );

  const y =
    Math.sin(deltaLambda) *
    Math.cos(phi2);

  const x =
    Math.cos(phi1) *
      Math.sin(phi2) -
    Math.sin(phi1) *
      Math.cos(phi2) *
      Math.cos(deltaLambda);

  return (
    (toDegrees(
      Math.atan2(y, x)
    ) +
      360) %
    360
  );
};

const bearingToDirection = (
  bearing
) => {
  if (
    !Number.isFinite(
      bearing
    )
  ) {
    return "UNKNOWN";
  }

  const directions = [
    "N",
    "NE",
    "E",
    "SE",
    "S",
    "SW",
    "W",
    "NW",
  ];

  return directions[
    Math.round(
      bearing / 45
    ) % 8
  ];
};

const canManageConnections = (
  req
) =>
  MANAGEMENT_ROLES.includes(
    req.user?.role
  );

/*
 * =========================================================
 * GET ALL CAMERA CONNECTIONS
 * =========================================================
 */

router.get(
  "/",
  verifyToken,
  async (req, res) => {
    try {
      const filter = {};

      if (
        req.query.fromCameraId
      ) {
        filter.fromCameraId =
          String(
            req.query.fromCameraId
          ).trim();
      }

      if (
        req.query.toCameraId
      ) {
        filter.toCameraId =
          String(
            req.query.toCameraId
          ).trim();
      }

      const connections =
        await CameraConnection.find(
          filter
        )
          .sort({
            priority: -1,
            distanceMeters: 1,
          })
          .lean();

      return res.json({
        success: true,
        count:
          connections.length,
        connections,
      });
    } catch (error) {
      console.error(
        "Camera Connections Fetch Error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to fetch camera connections",
      });
    }
  }
);

/*
 * =========================================================
 * GET NEXT CAMERA CANDIDATES
 * =========================================================
 *
 * Explicit road connections are preferred.
 *
 * If no explicit connection exists,
 * geographic nearest-camera candidates are
 * returned as a development fallback.
 */

router.get(
  "/next/:cameraId",
  verifyToken,
  async (req, res) => {
    try {
      const cameraId =
        String(
          req.params.cameraId
        ).trim();

      const currentCamera =
        await TrafficCamera.findOne({
          cameraId,
          status: "active",
        }).lean();

      if (!currentCamera) {
        return res.status(404).json({
          success: false,
          error:
            "Current camera not found",
        });
      }

      const connections =
        await CameraConnection.find({
          fromCameraId:
            cameraId,

          active: true,
        })
          .sort({
            priority: -1,
            distanceMeters: 1,
          })
          .lean();

      /*
       * -----------------------------------------------------
       * Explicit graph connections available
       * -----------------------------------------------------
       */

      if (
        connections.length > 0
      ) {
        const cameraIds =
          connections.map(
            (connection) =>
              connection.toCameraId
          );

        const cameras =
          await TrafficCamera.find({
            cameraId: {
              $in: cameraIds,
            },

            status: "active",
          }).lean();

        return res.json({
          success: true,

          mode:
            "EXPLICIT_CONNECTIONS",

          currentCamera,

          connections,

          cameras,
        });
      }

      /*
       * -----------------------------------------------------
       * Geographic fallback for development
       * -----------------------------------------------------
       */

      const allCameras =
        await TrafficCamera.find({
          status: "active",

          cameraId: {
            $ne: cameraId,
          },
        }).lean();

      const candidates =
        allCameras
          .map((camera) => {
            const distance =
              haversineMeters(
                currentCamera.latitude,
                currentCamera.longitude,
                camera.latitude,
                camera.longitude
              );

            const bearing =
              calculateBearing(
                currentCamera.latitude,
                currentCamera.longitude,
                camera.latitude,
                camera.longitude
              );

            return {
              camera,

              distanceMeters:
                Math.round(
                  distance
                ),

              bearing:
                Number(
                  bearing.toFixed(
                    1
                  )
                ),

              direction:
                bearingToDirection(
                  bearing
                ),
            };
          })
          .sort(
            (a, b) =>
              a.distanceMeters -
              b.distanceMeters
          )
          .slice(0, 5);

      return res.json({
        success: true,

        mode:
          "GEOGRAPHIC_FALLBACK",

        currentCamera,

        connections: [],

        cameras:
          candidates.map(
            (item) => ({
              ...item.camera,

              distanceMeters:
                item.distanceMeters,

              bearing:
                item.bearing,

              direction:
                item.direction,
            })
          ),
      });
    } catch (error) {
      console.error(
        "Next Camera Error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to determine next cameras",
      });
    }
  }
);

/*
 * =========================================================
 * CREATE / UPDATE CAMERA CONNECTION
 * =========================================================
 */

router.post(
  "/",
  verifyToken,
  async (req, res) => {
    try {
      if (
        !canManageConnections(req)
      ) {
        return res.status(403).json({
          success: false,

          error:
            "Only authorized government users or admins can manage camera connections",
        });
      }

      const {
        fromCameraId,
        toCameraId,
        distanceMeters,
        direction,
        bearing,
        roadName,
        connectionType,
        active,
        priority,
      } = req.body;

      const fromId =
        String(
          fromCameraId || ""
        ).trim();

      const toId =
        String(
          toCameraId || ""
        ).trim();

      if (
        !fromId ||
        !toId
      ) {
        return res.status(400).json({
          success: false,

          error:
            "fromCameraId and toCameraId are required",
        });
      }

      if (
        fromId === toId
      ) {
        return res.status(400).json({
          success: false,

          error:
            "A camera cannot connect to itself",
        });
      }

      const [
        fromCamera,
        toCamera,
      ] =
        await Promise.all([
          TrafficCamera.findOne({
            cameraId: fromId,
          }).lean(),

          TrafficCamera.findOne({
            cameraId: toId,
          }).lean(),
        ]);

      if (
        !fromCamera ||
        !toCamera
      ) {
        return res.status(404).json({
          success: false,

          error:
            "Both cameras must exist before creating a connection",
        });
      }

      /*
       * Automatically calculate distance
       * when caller does not provide it.
       */

      let finalDistance =
        Number(
          distanceMeters
        );

      if (
        !Number.isFinite(
          finalDistance
        )
      ) {
        finalDistance =
          haversineMeters(
            fromCamera.latitude,
            fromCamera.longitude,
            toCamera.latitude,
            toCamera.longitude
          );
      }

      /*
       * Automatically calculate bearing
       * when caller does not provide it.
       */

      let finalBearing =
        Number(bearing);

      if (
        !Number.isFinite(
          finalBearing
        )
      ) {
        finalBearing =
          calculateBearing(
            fromCamera.latitude,
            fromCamera.longitude,
            toCamera.latitude,
            toCamera.longitude
          );
      }

      const connection =
        await CameraConnection.findOneAndUpdate(
          {
            fromCameraId:
              fromId,

            toCameraId:
              toId,
          },

          {
            $set: {
              distanceMeters:
                Math.round(
                  finalDistance
                ),

              direction:
                direction ||
                bearingToDirection(
                  finalBearing
                ),

              bearing:
                Number(
                  finalBearing.toFixed(
                    1
                  )
                ),

              roadName:
                String(
                  roadName || ""
                ).trim(),

              connectionType:
                connectionType ||
                "MANUAL",

              active:
                active !== undefined
                  ? Boolean(active)
                  : true,

              priority:
                Number.isFinite(
                  Number(
                    priority
                  )
                )
                  ? Math.max(
                      1,
                      Math.min(
                        100,
                        Number(
                          priority
                        )
                      )
                    )
                  : 50,
            },
          },

          {
            upsert: true,

            new: true,

            setDefaultsOnInsert:
              true,
          }
        );

      return res.status(201).json({
        success: true,

        message:
          "Camera connection saved",

        connection,
      });
    } catch (error) {
      console.error(
        "Camera Connection Save Error:",
        error
      );

      return res.status(500).json({
        success: false,

        error:
          "Failed to save camera connection",
      });
    }
  }
);

/*
 * =========================================================
 * DELETE CAMERA CONNECTION
 * =========================================================
 */

router.delete(
  "/:fromCameraId/:toCameraId",
  verifyToken,
  async (req, res) => {
    try {
      if (
        !canManageConnections(req)
      ) {
        return res.status(403).json({
          success: false,

          error:
            "Only authorized government users or admins can manage camera connections",
        });
      }

      const result =
        await CameraConnection.deleteOne({
          fromCameraId:
            String(
              req.params
                .fromCameraId
            ).trim(),

          toCameraId:
            String(
              req.params
                .toCameraId
            ).trim(),
        });

      return res.json({
        success: true,

        deleted:
          result.deletedCount > 0,
      });
    } catch (error) {
      console.error(
        "Camera Connection Delete Error:",
        error
      );

      return res.status(500).json({
        success: false,

        error:
          "Failed to delete camera connection",
      });
    }
  }
);

module.exports = router;