const express = require("express");
const axios = require("axios");

const router = express.Router();

const {
  verifyToken,
} = require("../middleware/authMiddleware");

const OPENWEATHER_API_KEY =
  process.env.OPENWEATHER_API_KEY;


// =========================================================
// GET WEATHER BY LATITUDE + LONGITUDE
// =========================================================

router.get(
  "/",
  verifyToken,
  async (req, res) => {
    try {
      const latitude =
        Number(req.query.latitude);

      const longitude =
        Number(req.query.longitude);

      // ---------------------------------------------------
      // Validate coordinates
      // ---------------------------------------------------

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Valid latitude and longitude are required",
        });
      }

      // ---------------------------------------------------
      // Check API key
      // ---------------------------------------------------

      if (!OPENWEATHER_API_KEY) {
        return res.status(500).json({
          success: false,
          error:
            "OPENWEATHER_API_KEY is not configured",
        });
      }

      // ---------------------------------------------------
      // OpenWeather request
      // ---------------------------------------------------

      const response =
        await axios.get(
          "https://api.openweathermap.org/data/2.5/weather",
          {
            params: {
              lat: latitude,
              lon: longitude,
              appid:
                OPENWEATHER_API_KEY,
              units: "metric",
            },

            timeout: 10000,
          }
        );

      const data =
        response.data;

      // ---------------------------------------------------
      // Return clean weather data
      // ---------------------------------------------------

      res.json({
        success: true,

        name:
          data.name || "",

        latitude,

        longitude,

        temperature:
          data.main?.temp ??
          null,

        feelsLike:
          data.main?.feels_like ??
          null,

        humidity:
          data.main?.humidity ??
          null,

        pressure:
          data.main?.pressure ??
          null,

        windSpeed:
          data.wind?.speed ??
          null,

        description:
          data.weather?.[0]
            ?.description ||
          "",

        condition:
          data.weather?.[0]
            ?.main ||
          "",

        icon:
          data.weather?.[0]
            ?.icon ||
          null,

        raw:
          data,
      });

    } catch (error) {
      console.error(
        "OpenWeather Error:",

        error.response?.status,

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
            ?.message ||
          "Weather service unavailable",
      });
    }
  }
);


module.exports = router;