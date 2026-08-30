const mongoose = require("mongoose");

const trafficCameraSchema =
  new mongoose.Schema(
    {
      cameraId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },

      name: {
        type: String,
        required: true,
        trim: true,
      },

      /*
       * General display location.
       * Example:
       * "Dasarahalli, Bengaluru"
       */
      location: {
        type: String,
        required: true,
        trim: true,
      },

      /*
       * Phase 4 location hierarchy.
       */
      city: {
        type: String,
        required: true,
        trim: true,
      },

      district: {
        type: String,
        required: true,
        trim: true,
      },

      area: {
        type: String,
        required: true,
        trim: true,
      },

      latitude: {
        type: Number,
        required: true,
      },

      longitude: {
        type: Number,
        required: true,
      },

      status: {
        type: String,
        enum: [
          "active",
          "inactive",
        ],
        default: "active",
      },

      aiEnabled: {
        type: Boolean,
        default: true,
      },

      source: {
        type: String,
        required: true,
        default: "0",
        trim: true,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "TrafficCamera",
  trafficCameraSchema
);