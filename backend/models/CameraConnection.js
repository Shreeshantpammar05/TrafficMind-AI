const mongoose = require("mongoose");

const cameraConnectionSchema = new mongoose.Schema(
  {
    fromCameraId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    toCameraId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    distanceMeters: {
      type: Number,
      required: true,
      min: 0,
    },

    direction: {
      type: String,
      enum: [
        "N",
        "NE",
        "E",
        "SE",
        "S",
        "SW",
        "W",
        "NW",
        "UNKNOWN",
      ],
      default: "UNKNOWN",
    },

    bearing: {
      type: Number,
      min: 0,
      max: 360,
      default: null,
    },

    roadName: {
      type: String,
      trim: true,
      default: "",
    },

    connectionType: {
      type: String,
      enum: [
        "ROAD",
        "MANUAL",
        "INFERRED",
      ],
      default: "MANUAL",
    },

    active: {
      type: Boolean,
      default: true,
    },

    priority: {
      type: Number,
      min: 1,
      max: 100,
      default: 50,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Prevent duplicate directional connections.
 */
cameraConnectionSchema.index(
  {
    fromCameraId: 1,
    toCameraId: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "CameraConnection",
  cameraConnectionSchema
);