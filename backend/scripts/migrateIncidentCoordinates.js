const mongoose = require("mongoose");
const axios = require("axios");
require("dotenv").config();

const Incident = require("../models/Incident");

const MONGO_URI = process.env.MONGO_URI;
const ORS_API_KEY = process.env.ORS_API_KEY;

// IMPORTANT:
// Keep false until the dry-run output is confirmed.
const APPLY_CHANGES = true;

// Known spelling corrections / manual coordinates.
const LOCATION_OVERRIDES = {
  benglore: {
    latitude: 12.96557,
    longitude: 77.60625,
    label: "Bangalore, Karnataka, India",
  },

  bengluru: {
    latitude: 12.96557,
    longitude: 77.60625,
    label: "Bangalore, Karnataka, India",
  },
};

// These are not ordinary locations.
// Do not invent coordinates for them.
const SKIP_LOCATIONS = new Set([
  "ai camera zone",
  "electiricty",
  "yeshvantpur",
]);

async function geocodeLocation(location) {
  try {
    const response = await axios.get(
      "https://api.openrouteservice.org/geocode/search",
      {
        params: {
          api_key: ORS_API_KEY,
          text: location,
          size: 5,

          "boundary.rect.min_lon": 77.45,
          "boundary.rect.min_lat": 12.80,
          "boundary.rect.max_lon": 77.80,
          "boundary.rect.max_lat": 13.15,
        },
      }
    );

    const features =
      response.data.features || [];

    if (features.length === 0) {
      return {
        unresolved: true,
        reason: "No result found",
      };
    }

    const reliableFeature =
      features.find(
        (feature) =>
          feature.properties?.confidence >= 0.8 &&
          feature.properties?.match_type !==
            "fallback"
      );

    if (!reliableFeature) {
      return {
        unresolved: true,
        reason:
          "No reliable Bengaluru result",
      };
    }

    return {
      unresolved: false,
      latitude:
        reliableFeature.geometry
          .coordinates[1],
      longitude:
        reliableFeature.geometry
          .coordinates[0],
      label:
        reliableFeature.properties?.label,
      confidence:
        reliableFeature.properties?.confidence,
      matchType:
        reliableFeature.properties?.match_type,
      accuracy:
        reliableFeature.properties?.accuracy,
    };
  } catch (error) {
    return {
      unresolved: true,
      reason:
        error.response?.data ||
        error.message ||
        "Geocoding failed",
    };
  }
}

async function migrate() {
  if (!MONGO_URI) {
    throw new Error(
      "MONGO_URI is not configured"
    );
  }

  if (!ORS_API_KEY) {
    throw new Error(
      "ORS_API_KEY is not configured"
    );
  }

  await mongoose.connect(MONGO_URI);

  console.log("✅ MongoDB Connected");

  const incidents =
    await Incident.find({
      $or: [
        { latitude: { $exists: false } },
        { longitude: { $exists: false } },
        { latitude: null },
        { longitude: null },
      ],
    }).sort({
      createdAt: -1,
    });

  console.log(
    `\nFound ${incidents.length} incidents without coordinates.\n`
  );

  const uniqueLocations = [
    ...new Set(
      incidents
        .map((incident) =>
          incident.location?.trim()
        )
        .filter(Boolean)
    ),
  ];

  console.log(
    `Found ${uniqueLocations.length} unique locations.\n`
  );

  const locationResults =
    new Map();

  for (const originalLocation of uniqueLocations) {
    const normalized =
      originalLocation
        .trim()
        .toLowerCase();

    if (SKIP_LOCATIONS.has(normalized)) {
      console.log(
        `⚠️ SKIP: "${originalLocation}"`
      );

      console.log(
        "   Reason: manual review / AI camera location."
      );

      locationResults.set(
        originalLocation,
        {
          unresolved: true,
        }
      );

      continue;
    }

    const manual =
      LOCATION_OVERRIDES[normalized];

    if (manual) {
      console.log(
        `✅ Manual coordinate: "${originalLocation}"`
      );

      console.log(
        `   ${manual.label}`
      );

      console.log(
        `   Coordinates: ${manual.latitude}, ${manual.longitude}`
      );

      locationResults.set(
        originalLocation,
        {
          unresolved: false,
          latitude: manual.latitude,
          longitude: manual.longitude,
          label: manual.label,
          source: "manual",
        }
      );

      continue;
    }

    console.log(
      `🔎 Geocoding: "${originalLocation}"`
    );

    const result =
      await geocodeLocation(
        originalLocation
      );

    locationResults.set(
      originalLocation,
      result
    );

    if (
      !result ||
      result.unresolved
    ) {
      console.log(
        `   ❌ Unresolved: ${
          result?.reason || "No result"
        }`
      );
    } else {
      console.log(
        `   ✅ ${result.label}`
      );

      console.log(
        `   Coordinates: ${result.latitude}, ${result.longitude}`
      );

      console.log(
        `   Confidence: ${result.confidence}`
      );

      console.log(
        `   Match: ${result.matchType}`
      );

      console.log(
        `   Accuracy: ${result.accuracy}`
      );
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 400)
    );
  }

  console.log(
    "\n=============================="
  );
  console.log(
    "MIGRATION SUMMARY"
  );
  console.log(
    "=============================="
  );

  let updatedCount = 0;
  let unresolvedCount = 0;

  for (const incident of incidents) {
    const location =
      incident.location?.trim();

    const result =
      locationResults.get(location);

    if (
      !result ||
      result.unresolved
    ) {
      unresolvedCount++;

      console.log(
        `⚠️ SKIP: ${location}`
      );

      continue;
    }

    console.log(
      `✅ ${location} → ${result.latitude}, ${result.longitude}`
    );

    if (APPLY_CHANGES) {
      await Incident.findByIdAndUpdate(
        incident._id,
        {
          latitude:
            result.latitude,
          longitude:
            result.longitude,
        }
      );

      updatedCount++;
    }
  }

  console.log(
    `\nUpdated: ${updatedCount}`
  );

  console.log(
    `Unresolved: ${unresolvedCount}`
  );

  if (!APPLY_CHANGES) {
    console.log(
      "\n🟡 DRY RUN ONLY"
    );

    console.log(
      "No database records were modified."
    );
  } else {
    console.log(
      "\n🟢 DATABASE MIGRATION COMPLETE"
    );
  }

  await mongoose.disconnect();

  console.log(
    "MongoDB connection closed."
  );
}

migrate().catch(
  async (error) => {
    console.error(
      "\n❌ Migration failed:"
    );

    console.error(error);

    try {
      await mongoose.disconnect();
    } catch {}

    process.exit(1);
  }
);