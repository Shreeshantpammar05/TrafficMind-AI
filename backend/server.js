require("dotenv").config();
const demoControlRoutes = require("./routes/demoControlRoutes");
const geocodingRoutes = require("./routes/geocodingRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Incident = require("./models/Incident");
const Notification = require("./models/Notification");
const User = require("./models/User");
const Prediction = require("./models/Prediction");
const uploadRoutes =
  require("./routes/uploadRoutes");

const signalRoutes =
  require("./routes/signalRoutes");

const app = express();
const server = http.createServer(app);

const analysisRoutes =
  require("./routes/analysisRoutes");

  const videoRoutes =
  require("./routes/videoRoutes");

  const liveUpdateRoutes =
  require("./routes/liveUpdateRoutes");

  const incidentDetectionRoutes =
  require("./routes/incidentDetectionRoutes");

  const alertRoutes =
  require("./routes/alertRoutes");

  const nearbyServicesRoutes = require("./routes/nearbyServices");

const configuredFrontendOrigins = (
  process.env.FRONTEND_URLS || process.env.FRONTEND_URL || ""
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const allowedOrigins = [
  "http://localhost:5173",
  "https://traffic-mind-ai-gamma.vercel.app",
  "https://traffic-mind-ai-git-main-shreeshantpammar-7302s-projects.vercel.app",
  ...configuredFrontendOrigins,
];

const uniqueAllowedOrigins = [...new Set(allowedOrigins)];

const io = new Server(server, {
  cors: {
    origin: uniqueAllowedOrigins,
    methods: ["GET", "POST"],
  },
});

const aiRoutes =
  require("./routes/aiRoutes");

  const routeRoutes = require("./routes/routeRoutes");


const {
  verifyToken,
  requireAdmin,
} = require("./middleware/authMiddleware");

const trafficZoneRoutes =
  require("./routes/trafficZoneRoutes");

  const trafficRecommendationRoutes =
  require("./routes/trafficRecommendationRoutes");

  const predictiveTrafficRoutes =
  require(
    "./routes/predictiveTrafficRoutes"
  );

  const trafficCameraRoutes =
  require("./routes/trafficCameraRoutes");

  const cameraDetectionRoutes =
  require("./routes/cameraDetectionRoutes");

  const aiEvaluationRoutes =
  require("./routes/aiEvaluationRoutes");

  const aiDecisionRoutes =
  require("./routes/aiDecisionRoutes");

  const aiDecisionHistoryRoutes =
  require("./routes/aiDecisionHistoryRoutes");

  const weatherRoutes =
  require("./routes/weatherRoutes");

  const citizenTrafficRoutes =
  require(
    "./routes/citizenTrafficRoutes"
  );

  const aiCameraConfigRoutes =
  require(
    "./routes/aiCameraConfigRoutes"
  );

  const emergencyPredictionRoutes =
  require("./routes/emergencyPredictionRoutes");

  const emergencyRecoveryRoutes =
  require("./routes/emergencyRecoveryRoutes");

const officerAlertRoutes =
  require("./routes/officerAlertRoutes");

const emergencyAuditRoutes =
  require("./routes/emergencyAuditRoutes");

const userRoutes =
  require("./routes/userRoutes");

  const realCameraRoutes =
  require("./routes/realCameraRoutes");

app.use(
  cors({
    origin: uniqueAllowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

app.use(
  "/api/real-camera-integration",
  realCameraRoutes
);

app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/emergency-audit",
  emergencyAuditRoutes
);

app.use(
  "/api/officer-alerts",
  officerAlertRoutes
);

app.use(
  "/api/emergency-recovery",
  emergencyRecoveryRoutes
);

app.use(
  "/api/emergency-prediction",
  emergencyPredictionRoutes
);

app.use(
  "/api/camera-connections",
  require("./routes/cameraConnections")
);

app.use(
  "/api/ai-camera-config",
  aiCameraConfigRoutes
);

app.use(
  "/api/citizen-traffic",
  citizenTrafficRoutes
);

app.use(
  "/api/routes",
  routeRoutes
);

app.use(
  "/api/weather",
  weatherRoutes
);

app.use(
  "/api/ai-decision-history",
  aiDecisionHistoryRoutes
);

app.use(
  "/api/ai-decision",
  aiDecisionRoutes
);

app.use(
  "/api/ai-evaluations",
  aiEvaluationRoutes
);

app.use(
  "/api/camera-detections",
  cameraDetectionRoutes
);

app.use(
  "/api/traffic-cameras",
  trafficCameraRoutes
);

app.use(
  "/api/traffic-recommendation",
  trafficRecommendationRoutes
);

app.use(
  "/api/predictive-traffic",
  predictiveTrafficRoutes
);

app.use(
  "/api/traffic-zone",
  trafficZoneRoutes
);

app.use("/api/routes", routeRoutes);

app.use("/api/notifications", notificationRoutes);

app.use(
  "/results",
  express.static("ai")
);

app.use(
  "/api/upload",
  uploadRoutes
);

app.use(
  "/api/ai",
  aiRoutes
);

app.use(
  "/api/video",
  videoRoutes
);

app.use(
  "/api/signal",
  signalRoutes
);

app.use(
  "/api/smart-signal",
  require("./routes/smartSignal")
);

app.use(
  "/api/emergency",
  require("./routes/emergency")
);


app.use(
  "/api/officer-alerts",
  require("./routes/officerAlertRoutes")
);


app.use(
  "/api/analysis",
  analysisRoutes
);

app.use(
  "/api/prediction",
  require("./routes/prediction")
);



app.use("/api", liveUpdateRoutes);

app.use(
  "/api/incident-detection",
  incidentDetectionRoutes
);

app.use("/api/alerts", alertRoutes);

app.use("/api", nearbyServicesRoutes);

app.use("/api/demo-control", demoControlRoutes);
app.use("/api/geocoding", geocodingRoutes);

console.log("URI exists:", !!process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI, {
  dbName: "trafficmind_ai_staging",
  family: 4,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => {
    console.log("FULL ERROR:");
    console.log(err);
  });

app.get("/", (req, res) => {
  res.send("TrafficMind AI Backend Running");
});

// Lightweight deployment check. A 503 means MongoDB is not connected.
app.get("/api/health", (req, res) => {
  const databaseState = mongoose.connection.readyState;
  const databaseConnected = databaseState === 1;

  return res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    status: databaseConnected ? "ok" : "degraded",
    database: databaseConnected ? "connected" : "disconnected",
    databaseState,
  });
});

app.get(
  "/api/government-users",
  verifyToken,
  requireAdmin,
  async (req, res) => {
  try {
    const users = await User.find({
      role: "government",
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.put(
  "/api/government-users/:id/approve",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      await User.findOneAndUpdate(
  {
    _id: req.params.id,
    role: "government",
  },
  {
    verificationStatus: "approved",
  }
);

      res.json({
        success: true,
        message: "User Approved",
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  }
);

app.put(
  "/api/government-users/:id/reject",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
     await User.findOneAndUpdate(
  {
    _id: req.params.id,
    role: "government",
  },
  {
    verificationStatus: "rejected",
  }
);

      res.json({
        success: true,
        message: "User Rejected",
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  }
);




app.post(
  "/api/incidents",
  verifyToken,
  async (req, res) => {
    try {
      const incident = new Incident(
        req.body
      );

      await incident.save();

      // Save notification
      await Notification.create({
        title: "🚨 New Incident",
        message: `${incident.incidentType} reported at ${incident.location}`,
        type: incident.severity,
        isRead: false,
      });

      // Live Socket
      io.emit(
        "newIncident",
        incident
      );

      res.status(201).json({
        success: true,
        message: "Incident Report Saved",
        incident,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

app.get(
  "/api/incidents",
  verifyToken,
  async (req, res) => {
    try {
      const incidents =
        await Incident.find()
          .sort({ createdAt: -1 });

      res.json({
        success: true,
        incidents,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

app.get(
  "/api/stats",
  verifyToken,
  async (req, res) => {
    try {
      const totalIncidents =
        await Incident.countDocuments();

      const highSeverity =
        await Incident.countDocuments({
          severity: "High",
        });

      res.json({
        success: true,
        totalIncidents,
        highSeverity,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);



app.post(
  "/api/register",
  async (req, res) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          success: false,
          message: "Registration is temporarily unavailable because the database is not connected.",
        });
      }
     const {
  name,
  email,
  password,
  role,
  governmentProof,
  governmentOfficerType,
  jurisdictionDistrict,
  jurisdictionArea,
} = req.body || {};

      const allowedRoles = [
        "citizen",
        "government",
      ];

      const allowedOfficerTypes = [
        "main_officer",
        "sub_officer",
      ];

      if (
        role &&
        role !== "citizen" &&
        role !== "government"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid registration role",
        });
      }

      if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        !name.trim() ||
        !email.trim() ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name, email and password are required",
        });
      }

      const userRole =
        role || "citizen";

      if (
        !allowedRoles.includes(
          userRole
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid registration role",
        });
      }

      /*
       * Government users must choose
       * Main Officer or Sub Officer.
       */
      if (
        userRole === "government" &&
        !allowedOfficerTypes.includes(
          governmentOfficerType
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Government officer type is required",
        });
      }

      /*
       * Citizens must not submit a
       * government officer type.
       */
      if (
        userRole === "citizen" &&
        governmentOfficerType
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Government officer type is only for government users",
        });
      }

      if (
        userRole === "government" &&
        !governmentProof?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Government ID is required",
        });
      }

      if (
  userRole === "government" &&
  !jurisdictionDistrict?.trim()
) {
  return res.status(400).json({
    success: false,
    message:
      "District is required for government officers",
  });
}

if (
  userRole === "government" &&
  governmentOfficerType ===
    "sub_officer" &&
  !jurisdictionArea?.trim()
) {
  return res.status(400).json({
    success: false,
    message:
      "Assigned area is required for Sub Officers",
  });
}

if (
  userRole === "government" &&
  governmentOfficerType ===
    "main_officer" &&
  jurisdictionArea?.trim()
) {
  return res.status(400).json({
    success: false,
    message:
      "Main Officers should not have an assigned area",
  });
}

      const normalizedEmail =
        email.trim().toLowerCase();

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
        });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message:
            "User already exists",
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

     const user =
  new User({
    name:
      name.trim(),

    email:
      normalizedEmail,

    password:
      hashedPassword,

    role:
      userRole,

    governmentProof:
      userRole === "government"
        ? governmentProof.trim()
        : "",

    governmentOfficerType:
      userRole === "government"
        ? governmentOfficerType
        : "",

    jurisdictionDistrict:
      userRole === "government"
        ? jurisdictionDistrict.trim()
        : "",

    jurisdictionArea:
      userRole === "government" &&
      governmentOfficerType ===
        "sub_officer"
        ? jurisdictionArea.trim()
        : "",

    verificationStatus:
      userRole === "government"
        ? "pending"
        : "approved",
  });

      await user.save();

      res.status(201).json({
  success: true,

  message:
    userRole === "government"
      ? "Government officer application submitted. Waiting for admin approval."
      : "User Registered Successfully",

  verificationStatus:
    user.verificationStatus,

  governmentOfficerType:
    user.governmentOfficerType,

  jurisdictionDistrict:
    user.jurisdictionDistrict,

  jurisdictionArea:
    user.jurisdictionArea,
});
    } catch (error) {
      console.error(
        "Registration Error:",
        error
      );

      if (error && error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists.",
        });
      }

      const databaseUnavailable =
        mongoose.connection.readyState !== 1;

      return res.status(databaseUnavailable ? 503 : 500).json({
        success: false,
        message: databaseUnavailable
          ? "Registration is temporarily unavailable because the database is not connected."
          : "Registration failed due to a server error. Please try again.",
      });
    }
  }
);

app.post(
  "/api/login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      const normalizedEmail =
  typeof email === "string"
    ? email.trim().toLowerCase()
    : "";

if (!normalizedEmail || typeof password !== "string" || !password) {
  return res.status(400).json({
    success: false,
    message: "Email and password are required",
  });
}

const user = await User.findOne({
  email: normalizedEmail,
});

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found",
        });
      }

      const isMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid email or password",
        });
      }

      if (
  user.role === "government" &&
  user.verificationStatus !== "approved"
) {
  return res.status(200).json({
    success: true,
    message:
      user.verificationStatus ===
      "rejected"
        ? "Government officer application was rejected."
        : "Government officer application is pending admin approval.",
    role: user.role,
    verificationStatus:
      user.verificationStatus,
    governmentOfficerType:
      user.governmentOfficerType ||
      "",
    accessGranted: false,
  });
}

   const token = jwt.sign(
  {
    userId: user._id,
    email: user.email,
    role: user.role,

    governmentOfficerType:
      user.governmentOfficerType ||
      "",

    jurisdictionDistrict:
      user.jurisdictionDistrict ||
      "",

    jurisdictionArea:
      user.jurisdictionArea ||
      "",

    verificationStatus:
      user.verificationStatus,
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "8h",
    algorithm: "HS256",
  }
);
      console.log(
        "LOGIN SUCCESS:",
        user.email,
        user.role
      );

      res.json({
  success: true,
  message: "Login Successful",
  token,
  role: user.role,
  verificationStatus:
    user.verificationStatus,

  governmentOfficerType:
    user.governmentOfficerType || "",

  jurisdictionDistrict:
    user.jurisdictionDistrict || "",

  jurisdictionArea:
    user.jurisdictionArea || "",
});


    } catch (error) {
      console.error(
        "Login Error:",
        error.message
      );

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);


app.post(
  "/api/predictions",
  verifyToken,
  async (req, res) => {
    try {
      const prediction =
        new Prediction(req.body);

      await prediction.save();

      res.status(201).json({
        success: true,
        message: "Prediction Saved",
        prediction,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

app.get(
  "/api/predictions",
  verifyToken,
  async (req, res) => {
    try {
      const predictions =
        await Prediction.find()
          .sort({ createdAt: -1 });

      res.json({
        success: true,
        predictions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);




app.get(
  "/api/map-zones",
  verifyToken,
  async (req, res) => {
    try {
      const incidents =
        await Incident.find()
          .sort({ createdAt: -1 });

      res.json({
        success: true,
        incidents,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

io.on("connection", (socket) => {
  console.log("🟢 User Connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 User Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;



server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});