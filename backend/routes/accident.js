const express = require("express");
const router = express.Router();

router.get("/status", (req, res) => {

  const accidentDetected =
    Math.random() > 0.8;

  res.json({
    accidentDetected,
    alert: accidentDetected
      ? "ACCIDENT DETECTED"
      : "NO ACCIDENT"
  });

});

module.exports = router;