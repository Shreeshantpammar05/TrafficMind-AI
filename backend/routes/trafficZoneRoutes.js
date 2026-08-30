const express = require("express");

const router = express.Router();

const {
  verifyToken,
} = require("../middleware/authMiddleware");

const {
  getTrafficZoneStatus,
} = require(
  "../services/trafficZoneService"
);

router.get(
  "/:zone",
  verifyToken,
  (req, res) => {
    try {
      const zone =
        req.params.zone?.trim();

      if (!zone) {
        return res.status(400).json({
          success: false,
          error:
            "Traffic zone is required",
        });
      }

      const result =
        getTrafficZoneStatus(zone);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error(
        "Traffic Zone Error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Failed to generate traffic zone status",
      });
    }
  }
);

module.exports = router;