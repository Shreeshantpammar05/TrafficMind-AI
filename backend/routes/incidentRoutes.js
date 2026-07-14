const Incident = require("../models/Incident");
const Notification = require("../models/Notification");
router.post("/", async (req, res) => {
  try {
    // Create new incident
    const incident = await Incident.create(req.body);

    // Create notification automatically
    await Notification.create({
      title: "🚨 New Incident",
      message: `${incident.incidentType} reported at ${incident.location}`,
      type: incident.severity,
      isRead: false,
    });

    res.status(201).json({
      success: true,
      incident,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create incident",
    });
  }
});