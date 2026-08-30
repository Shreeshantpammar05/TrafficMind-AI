const express =
  require("express");

const router =
  express.Router();

const {
  verifyToken,
} = require(
  "../middleware/authMiddleware"
);

const {
  getMultiCameraIntelligence,
} = require(
  "../services/multiCameraIntelligenceService"
);

const {
  generateTrafficRecommendation,
} = require(
  "../services/trafficRecommendationService"
);

const getCameraFilter = (
  req
) => {
  if (
    req.user.role === "admin"
  ) {
    return {};
  }

  return {
    district:
      req.user
        .jurisdictionDistrict,

    ...(req.user
      .governmentOfficerType ===
      "sub_officer"
      ? {
          area:
            req.user
              .jurisdictionArea,
        }
      : {}),
  };
};

router.get(
  "/",
  verifyToken,
  async (req, res) => {
    try {
      if (
        req.user.role !==
          "admin" &&
        req.user.role !==
          "government"
      ) {
        return res.status(403).json({
          success: false,
          error:
            "Camera intelligence access denied",
        });
      }

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

        if (
          !req.user
            .jurisdictionDistrict
        ) {
          return res.status(403).json({
            success: false,
            error:
              "Officer jurisdiction is not assigned",
          });
        }

        if (
          req.user
            .governmentOfficerType ===
            "sub_officer" &&
          !req.user
            .jurisdictionArea
        ) {
          return res.status(403).json({
            success: false,
            error:
              "Sub Officer area is not assigned",
          });
        }
      }

      const filter =
        getCameraFilter(req);

      const intelligence =
        await getMultiCameraIntelligence(
          filter
        );

      const recommendation =
        generateTrafficRecommendation({
          congestion:
            intelligence.overallCongestion,

          riskLevel:
            intelligence.overallRisk,

          emergencyDetected:
            intelligence
              .emergencyCameras
              .length > 0,

          accidentDetected:
            intelligence
              .accidentCameras
              .length > 0,

          vehicleCount:
            intelligence.totalVehicles,

          priorityCamera:
            intelligence.priorityCamera,
        });

      res.json({
        success: true,

        priority:
          recommendation.priority,

        action:
          recommendation.action,

        congestion:
          intelligence.overallCongestion,

        riskLevel:
          intelligence.overallRisk,

        totalVehicles:
          intelligence.totalVehicles,

        averageVehicles:
          intelligence.averageVehicles,

        cameraCount:
          intelligence.cameraCount,

        priorityCamera:
          intelligence.priorityCamera,

        accidentCameras:
          intelligence.accidentCameras,

        emergencyCameras:
          intelligence.emergencyCameras,

        congestionCameras:
          intelligence.congestionCameras,

        jurisdiction: {
          district:
            req.user
              .jurisdictionDistrict ||
            "",

          area:
            req.user
              .jurisdictionArea ||
            "",
        },
      });
    } catch (error) {
      console.error(
        "Traffic Recommendation Error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Failed to generate traffic recommendation",
      });
    }
  }
);

module.exports = router;