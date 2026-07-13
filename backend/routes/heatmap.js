const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {

  const locations = [
    {
      name: "North Junction",
      congestion: "HIGH"
    },
    {
      name: "South Junction",
      congestion: "MEDIUM"
    },
    {
      name: "East Junction",
      congestion: "LOW"
    },
    {
      name: "West Junction",
      congestion: "HIGH"
    }
  ];

  res.json(locations);

});

module.exports = router;