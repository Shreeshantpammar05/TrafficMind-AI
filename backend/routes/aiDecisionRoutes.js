const express =
  require("express");

const router =
  express.Router();

const AIDecision =
  require("../models/AIDecision");

const CameraDetection =
  require("../models/CameraDetection");

const {
  verifyToken,
} = require("../middleware/authMiddleware");

const {
  getAIDecision,
} = require(
  "../services/aiDecisionService"
);

router.get(
  "/:cameraId",
  verifyToken,
  async (req, res) => {
    try {
      const cameraId =
        req.params.cameraId?.trim();

      if (!cameraId) {
        return res.status(400).json({
          success: false,
          error:
            "Camera ID is required",
        });
      }

      const detection =
        await CameraDetection.findOne({
          cameraId,
        }).lean();

      const decision =
        await getAIDecision({
          cameraId,

          detection,
        });

      /*
       * Keep the existing decision-history
       * behavior. Only save when the actual
       * decision state changes.
       */
      const latestDecision =
        await AIDecision.findOne({
          cameraId,
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      const decisionChanged =
        !latestDecision ||
        latestDecision.decision !==
          decision.decision ||
        latestDecision.priority !==
          decision.priority ||
        latestDecision.action !==
          decision.action;

      if (decisionChanged) {
        await AIDecision.create({
          cameraId,

          decision:
            decision.decision,

          priority:
            decision.priority,

          action:
            decision.action,

          explanation:
            decision.explanation,

          confidence:
            decision.confidence,

          vehicleCount:
            decision.vehicleCount,

          congestion:
            decision.congestion,

          riskLevel:
            decision.riskLevel,
        });
      }

      res.json({
        success: true,

        cameraId,

        decision,
      });
    } catch (error) {
      console.error(
        "AI Decision Error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Failed to generate AI decision",
      });
    }
  }
);

module.exports = router;