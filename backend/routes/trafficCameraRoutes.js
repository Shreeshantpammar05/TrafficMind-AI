const express = require("express");

const router = express.Router();

const {
  verifyToken,
  requireAdmin,
  requireCameraAccess,
} = require("../middleware/authMiddleware");

const TrafficCamera =
  require("../models/TrafficCamera");

const CameraDetection =
  require("../models/CameraDetection");

const CameraDetectionHistory =
  require("../models/CameraDetectionHistory");

/*
 * Build the camera filter based on
 * the logged-in user's jurisdiction.
 */
const getCameraAccessFilter = (req) => {
  if (req.user.role === "admin") {
    return {
      status: "active",
    };
  }

  if (
    req.user.role === "government" &&
    req.user.governmentOfficerType === "main_officer"
  ) {
    return {
      status: "active",
      district: req.user.jurisdictionDistrict,
    };
  }

  if (
    req.user.role === "government" &&
    req.user.governmentOfficerType === "sub_officer"
  ) {
    return {
      status: "active",
      district: req.user.jurisdictionDistrict,
      area: req.user.jurisdictionArea,
    };
  }

  return {
    status: "active",
    _id: null,
  };
};

/*
 * Camera creation permission:
 * Admin OR approved Main Officer.
 * Sub Officer cannot create cameras.
 */
const canCreateCamera = (req) => {
  if (req.user.role === "admin") {
    return true;
  }

  return (
    req.user.role === "government" &&
    req.user.governmentOfficerType === "main_officer" &&
    req.user.verificationStatus === "approved" &&
    !!req.user.jurisdictionDistrict
  );
};

// =========================================================
// Get cameras available to this officer
// =========================================================

router.get(
  "/",
  verifyToken,
  requireCameraAccess,
  async (req, res) => {
    try {
      const filter = getCameraAccessFilter(req);

      const cameras =
        await TrafficCamera.find(filter).sort({
          createdAt: -1,
        });

      res.json({
        success: true,

        accessLevel:
          req.user.role === "admin"
            ? "admin"
            : req.user.governmentOfficerType,

        jurisdiction: {
          district:
            req.user.jurisdictionDistrict || "",

          area:
            req.user.jurisdictionArea || "",
        },

        cameras,
      });
    } catch (error) {
      console.error("Camera Fetch Error:", error);

      res.status(500).json({
        success: false,
        error:
          "Failed to fetch authorized cameras",
      });
    }
  }
);

// =========================================================
// Get cameras for a specific location
// =========================================================

router.get(
  "/location/:city/:district/:area",
  verifyToken,
  requireCameraAccess,
  async (req, res) => {
    try {
      const city =
        req.params.city?.trim();

      const district =
        req.params.district?.trim();

      const area =
        req.params.area?.trim();

      if (
        !city ||
        !district ||
        !area
      ) {
        return res.status(400).json({
          success: false,
          error:
            "City, district and area are required",
        });
      }

      /*
       * Admin can request any location.
       */
      if (
        req.user.role === "admin"
      ) {
        const cameras =
          await TrafficCamera.find({
            city,
            district,
            area,
            status: "active",
          }).sort({
            createdAt: -1,
          });

        return res.json({
          success: true,
          city,
          district,
          area,
          cameras,
        });
      }

      /*
       * Main Officer:
       * district must match.
       */
      if (
        req.user.governmentOfficerType ===
        "main_officer"
      ) {
        if (
          district !==
          req.user.jurisdictionDistrict
        ) {
          return res.status(403).json({
            success: false,
            error:
              "Camera access denied for this district",
          });
        }

        const cameras =
          await TrafficCamera.find({
            city,
            district,
            status: "active",
          }).sort({
            createdAt: -1,
          });

        return res.json({
          success: true,
          city,
          district,
          area: null,
          cameras,
        });
      }

      /*
       * Sub Officer:
       * district AND area must match.
       */
      if (
        req.user.governmentOfficerType ===
        "sub_officer"
      ) {
        if (
          district !==
            req.user.jurisdictionDistrict ||
          area !==
            req.user.jurisdictionArea
        ) {
          return res.status(403).json({
            success: false,
            error:
              "Camera access denied for this area",
          });
        }

        const cameras =
          await TrafficCamera.find({
            city,
            district,
            area,
            status: "active",
          }).sort({
            createdAt: -1,
          });

        return res.json({
          success: true,
          city,
          district,
          area,
          cameras,
        });
      }

      return res.status(403).json({
        success: false,
        error:
          "Camera access denied",
      });
    } catch (error) {
      console.error(
        "Location Camera Fetch Error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Failed to fetch authorized location cameras",
      });
    }
  }
);

