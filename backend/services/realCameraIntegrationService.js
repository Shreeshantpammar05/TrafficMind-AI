const TrafficCamera =
  require("../models/TrafficCamera");

const CameraConnection =
  require("../models/CameraConnection");

const User =
  require("../models/User");

const EARTH_RADIUS_METERS = 6371000;

const AUTO_CONNECT_MAX_DISTANCE_METERS =
  2500;

const AUTO_CONNECT_MAX_CANDIDATES = 2;

const INFERRED_PRIORITY = 40;

// =========================================================
// GEO HELPERS
// =========================================================

const toRadians = (degrees) =>
  (Number(degrees) * Math.PI) / 180;

const toDegrees = (radians) =>
  (Number(radians) * 180) / Math.PI;

const haversineMeters = (
  lat1,
  lon1,
  lat2,
  lon2
) => {
  const p1 = toRadians(lat1);
  const p2 = toRadians(lat2);

  const dLat = toRadians(
    Number(lat2) - Number(lat1)
  );

  const dLon = toRadians(
    Number(lon2) - Number(lon1)
  );

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(p1) *
      Math.cos(p2) *
      Math.sin(dLon / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
};

const calculateBearing = (
  lat1,
  lon1,
  lat2,
  lon2
) => {
  const phi1 = toRadians(lat1);

  const phi2 = toRadians(lat2);

  const deltaLambda =
    toRadians(
      Number(lon2) -
        Number(lon1)
    );

  const y =
    Math.sin(deltaLambda) *
    Math.cos(phi2);

  const x =
    Math.cos(phi1) *
      Math.sin(phi2) -
    Math.sin(phi1) *
      Math.cos(phi2) *
      Math.cos(deltaLambda);

  return (
    (toDegrees(
      Math.atan2(y, x)
    ) + 360) % 360
  );
};

const bearingToDirection = (
  bearing
) => {
  if (
    !Number.isFinite(
      Number(bearing)
    )
  ) {
    return "UNKNOWN";
  }

  const directions = [
    "N",
    "NE",
    "E",
    "SE",
    "S",
    "SW",
    "W",
    "NW",
  ];

  return directions[
    Math.round(
      Number(bearing) / 45
    ) % 8
  ];
};

// =========================================================
// VALIDATION
// =========================================================

const requireNonEmpty = (
  value,
  label
) => {
  const normalized =
    String(
      value || ""
    ).trim();

  if (!normalized) {
    throw new Error(
      `${label} is required`
    );
  }

  return normalized;
};

const normalizeNumber = (
  value,
  label
) => {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    throw new Error(
      `${label} must be a valid number`
    );
  }

  return number;
};

const validateCameraInput = (
  input = {}
) => {
  const cameraId =
    requireNonEmpty(
      input.cameraId,
      "cameraId"
    );

  const name =
    requireNonEmpty(
      input.name,
      "name"
    );

  const location =
    requireNonEmpty(
      input.location,
      "location"
    );

  const city =
    requireNonEmpty(
      input.city,
      "city"
    );

  const district =
    requireNonEmpty(
      input.district,
      "district"
    );

  const area =
    requireNonEmpty(
      input.area,
      "area"
    );

  const source =
    requireNonEmpty(
      input.source,
      "source"
    );

  const latitude =
    normalizeNumber(
      input.latitude,
      "latitude"
    );

  const longitude =
    normalizeNumber(
      input.longitude,
      "longitude"
    );

  if (
    latitude < -90 ||
    latitude > 90
  ) {
    throw new Error(
      "latitude must be between -90 and 90"
    );
  }

  if (
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error(
      "longitude must be between -180 and 180"
    );
  }

  return {
    cameraId,

    name,

    location,

    city,

    district,

    area,

    latitude,

    longitude,

    source,

    aiEnabled:
      input.aiEnabled !==
      undefined
        ? Boolean(
            input.aiEnabled
          )
        : true,

    status:
      input.status ===
      "inactive"
        ? "inactive"
        : "active",
  };
};

// =========================================================
// DISCOVER NEARBY CAMERAS
// =========================================================
//
// IMPORTANT:
// These are geographic candidate relationships.
// They are NOT guaranteed road-map truth.
//
// Explicit ROAD connections remain authoritative.
// =========================================================

const discoverNearbyCandidates =
  async (camera) => {
    const allCameras =
      await TrafficCamera.find({
        status: "active",

        cameraId: {
          $ne:
            camera.cameraId,
        },

        city:
          camera.city,
      }).lean();

    return allCameras
      .filter(
        (candidate) =>
          Number.isFinite(
            candidate.latitude
          ) &&
          Number.isFinite(
            candidate.longitude
          )
      )
      .map(
        (candidate) => {
          const distanceMeters =
            haversineMeters(
              camera.latitude,
              camera.longitude,
              candidate.latitude,
              candidate.longitude
            );

          const bearing =
            calculateBearing(
              camera.latitude,
              camera.longitude,
              candidate.latitude,
              candidate.longitude
            );

          let score =
            Math.max(
              0,
              100 -
                distanceMeters /
                  40
            );

          if (
            String(
              candidate.district
            ).trim() ===
            String(
              camera.district
            ).trim()
          ) {
            score += 15;
          }

          if (
            String(
              candidate.area
            ).trim() ===
            String(
              camera.area
            ).trim()
          ) {
            score += 10;
          }

          return {
            candidate,

            distanceMeters,

            bearing,

            direction:
              bearingToDirection(
                bearing
              ),

            score,
          };
        }
      )
      .filter(
        (item) =>
          item.distanceMeters <=
          AUTO_CONNECT_MAX_DISTANCE_METERS
      )
      .sort(
        (a, b) =>
          b.score -
          a.score
      )
      .slice(
        0,
        AUTO_CONNECT_MAX_CANDIDATES
      );
  };

