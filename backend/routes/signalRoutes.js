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
  calculateSignalOptimization,
} = require(
  "../services/smartSignalService"
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
  "/status",
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

      const isSubOfficer =
        req.user
          .governmentOfficerType ===
        "sub_officer";

      const cameraFilter =
        req.user.role === "admin"
          ? {}
          : {
              district:
                req.user
                  .jurisdictionDistrict,

              ...(isSubOfficer
                ? {
                    area:
                      req.user
                        .jurisdictionArea,
                  }
                : {}),
            };

      const nearbyOptions = {
        includeNearby:
          isSubOfficer,

        nearbyArea:
          isSubOfficer
            ? req.user
                .jurisdictionArea
            : "",
      };

      const intelligence =
        await getMultiCameraIntelligence(
          cameraFilter
        );

      const optimization =
        await calculateSignalOptimization(
          cameraFilter,
          nearbyOptions
        );

      res.json({
        success: true,

        vehicleCount:
          intelligence.totalVehicles,

        averageVehicles:
          intelligence.averageVehicles,

        cameraCount:
          intelligence.cameraCount,

        congestion:
          intelligence.overallCongestion,

        signalTime:
          optimization.greenTime,

        recommendation:
          optimization.recommendation ||
          intelligence.priorityCamera
            ?.recommendation ||
          "Maintain normal signal timing",

        density:
          intelligence.totalVehicles >=
          25
            ? "VERY HIGH"
            : intelligence.totalVehicles >=
              15
            ? "HIGH"
            : intelligence.totalVehicles >=
              5
            ? "MEDIUM"
            : "LOW",

        flowStatus:
          intelligence.overallCongestion ===
          "HIGH"
            ? "SLOW"
            : intelligence.overallCongestion ===
              "MEDIUM"
            ? "MODERATE"
            : "NORMAL",

        riskLevel:
          intelligence.overallRisk,

        priority:
          optimization.action,

        trafficRecommendation:
          intelligence.priorityCamera
            ?.recommendation ||
          "Traffic flow is normal",

        emergencyDetected:
          intelligence
            .emergencyCameras
            .length > 0,

        accidentDetected:
          intelligence
            .accidentCameras
            .length > 0,

        priorityCamera:
          intelligence.priorityCamera,

        accidentCameras:
          intelligence.accidentCameras,

        emergencyCameras:
          intelligence.emergencyCameras,

        greenCorridor:
          optimization.greenCorridor,

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
        "Smart Signal Error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Failed to generate smart signal status",
      });
    }
  }
);

/*
 * =========================================================
 * PHASE 23 — GREEN CORRIDOR INTELLIGENCE
 * =========================================================
 *
 * Dedicated endpoint for emergency corridor
 * recommendations. This does NOT control physical
 * traffic signals. It produces explainable actions.
 */

router.get(
  "/green-corridor/:emergencyId",
  verifyToken,
  async (req, res) => {
    try {
      if (
        req.user.role !== "admin" &&
        req.user.role !== "government"
      ) {
        return res.status(403).json({
          success: false,
          error:
            "Green corridor access denied",
        });
      }

      if (
        req.user.role ===
        "government" &&
        req.user.verificationStatus !==
          "approved"
      ) {
        return res.status(403).json({
          success: false,
          error:
            "Government officer approval required",
        });
      }

      const filter =
        getCameraFilter(req);

      const nearbyOptions = {
        includeNearby:
          req.user
            .governmentOfficerType ===
          "sub_officer",

        nearbyArea:
          req.user
            .governmentOfficerType ===
          "sub_officer"
            ? req.user.jurisdictionArea
            : "",
      };

      const optimization =
        await calculateSignalOptimization(
          filter,
          nearbyOptions,
          {
            emergencyId:
              req.params.emergencyId,
          }
        );

      return res.json({
        success: true,
        phase: 23,
        emergencyId:
          req.params.emergencyId,
        greenCorridor:
          optimization.greenCorridor,
      });
    } catch (error) {
      console.error(
        "Green Corridor Error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to generate green corridor intelligence",
      });
    }
  }
);

module.exports = router;