// =========================================================
// Create camera - Admin + approved Main Officer
// =========================================================

router.post(
  "/",
  verifyToken,
  async (req, res) => {
    try {
      if (!canCreateCamera(req)) {
        return res.status(403).json({
          success: false,
          error:
            req.user.role === "government"
              ? "Only an approved Main Officer can add cameras"
              : "Camera creation access denied",
        });
      }

      const {
        cameraId,
        name,
        location,
        city,
        district,
        area,
        latitude,
        longitude,
        source,
        aiEnabled,
      } = req.body;

      if (
        !cameraId ||
        !name ||
        !location ||
        !city ||
        !district ||
        !area ||
        !source ||
        !Number.isFinite(
          Number(latitude)
        ) ||
        !Number.isFinite(
          Number(longitude)
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Valid camera and location details are required",
        });
      }

      const normalizedCameraId =
        cameraId.trim();

      const normalizedCity =
        city.trim();

      const normalizedDistrict =
        district.trim();

      const normalizedArea =
        area.trim();

      if (!normalizedCameraId) {
        return res.status(400).json({
          success: false,
          error:
            "Camera ID is required",
        });
      }

      /*
       * Main Officer can only create
       * inside their assigned district.
       */
      if (
        req.user.role ===
          "government" &&
        normalizedDistrict !==
          req.user.jurisdictionDistrict
      ) {
        return res.status(403).json({
          success: false,
          error:
            "Main Officer can only add cameras inside the assigned district",
        });
      }

      const existingCamera =
        await TrafficCamera.findOne({
          cameraId:
            normalizedCameraId,
        });

      if (existingCamera) {
        return res.status(400).json({
          success: false,
          error:
            "Camera ID already exists",
        });
      }

      const camera =
        await TrafficCamera.create({
          cameraId:
            normalizedCameraId,

          name:
            name.trim(),

          location:
            location.trim(),

          city:
            normalizedCity,

          district:
            normalizedDistrict,

          area:
            normalizedArea,

          latitude:
            Number(latitude),

          longitude:
            Number(longitude),

          source:
            source.trim(),

          aiEnabled:
            aiEnabled !== false,

          status:
            "active",
        });

      res.status(201).json({
        success: true,
        message:
          "Traffic camera created",
        camera,
      });
    } catch (error) {
      console.error(
        "Camera Create Error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Failed to create camera",
      });
    }
  }
);

// =========================================================
// Delete camera - Admin only
// =========================================================

router.delete(
  "/:cameraId",
  verifyToken,
  requireAdmin,
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

      const camera =
        await TrafficCamera.findOne({
          cameraId,
        });

      if (!camera) {
        return res.status(404).json({
          success: false,
          error:
            "Camera not found",
        });
      }

      await TrafficCamera.deleteOne({
        cameraId,
      });

      /*
       * Remove detection records
       * belonging to deleted camera.
       */
      await CameraDetection.deleteMany({
        cameraId,
      });

      await CameraDetectionHistory.deleteMany({
        cameraId,
      });

      res.json({
        success: true,
        message:
          "Traffic camera deleted",
        cameraId,
      });
    } catch (error) {
      console.error(
        "Camera Delete Error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Failed to delete traffic camera",
      });
    }
  }
);

module.exports = router;