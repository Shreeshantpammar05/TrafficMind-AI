const express = require("express");

const Incident = require("../models/Incident");

const TrafficCamera =
  require("../models/TrafficCamera");

const CameraDetection =
  require("../models/CameraDetection");

const CameraDetectionHistory =
  require("../models/CameraDetectionHistory");

const router = express.Router();

const latestDetection =
  require("../data/latestDetection");

const ALLOWED_CONGESTION = [
  "LOW",
  "MEDIUM",
  "HIGH",
];

const INCIDENT_COOLDOWN_MS =
  5 * 60 * 1000;

const HISTORY_SNAPSHOT_INTERVAL_MS =
  30 * 1000;

const historySnapshotCache =
  new Map();

/*
|--------------------------------------------------------------------------
| Small in-memory cache
|--------------------------------------------------------------------------
| Avoid querying TrafficCamera for every AI frame/update.
| Camera status is checked periodically instead.
|--------------------------------------------------------------------------
*/

const activeCameraCache = new Map();

const getActiveCamera = async (
  cameraId
) => {
  const cached =
    activeCameraCache.get(cameraId);

  const now = Date.now();

  if (
    cached &&
    now - cached.checkedAt <
      30000
  ) {
    return cached.camera;
  }

  const camera =
    await TrafficCamera.findOne(
      {
        cameraId,
        status: "active",
      },
      {
        cameraId: 1,
        status: 1,
        aiEnabled: 1,
      }
    ).lean();

  activeCameraCache.set(
    cameraId,
    {
      camera,
      checkedAt: now,
    }
  );

  return camera;
};

/*
|--------------------------------------------------------------------------
| Incident cooldown
|--------------------------------------------------------------------------
| Prevent multiple cameras/updates from repeatedly querying/creating
| the same congestion incident.
|--------------------------------------------------------------------------
*/

const incidentCooldown =
  new Map();

const isBoolean = (value) =>
  typeof value === "boolean";

const isValidVehicleCount = (
  value
) => {
  const count = Number(value);

  return (
    Number.isFinite(count) &&
    count >= 0 &&
    count <= 10000
  );
};

const isValidConfidence = (
  value
) => {
  const confidence = Number(value);

  return (
    Number.isFinite(confidence) &&
    confidence >= 0 &&
    confidence <= 1
  );
};

/*
|--------------------------------------------------------------------------
| Background congestion incident
|--------------------------------------------------------------------------
*/

