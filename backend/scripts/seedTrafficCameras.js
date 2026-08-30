const mongoose = require("mongoose");
require("dotenv").config();

const TrafficCamera =
  require("../models/TrafficCamera");

const cameras = [
  {
    cameraId: "CAM-001",
    name: "MG Road Camera",
    location: "MG Road",

    city: "Bengaluru",
    district: "Bengaluru Urban",
    area: "MG Road",

    latitude: 12.9756,
    longitude: 77.6067,

    source: "0",

    status: "active",
    aiEnabled: true,
  },

  {
    cameraId: "CAM-002",
    name: "Hebbal Camera",
    location: "Hebbal",

    city: "Bengaluru",
    district: "Bengaluru Urban",
    area: "Hebbal",

    latitude: 13.0358,
    longitude: 77.597,

    source:
      "frontend/public/videos/camera2.mp4",

    status: "active",
    aiEnabled: true,
  },

  {
    cameraId: "CAM-003",
    name: "Whitefield Camera",
    location: "Whitefield",

    city: "Bengaluru",
    district: "Bengaluru Urban",
    area: "Whitefield",

    latitude: 12.9698,
    longitude: 77.7499,

    source:
      "frontend/public/videos/camera3.mp4",

    status: "active",
    aiEnabled: true,
  },

  {
    cameraId: "CAM-004",
    name: "Electronic City Camera",
    location: "Electronic City",

    city: "Bengaluru",
    district: "Bengaluru Urban",
    area: "Electronic City",

    latitude: 12.8456,
    longitude: 77.6603,

    source:
      "frontend/public/videos/camera4.mp4",

    status: "active",
    aiEnabled: true,
  },
];

async function seedCameras() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "✅ MongoDB Connected"
    );

    for (const camera of cameras) {
      const updatedCamera =
        await TrafficCamera.findOneAndUpdate(
          {
            cameraId:
              camera.cameraId,
          },
          camera,
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );

      console.log(
        `✅ ${updatedCamera.cameraId} → ${updatedCamera.city} / ${updatedCamera.district} / ${updatedCamera.area}`
      );
    }

    console.log(
      "✅ Traffic cameras seeded with location hierarchy"
    );

    await mongoose.disconnect();

    console.log(
      "MongoDB connection closed"
    );
  } catch (error) {
    console.error(
      "❌ Camera seed failed:",
      error
    );

    process.exit(1);
  }
}

seedCameras();