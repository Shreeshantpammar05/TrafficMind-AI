const express = require("express");

const router = express.Router();

const {
  verifyToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

const CameraDetection =
  require("../models/CameraDetection");

// Latest detection for one camera
router.get(
  "/:cameraId/latest",
  verifyToken,
  async (req, res) => {
    try {
      const cameraId =
        req.params.cameraId?.trim();

      if (!cameraId) {
        return res.status(400).json({
          success: false,
          error: "Camera ID is required",
        });
      }

      const detection =
        await CameraDetection.findOne({
          cameraId,
        }).sort({
          detectedAt: -1,
        });

      res.json({
        success: true,
       detection: detection || {
  cameraId,
  vehicleCount: 0,
  congestion: "LOW",
  averageConfidence: 0,
  maxConfidence: 0,
  emergencyDetected: false,
  accidentDetected: false,
  accidentSeverity: "NONE",
  recommendation:
    "No detection available",
},
      });
    } catch (error) {
      console.error(
        "Camera Detection Fetch Error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Failed to fetch camera detection",
      });
    }
  }
);

// Create/update detection
router.post(
  "/",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        cameraId,
        vehicleCount,
        congestion,
        emergencyDetected,
        accidentDetected,
        accidentSeverity,
        recommendation,
      } = req.body;

      if (!cameraId) {
        return res.status(400).json({
          success: false,
          error: "Camera ID is required",
        });
      }

      const detection =
        await CameraDetection.create({
          cameraId,
          vehicleCount:
            Number(vehicleCount) || 0,
          congestion:
            congestion || "LOW",
          emergencyDetected:
            emergencyDetected === true,
          accidentDetected:
            accidentDetected === true,
          accidentSeverity:
            accidentSeverity || "NONE",
          recommendation:
            recommendation ||
            "Traffic Flow Normal",
          detectedAt: new Date(),
        });

      res.status(201).json({
        success: true,
        detection,
      });
    } catch (error) {
      console.error(
        "Camera Detection Create Error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Failed to save camera detection",
      });
    }
  }
);

module.exports = router;