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
  getPredictiveTrafficIntelligence,
} = require(
  "../services/predictiveTrafficService"
);

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

      const prediction =
        await getPredictiveTrafficIntelligence(
          cameraFilter,
          {
            includeNearby:
              isSubOfficer,
            nearbyArea:
              isSubOfficer
                ? req.user
                    .jurisdictionArea
                : "",
          }
        );

      res.json({
        ...prediction,

        accessType:
          isSubOfficer
            ? "AREA_PLUS_NEARBY"
            : req.user.role ===
              "admin"
            ? "FULL"
            : "DISTRICT",

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
        "Predictive Traffic Error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Failed to generate predictive traffic intelligence",
      });
    }
  }
);

module.exports = router;