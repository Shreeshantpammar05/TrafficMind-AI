const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Incident = require("./models/Incident");
const { PythonShell } = require("python-shell");
const path = require("path");
const User = require("./models/User");
const Prediction = require("./models/Prediction");
const uploadRoutes =
  require("./routes/uploadRoutes");
require("dotenv").config();

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

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const aiRoutes =
  require("./routes/aiRoutes");

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

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
  "/api/analysis",
  analysisRoutes
);

app.use(
  "/api/accident",
  require("./routes/accident")
);

app.use(
  "/api/prediction",
  require("./routes/prediction")
);

app.use(
  "/api/heatmap",
  require("./routes/heatmap")
);

app.use("/api", liveUpdateRoutes);

app.use(
  "/api/incident-detection",
  incidentDetectionRoutes
);

app.use("/api/alerts", alertRoutes);

console.log("URI exists:", !!process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
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

app.get("/api/government-users", async (req, res) => {
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
  async (req, res) => {
    try {
      await User.findByIdAndUpdate(
        req.params.id,
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
  async (req, res) => {
    try {
      await User.findByIdAndUpdate(
        req.params.id,
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

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "TrafficMind AI Backend Working",
  });
});


app.post("/api/incidents", async (req, res) => {
  try {
    const incident = new Incident(req.body);

    await incident.save();
    io.emit("newIncident", incident);

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
});

app.get("/api/incidents", async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ createdAt: -1 });

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
});

app.get("/api/stats", async (req, res) => {
  try {
    const totalIncidents = await Incident.countDocuments();

    const highSeverity = await Incident.countDocuments({
      severity: "High",
    });

    res.json({
      totalIncidents,
      highSeverity,
      aiPredictions: 32,
      congestedAreas: 9,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

let liveData = {
  vehicleCount: 0,
  congestion: "LOW",
  recommendation: "Traffic Flow Normal",
};

app.post("/api/live-update", (req, res) => {
  liveData = req.body;

  res.json({
    success: true,
  });
});

app.get("/api/live-status", (req, res) => {
  res.json(liveData);
});


app.post("/api/register", async (req, res) => {
  try {
    const {
  name,
  email,
  password,
  role,
  governmentProof,
} = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
  name,
  email,
  password: hashedPassword,
  role,
  governmentProof,
});

    await user.save();

    res.status(201).json({
      message: "User Registered Successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid Password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      "trafficmind_secret_key",
      {
        expiresIn: "7d",
      }
    );

    console.log("LOGIN USER:", user);

    res.json({
  message: "Login Successful",
  token,
  role: user.role,
  verificationStatus:
    user.verificationStatus,
});
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});


app.post("/api/predictions", async (req, res) => {
  try {
    const prediction = new Prediction(req.body);

    await prediction.save();

    res.status(201).json({
      success: true,
      message: "Prediction Saved",
      prediction,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});




app.get("/api/predictions", async (req, res) => {
  try {
    const predictions = await Prediction.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      predictions,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});


app.post("/api/ai-predict", async (req, res) => {
  try {
    const { vehicles, time, weather } = req.body;

    const options = {
      args: [
        vehicles,
        time,
        weather,
      ],
    };

    PythonShell.run(
      path.join(__dirname, "ml", "predict.py"),
      options
    )
      .then((results) => {
        res.json({
          success: true,
          risk: results[0],
        });
      })
      .catch((err) => {
        console.log(err);

        res.status(500).json({
          success: false,
          error: err.message,
        });
      });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.get("/api/map-zones", async (req, res) => {
  try {
    const incidents = await Incident.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      incidents,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

let vehicles = [
  {
    id: 1,
    lat: 12.9716,
    lng: 77.5946,
  },
  {
    id: 2,
    lat: 12.9780,
    lng: 77.6100,
  },
];

let ambulance = {
  id: 1,
  lat: 12.9820,
  lng: 77.6200,
};

io.on("connection", (socket) => {
  console.log("🟢 User Connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 User Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

setInterval(() => {

  vehicles = vehicles.map(
    (vehicle) => ({
      ...vehicle,
      lat:
        vehicle.lat +
        (Math.random() - 0.5) *
          0.001,

      lng:
        vehicle.lng +
        (Math.random() - 0.5) *
          0.001,
    })
  );

  ambulance = {
    ...ambulance,
    lat:
      ambulance.lat +
      (Math.random() - 0.5) *
        0.001,

    lng:
      ambulance.lng +
      (Math.random() - 0.5) *
        0.001,
  };

  io.emit(
    "digitalTwinUpdate",
    {
      vehicles,
      ambulance,
    }
  );

}, 3000);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});