const handleCongestionIncident =
  async ({
    cameraId,
    vehicleCount,
    congestion,
  }) => {
    try {
      const incidentKey =
        `${cameraId}:Traffic Congestion`;

      const now = Date.now();

      const lastCreated =
        incidentCooldown.get(
          incidentKey
        );

      if (
        lastCreated &&
        now - lastCreated <
          INCIDENT_COOLDOWN_MS
      ) {
        return;
      }

      /*
      Only HIGH + >=15 vehicles
      should create a congestion incident.
      */

      if (
        congestion !== "HIGH" ||
        vehicleCount < 15
      ) {
        return;
      }

      /*
      Set cooldown immediately.
      This prevents multiple parallel requests
      from all attempting Incident.findOne().
      */

      incidentCooldown.set(
        incidentKey,
        now
      );

      const recentIncident =
        await Incident.findOne({
          incidentType:
            "Traffic Congestion",

          location:
            "AI Camera Zone",

          createdAt: {
            $gte: new Date(
              now -
                INCIDENT_COOLDOWN_MS
            ),
          },
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      if (recentIncident) {
        return;
      }

      await Incident.create({
        location:
          "AI Camera Zone",

        incidentType:
          "Traffic Congestion",

        severity: "High",

        description:
          `Auto-created by AI. Camera: ${cameraId}. Vehicle Count: ${vehicleCount}`,
      });

      latestDetection.latestAlert =
        {
          title:
            "Traffic Congestion Detected",

          severity:
            "High",

          location:
            "AI Camera Zone",

          time:
            new Date().toLocaleTimeString(),
        };

      console.log(
        `🚨 AI congestion incident created | ${cameraId} | Vehicles: ${vehicleCount}`
      );
    } catch (error) {
      console.error(
        "AI congestion incident error:",
        error
      );
    }
  };

/*
|--------------------------------------------------------------------------
| POST /api/live-update
|--------------------------------------------------------------------------
*/

router.post(
  "/live-update",
  async (req, res) => {
    const expectedInternalKey = process.env.INTERNAL_AI_KEY;
    const suppliedInternalKey = req.headers["x-internal-ai-key"];

    if (
      !expectedInternalKey ||
      !suppliedInternalKey ||
      suppliedInternalKey !== expectedInternalKey
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized AI live-update request",
      });
    }

    try {
      const {
        cameraId,
        vehicleCount,
        congestion,
        averageConfidence,
        maxConfidence,
        recommendation,
        emergencyDetected,
        accidentDetected,
        accidentSeverity,
      } = req.body;

      // =====================================================
      // Camera ID
      // =====================================================

      if (!cameraId) {
        return res.status(400).json({
          success: false,
          message:
            "cameraId is required",
        });
      }

      // =====================================================
      // Validate Camera
      // =====================================================

      const camera =
        await getActiveCamera(
          cameraId
        );

      if (!camera) {
        return res.status(404).json({
          success: false,
          message:
            "Active traffic camera not found",
        });
      }

      if (camera.aiEnabled === false) {
        return res.status(403).json({
          success: false,
          message:
            "AI analysis is disabled for this camera",
        });
      }

      // =====================================================
      // Vehicle Count
      // =====================================================

      if (
        !isValidVehicleCount(
          vehicleCount
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid vehicle count",
        });
      }

      // =====================================================
      // Congestion
      // =====================================================

      if (
        !ALLOWED_CONGESTION.includes(
          congestion
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid congestion level",
        });
      }

      // =====================================================
      // Confidence
      // =====================================================

      if (
        !isValidConfidence(
          averageConfidence
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid average confidence",
        });
      }

      if (
        !isValidConfidence(
          maxConfidence
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid maximum confidence",
        });
      }

      // =====================================================
      // Recommendation
      // =====================================================

      if (
        typeof recommendation !==
          "string" ||
        !recommendation.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid recommendation is required",
        });
      }

      // =====================================================
      // Emergency
      // =====================================================

      if (
        emergencyDetected !==
          undefined &&
        !isBoolean(
          emergencyDetected
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid emergencyDetected value",
        });
      }

      // =====================================================
      // Accident
      // =====================================================

      if (
        accidentDetected !==
          undefined &&
        !isBoolean(
          accidentDetected
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid accidentDetected value",
        });
      }

      // =====================================================
      // Normalize
      // =====================================================

      const normalizedVehicleCount =
        Number(vehicleCount);

      const normalizedAverageConfidence =
        Number(
          averageConfidence
        );

      const normalizedMaxConfidence =
        Number(
          maxConfidence
        );

      const normalizedEmergency =
        emergencyDetected === true;

      const normalizedAccident =
        accidentDetected === true;

      const normalizedSeverity =
        accidentSeverity ||
        "NONE";

      const normalizedRecommendation =
        recommendation.trim();

      // =====================================================
      // Global state
      // =====================================================

      latestDetection.vehicleCount =
        normalizedVehicleCount;

      latestDetection.congestion =
        congestion;

      latestDetection.recommendation =
        normalizedRecommendation;

      latestDetection.emergencyDetected =
        normalizedEmergency;

      latestDetection.accidentDetected =
        normalizedAccident;

      latestDetection.accidentSeverity =
        normalizedSeverity;

      latestDetection.incidentDetected =
        congestion === "HIGH" &&
        normalizedVehicleCount >= 15;

      // =====================================================
      // Camera-specific MongoDB update
      // =====================================================

      await CameraDetection.findOneAndUpdate(
        {
          cameraId,
        },

        {
          $set: {
            cameraId,

            vehicleCount:
              normalizedVehicleCount,

            congestion,

            averageConfidence:
              normalizedAverageConfidence,

            maxConfidence:
              normalizedMaxConfidence,

            emergencyDetected:
              normalizedEmergency,

            accidentDetected:
              normalizedAccident,

            accidentSeverity:
              normalizedSeverity,

            recommendation:
              normalizedRecommendation,

            detectedAt:
              new Date(),
          },
        },

        {
          upsert: true,

          returnDocument: "after",

          setDefaultsOnInsert:
            true,
        }
      );

      // =====================================================
      // Detection history snapshot
      //
      // Keep current state in CameraDetection while
      // periodically storing observations for trend analysis.
      // =====================================================

      const historyNow =
        Date.now();

      const lastHistorySnapshot =
        historySnapshotCache.get(
          cameraId
        );

      if (
        !lastHistorySnapshot ||
        historyNow -
            lastHistorySnapshot >=
          HISTORY_SNAPSHOT_INTERVAL_MS
      ) {
        historySnapshotCache.set(
          cameraId,
          historyNow
        );

        try {
          await CameraDetectionHistory.create(
            {
              cameraId,

              vehicleCount:
                normalizedVehicleCount,

              congestion,

              averageConfidence:
                normalizedAverageConfidence,

              maxConfidence:
                normalizedMaxConfidence,

              emergencyDetected:
                normalizedEmergency,

              accidentDetected:
                normalizedAccident,

              accidentSeverity:
                normalizedSeverity,

              recommendation:
                normalizedRecommendation,

              detectedAt:
                new Date(),
            }
          );
        } catch (
          historyError
        ) {
          console.error(
            "Camera detection history error:",
            historyError
          );
        }
      }

      // =====================================================
      // Immediate response
      //
      // Do NOT wait for incident processing.
      // =====================================================

      res.json({
        success: true,

        message:
          "Live camera detection updated",

        cameraId,
      });

      // =====================================================
      // Background incident processing
      // =====================================================

      if (
        congestion === "HIGH" &&
        normalizedVehicleCount >= 15
      ) {
        setImmediate(() => {
          handleCongestionIncident({
            cameraId,
            vehicleCount:
              normalizedVehicleCount,
            congestion,
          });
        });
      }
    } catch (error) {
      console.error(
        "Live Camera Update Error:",
        error
      );

      /*
      Only send a response if one
      has not already been sent.
      */

      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message:
            "Failed to update live camera detection",
        });
      }
    }
  }
);

module.exports = router;