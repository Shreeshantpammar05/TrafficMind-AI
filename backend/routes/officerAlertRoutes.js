const express =
  require("express");

const router =
  express.Router();

const EmergencyEvent =
  require("../models/EmergencyEvent");

const TrafficCamera =
  require("../models/TrafficCamera");

const OfficerEmergencyAlert =
  require("../models/OfficerEmergencyAlert");

const {
  verifyToken,
} = require("../middleware/authMiddleware");

const {
  syncOfficerIntelligence,
  resolveCompletedEmergencyAlerts,
} = require("../services/officerEmergencyIntelligence");

const ACTIVE_STATUSES = [
  "DETECTED",
  "TRACKING",
  "APPROACHING",
  "ACTIVE",
  "SEARCHING",
];

/*
 * =========================================================
 * MANUAL DISPATCH
 * =========================================================
 *
 * POST:
 * /api/officer-alerts/dispatch/:emergencyId
 *
 * Government officer/admin only.
 */

router.post(
  "/dispatch/:emergencyId",
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
            "Only government officers or admins can dispatch officer alerts",
        });
      }

      const result =
        await syncOfficerIntelligence({
          emergencyId:
            req.params.emergencyId,

          source:
            "AI_EMERGENCY",

          forceNotify:
            true,
        });

      if (!result.success) {
        return res.status(400).json(
          result
        );
      }

      return res.json(
        result
      );
    } catch (error) {
      console.error(
        "Officer Alert Dispatch Error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error.message ||
          "Failed to dispatch officer emergency alerts",
      });
    }
  }
);

/*
 * =========================================================
 * PHASE 21
 * INTERNAL DYNAMIC JURISDICTION SYNC
 * =========================================================
 *
 * POST:
 * /api/officer-alerts/internal/sync/:emergencyId
 *
 * AI/backend trusted request.
 */

router.post(
  "/internal/sync/:emergencyId",
  async (req, res) => {
    try {
      const configuredKey =
        process.env.INTERNAL_AI_KEY ||
        "";

      const suppliedKey =
        req.get(
          "x-internal-ai-key"
        ) || "";

      if (
        !configuredKey ||
        suppliedKey !== configuredKey
      ) {
        return res.status(401).json({
          success: false,
          error:
            "Unauthorized internal officer sync request",
        });
      }

      const result =
        await syncOfficerIntelligence({
          emergencyId:
            req.params
              .emergencyId,

          source:
            req.body?.source ||
            "HANDOFF",

          forceNotify:
            req.body?.forceNotify !==
            false,
        });

      if (!result.success) {
        return res.status(400).json(
          result
        );
      }

      return res.json({
        success: true,

        phase: 21,

        ...result,
      });
    } catch (error) {
      console.error(
        "Internal Officer Intelligence Sync Error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to synchronize officer intelligence",
      });
    }
  }
);

/*
 * =========================================================
 * PHASE 21
 * COMPLETE EVENT RELEASE
 * =========================================================
 *
 * POST:
 * /api/officer-alerts/internal/complete/:emergencyId
 */

router.post(
  "/internal/complete/:emergencyId",
  async (req, res) => {
    try {
      const configuredKey =
        process.env.INTERNAL_AI_KEY ||
        "";

      const suppliedKey =
        req.get(
          "x-internal-ai-key"
        ) || "";

      if (
        !configuredKey ||
        suppliedKey !== configuredKey
      ) {
        return res.status(401).json({
          success: false,
          error:
            "Unauthorized internal officer completion request",
        });
      }

      const result =
        await resolveCompletedEmergencyAlerts(
          req.params
            .emergencyId
        );

      return res.json({
        success: true,

        phase: 21,

        emergencyId:
          req.params
            .emergencyId,

        matched:
          result.matchedCount ||
          0,

        modified:
          result.modifiedCount ||
          0,
      });
    } catch (error) {
      console.error(
        "Internal Officer Completion Error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to release officer responsibilities",
      });
    }
  }
);

/*
 * =========================================================
 * GET MY ALERTS
 * =========================================================
 *
 * GET:
 * /api/officer-alerts/my
 */

router.get(
  "/my",
  verifyToken,
  async (req, res) => {
    try {
      const alerts =
        await OfficerEmergencyAlert.find({
          recipientUserId:
            req.user.userId,
        })
          .sort({
            isRead: 1,
            sentAt: -1,
          })
          .limit(100)
          .lean();

      return res.json({
        success: true,
        count:
          alerts.length,
        alerts,
      });
    } catch (error) {
      console.error(
        "Officer Alert Fetch Error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to fetch officer alerts",
      });
    }
  }
);

/*
 * =========================================================
 * UPDATE MY ALERT STATUS
 * =========================================================
 *
 * SENT
 *   ↓
 * ACKNOWLEDGED
 *   ↓
 * RESPONDING
 *   ↓
 * RESOLVED
 */

router.patch(
  "/:alertId/status",
  verifyToken,
  async (req, res) => {
    try {
      const transitions = {
        SENT: [
          "SENT",
          "ACKNOWLEDGED",
        ],

        ACKNOWLEDGED: [
          "ACKNOWLEDGED",
          "RESPONDING",
        ],

        RESPONDING: [
          "RESPONDING",
          "RESOLVED",
        ],

        RESOLVED: [
          "RESOLVED",
        ],
      };

      const status =
        String(
          req.body.status || ""
        )
          .trim()
          .toUpperCase();

      const alert =
        await OfficerEmergencyAlert.findOne(
          {
            _id:
              req.params.alertId,

            recipientUserId:
              req.user.userId,
          }
        );

      if (!alert) {
        return res.status(404).json({
          success: false,
          error:
            "Officer alert not found",
        });
      }

      const allowed =
        transitions[
          alert.status
        ] || [];

      if (
        !allowed.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            `Invalid status transition ${alert.status} → ${status}`,
        });
      }

      alert.status =
        status;

      if (
        status ===
        "ACKNOWLEDGED"
      ) {
        alert.acknowledgedAt =
          new Date();

        alert.isRead = true;
      }

      if (
        status ===
        "RESPONDING"
      ) {
        alert.isRead = true;
      }

      if (
        status ===
        "RESOLVED"
      ) {
        alert.resolvedAt =
          new Date();

        alert.isRead = true;
      }

      await alert.save();

      return res.json({
        success: true,

        message:
          "Officer alert status updated",

        alert,
      });
    } catch (error) {
      console.error(
        "Officer Alert Status Error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to update officer alert status",
      });
    }
  }
);

module.exports = router;