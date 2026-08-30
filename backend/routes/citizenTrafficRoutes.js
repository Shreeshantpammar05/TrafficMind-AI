const express =
  require("express");

const router =
  express.Router();

const TrafficCamera =
  require("../models/TrafficCamera");

const CameraDetection =
  require("../models/CameraDetection");

const SEARCH_RADIUS_KM = 25;

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

router.get(
  "/",
  async (req, res) => {
    try {
      const latitude =
        Number(req.query.latitude);

      const longitude =
        Number(req.query.longitude);

      const requestedCity =
        String(
          req.query.city || ""
        ).trim();

      if (
        !Number.isFinite(
          latitude
        ) ||
        !Number.isFinite(
          longitude
        ) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Valid latitude and longitude are required",
        });
      }

      const cameras =
        await TrafficCamera.find({
          status: "active",
          aiEnabled: true,
        })
          .select(
            "cameraId name location city district area latitude longitude status aiEnabled"
          )
          .lean();

      /*
       * =====================================================
       * CAMERA SELECTION
       * =====================================================
       *
       * 1. If city is provided, prefer exact city matching.
       * 2. Otherwise use geographic radius.
       *
       * This prevents Bengaluru cameras from disappearing
       * simply because the selected Bengaluru coordinate is
       * more than 10 km from one of the cameras.
       */

      let matchedCameras = [];

      if (requestedCity) {
        matchedCameras =
          cameras.filter(
            (camera) =>
              String(
                camera.city || ""
              ).trim().toLowerCase() ===
              requestedCity
                .toLowerCase()
          );
      }

      /*
       * If city matching found nothing,
       * use geographic fallback.
       */
      if (!matchedCameras.length) {
        matchedCameras =
          cameras
            .map((camera) => {
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
                return null;
              }

              const distance =
                calculateDistanceKm(
                  latitude,
                  longitude,
                  Number(
                    camera.latitude
                  ),
                  Number(
                    camera.longitude
                  )
                );

              return {
                ...camera,

                distanceKm:
                  Number(
                    distance.toFixed(2)
                  ),
              };
            })
            .filter(Boolean)
            .filter(
              (camera) =>
                camera.distanceKm <=
                SEARCH_RADIUS_KM
            )
            .sort(
              (a, b) =>
                a.distanceKm -
                b.distanceKm
            );
      } else {
        /*
         * Add distance information even when
         * city matching is used.
         */
        matchedCameras =
          matchedCameras.map(
            (camera) => {
              const hasCoordinates =
                Number.isFinite(
                  Number(
                    camera.latitude
                  )
                ) &&
                Number.isFinite(
                  Number(
                    camera.longitude
                  )
                );

              return {
                ...camera,

                distanceKm:
                  hasCoordinates
                    ? Number(
                        calculateDistanceKm(
                          latitude,
                          longitude,
                          Number(
                            camera.latitude
                          ),
                          Number(
                            camera.longitude
                          )
                        ).toFixed(2)
                      )
                    : null,
              };
            }
          );

        matchedCameras.sort(
          (a, b) =>
            (a.distanceKm ??
              Infinity) -
            (b.distanceKm ??
              Infinity)
        );
      }

      /*
       * =====================================================
       * NO PUBLIC CAMERA COVERAGE
       * =====================================================
       */

      if (
        !matchedCameras.length
      ) {
        return res.json({
          success: true,

          coverage: {
            available: false,

            radiusKm:
              SEARCH_RADIUS_KM,
          },

          location: {
            latitude,
            longitude,
          },

          city:
            requestedCity || "",

          cameraCount: 0,

          totalVehicles: 0,

          averageVehicles: 0,

          congestion:
            "NO DATA",

          riskLevel:
            "NO DATA",

          cameras: [],
        });
      }

      /*
       * =====================================================
       * GET DETECTIONS
       * =====================================================
       */

      const cameraIds =
        matchedCameras.map(
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

      /*
       * =====================================================
       * BUILD PUBLIC CAMERA DATA
       * =====================================================
       */

      const cameraStates =
        matchedCameras.map(
          (camera) => {
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

              distanceKm:
                camera.distanceKm ??
                null,

              vehicleCount:
                Number(
                  detection.vehicleCount
                ) || 0,

              congestion:
                detection.congestion ||
                "LOW",

              accidentDetected:
                detection
                  .accidentDetected ===
                true,

              emergencyDetected:
                detection
                  .emergencyDetected ===
                true,

              accidentSeverity:
                detection
                  .accidentSeverity ||
                "NONE",

              detectedAt:
                detection.detectedAt ||
                null,
            };
          }
        );

      /*
       * =====================================================
       * AGGREGATE TRAFFIC
       * =====================================================
       */

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

      const hasHigh =
        cameraStates.some(
          (camera) =>
            camera.congestion ===
            "HIGH"
        );

      const hasMedium =
        cameraStates.some(
          (camera) =>
            camera.congestion ===
            "MEDIUM"
        );

      const hasCritical =
        cameraStates.some(
          (camera) =>
            camera.accidentDetected ||
            camera.emergencyDetected
        );

      const congestion =
        hasHigh
          ? "HIGH"
          : hasMedium
          ? "MEDIUM"
          : "LOW";

      const riskLevel =
        hasCritical
          ? "CRITICAL"
          : hasHigh
          ? "HIGH"
          : hasMedium
          ? "MEDIUM"
          : "LOW";

      /*
       * =====================================================
       * RESPONSE
       * =====================================================
       */

      res.json({
        success: true,

        coverage: {
          available: true,

          radiusKm:
            SEARCH_RADIUS_KM,

          mode:
            requestedCity
              ? "CITY"
              : "RADIUS",
        },

        location: {
          latitude,
          longitude,
        },

        city:
          requestedCity ||
          cameraStates[0]?.city ||
          "",

        cameraCount:
          cameraStates.length,

        totalVehicles,

        averageVehicles,

        congestion,

        riskLevel,

        cameras:
          cameraStates,
      });
    } catch (error) {
      console.error(
        "Citizen Traffic Error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Failed to fetch public traffic data",
      });
    }
  }
);

module.exports = router;