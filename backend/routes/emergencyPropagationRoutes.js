const express = require("express");

const router = express.Router();

const EmergencyEvent =
  require("../models/EmergencyEvent");

const EmergencyPropagation =
  require("../models/EmergencyPropagation");

const {
  verifyToken,
} = require("../middleware/authMiddleware");

const {
  calculatePropagation,
  syncPropagation,
  PROPAGATION_RADIUS_METERS,
} = require("../services/emergencyPropagation");

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
 * INTERNAL AI AUTH
 * =========================================================
 */

const isInternalAIRequest = (
  req
) =>
  Boolean(
    process.env.INTERNAL_AI_KEY &&
      req.get(
        "x-internal-ai-key"
      ) ===
        process.env.INTERNAL_AI_KEY
  );

/*
 * =========================================================
 * PHASE 18
 * GET 5 KM PROPAGATION
 * =========================================================
 *
 * GET:
 *
 * /api/emergency/events/:emergencyId/propagation
 *
 * Used by government/admin UI.
 */

router.get(
  "/events/:emergencyId/propagation",
  verifyToken,
  async (req, res) => {
    try {
      const event =
        await EmergencyEvent.findOne({
          emergencyId:
            req.params
              .emergencyId,

          status: {
            $in:
              ACTIVE_STATUSES,
          },
        }).lean();

      if (!event) {
        return res.status(
          404
        ).json({
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

      return res.status(
        500
      ).json({
        success: false,

        error:
          "Failed to calculate emergency propagation",
      });
    }
  }
);

/*
 * =========================================================
 * PHASE 18
 * INTERNAL AI PROPAGATION SYNC
 * =========================================================
 *
 * POST:
 *
 * /api/emergency/events/:emergencyId/propagation/sync
 *
 * Called by the AI process.
 */

router.post(
  "/events/:emergencyId/propagation/sync",
  async (req, res) => {
    try {
      /*
       * Verify AI process.
       */

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
            "Unauthorized AI propagation request",
        });
      }

      const event =
        await EmergencyEvent.findOne({
          emergencyId:
            req.params
              .emergencyId,

          status: {
            $in:
              ACTIVE_STATUSES,
          },
        });

      if (!event) {
        return res.status(
          404
        ).json({
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

      return res.status(
        500
      ).json({
        success: false,

        error:
          "Failed to sync emergency propagation",
      });
    }
  }
);

/*
 * =========================================================
 * PHASE 18
 * GET PERSISTED AFFECTED CAMERAS
 * =========================================================
 *
 * GET:
 *
 * /api/emergency/events/:emergencyId/propagation/cameras
 */

router.get(
  "/events/:emergencyId/propagation/cameras",
  verifyToken,
  async (req, res) => {
    try {
      const records =
        await EmergencyPropagation.find(
          {
            emergencyId:
              req.params
                .emergencyId,

            active:
              true,
          }
        )
          .sort({
            priorityScore:
              -1,

            distanceMeters:
              1,
          })
          .lean();

      return res.json({
        success: true,

        emergencyId:
          req.params
            .emergencyId,

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

      return res.status(
        500
      ).json({
        success: false,

        error:
          "Failed to fetch affected cameras",
      });
    }
  }
);

module.exports = router;