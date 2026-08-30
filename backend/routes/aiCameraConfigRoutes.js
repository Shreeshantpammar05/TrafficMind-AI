const express = require("express");

const router = express.Router();

const TrafficCamera =
  require("../models/TrafficCamera");

router.get(
  "/",
  async (req, res) => {
    try {
      const internalKey =
        req.headers["x-internal-ai-key"];

      if (
        !internalKey ||
        internalKey !==
          process.env.INTERNAL_AI_KEY
      ) {
        return res.status(401).json({
          success: false,
          error:
            "Invalid internal AI authentication key",
        });
      }

      const cameras =
        await TrafficCamera.find({
          status: "active",
          aiEnabled: true,
        })
          .select(
            "cameraId source name location city district area latitude longitude aiEnabled status"
          )
          .sort({
            createdAt: 1,
          })
          .lean();

      res.json({
        success: true,
        count:
          cameras.length,
        cameras,
      });
    } catch (error) {
      console.error(
        "AI Camera Config Error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Failed to load AI camera configuration",
      });
    }
  }
);

module.exports = router;