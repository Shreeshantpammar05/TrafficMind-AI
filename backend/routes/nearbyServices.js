const express = require("express");
const axios = require("axios");

const router = express.Router();

const {
  verifyToken,
} = require("../middleware/authMiddleware");

const ALLOWED_EMERGENCY_TYPES = [
  "hospital",
  "police",
  "fire_station",
];

router.post(
  "/nearby-services",
  verifyToken,
  async (req, res) => {
    try {
      const {
        latitude,
        longitude,
        emergencyTypeTag,
      } = req.body;

      const lat = Number(latitude);
      const lon = Number(longitude);

      if (
        !Number.isFinite(lat) ||
        lat < -90 ||
        lat > 90
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid latitude is required",
        });
      }

      if (
        !Number.isFinite(lon) ||
        lon < -180 ||
        lon > 180
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid longitude is required",
        });
      }

      if (
        !ALLOWED_EMERGENCY_TYPES.includes(
          emergencyTypeTag
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid emergency service type",
        });
      }

      const overpassQuery = `
[out:json];
node
  ["amenity"="${emergencyTypeTag}"]
  (around:5000,${lat},${lon});
out;
`;

      const response = await axios.post(
        "https://overpass.kumi.systems/api/interpreter",
        overpassQuery,
        {
          timeout: 15000,
          headers: {
            "Content-Type": "text/plain",
          },
        }
      );

      res.json({
        success: true,
        elements:
          response.data.elements || [],
      });
    } catch (error) {
      console.error(
        "Nearby Services Error:",
        error.response?.data ||
          error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch nearby services",
      });
    }
  }
);

module.exports = router;