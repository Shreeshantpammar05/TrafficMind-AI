const express =
  require("express");

const router =
  express.Router();

const {
  verifyToken,
} = require("../middleware/authMiddleware");

const {
  evaluateRecovery,
  recoverEmergency,
  evaluateCompletion,
  completeEmergency,
  cancelEmergency,
} = require("../services/emergencyRecovery");

function isInternalAIRequest(
  req
) {
  const key =
    process.env.INTERNAL_AI_KEY;

  return (
    !!key &&
    req.get(
      "x-internal-ai-key"
    ) === key
  );
}

/*
 * =========================================================
 * PHASE 20 — RECOVERY STATUS
 * =========================================================
 *
 * GET:
 * /api/emergency-recovery/:emergencyId
 */
router.get(
  "/:emergencyId",
  verifyToken,
  async (req, res) => {
    try {
      const result =
        await evaluateRecovery(
          req.params.emergencyId
        );

      if (!result.found) {
        return res.status(404).json({
          success: false,
          error:
            result.reason,
        });
      }

      return res.json({
        success: true,

        phase: 20,

        emergencyId:
          req.params
            .emergencyId,

        searching:
          result.searching,

        recovered:
          result.recovered,

        completed:
          result.completed ||
          false,

        completionReason:
          result.completionReason ||
          "",

        elapsedSeconds:
          result.elapsedSeconds ??
          0,

        timeoutSeconds:
          result.timeoutSeconds ??
          0,

        currentCameraId:
          result.event
            ?.currentCameraId ||
          "",

        status:
          result.event?.status ||
          "",

        candidates:
          result.candidates ||
          [],
      });
    } catch (error) {
      console.error(
        "Emergency Recovery Status Error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to evaluate emergency recovery",
      });
    }
  }
);

/*
 * =========================================================
 * PHASE 20 — AI RECOVERY
 * =========================================================
 *
 * POST:
 * /api/emergency-recovery/:emergencyId/recover
 */
router.post(
  "/:emergencyId/recover",
  async (req, res) => {
    try {
      if (
        !isInternalAIRequest(req)
      ) {
        return res.status(401).json({
          success: false,
          error:
            "Unauthorized AI recovery request",
        });
      }

      const {
        cameraId,
        vehicleType,
        confidence,
        appearanceSignature,
      } = req.body;

      if (!cameraId) {
        return res.status(400).json({
          success: false,
          error:
            "cameraId is required",
        });
      }

      const result =
        await recoverEmergency({
          emergencyId:
            req.params
              .emergencyId,

          cameraId,

          vehicleType,

          confidence,

          appearanceSignature,
        });

      return res.json({
        success: true,

        phase: 20,

        emergencyId:
          req.params
            .emergencyId,

        ...result,
      });
    } catch (error) {
      console.error(
        "Emergency Recovery Error:",
        error
      );

      return res.status(400).json({
        success: false,
        error:
          error.message ||
          "Emergency recovery failed",
      });
    }
  }
);

/*
 * =========================================================
 * PHASE 26 — COMPLETION EVALUATION
 * =========================================================
 *
 * GET:
 * /api/emergency-recovery/:emergencyId/completion
 *
 * This endpoint only evaluates whether the emergency
 * appears to have reached its destination.
 *
 * It does NOT complete the event automatically.
 */
router.get(
  "/:emergencyId/completion",
  verifyToken,
  async (req, res) => {
    try {
      const result =
        await evaluateCompletion(
          req.params
            .emergencyId
        );

      if (!result.found) {
        return res.status(404).json({
          success: false,
          error:
            result.reason,
        });
      }

      return res.json({
        success: true,

        phase: 26,

        emergencyId:
          req.params
            .emergencyId,

        completed:
          result.completed,

        reason:
          result.reason,

        distanceMeters:
          result.distanceMeters,

        currentCameraId:
          result.currentCameraId,

        destinationAvailable:
          result.destinationAvailable,

        status:
          result.status,
      });
    } catch (error) {
      console.error(
        "Emergency Completion Evaluation Error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to evaluate emergency completion",
      });
    }
  }
);

/*
 * =========================================================
 * PHASE 26 — COMPLETE EMERGENCY
 * =========================================================
 *
 * POST:
 * /api/emergency-recovery/:emergencyId/complete
 *
 * Authorized government/admin action.
 *
 * The service:
 * - marks EmergencyEvent COMPLETED
 * - releases propagation records
 * - resolves officer alerts
 * - writes audit entry
 */
router.post(
  "/:emergencyId/complete",
  verifyToken,
  async (req, res) => {
    try {
      if (
        req.user.role !==
          "government" &&
        req.user.role !==
          "admin"
      ) {
        return res.status(403).json({
          success: false,
          error:
            "Only authorized government workers or admins can complete emergencies",
        });
      }

      const reason =
        String(
          req.body?.reason ||
            "Emergency event completed."
        ).trim();

      const result =
        await completeEmergency({
          emergencyId:
            req.params
              .emergencyId,

          reason,

          source:
            req.user.role ===
            "government"
              ? "WORKER"
              : "SYSTEM",

          actorUserId:
            req.user.userId ||
            null,

          actorRole:
            req.user.role ||
            "",
        });

      return res.json({
        success: true,

        phase: 26,

        action:
          "COMPLETE",

        emergencyId:
          req.params
            .emergencyId,

        ...result,
      });
    } catch (error) {
      console.error(
        "Emergency Completion Error:",
        error
      );

      return res.status(400).json({
        success: false,
        error:
          error.message ||
          "Failed to complete emergency",
      });
    }
  }
);

/*
 * =========================================================
 * PHASE 26 — CANCEL EMERGENCY
 * =========================================================
 *
 * POST:
 * /api/emergency-recovery/:emergencyId/cancel
 */
router.post(
  "/:emergencyId/cancel",
  verifyToken,
  async (req, res) => {
    try {
      if (
        req.user.role !==
          "government" &&
        req.user.role !==
          "admin"
      ) {
        return res.status(403).json({
          success: false,
          error:
            "Only authorized government workers or admins can cancel emergencies",
        });
      }

      const reason =
        String(
          req.body?.reason ||
            "Emergency event cancelled."
        ).trim();

      const result =
        await cancelEmergency({
          emergencyId:
            req.params
              .emergencyId,

          reason,

          source:
            req.user.role ===
            "government"
              ? "WORKER"
              : "SYSTEM",

          actorUserId:
            req.user.userId ||
            null,

          actorRole:
            req.user.role ||
            "",
        });

      return res.json({
        success: true,

        phase: 26,

        action:
          "CANCEL",

        emergencyId:
          req.params
            .emergencyId,

        ...result,
      });
    } catch (error) {
      console.error(
        "Emergency Cancellation Error:",
        error
      );

      return res.status(400).json({
        success: false,
        error:
          error.message ||
          "Failed to cancel emergency",
      });
    }
  }
);

module.exports = router;