// =========================================================
// CREATE INFERRED CONNECTIONS
// =========================================================

const createInferredConnections =
  async (camera) => {
    const candidates =
      await discoverNearbyCandidates(
        camera
      );

    const connections = [];

    for (
      const item of candidates
    ) {
      const toCamera =
        item.candidate;

      const connection =
        await CameraConnection.findOneAndUpdate(
          {
            fromCameraId:
              camera.cameraId,

            toCameraId:
              toCamera.cameraId,
          },

          {
            $setOnInsert: {
              fromCameraId:
                camera.cameraId,

              toCameraId:
                toCamera.cameraId,

              distanceMeters:
                Math.round(
                  item.distanceMeters
                ),

              direction:
                item.direction,

              bearing:
                Number(
                  item.bearing.toFixed(
                    1
                  )
                ),

              roadName:
                "",

              connectionType:
                "INFERRED",

              active:
                true,

              priority:
                INFERRED_PRIORITY,
            },
          },

          {
            upsert: true,

            new: true,

            setDefaultsOnInsert:
              true,
          }
        );

      connections.push(
        connection
      );
    }

    return {
      candidates,

      connections,
    };
  };

// =========================================================
// JURISDICTION MAPPING
// =========================================================

const mapJurisdiction =
  async (camera) => {
    const districtOfficers =
      await User.find({
        role: "government",

        verificationStatus:
          "approved",

        jurisdictionDistrict:
          camera.district,
      })
        .select(
          "name email governmentOfficerType jurisdictionDistrict jurisdictionArea"
        )
        .lean();

    const matchingAreaOfficers =
      districtOfficers.filter(
        (officer) => {
          const area =
            String(
              officer.jurisdictionArea ||
                ""
            ).trim();

          return (
            !area ||
            area ===
              String(
                camera.area
              ).trim()
          );
        }
      );

    return {
      district:
        camera.district,

      area:
        camera.area,

      districtOfficers,

      matchingAreaOfficers,
    };
  };

// =========================================================
// REGISTER / UPDATE REAL CAMERA
// =========================================================

const registerRealCamera =
  async (input) => {
    const camera =
      validateCameraInput(
        input
      );

    const existing =
      await TrafficCamera.findOne({
        cameraId:
          camera.cameraId,
      }).lean();

    const saved =
      await TrafficCamera.findOneAndUpdate(
        {
          cameraId:
            camera.cameraId,
        },

        {
          $set:
            camera,
        },

        {
          upsert: true,

          new: true,

          setDefaultsOnInsert:
            true,
        }
      ).lean();

    // -----------------------------------------------------
    // Automatically discover nearby existing cameras
    // -----------------------------------------------------

    const autoGraph =
      await createInferredConnections(
        saved
      );

    // -----------------------------------------------------
    // Create reverse inferred candidates
    // -----------------------------------------------------
    //
    // We use $setOnInsert so an existing explicit ROAD
    // relationship is never overwritten.
    // -----------------------------------------------------

    for (
      const item of
        autoGraph.candidates
    ) {
      const existingCamera =
        item.candidate;

      const reverseBearing =
        (
          item.bearing +
          180
        ) % 360;

      await CameraConnection.findOneAndUpdate(
        {
          fromCameraId:
            existingCamera.cameraId,

          toCameraId:
            saved.cameraId,
        },

        {
          $setOnInsert: {
            fromCameraId:
              existingCamera.cameraId,

            toCameraId:
              saved.cameraId,

            distanceMeters:
              Math.round(
                item.distanceMeters
              ),

            direction:
              bearingToDirection(
                reverseBearing
              ),

            bearing:
              Number(
                reverseBearing.toFixed(
                  1
                )
              ),

            roadName:
              "",

            connectionType:
              "INFERRED",

            active:
              true,

            priority:
              INFERRED_PRIORITY,
          },
        },

        {
          upsert: true,

          setDefaultsOnInsert:
            true,
        }
      );
    }

    // -----------------------------------------------------
    // Jurisdiction discovery
    // -----------------------------------------------------

    const jurisdiction =
      await mapJurisdiction(
        saved
      );

    return {
      created:
        !existing,

      updated:
        Boolean(existing),

      camera:
        saved,

      inferredConnections:
        autoGraph.connections,

      jurisdiction,
    };
  };

module.exports = {
  registerRealCamera,

  haversineMeters,

  calculateBearing,

  bearingToDirection,
};