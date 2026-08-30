const express =
  require("express");

const router =
  express.Router();

const TrafficCamera =
  require("../models/TrafficCamera");

const CameraConnection =
  require("../models/CameraConnection");

const {
  verifyToken,
} = require(
  "../middleware/authMiddleware"
);

const {
  registerRealCamera,
} = require(
  "../services/realCameraIntegrationService"
);

const MANAGEMENT_ROLES = [
  "admin",
  "government",
];

const canManage = (
  req
) =>
  MANAGEMENT_ROLES.includes(
    req.user?.role
  );

// =========================================================
// PHASE 28
// REAL CAMERA REGISTRATION
// =========================================================
//
// POST
// /api/real-camera-integration/register
//
// Admin / Government only.
// =========================================================

router.post(
  "/register",
  verifyToken,
  async (
    req,
    res
  ) => {
    try {
      if (
        !canManage(req)
      ) {
        return res
          .status(403)
          .json({
            success: false,

            error:
              "Only government users or admins can register cameras",
          });
      }

      const result =
        await registerRealCamera(
          req.body
        );

      return res
        .status(
          result.created
            ? 201
            : 200
        )
        .json({
          success: true,

          phase: 28,

          ...result,
        });
    } catch (error) {
      console.error(
        "Phase 28 camera registration error:",
        error
      );

      return res
        .status(400)
        .json({
          success: false,

          phase: 28,

          error:
            error.message ||
            "Failed to register real camera",
        });
    }
  }
);

// =========================================================
// PHASE 28
// VALIDATE CAMERA NETWORK
// =========================================================
//
// GET
// /api/real-camera-integration/validate/:cameraId
// =========================================================

router.get(
  "/validate/:cameraId",
  verifyToken,
  async (
    req,
    res
  ) => {
    try {
      if (
        !canManage(req)
      ) {
        return res
          .status(403)
          .json({
            success: false,

            error:
              "Only government users or admins can validate camera integration",
          });
      }

      const camera =
        await TrafficCamera.findOne({
          cameraId:
            String(
              req.params
                .cameraId ||
                ""
            ).trim(),
        }).lean();

      if (!camera) {
        return res
          .status(404)
          .json({
            success: false,

            error:
              "Camera not found",
          });
      }

      const outgoing =
        await CameraConnection.find({
          fromCameraId:
            camera.cameraId,

          active:
            true,
        })
          .sort({
            priority:
              -1,

            distanceMeters:
              1,
          })
          .lean();

      const incoming =
        await CameraConnection.find({
          toCameraId:
            camera.cameraId,

          active:
            true,
        })
          .sort({
            priority:
              -1,

            distanceMeters:
              1,
          })
          .lean();

      return res.json({
        success: true,

        phase: 28,

        camera,

        connected:
          outgoing.length >
            0 ||
          incoming.length >
            0,

        outgoing,

        incoming,
      });
    } catch (error) {
      console.error(
        "Phase 28 camera validation error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          error:
            "Failed to validate camera integration",
        });
    }
  }
);

// =========================================================
// PHASE 28
// REMOVE CAMERA
// =========================================================
//
// DELETE
// /api/real-camera-integration/:cameraId
//
// Deletes the camera and all graph edges involving it.
// =========================================================

router.delete(
  "/:cameraId",
  verifyToken,
  async (
    req,
    res
  ) => {
    try {
      if (
        !canManage(req)
      ) {
        return res
          .status(403)
          .json({
            success: false,

            error:
              "Only government users or admins can remove cameras",
          });
      }

      const cameraId =
        String(
          req.params
            .cameraId ||
            ""
        ).trim();

      if (!cameraId) {
        return res
          .status(400)
          .json({
            success: false,

            error:
              "Camera ID is required",
          });
      }

      const result =
        await TrafficCamera.deleteOne({
          cameraId,
        });

      const edges =
        await CameraConnection.deleteMany(
          {
            $or: [
              {
                fromCameraId:
                  cameraId,
              },

              {
                toCameraId:
                  cameraId,
              },
            ],
          }
        );

      return res.json({
        success: true,

        phase: 28,

        cameraId,

        deleted:
          result.deletedCount >
          0,

        deletedConnections:
          edges.deletedCount,
      });
    } catch (error) {
      console.error(
        "Phase 28 camera removal error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          error:
            "Failed to remove camera",
        });
    }
  }
);

module.exports = router;