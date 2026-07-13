const express = require("express");
const axios = require("axios");

const router = express.Router();

router.post("/nearby-services", async (req, res) => {
  try {
    const { latitude, longitude, emergencyTypeTag } = req.body;

    const overpassQuery = `
[out:json];
node
  ["amenity"="${emergencyTypeTag}"]
  (around:5000,${latitude},${longitude});
out;
`;

    const response = await axios.post(
      "https://overpass-api.de/api/interpreter",
      overpassQuery,
      {
        headers: {
          "Content-Type": "text/plain",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch nearby services",
    });
  }
});

module.exports = router;