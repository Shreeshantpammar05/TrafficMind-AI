require("dotenv").config();

const mongoose = require("mongoose");

const TrafficCamera =
  require("./models/TrafficCamera");

const CameraConnection =
  require("./models/CameraConnection");

const User =
  require("./models/User");

async function run() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI
    );

    const cameras =
      await TrafficCamera.find({})
        .lean();

    const connections =
      await CameraConnection.find({
        active: true,
      }).lean();

    const officers =
      await User.find({
        role: "government",
        verificationStatus:
          "approved",
      })
        .select(
          "name email governmentOfficerType jurisdictionDistrict jurisdictionArea"
        )
        .lean();

    const cameraMap =
      new Map(
        cameras.map(
          (camera) => [
            camera.cameraId,
            camera,
          ]
        )
      );

    const outgoing =
      new Map();

    const incoming =
      new Map();

    for (const connection of connections) {
      if (!outgoing.has(connection.fromCameraId)) {
        outgoing.set(
          connection.fromCameraId,
          []
        );
      }

      if (!incoming.has(connection.toCameraId)) {
        incoming.set(
          connection.toCameraId,
          []
        );
      }

      outgoing.get(
        connection.fromCameraId
      ).push(connection);

      incoming.get(
        connection.toCameraId
      ).push(connection);
    }

    console.log(
      "\n========================================"
    );
    console.log(
      "PHASE 28 - REAL LOCATION VALIDATION"
    );
    console.log(
      "========================================\n"
    );

    console.log(
      `Cameras: ${cameras.length}`
    );

    console.log(
      `Active road connections: ${connections.length}`
    );

    console.log(
      `Approved officers: ${officers.length}`
    );

    console.log(
      "\n--------------- CAMERAS ---------------\n"
    );

    for (const camera of cameras) {
      const outgoingCount =
        outgoing.get(
          camera.cameraId
        )?.length || 0;

      const incomingCount =
        incoming.get(
          camera.cameraId
        )?.length || 0;

      const coordinateValid =
        Number.isFinite(
          camera.latitude
        ) &&
        Number.isFinite(
          camera.longitude
        );

      const sourceValid =
        typeof camera.source ===
          "string" &&
        camera.source.trim()
          .length > 0;

      const orphan =
        outgoingCount === 0 &&
        incomingCount === 0;

      console.log(
        `${camera.cameraId}`
      );

      console.log(
        `  Location : ${camera.location}`
      );

      console.log(
        `  Coordinates : ${
          coordinateValid
            ? "OK"
            : "MISSING"
        }`
      );

      console.log(
        `  Source : ${
          sourceValid
            ? "OK"
            : "MISSING"
        }`
      );

      console.log(
        `  Incoming : ${incomingCount}`
      );

      console.log(
        `  Outgoing : ${outgoingCount}`
      );

      console.log(
        `  Network : ${
          orphan
            ? "ORPHAN"
            : "CONNECTED"
        }`
      );

      console.log("");
    }

    console.log(
      "\n----------- ROAD GRAPH -----------\n"
    );

    for (const connection of connections) {
      const from =
        cameraMap.get(
          connection.fromCameraId
        );

      const to =
        cameraMap.get(
          connection.toCameraId
        );

      console.log(
        `${connection.fromCameraId} → ${connection.toCameraId}`
      );

      console.log(
        `  Road : ${
          connection.roadName ||
          "Unnamed"
        }`
      );

      console.log(
        `  Distance : ${
          connection.distanceMeters
        } m`
      );

      console.log(
        `  Direction : ${
          connection.direction
        }`
      );

      console.log(
        `  Bearing : ${
          connection.bearing
        }`
      );

      console.log(
        `  Priority : ${
          connection.priority
        }`
      );

      console.log(
        `  Cameras valid : ${
          from && to
            ? "YES"
            : "NO"
        }`
      );

      console.log("");
    }

    console.log(
      "\n--------- JURISDICTION ---------\n"
    );

    for (const officer of officers) {
      console.log(
        `${officer.name}`
      );

      console.log(
        `  Type : ${
          officer.governmentOfficerType
        }`
      );

      console.log(
        `  District : ${
          officer.jurisdictionDistrict ||
          "UNASSIGNED"
        }`
      );

      console.log(
        `  Area : ${
          officer.jurisdictionArea ||
          "UNASSIGNED"
        }`
      );

      console.log("");
    }

    console.log(
      "========================================\n"
    );
  } catch (error) {
    console.error(
      "Phase 28 validation failed:",
      error.message
    );
  } finally {
    await mongoose.disconnect();
  }
}

run();