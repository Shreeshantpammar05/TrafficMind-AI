const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
  {
    location: {
      type: String,
      required: true,
    },
    incidentType: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Incident", incidentSchema);