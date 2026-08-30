const express = require("express");

const router = express.Router();

const latestDetection =
  require("../data/latestDetection");

const {
  verifyToken,
} = require("../middleware/authMiddleware");

router.get(
  "/latest",
  verifyToken,
  (req, res) => {
    res.json(
      latestDetection.latestAlert || {
        title: "No Active Alerts",
      }
    );
  }
);

module.exports = router;