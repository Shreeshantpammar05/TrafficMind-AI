const express = require("express");
const axios = require("axios");

const router = express.Router();

const {
  verifyToken,
} = require("../middleware/authMiddleware");

const ORS_API_KEY =
  process.env.ORS_API_KEY;


// =========================================================
// GEOCODING
// =========================================================

router.get(
  "/geocode",
  verifyToken,
  async (req, res) => {
    try {
      const { text } =
        req.query;

      if (
        !text ||
        !String(text).trim()
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Location text is required",
        });
      }

      if (!ORS_API_KEY) {
        return res.status(500).json({
          success: false,
          error:
            "ORS_API_KEY is not configured",
        });
      }

      const response =
        await axios.get(
          "https://api.openrouteservice.org/geocode/search",
          {
            params: {
              api_key:
                ORS_API_KEY,

              text:
                String(text).trim(),

              size: 5,
            },

            timeout: 10000,
          }
        );

      res.json({
        success: true,

        features:
          response.data.features ||
          [],
      });

    } catch (error) {
      console.error(
        "ORS Geocode Error:",
        error.response?.status,
        error.response?.data ||
          error.message
      );

      res.status(500).json({
        success: false,

        error:
          error.response?.data ||
          error.message ||
          "Geocoding failed",
      });
    }
  }
);


// =========================================================
// DRIVING DIRECTIONS
// =========================================================

router.post(
  "/directions",
  verifyToken,
  async (req, res) => {
    try {
      const {
        start,
        end,
      } = req.body;


      // ---------------------------------------------------
      // Validate coordinates
      // ---------------------------------------------------

      const isValidCoordinatePair =
        (coordinates) => {
          return (
            Array.isArray(
              coordinates
            ) &&

            coordinates.length ===
              2 &&

            coordinates.every(
              (value) =>
                typeof value ===
                  "number" &&
                Number.isFinite(
                  value
                )
            ) &&

            coordinates[0] >=
              -180 &&

            coordinates[0] <=
              180 &&

            coordinates[1] >=
              -90 &&

            coordinates[1] <=
              90
          );
        };


      if (
        !isValidCoordinatePair(
          start
        ) ||
        !isValidCoordinatePair(
          end
        )
      ) {
        return res.status(400).json({
          success: false,

          error:
            "Valid start and end coordinates are required",
        });
      }


      // ---------------------------------------------------
      // Check ORS key
      // ---------------------------------------------------

      if (!ORS_API_KEY) {
        return res.status(500).json({
          success: false,

          error:
            "ORS_API_KEY is not configured",
        });
      }


      // ---------------------------------------------------
      // OpenRouteService
      // ---------------------------------------------------

      const response =
        await axios.post(
          "https://api.openrouteservice.org/v2/directions/driving-car/json",

          {
            coordinates: [
              start,
              end,
            ],
          },

          {
            headers: {
              Authorization:
                ORS_API_KEY,

              Accept:
                "application/json",

              "Content-Type":
                "application/json",
            },

            timeout: 20000,
          }
        );


      const route =
        response.data?.routes?.[0];


      if (!route) {
        return res.status(502).json({
          success: false,

          error:
            "OpenRouteService returned no route",
        });
      }


      // ---------------------------------------------------
      // Route response
      // ---------------------------------------------------

      res.json({
        success: true,

        route: {
          summary: {
            distance:
              route.summary?.distance ??
              null,

            duration:
              route.summary?.duration ??
              null,
          },

          geometry:
            route.geometry ??
            null,
        },
      });

    } catch (error) {

      console.error(
        "ORS Directions Error:",
        error.response?.status
      );

      console.error(
        "ORS Response:",
        error.response?.data ||
          error.message
      );


      res.status(
        error.response?.status ===
          401
          ? 502
          : 500
      ).json({
        success: false,

        error:
          error.response?.data
            ?.error
            ?.message ||

          error.response?.data
            ?.message ||

          "Route generation failed",
      });
    }
  }
);


module.exports = router;