const express = require("express");

const router = express.Router();

const {
  verifyToken,
} = require("../middleware/authMiddleware");

const AIDecision =
  require("../models/AIDecision");

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

      const history =
        await AIDecision.find({
          cameraId,
        })
          .sort({
            createdAt: -1,
          })
          .limit(50)
          .lean();

      const enrichedHistory =
        history.map(
          (item, index) => {
            const previous =
              history[index + 1] || null;

            const currentVehicles =
              Number(
                item.vehicleCount
              ) || 0;

            const previousVehicles =
              Number(
                previous?.vehicleCount
              ) || 0;

            const vehicleChange =
              previous
                ? currentVehicles -
                  previousVehicles
                : 0;

            let trend = "STABLE";

            if (vehicleChange >= 5) {
              trend = "RISING FAST";
            } else if (
              vehicleChange >= 2
            ) {
              trend = "RISING";
            } else if (
              vehicleChange <= -5
            ) {
              trend = "FALLING FAST";
            } else if (
              vehicleChange <= -2
            ) {
              trend = "FALLING";
            }

            return {
              ...item,

              vehicleChange,

              trend,

              isLatest:
                index === 0,

              confidencePercent:
                Number(
                  item.confidence || 0
                ) * 100,
            };
          }
        );

      res.json({
        success: true,

        cameraId,

        count:
          enrichedHistory.length,

        history:
          enrichedHistory,
      });
    } catch (error) {
      console.error(
        "AI Decision History Error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Failed to fetch AI decision history",
      });
    }
  }
);

module.exports = router;