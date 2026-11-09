
const express = require("express");

const router = express.Router();
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const MIN_REQUEST_INTERVAL_MS = 1100;

let lastNominatimRequestAt = 0;
let requestQueue = Promise.resolve();

const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function queueNominatimRequest(path, params) {
  const run = async () => {
    const remainingWait = Math.max(
      0,
      MIN_REQUEST_INTERVAL_MS - (Date.now() - lastNominatimRequestAt)
    );

    if (remainingWait > 0) {
      await wait(remainingWait);
    }

    lastNominatimRequestAt = Date.now();

    const url = new URL(path, NOMINATIM_BASE);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    const contact = process.env.NOMINATIM_CONTACT_EMAIL;
    const userAgent = contact
      ? `TrafficMindAI/1.0 (${contact})`
      : "TrafficMindAI/1.0";

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": userAgent,
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const error = new Error(`Geocoding provider returned HTTP ${response.status}.`);
      error.status = response.status === 429 ? 503 : 502;
      throw error;
    }

    return response.json();
  };

  const task = requestQueue.then(run, run);
  requestQueue = task.then(
    () => undefined,
    () => undefined
  );
  return task;
}

router.get("/reverse", async (req, res) => {
  const latitude = Number(req.query.lat);
  const longitude = Number(req.query.lon);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return res.status(400).json({
      error: "Valid latitude and longitude are required.",
    });
  }

  try {
    const data = await queueNominatimRequest("/reverse", {
      lat: latitude,
      lon: longitude,
      format: "jsonv2",
    });
    return res.json(data);
  } catch (error) {
    console.error("Reverse geocoding proxy error:", error.message);
    return res.status(error.status || 502).json({
      error: "Reverse geocoding is temporarily unavailable.",
    });
  }
});

router.get("/search", async (req, res) => {
  const query = String(req.query.q || "").trim();
  const requestedLimit = Number.parseInt(req.query.limit || "5", 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 5)
    : 5;

  if (query.length < 2 || query.length > 200) {
    return res.status(400).json({
      error: "Search query must contain between 2 and 200 characters.",
    });
  }

  try {
    const data = await queueNominatimRequest("/search", {
      q: query,
      format: "jsonv2",
      limit,
      addressdetails: 1,
    });
    return res.json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Location search proxy error:", error.message);
    return res.status(error.status || 502).json({
      error: "Location search is temporarily unavailable.",
    });
  }
});

module.exports = router;
