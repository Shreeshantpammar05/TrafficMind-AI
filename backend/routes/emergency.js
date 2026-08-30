const express = require("express");
const crypto = require("crypto");

const router = express.Router();

const latestDetection =
  require("../data/latestDetection");

const EmergencyEvent =
  require("../models/EmergencyEvent");

const {
  verifyToken,
} = require("../middleware/authMiddleware");

const {
  getNextCameras,
  handoffEmergency,
} = require("../services/emergencyTracker");

const {
  calculatePropagation,
  syncPropagation,
  PROPAGATION_RADIUS_METERS,
} = require("../services/emergencyPropagation");

const EmergencyPropagation =
  require("../models/EmergencyPropagation");

const {
  getEmergencyPriorityConfig,
  applyEmergencyPriority,
} = require("../services/emergencyPriorityEngine");

const {
  recordEmergencyAudit,
} = require(
  "../services/emergencyAuditService"
);

/*
 * =========================================================
 * ACTIVE EMERGENCY STATUSES
 * =========================================================
 */

const ACTIVE_STATUSES = [
  "DETECTED",
  "TRACKING",
  "APPROACHING",
  "ACTIVE",
  "SEARCHING",
];

/*
 * =========================================================
 * INTERNAL AI AUTHENTICATION
 * =========================================================
 *
 * Used by the backend AI runner.
 *
 * The AI runner already uses INTERNAL_AI_KEY for
 * protected camera configuration requests.
 */

const isInternalAIRequest = (req) =>
  Boolean(
    process.env.INTERNAL_AI_KEY &&
      req.get("x-internal-ai-key") ===
        process.env.INTERNAL_AI_KEY
  );

/*
 * =========================================================
 * PHASE 17 — RE-IDENTIFICATION CONFIG
 * =========================================================
 */

const EMERGENCY_REID_MIN_SCORE = Math.max(
  0,
  Math.min(
    1,
    Number(
      process.env.EMERGENCY_REID_MIN_SCORE ||
        "0.72"
    )
  )
);

/*
 * =========================================================
 * PHASE 17 — SIGNATURE NORMALIZATION
 * =========================================================
 */

const normalizeSignature = (
  signature
) => {
  if (
    !Array.isArray(
      signature
    )
  ) {
    return [];
  }

  return signature
    .map((value) => {
      const numeric =
        Number(value);

      if (
        !Number.isFinite(
          numeric
        )
      ) {
        return 0;
      }

      return Math.max(
        0,
        Math.min(
          1,
          numeric
        )
      );
    })
    .slice(0, 64);
};

/*
 * =========================================================
 * PHASE 17 — COSINE SIMILARITY
 * =========================================================
 */

const cosineSimilarity = (
  first,
  second
) => {
  if (
    !Array.isArray(first) ||
    !Array.isArray(second) ||
    first.length === 0 ||
    first.length !==
      second.length
  ) {
    return 0;
  }

  let dot = 0;
  let firstNorm = 0;
  let secondNorm = 0;

  for (
    let i = 0;
    i < first.length;
    i += 1
  ) {
    const a =
      Number(first[i]) || 0;

    const b =
      Number(second[i]) || 0;

    dot += a * b;

    firstNorm +=
      a * a;

    secondNorm +=
      b * b;
  }

  if (
    firstNorm === 0 ||
    secondNorm === 0
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      1,
      dot /
        (
          Math.sqrt(
            firstNorm
          ) *
          Math.sqrt(
            secondNorm
          )
        )
    )
  );
};

/*
 * =========================================================
 * EMERGENCY ID GENERATOR
 * =========================================================
 */

