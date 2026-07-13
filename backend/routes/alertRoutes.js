const express = require("express");
const router = express.Router();

const latestDetection =
  require("../data/latestDetection");

router.get("/latest", (req, res) => {

  res.json(
    latestDetection.latestAlert || {
      title: "No Active Alerts"
    }
  );

});

module.exports = router;