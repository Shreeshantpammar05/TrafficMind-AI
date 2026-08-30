require("dotenv").config();

const mongoose = require("mongoose");

const TrafficCamera =
  require("./models/TrafficCamera");

const CameraConnection =
  require("./models/CameraConnection");

async function main() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI
    );

    const cameras =
      await TrafficCamera.find({})
        .select(
          "cameraId name location city district area latitude longitude source status aiEnabled"
        )
        .sort({
          cameraId: 1,
        })
        .lean();

    const connections =
      await CameraConnection.find({
        active: true,
      })
        .select(
          "fromCameraId toCameraId distanceMeters direction bearing roadName connectionType active priority"
        )
        .sort({
          fromCameraId: 1,
          priority: -1,
          distanceMeters: 1,
        })
        .lean();

    const orphanCameras =
      cameras.filter(
        (camera) => {
          return !connections.some(
            (connection) =>
              connection.fromCameraId ===
                camera.cameraId ||
              connection.toCameraId ===
                camera.cameraId
          );
        }
      );

    const inferred =
      connections.filter(
        (connection) =>
          connection.connectionType ===
          "INFERRED"
      );

    const explicit =
      connections.filter(
        (connection) =>
          connection.connectionType !==
          "INFERRED"
      );

    console.log(
      "\n========================================"
    );

    console.log(
      "PHASE 28 — FINAL REAL CAMERA VALIDATION"
    );

    console.log(
      "========================================\n"
    );

    console.log(
      `Total cameras       : ${cameras.length}`
    );

    console.log(
      `Active connections  : ${connections.length}`
    );

    console.log(
      `Explicit connections: ${explicit.length}`
    );

    console.log(
      `Inferred connections : ${inferred.length}`
    );

    console.log(
      `Orphan cameras      : ${orphanCameras.length}`
    );

    console.log(
      "\nCameras without graph edges:"
    );

    if (
      !orphanCameras.length
    ) {
      console.log(
        "  NONE"
      );
    } else {
      for (
        const camera of
          orphanCameras
      ) {
        console.log(
          `  ${camera.cameraId} → ${camera.location}`
        );
      }
    }

    console.log(
      "\n========================================\n"
    );
  } catch (error) {
    console.error(
      "Phase 28 validation failed:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();