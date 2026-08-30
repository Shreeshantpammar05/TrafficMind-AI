const express =
  require("express");

const router =
  express.Router();

const {
  verifyToken,
} = require(
  "../middleware/authMiddleware"
);

const EmergencyEvent =
  require(
    "../models/EmergencyEvent"
  );

const {
  getEmergencyAuditTimeline,
} = require(
  "../services/emergencyAuditService"
);

const ACTIVE_STATUSES = [
  "DETECTED",
  "TRACKING",
  "APPROACHING",
  "ACTIVE",
  "SEARCHING",
];

router.get(
  "/:emergencyId/timeline",
  verifyToken,
  async (req, res) => {
    try {
      const emergencyId =
        String(
          req.params.emergencyId ||
            ""
        ).trim();

      if (!emergencyId) {
        return res.status(400).json({
          success: false,
          error:
            "Emergency ID is required",
        });
      }

      const event =
        await EmergencyEvent.findOne({
          emergencyId,
        }).lean();

      if (!event) {
        return res.status(404).json({
          success: false,
          error:
            "Emergency event not found",
        });
      }

      /*
       * Government users only see emergencies
       * currently inside their jurisdiction.
       */
      if (
        req.user.role ===
        "government"
      ) {
        if (
          req.user
            .verificationStatus !==
          "approved"
        ) {
          return res.status(403).json({
            success: false,
            error:
              "Government officer approval required",
          });
        }

        const districtMatches =
          String(
            event.startLocation
              ?.name || ""
          ).trim() ===
          String(
            req.user
              .jurisdictionDistrict ||
              ""
          ).trim();

        /*
         * If a current camera exists, use its
         * jurisdiction through the event only
         * when the event is active. For completed
         * events, timeline access remains useful.
         */
        if (
          !districtMatches &&
          event.status !==
            "COMPLETED"
        ) {
          return res.status(403).json({
            success: false,
            error:
              "Emergency timeline access denied",
          });
        }
      }

      const timeline =
        await getEmergencyAuditTimeline(
          emergencyId,
          req.query.limit
        );

      return res.json({
        success: true,
        phase: 25,
        emergencyId,
        count:
          timeline.length,
        timeline,
      });
    } catch (error) {
      console.error(
        "Emergency Audit Timeline Error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to fetch emergency audit timeline",
      });
    }
  }
);

module.exports = router;
