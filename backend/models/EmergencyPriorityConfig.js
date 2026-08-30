const mongoose = require("mongoose");

const EmergencyPriorityConfigSchema =
  new mongoose.Schema(
    {
      configKey: {
        type: String,
        unique: true,
        index: true,
        default: "default",
      },

      version: {
        type: Number,
        default: 1,
      },

      vehicleScores: {
        ambulance: {
          type: Number,
          default: 100,
        },

        fire_truck: {
          type: Number,
          default: 95,
        },

        police_vehicle: {
          type: Number,
          default: 90,
        },
      },

      incidentScores: {
        NONE: {
          type: Number,
          default: 10,
        },

        LOW: {
          type: Number,
          default: 35,
        },

        MEDIUM: {
          type: Number,
          default: 65,
        },

        HIGH: {
          type: Number,
          default: 85,
        },

        CRITICAL: {
          type: Number,
          default: 100,
        },
      },

      congestionBands: [
        {
          label: {
            type: String,
            required: true,
          },

          minVehicles: {
            type: Number,
            min: 0,
            default: 0,
          },

          factor: {
            type: Number,
            min: 0,
            max: 1,
            default: 1,
          },

          score: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
          },
        },
      ],

      etaBands: [
        {
          label: {
            type: String,
            required: true,
          },

          maxSeconds: {
            type: Number,
            min: 0,
            default: 0,
          },

          score: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
          },
        },
      ],

      routeDelayBands: [
        {
          label: {
            type: String,
            required: true,
          },

          maxRatio: {
            type: Number,
            min: 0,
            max: 1,
            default: 1,
          },

          score: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
          },
        },
      ],

      weights: {
        vehicle: {
          type: Number,
          min: 0,
          default: 0.20,
        },

        incident: {
          type: Number,
          min: 0,
          default: 0.25,
        },

        congestion: {
          type: Number,
          min: 0,
          default: 0.20,
        },

        routeDelay: {
          type: Number,
          min: 0,
          default: 0.20,
        },

        etaUrgency: {
          type: Number,
          min: 0,
          default: 0.15,
        },
      },

      priorityThresholds: {
        critical: {
          type: Number,
          default: 80,
        },

        high: {
          type: Number,
          default: 55,
        },

        medium: {
          type: Number,
          default: 30,
        },
      },

      vehicleSpeedsKmh: {
        ambulance: {
          type: Number,
          min: 1,
          default: 42,
        },

        fire_truck: {
          type: Number,
          min: 1,
          default: 38,
        },

        police_vehicle: {
          type: Number,
          min: 1,
          default: 45,
        },

        default: {
          type: Number,
          min: 1,
          default: 40,
        },
      },

      phase19Prediction: {
        graphWeight: {
          type: Number,
          min: 0,
          default: 0.30,
        },

        distanceWeight: {
          type: Number,
          min: 0,
          default: 0.25,
        },

        directionWeight: {
          type: Number,
          min: 0,
          default: 0.20,
        },

        trafficWeight: {
          type: Number,
          min: 0,
          default: 0.10,
        },

        confidenceWeight: {
          type: Number,
          min: 0,
          default: 0.15,
        },

        softmaxTemperature: {
          type: Number,
          min: 0.01,
          default: 0.25,
        },

        distanceScoreBands: [
          {
            maxMeters: {
              type: Number,
              min: 0,
              default: 500,
            },

            score: {
              type: Number,
              min: 0,
              max: 1,
              default: 1,
            },
          },
        ],

        shortDistanceMeters: {
          type: Number,
          min: 0,
          default: 1500,
        },

        graphPriorityReasonThreshold: {
          type: Number,
          min: 0,
          max: 100,
          default: 70,
        },

        confidenceReasonThreshold: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.8,
        },
      },

      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },

    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.models.EmergencyPriorityConfig ||
  mongoose.model(
    "EmergencyPriorityConfig",
    EmergencyPriorityConfigSchema
  );