const generateEmergencyId = () =>
  `EMG-${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;

/*
 * =========================================================
 * PHASE 11 — EMERGENCY STATUS
 * =========================================================
 */

router.get(
  "/status",
  async (req, res) => {
    try {
      const activeEvent =
        await EmergencyEvent.findOne({
          status: {
            $in:
              ACTIVE_STATUSES,
          },
        })
          .sort({
            lastSeenAt: -1,
          })
          .lean();

      if (activeEvent) {
        return res.json({
          success: true,

          emergencyDetected:
            true,

          priority:
            "GREEN CORRIDOR ACTIVATED",

          event:
            activeEvent,
        });
      }

      const emergencyDetected =
        latestDetection
          .emergencyDetected ===
        true;

      return res.json({
        success: true,

        emergencyDetected,

        priority:
          emergencyDetected
            ? "GREEN CORRIDOR ACTIVATED"
            : "NORMAL TRAFFIC FLOW",

        event: null,
      });
    } catch (error) {
      console.error(
        "Emergency Status Error:",
        error
      );

      return res.status(
        500
      ).json({
        success: false,

        error:
          "Failed to fetch emergency status",
      });
    }
  }
);

/*
 * =========================================================
 * PHASE 12 — WORKER DECLARED EMERGENCY
 * =========================================================
 */

router.post(
  "/events",
  verifyToken,
  async (req, res) => {
    try {
      if (
        req.user.role !==
          "government" &&
        req.user.role !==
          "admin"
      ) {
        return res.status(
          403
        ).json({
          success: false,

          error:
            "Only authorized government workers or admins can create emergencies",
        });
      }

      const {
        vehicleType,
        startLocation,
        destination,
        priority,
        currentCameraId,
        confidence,
        notes,
      } = req.body;

      const allowedVehicleTypes =
        [
          "ambulance",
          "fire_truck",
          "police_vehicle",
        ];

      if (
        !allowedVehicleTypes.includes(
          vehicleType
        )
      ) {
        return res.status(
          400
        ).json({
          success: false,

          error:
            "Vehicle type must be ambulance, fire_truck, or police_vehicle",
        });
      }

      if (
        !startLocation?.name?.trim() ||
        !destination?.name?.trim()
      ) {
        return res.status(
          400
        ).json({
          success: false,

          error:
            "Start location and destination are required",
        });
      }

      const numericConfidence =
        Number(confidence);

      const event =
        await EmergencyEvent.create(
          {
            emergencyId:
              generateEmergencyId(),

            vehicleType,

            source:
              "WORKER_DECLARED",

            status:
              currentCameraId
                ? "TRACKING"
                : "DETECTED",

            priority:
              priority ===
                "NORMAL" ||
              priority ===
                "HIGH" ||
              priority ===
                "CRITICAL"
                ? priority
                : "CRITICAL",

            currentCameraId:
              String(
                currentCameraId ||
                  ""
              ).trim(),

            previousCameraId:
              "",

            startLocation: {
              name:
                startLocation.name.trim(),

              latitude:
                Number.isFinite(
                  Number(
                    startLocation.latitude
                  )
                )
                  ? Number(
                      startLocation.latitude
                    )
                  : null,

              longitude:
                Number.isFinite(
                  Number(
                    startLocation.longitude
                  )
                )
                  ? Number(
                      startLocation.longitude
                    )
                  : null,
            },

            destination: {
              name:
                destination.name.trim(),

              latitude:
                Number.isFinite(
                  Number(
                    destination.latitude
                  )
                )
                  ? Number(
                      destination.latitude
                    )
                  : null,

              longitude:
                Number.isFinite(
                  Number(
                    destination.longitude
                  )
                )
                  ? Number(
                      destination.longitude
                    )
                  : null,
            },

            confidence:
              Number.isFinite(
                numericConfidence
              )
                ? Math.min(
                    1,
                    Math.max(
                      0,
                      numericConfidence
                    )
                  )
                : 0,

            createdBy:
              req.user.userId ||
              null,

            notes:
              String(
                notes || ""
              ).trim(),
          }
        );

      await recordEmergencyAudit({
        emergencyId:
          event.emergencyId,
        action:
          "EMERGENCY_CREATED",
        source:
          "WORKER",
        cameraId:
          event.currentCameraId,
        status:
          event.status,
        priority:
          event.priority,
        confidence:
          event.confidence,
        reason:
          "Worker-declared emergency event created.",
        actorUserId:
          req.user.userId || null,
        actorRole:
          req.user.role || "",
        metadata: {
          vehicleType:
            event.vehicleType,
          startLocation:
            event.startLocation,
          destination:
            event.destination,
        },
      });

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Emergency event created",

          event,
        });
    } catch (error) {
      console.error(
        "Emergency Event Create Error:",
        error
      );

      return res.status(
        500
      ).json({
        success: false,

        error:
          "Failed to create emergency event",
      });
    }
  }
);

/*
 * =========================================================
 * PHASE 14 — AI AUTOMATIC EMERGENCY
 * =========================================================
 */

router.post(
  "/events/ai-detected",
  async (req, res) => {
    try {
      if (
        !isInternalAIRequest(
          req
        )
      ) {
        return res.status(
          401
        ).json({
          success: false,

          error:
            "Unauthorized AI request",
        });
      }

      const {
        cameraId,
        vehicleType,
        confidence,
        location,
        appearanceSignature,
      } = req.body;

      const normalizedSignature =
        normalizeSignature(
          appearanceSignature
        );

      if (
        !cameraId ||
        ![
          "ambulance",
          "fire_truck",
          "police_vehicle",
        ].includes(
          vehicleType
        )
      ) {
        return res.status(
          400
        ).json({
          success: false,

          error:
            "cameraId and a valid emergency vehicle type are required",
        });
      }

      const numericConfidence =
        Number(
          confidence
        );

      if (
        !Number.isFinite(
          numericConfidence
        ) ||
        numericConfidence <
          0 ||
        numericConfidence >
          1
      ) {
        return res.status(
          400
        ).json({
          success: false,

          error:
            "Confidence must be between 0 and 1",
        });
      }

      const normalizedCameraId =
        String(
          cameraId
        ).trim();

      const now =
        new Date();

      /*
       * Find an active event of the same
       * emergency type currently at this camera.
       */

      let event =
        await EmergencyEvent.findOne(
          {
            vehicleType,

            currentCameraId:
              normalizedCameraId,

            status: {
              $in:
                ACTIVE_STATUSES,
            },
          }
        ).sort({
          lastSeenAt: -1,
        });

      if (event) {
        event.previousCameraId =
          event.currentCameraId;

        event.currentCameraId =
          normalizedCameraId;

        event.confidence =
          numericConfidence;

        event.lastSeenAt =
          now;

        if (
          event.status ===
            "DETECTED" ||
          event.status ===
            "SEARCHING"
        ) {
          event.status =
            "TRACKING";
        }

        if (
          normalizedSignature.length >
          0
        ) {
          event.appearanceSignature =
            normalizedSignature;

          event.reidMethod =
            "HSV_APPEARANCE";
        }

        if (location) {
          event.startLocation =
            {
              name:
                String(
                  location.name ||
                    ""
                ).trim(),

              latitude:
                Number.isFinite(
                  Number(
                    location.latitude
                  )
                )
                  ? Number(
                      location.latitude
                    )
                  : null,

              longitude:
                Number.isFinite(
                  Number(
                    location.longitude
                  )
                )
                  ? Number(
                      location.longitude
                    )
                  : null,
            };
        }

        await event.save();

        await recordEmergencyAudit({
          emergencyId:
            event.emergencyId,
          action:
            "AI_EMERGENCY_REFRESHED",
          source:
            "AI",
          cameraId:
            event.currentCameraId,
          previousCameraId:
            event.previousCameraId,
          status:
            event.status,
          priority:
            event.priority,
          confidence:
            event.confidence,
          reason:
            "Existing AI emergency refreshed by a new detection.",
          metadata: {
            reidMethod:
              event.reidMethod,
            reidMatchScore:
              event.reidMatchScore,
          },
        });

        return res.json({
          success: true,

          created: false,

          message:
            "Existing AI emergency event refreshed",

          event,
        });
      }

      /*
       * Create new AI emergency event.
       */

      event =
        await EmergencyEvent.create(
          {
            emergencyId:
              generateEmergencyId(),

            vehicleType,

            source:
              "AI_DETECTED",

            status:
              "TRACKING",

            priority:
              "CRITICAL",

            currentCameraId:
              normalizedCameraId,

            previousCameraId:
              "",

            startLocation: {
              name:
                String(
                  location?.name ||
                    ""
                ).trim(),

              latitude:
                Number.isFinite(
                  Number(
                    location?.latitude
                  )
                )
                  ? Number(
                      location.latitude
                    )
                  : null,

              longitude:
                Number.isFinite(
                  Number(
                    location?.longitude
                  )
                )
                  ? Number(
                      location.longitude
                    )
                  : null,
            },

            destination: {
              name: "",

              latitude: null,

              longitude: null,
            },

            confidence:
              numericConfidence,

            appearanceSignature:
              normalizedSignature,

            reidMatchScore:
              normalizedSignature.length >
              0
                ? 1
                : 0,

            reidMethod:
              normalizedSignature.length >
              0
                ? "HSV_APPEARANCE"
                : "",

            startedAt:
              now,

            lastSeenAt:
              now,

            notes:
              "Automatically created from AI emergency vehicle detection.",
          }
        );

      await recordEmergencyAudit({
        emergencyId:
          event.emergencyId,
        action:
          "AI_EMERGENCY_CREATED",
        source:
          "AI",
        cameraId:
          event.currentCameraId,
        status:
          event.status,
        priority:
          event.priority,
        confidence:
          event.confidence,
        reason:
          "Emergency event automatically created from AI emergency-vehicle detection.",
        metadata: {
          reidMethod:
            event.reidMethod,
          reidMatchScore:
            event.reidMatchScore,
        },
      });

      return res
        .status(201)
        .json({
          success: true,

          created: true,

          message:
            "AI emergency event created",

          event,
        });
    } catch (error) {
      console.error(
        "AI Emergency Event Error:",
        error
      );

      return res.status(
        500
      ).json({
        success: false,

        error:
          "Failed to create AI emergency event",
      });
    }
  }
);

/*
 * =========================================================
 * PHASE 16B — INTERNAL AI NEXT-CAMERA LOOKUP
 * =========================================================
 *
 * GET:
 *
 * /api/emergency/events/:emergencyId/next-cameras/ai
 */

router.get(
  "/events/:emergencyId/next-cameras/ai",
  async (req, res) => {
    try {
      if (
        !isInternalAIRequest(
          req
        )
      ) {
        return res.status(
          401
        ).json({
          success: false,

          error:
            "Unauthorized AI graph request",
        });
      }

      const event =
        await EmergencyEvent.findOne(
          {
            emergencyId:
              req.params
                .emergencyId,

            status: {
              $in:
                ACTIVE_STATUSES,
            },
          }
        ).lean();

      if (!event) {
        return res.status(
          404
        ).json({
          success: false,

          error:
            "Active emergency event not found",
        });
      }

      if (
        !event.currentCameraId
      ) {
        return res.json({
          success: true,

          emergencyId:
            event.emergencyId,

          currentCameraId: "",

          cameras: [],
        });
      }

      const connections =
        await getNextCameras(
          event.currentCameraId
        );

      return res.json({
        success: true,

        emergencyId:
          event.emergencyId,

        currentCameraId:
          event.currentCameraId,

        cameras:
          connections,
      });
    } catch (error) {
      console.error(
        "AI Emergency Graph Error:",
        error
      );

      return res.status(
        500
      ).json({
        success: false,

        error:
          "Failed to get AI emergency camera candidates",
      });
    }
  }
);

/*
 * =========================================================
 * PHASE 16 — GET NEXT CAMERAS
 * =========================================================
 */

router.get(
  "/events/:emergencyId/next-cameras",
  verifyToken,
  async (req, res) => {
    try {
      const event =
        await EmergencyEvent.findOne(
          {
            emergencyId:
              req.params
                .emergencyId,

            status: {
              $in:
                ACTIVE_STATUSES,
            },
          }
        ).lean();

      if (!event) {
        return res.status(
          404
        ).json({
          success: false,

          error:
            "Active emergency event not found",
        });
      }

      if (
        !event.currentCameraId
      ) {
        return res.json({
          success: true,

          emergencyId:
            event.emergencyId,

          currentCameraId: "",

          cameras: [],
        });
      }

      const connections =
        await getNextCameras(
          event.currentCameraId
        );

      return res.json({
        success: true,

        emergencyId:
          event.emergencyId,

        currentCameraId:
          event.currentCameraId,

        cameras:
          connections,
      });
    } catch (error) {
      console.error(
        "Emergency Next Cameras Error:",
        error
      );

      return res.status(
        500
      ).json({
        success: false,

        error:
          "Failed to get next emergency cameras",
      });
    }
  }
);

/*
 * =========================================================
 * PHASE 17 — SAME-VEHICLE CAMERA HANDOFF
 * =========================================================
 *
 * POST:
 *
 * /api/emergency/events/:emergencyId/handoff
 *
 * Body:
 *
 * {
 *   "nextCameraId": "CAM-002",
 *   "confidence": 0.91,
 *   "appearanceSignature": [...]
 * }
 *
 * The handoff is accepted only when:
 *
 * 1. AI authentication succeeds
 * 2. Appearance signatures exist
 * 3. Similarity >= configured threshold
 * 4. The camera graph allows the transition
 */

router.post(
  "/events/:emergencyId/handoff",
  async (req, res) => {
    try {
      if (
        !isInternalAIRequest(
          req
        )
      ) {
        return res.status(
          401
        ).json({
          success: false,

          error:
            "Unauthorized AI handoff request",
        });
      }

      const {
        nextCameraId,
        confidence,
        appearanceSignature,
      } = req.body;

      if (
        !nextCameraId
      ) {
        return res.status(
          400
        ).json({
          success: false,

          error:
            "nextCameraId is required",
        });
      }

      const event =
        await EmergencyEvent.findOne(
          {
            emergencyId:
              req.params
                .emergencyId,

            status: {
              $in:
                ACTIVE_STATUSES,
            },
          }
        );

      if (!event) {
        return res.status(
          404
        ).json({
          success: false,

          error:
            "Active emergency event not found",
        });
      }

      const incomingSignature =
        normalizeSignature(
          appearanceSignature
        );

      const storedSignature =
        normalizeSignature(
          event.appearanceSignature
        );

      /*
       * We do not claim same-vehicle identity
       * when either signature is missing.
       */

      if (
        storedSignature.length === 0 ||
        incomingSignature.length === 0
      ) {
        return res.status(
          409
        ).json({
          success: false,

          reidMatched: false,

          reidMatchScore: 0,

          threshold:
            EMERGENCY_REID_MIN_SCORE,

          error:
            "Insufficient appearance data for same-vehicle verification",
        });
      }

      /*
       * Calculate visual similarity.
       */

      const reidMatchScore =
        cosineSimilarity(
          storedSignature,
          incomingSignature
        );

      /*
       * Reject weak matches.
       */

      if (
        reidMatchScore <
        EMERGENCY_REID_MIN_SCORE
      ) {
        return res.status(
          409
        ).json({
          success: false,

          reidMatched: false,

          reidMatchScore,

          threshold:
            EMERGENCY_REID_MIN_SCORE,

          error:
            "Same-vehicle verification failed",
        });
      }

      /*
       * Only after successful visual verification
       * do we execute the camera graph handoff.
       */

      const result =
        await handoffEmergency(
          {
            emergencyId:
              req.params
                .emergencyId,

            nextCameraId,

            confidence,
          }
        );

      const updatedEvent =
        result.event;

      /*
       * Store the newly verified appearance.
       */

      if (
        updatedEvent
      ) {
        updatedEvent.appearanceSignature =
          incomingSignature;

        updatedEvent.reidMatchScore =
          reidMatchScore;

        updatedEvent.reidMethod =
          "HSV_APPEARANCE";

        await updatedEvent.save();

        await recordEmergencyAudit({
          emergencyId:
            updatedEvent.emergencyId,
          action:
            result.moved
              ? "CAMERA_HANDOFF"
              : "CAMERA_CONFIRMED",
          source:
            "AI",
          cameraId:
            updatedEvent.currentCameraId,
          previousCameraId:
            updatedEvent.previousCameraId,
          status:
            updatedEvent.status,
          priority:
            updatedEvent.priority,
          confidence:
            updatedEvent.confidence,
          reason:
            result.moved
              ? "Same-vehicle verification succeeded and the emergency moved through the camera graph."
              : "Same-vehicle verification succeeded and the current camera was refreshed.",
          metadata: {
            reidMatchScore,
            threshold:
              EMERGENCY_REID_MIN_SCORE,
            reidMethod:
              updatedEvent.reidMethod,
          },
        });
      }

      return res.json({
        success: true,

        moved:
          result.moved,

        reidMatched:
          true,

        reidMatchScore,

        threshold:
          EMERGENCY_REID_MIN_SCORE,

        event:
          updatedEvent,

        connection:
          result.connection ||
          null,
      });
    } catch (error) {
      console.error(
        "Emergency Handoff Error:",
        error
      );

      return res.status(
        400
      ).json({
        success: false,

        error:
          error.message ||
          "Emergency camera handoff failed",
      });
    }
  }
);

/*
 * =========================================================
 * GET ACTIVE EMERGENCY
 * =========================================================
 */

router.get(
  "/events/active",
  verifyToken,
  async (req, res) => {
    try {
      const event =
        await EmergencyEvent.findOne(
          {
            status: {
              $in:
                ACTIVE_STATUSES,
            },
          }
        )
          .sort({
            lastSeenAt: -1,
          })
          .lean();

      return res.json({
        success: true,

        active:
          Boolean(event),

        event:
          event || null,
      });
    } catch (error) {
      console.error(
        "Active Emergency Fetch Error:",
        error
      );

      return res.status(
        500
      ).json({
        success: false,

        error:
          "Failed to fetch active emergency",
      });
    }
  }
);

/*
 * =========================================================
 * GET ONE EMERGENCY
 * =========================================================
 */


/*
 * =========================================================
 * PHASE 22 — EMERGENCY PRIORITY ENGINE
 * =========================================================
 */

router.get(
  "/events/:emergencyId/priority",
  verifyToken,
  async (req, res) => {
    try {
      const result =
        await applyEmergencyPriority(
          req.params.emergencyId
        );

      await recordEmergencyAudit({
        emergencyId:
          result.event.emergencyId,
        action:
          "PRIORITY_UPDATED",
        source:
          "SYSTEM",
        cameraId:
          result.event.currentCameraId,
        status:
          result.event.status,
        priority:
          result.priority?.priority ||
          result.event.priority,
        priorityScore:
          result.priority?.priorityScore ??
          result.event.priorityScore,
        confidence:
          result.event.confidence,
        reason:
          (
            result.priority?.reasons ||
            []
          ).join(" ") ||
          "Emergency priority recalculated.",
        metadata: {
          breakdown:
            result.priority?.breakdown ||
            result.event.priorityBreakdown ||
            {},
          configVersion:
            result.priority?.configVersion ||
            null,
        },
      });

      return res.json({
        success: true,
        phase: 22,
        emergencyId:
          result.event.emergencyId,
        priority:
          result.priority,
        event:
          result.event,
      });
    } catch (error) {
      console.error(
        "Phase 22 Priority Error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error.message ||
          "Failed to calculate emergency priority",
      });
    }
  }
);

router.post(
  "/events/:emergencyId/priority/recalculate",
  verifyToken,
  async (req, res) => {
    try {
      if (
        req.user.role !== "government" &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          error:
            "Only authorized government workers or admins can recalculate emergency priority",
        });
      }

      const result =
        await applyEmergencyPriority(
          req.params.emergencyId
        );

      return res.json({
        success: true,
        phase: 22,
        emergencyId:
          result.event.emergencyId,
        priority:
          result.priority,
        event:
          result.event,
      });
    } catch (error) {
      console.error(
        "Phase 22 Priority Recalculate Error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error.message ||
          "Failed to recalculate emergency priority",
      });
    }
  }
);

router.get(
  "/priority-config",
  verifyToken,
  async (req, res) => {
    try {
      const config =
        await getEmergencyPriorityConfig();

      return res.json({
        success: true,
        phase: 22,
        config,
      });
    } catch (error) {
      console.error(
        "Phase 22 Priority Config Error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to fetch emergency priority configuration",
      });
    }
  }
);

router.patch(
  "/priority-config",
  verifyToken,
  async (req, res) => {
    try {
      if (
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          error:
            "Only admins can update emergency priority configuration",
        });
      }

      const EmergencyPriorityConfig =
        require("../models/EmergencyPriorityConfig");

      const allowedKeys = [
        "version",
        "vehicleScores",
        "incidentScores",
        "congestionBands",
        "etaBands",
        "routeDelayBands",
        "weights",
        "priorityThresholds",
        "vehicleSpeedsKmh",
        "phase19Prediction",
      ];

      const update = {};

      for (
        const key of allowedKeys
      ) {
        if (
          req.body[key] !==
          undefined
        ) {
          update[key] =
            req.body[key];
        }
      }

      update.updatedBy =
        req.user.userId;

      const config =
        await EmergencyPriorityConfig.findOneAndUpdate(
          {
            configKey: "default",
          },
          {
            $set: update,
            $setOnInsert: {
              configKey: "default",
            },
          },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert:
              true,
          }
        ).lean();

      return res.json({
        success: true,
        phase: 22,
        message:
          "Emergency priority configuration updated",
        config,
      });
    } catch (error) {
      console.error(
        "Phase 22 Priority Config Update Error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to update emergency priority configuration",
      });
    }
  }
);

router.get(
  "/events/:emergencyId",
  verifyToken,
  async (req, res) => {
    try {
      const event =
        await EmergencyEvent.findOne(
          {
            emergencyId:
              req.params
                .emergencyId,
          }
        ).lean();

      if (!event) {
        return res.status(
          404
        ).json({
          success: false,

          error:
            "Emergency event not found",
        });
      }

      return res.json({
        success: true,

        event,
      });
    } catch (error) {
      console.error(
        "Emergency Event Fetch Error:",
        error
      );

      return res.status(
        500
      ).json({
        success: false,

        error:
          "Failed to fetch emergency event",
      });
    }
  }
);

/*
 * =========================================================
 * UPDATE EMERGENCY STATUS
 * =========================================================
 */

router.patch(
  "/events/:emergencyId/status",
  verifyToken,
  async (req, res) => {
    try {
      if (
        req.user.role !==
          "government" &&
        req.user.role !==
          "admin"
      ) {
        return res.status(
          403
        ).json({
          success: false,

          error:
            "Only authorized government workers or admins can update emergencies",
        });
      }

      const allowedStatuses = [
        "DETECTED",
        "TRACKING",
        "APPROACHING",
        "ACTIVE",
        "SEARCHING",
        "COMPLETED",
        "CANCELLED",
      ];

      const {
        status,
        currentCameraId,
        previousCameraId,
        confidence,
      } = req.body;

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(
          400
        ).json({
          success: false,

          error:
            "Invalid emergency status",
        });
      }

      const update = {
        status,

        lastSeenAt:
          new Date(),
      };

      if (
        currentCameraId !==
        undefined
      ) {
        update.currentCameraId =
          String(
            currentCameraId ||
              ""
          ).trim();
      }

      if (
        previousCameraId !==
        undefined
      ) {
        update.previousCameraId =
          String(
            previousCameraId ||
              ""
          ).trim();
      }

      const numericConfidence =
        Number(
          confidence
        );

      if (
        confidence !==
          undefined &&
        Number.isFinite(
          numericConfidence
        )
      ) {
        update.confidence =
          Math.min(
            1,
            Math.max(
              0,
              numericConfidence
            )
          );
      }

      if (
        status ===
          "COMPLETED" ||
        status ===
          "CANCELLED"
      ) {
        update.completedAt =
          new Date();
      }

      const event =
        await EmergencyEvent.findOneAndUpdate(
          {
            emergencyId:
              req.params
                .emergencyId,
          },

          {
            $set:
              update,
          },

          {
            new: true,
          }
        );

      if (!event) {
        return res.status(
          404
        ).json({
          success: false,

          error:
            "Emergency event not found",
        });
      }

      const priorityResult =
        await applyEmergencyPriority(
          event.emergencyId
        );

      await recordEmergencyAudit({
        emergencyId:
          event.emergencyId,
        action:
          "STATUS_CHANGED",
        source:
          req.user.role === "government"
            ? "OFFICER"
            : "SYSTEM",
        cameraId:
          priorityResult.event.currentCameraId,
        previousCameraId:
          priorityResult.event.previousCameraId,
        status:
          priorityResult.event.status,
        priority:
          priorityResult.event.priority,
        priorityScore:
          priorityResult.event.priorityScore,
        confidence:
          priorityResult.event.confidence,
        reason:
          `Emergency status changed to ${status}.`,
        actorUserId:
          req.user.userId || null,
        actorRole:
          req.user.role || "",
      });

      if (
        status === "COMPLETED" ||
        status === "CANCELLED"
      ) {
        await recordEmergencyAudit({
          emergencyId:
            event.emergencyId,
          action:
            status === "COMPLETED"
              ? "EMERGENCY_COMPLETED"
              : "EMERGENCY_CANCELLED",
          source:
            req.user.role === "government"
              ? "OFFICER"
              : "SYSTEM",
          cameraId:
            priorityResult.event.currentCameraId,
          previousCameraId:
            priorityResult.event.previousCameraId,
          status:
            priorityResult.event.status,
          priority:
            priorityResult.event.priority,
          priorityScore:
            priorityResult.event.priorityScore,
          confidence:
            priorityResult.event.confidence,
          reason:
            status === "COMPLETED"
              ? "Emergency event marked completed."
              : "Emergency event cancelled.",
          actorUserId:
            req.user.userId || null,
          actorRole:
            req.user.role || "",
        });
      }

      return res.json({
        success: true,

        message:
          "Emergency status updated",

        event:
          priorityResult.event,
      });
    } catch (error) {
      console.error(
        "Emergency Status Update Error:",
        error
      );

      return res.status(
        500
      ).json({
        success: false,

        error:
          "Failed to update emergency status",
      });
    }
  }
);


/*
 * =========================================================
 * PHASE 18 — 5 KM EMERGENCY PROPAGATION
 * =========================================================
 */

router.get(
  "/events/:emergencyId/propagation",
  verifyToken,
  async (req, res) => {
    try {
      const event =
        await EmergencyEvent.findOne({
          emergencyId:
            req.params.emergencyId,

          status: {
            $in: ACTIVE_STATUSES,
          },
        }).lean();

      if (!event) {
        return res.status(404).json({
          success: false,
          error:
            "Active emergency event not found",
        });
      }

      const result =
        await calculatePropagation(
          event
        );

      return res.json({
        success: true,
        emergencyId:
          event.emergencyId,
        vehicleType:
          event.vehicleType,
        currentCameraId:
          event.currentCameraId,
        radiusMeters:
          PROPAGATION_RADIUS_METERS,
        currentCamera:
          result.currentCamera,
        affectedCameraCount:
          result.cameras.length,
        cameras:
          result.cameras,
      });
    } catch (error) {
      console.error(
        "Emergency Propagation Fetch Error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to calculate emergency propagation",
      });
    }
  }
);

router.post(
  "/events/:emergencyId/propagation/sync",
  async (req, res) => {
    try {
      if (
        !isInternalAIRequest(req)
      ) {
        return res.status(401).json({
          success: false,
          error:
            "Unauthorized AI propagation request",
        });
      }

      const event =
        await EmergencyEvent.findOne({
          emergencyId:
            req.params.emergencyId,

          status: {
            $in: ACTIVE_STATUSES,
          },
        });

      if (!event) {
        return res.status(404).json({
          success: false,
          error:
            "Active emergency event not found",
        });
      }

      const result =
        await syncPropagation(
          event
        );

      return res.json({
        success: true,
        emergencyId:
          event.emergencyId,
        currentCameraId:
          event.currentCameraId,
        radiusMeters:
          PROPAGATION_RADIUS_METERS,
        affectedCameraCount:
          result.cameras.length,
        cameras:
          result.cameras,
      });
    } catch (error) {
      console.error(
        "Emergency Propagation Sync Error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to sync emergency propagation",
      });
    }
  }
);

router.get(
  "/events/:emergencyId/propagation/cameras",
  verifyToken,
  async (req, res) => {
    try {
      const records =
        await EmergencyPropagation.find({
          emergencyId:
            req.params.emergencyId,

          active: true,
        })
          .sort({
            priorityScore: -1,
            distanceMeters: 1,
          })
          .lean();

      return res.json({
        success: true,
        emergencyId:
          req.params.emergencyId,
        count:
          records.length,
        cameras:
          records,
      });
    } catch (error) {
      console.error(
        "Affected Camera Fetch Error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to fetch affected cameras",
      });
    }
  }
);

module.exports = router;