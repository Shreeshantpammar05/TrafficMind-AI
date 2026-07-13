
import MainLayout from "../layouts/MainLayout";
import AICommandCenter from "./AICommandCenter";
import WeatherWidget from "./WeatherWidget";
import socket from "../socket";


import RouteRecommendation from "./RouteRecommendation";

import TrafficMap from "./TrafficMap";

import TrafficChart from "./TrafficChart";
import IncidentForm from "./IncidentForm";

import { useEffect, useState } from "react";
import axios from "axios";

import "./Dashboard.css";

import {
  FaCar,
  FaExclamationTriangle,
  FaRoad,
  FaRobot,
} from "react-icons/fa";

function Dashboard() {
  const [stats, setStats] = useState({
    totalIncidents: 0,
    highSeverity: 0,
    aiPredictions: 32,
    congestedAreas: 9,
  });

  const [aiStatus, setAiStatus] = useState({
  vehicleCount: 0,
  congestion: "LOW",
  recommendation: "Waiting...",
});

const [trafficControl, setTrafficControl] =
  useState({
    signalTime: 0,
    priorityLane: "N/A",
  });

const [emergencyStatus, setEmergencyStatus] =
  useState({
    emergencyDetected: false,
    priority: "NORMAL TRAFFIC FLOW",
  });

  const [incidentStatus, setIncidentStatus] =
  useState({
    incidentDetected: false,
    alert: "NO INCIDENT DETECTED",
  });

  const [latestAlert, setLatestAlert] =
  useState({
    title: "No Active Alerts",
  });

  const [systemHealth, setSystemHealth] =
  useState({
    aiVision: "ONLINE",
    smartSignal: "ONLINE",
    multiLane: "ONLINE",
    backend: "ONLINE",
  });


  const fetchStats = async () => {
    try {
      const res = await axios.get(
        "https://trafficmind-ai.onrender.com/api/stats"
      );

      setStats(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchAIStatus = async () => {
  try {
    const res = await axios.get(
      "https://trafficmind-ai.onrender.com/api/signal/status"
    );

    setAiStatus(res.data);

  } catch (error) {
    console.log(error);
  }
};

const fetchTrafficControl = async () => {
  try {
    const signalRes = await axios.get(
      "https://trafficmind-ai.onrender.com/api/signal/status"
    );

    const laneRes = await axios.get(
      "https://trafficmind-ai.onrender.com/api/smart-signal/multi-lane"
    );

    setTrafficControl({
      signalTime: signalRes.data.signalTime,
      priorityLane: laneRes.data.priorityLane,
    });

  } catch (error) {
    console.log(error);
  }
};

const fetchEmergencyStatus = async () => {
  try {
    const res = await axios.get(
      "https://trafficmind-ai.onrender.com/api/emergency/status"
    );

    setEmergencyStatus(res.data);

  } catch (error) {
    console.log(error);
  }
};

const fetchIncidentStatus = async () => {
  try {
    const res = await axios.get(
      "https://trafficmind-ai.onrender.com/api/incident-detection/status"
    );

    setIncidentStatus(res.data);

  } catch (error) {
    console.log(error);
  }
};

const fetchLatestAlert = async () => {
  try {
    const res = await axios.get(
      "https://trafficmind-ai.onrender.com/api/alerts/latest"
    );

    setLatestAlert(res.data);

  } catch (error) {
    console.log(error);
  }
};

  useEffect(() => {
 fetchStats();
fetchAIStatus();
fetchTrafficControl();
fetchEmergencyStatus();
fetchIncidentStatus();
fetchLatestAlert();

  const interval = setInterval(() => {
  fetchAIStatus();
  fetchTrafficControl();
  fetchEmergencyStatus();
  fetchIncidentStatus();
  fetchLatestAlert();
}, 5000);

  socket.on("newIncident", () => {
    fetchStats();
  });

 return () => {
  clearInterval(interval);
  socket.off("newIncident");
};
}, []);

  const cards = [
  {
    title: "Traffic Reports",
    value: stats.totalIncidents,
    icon: <FaCar size={30} />,
  },
  {
    title: "Active Incidents",
    value: stats.highSeverity,
    icon: <FaExclamationTriangle size={30} />,
  },
  {
    title: "Live Vehicles",
    value: aiStatus.vehicleCount,
    icon: <FaRoad size={30} />,
  },
  {
    title: "AI Predictions",
    value: stats.aiPredictions,
    icon: <FaRobot size={30} />,
  },
];

  return (
    <MainLayout>

      

      
        

        <div
          className="dashboard"
          style={{
            flex: 1,
          }}
        >
          {/* Hero Header */}

<div
  className="hero-header"
  style={{
    background:
      "linear-gradient(135deg,#1E3A8A,#2563EB,#38BDF8)",
   borderRadius: "18px",
    padding: "24px 30px",
    marginBottom: "30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#fff",
    boxShadow: "0 10px 30px rgba(37,99,235,.35)",
  }}
>
  <div>
    <h1
      style={{
        margin: 0,
        fontSize: "34px",
        fontWeight: "800",
      }}
    >
      👋 Welcome Back
    </h1>

    <h2
      style={{
        marginTop: "6px",
        marginBottom: "6px",
        fontWeight: "700",
        fontSize: "24px",
      }}
    >
      
    </h2>

    <p
      style={{
        color: "#E2E8F0",
        fontSize: "15px",
        lineHeight: "1.6",
        maxWidth: "500px",
      }}
    >
      Monitor live traffic, emergency operations, AI surveillance,
      and smart city analytics from one centralized dashboard.
    </p>
  </div>

  <div
    style={{
      background: "rgba(255,255,255,.15)",
      padding: "14px 18px",
      borderRadius: "18px",
      textAlign: "center",
      backdropFilter: "blur(10px)",
    }}
  >
    <h3
      style={{
        margin: 0,
        fontSize: "16px",
      }}
    >
      🟢 AI Status
    </h3>

    <h2
      style={{
        margin: "6px 0",
      }}
    >
      ONLINE
    </h2>

    <p
      style={{
        margin: 0,
        color: "#E2E8F0",
      }}
    >
      Live Monitoring Active
    </p>
  </div>
</div>







{/* KPI Cards */}

<div className="cards">
  {cards.map((card, index) => (
    <div
  className="card"
  key={index}
  style={{
    background:
      "linear-gradient(145deg,#0F172A,#1E293B)",
    border: "1px solid rgba(255,255,255,0.08)",
   borderRadius: "18px",
    padding: "25px",
    minHeight: "190px",
    transition: "all .3s ease",
    cursor: "pointer",
    boxShadow:
      "0 10px 25px rgba(0,0,0,.25)",
  }}
>
      <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
  <h3
    style={{
      color: "#94a3b8",
      fontSize: "14px",
      fontWeight: "600",
    }}
  >
    {card.title}
  </h3>

  <div
  style={{
    width: "60px",
    height: "60px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg,#2563EB,#38BDF8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#fff",
    fontSize: "24px",
    boxShadow:
      "0 8px 20px rgba(59,130,246,.35)",
  }}
>
  {card.icon}
</div>
</div>

      <>
 <h1
  style={{
    fontSize: "42px",
    fontWeight: "800",
    margin: "18px 0 8px",
    color: "#FFFFFF",
  }}
>
  {card.value}
</h1>

 <>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      marginTop: "12px",
      fontSize: "13px",
      color: "#94A3B8",
    }}
  >
    <span>Live Data</span>

    <span
      style={{
        color: "#22C55E",
        fontWeight: "700",
      }}
    >
      ● Online
    </span>
  </div>

  <div
    style={{
      marginTop: "14px",
      height: "6px",
      background: "#1E293B",
      borderRadius: "20px",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        width: "80%",
        height: "100%",
        background:
          "linear-gradient(90deg,#22C55E,#4ADE80)",
        borderRadius: "20px",
      }}
    />
  </div>
</>
</>
    </div>
  ))}
</div>

<div
  className="section-card"
  style={{
    marginBottom: "20px",
  }}
>
  <h2
    style={{
      marginBottom: "20px",
    }}
  >
    Operations Status
  </h2>

 <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: "20px",
    marginTop: "20px",
  }}
>
   <div
  style={{
    background: "#0F172A",
    borderRadius: "18px",
    padding: "20px",
    border: "1px solid rgba(255,255,255,.08)",
  }}
>
  <h4 style={{ color: "#94A3B8" }}>
    🚦 Signal Time
  </h4>

  <h2 style={{ margin: "12px 0" }}>
    {trafficControl.signalTime}s
  </h2>

  <span style={{ color: "#22C55E" }}>
    Live Update
  </span>
</div>

   <div
  style={{
    background: "#0F172A",
    borderRadius: "18px",
    padding: "20px",
    border: "1px solid rgba(255,255,255,.08)",
  }}
>
  <h4 style={{ color: "#94A3B8" }}>
    🚗 Priority Lane
  </h4>

  <h2 style={{ margin: "12px 0" }}>
    {trafficControl.priorityLane}
  </h2>

  <span style={{ color: "#3B82F6" }}>
    AI Controlled
  </span>
</div>

   <div
  style={{
    background: "#0F172A",
    borderRadius: "18px",
    padding: "20px",
    border: "1px solid rgba(255,255,255,.08)",
  }}
>
  <h4 style={{ color: "#94A3B8" }}>
    🚥 Congestion
  </h4>

  <h2 style={{ margin: "12px 0" }}>
    {aiStatus.congestion}
  </h2>

  <span style={{ color: "#F59E0B" }}>
    AI Analysis
  </span>
</div>

    <div
  style={{
    background: "#0F172A",
    borderRadius: "18px",
    padding: "20px",
    border: "1px solid rgba(255,255,255,.08)",
  }}
>
  <h4 style={{ color: "#94A3B8" }}>
    🚑 Emergency
  </h4>

  <h2 style={{ margin: "12px 0" }}>
    {emergencyStatus.emergencyDetected
      ? "ACTIVE"
      : "NORMAL"}
  </h2>

  <span
    style={{
      color: emergencyStatus.emergencyDetected
        ? "#EF4444"
        : "#22C55E",
    }}
  >
    {emergencyStatus.emergencyDetected
      ? "Response Running"
      : "No Emergency"}
  </span>
</div>
  </div>
</div>

<div
  className="control-room"
  style={{
    display: "grid",
    gridTemplateColumns: "1fr 380px",
    gap: "25px",
    marginTop: "30px",
    marginBottom: "30px",
  }}
>
  <div
    style={{
      background: "#111827",
      borderRadius: "20px",
      padding: "25px",
      border: "1px solid rgba(255,255,255,.08)",
    }}
  >
    <h2
      style={{
        marginTop: 0,
        marginBottom: "20px",
      }}
    >
      🤖 AI Command Center
    </h2>

    <AICommandCenter
      totalIncidents={stats.totalIncidents}
      highSeverity={stats.highSeverity}
    />
  </div>

 <div
  className="alert-panel"
  style={{
    background: "#111827",
    borderRadius: "20px",
    padding: "25px",
    border: "1px solid rgba(255,255,255,.08)",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  }}
>

  <h2
  style={{
    margin: 0,
    marginBottom: "10px",
  }}
>
🚨 Operations Center
</h2>

    <div className="alert-stats">

  <div className="alert-item">
    <h3>🚨 Active Incidents</h3>
    <h2>{stats.highSeverity}</h2>
  </div>

  <div className="alert-item">
    <h3>🚦 Congestion</h3>
    <h2>{aiStatus.congestion}</h2>
  </div>

  <div className="alert-item">
    <h3>🚗 Vehicles</h3>
    <h2>{aiStatus.vehicleCount}</h2>
  </div>

  <div className="alert-item">
    <h3>🤖 AI Status</h3>
    <h2>ACTIVE</h2>
  </div>

</div>

<div
  style={{
    background: "#0F172A",
    padding: "18px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,.08)",
  }}
>
  <h4
    style={{
      margin: 0,
      marginBottom: "10px",
      color: "#ffffff",
    }}
  >
    Latest Alert
  </h4>

  <p
    style={{
      margin: 0,
      color: "#94a3b8",
    }}
  >
    {latestAlert.title}
  </p>
</div>

  </div>

</div>


{/* Live Traffic Map */}

<div className="full-width">
  <div className="section-card">
   <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  }}
>
  <div>
    <h2
      style={{
        margin: 0,
        fontSize: "28px",
        fontWeight: "700",
      }}
    >
      🌍 Live Traffic Network
    </h2>

    <p
      style={{
        color: "#94A3B8",
        marginTop: "6px",
      }}
    >
      Real-time Smart City Monitoring
    </p>
  </div>

  <div
    style={{
      display: "flex",
      gap: "12px",
    }}
  >
    <div className="status-pill">
      🚗 {aiStatus.vehicleCount}
    </div>

    <div className="status-pill">
      🚨 {stats.highSeverity}
    </div>

    <div className="status-pill">
      🚦 {trafficControl.signalTime}s
    </div>
  </div>
</div>
    <div
  style={{
    background: "#0F172A",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px",
    overflow: "hidden",
  }}
>
  {/* Map Toolbar */}

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "15px 20px",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      background: "#111827",
    }}
  >
    <div
      style={{
        display: "flex",
        gap: "10px",
      }}
    >
      <div className="status-pill">
        🟢 Live
      </div>

      <div className="status-pill">
        🚗 Vehicles
      </div>

      <div className="status-pill">
        🚦 Signals
      </div>

      <div className="status-pill">
        🚨 Incidents
      </div>
    </div>

    <div
      style={{
        color: "#94A3B8",
        fontSize: "14px",
      }}
    >
      Updated just now
    </div>
  </div>

  <TrafficMap />
</div>
  </div>
</div>





{/* Analytics */}

<div className="dashboard-grid">

  <div className="section-card">
  <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  }}
>
  <div>
    <h2
      style={{
        margin: 0,
        fontSize: "28px",
        fontWeight: "700",
      }}
    >
      📊 Traffic Analytics
    </h2>

    <p
      style={{
        marginTop: "6px",
        color: "#94A3B8",
      }}
    >
      Live traffic trends and congestion insights
    </p>
  </div>

  <div
    style={{
      display: "flex",
      gap: "10px",
    }}
  >
    <button
      style={{
        background: "#2563EB",
        color: "white",
        border: "none",
        padding: "8px 16px",
        borderRadius: "10px",
        cursor: "pointer",
      }}
    >
      Today
    </button>

    <button
      style={{
        background: "#1E293B",
        color: "#94A3B8",
        border: "1px solid rgba(255,255,255,.08)",
        padding: "8px 16px",
        borderRadius: "10px",
        cursor: "pointer",
      }}
    >
      Week
    </button>

    <button
      style={{
        background: "#1E293B",
        color: "#94A3B8",
        border: "1px solid rgba(255,255,255,.08)",
        padding: "8px 16px",
        borderRadius: "10px",
        cursor: "pointer",
      }}
    >
      Month
    </button>
  </div>
</div>

<div
  style={{
    background: "#0F172A",
    borderRadius: "18px",
    padding: "20px",
    border: "1px solid rgba(255,255,255,.08)",
  }}
>
  <TrafficChart />
</div>
  </div>
</div>





{incidentStatus.incidentDetected && (
  <div
    style={{
      background: "#dc2626",
      color: "white",
      padding: "20px",
      borderRadius: "15px",
      marginTop: "20px",
      marginBottom: "20px",
      fontWeight: "bold",
      fontSize: "20px",
      textAlign: "center",
    }}
  >
    🚨 POSSIBLE TRAFFIC INCIDENT DETECTED
  </div>
)}


{latestAlert.title !==
  "No Active Alerts" && (
  <div
    style={{
      background: "rgba(239,68,68,0.12)",
      border: "1px solid rgba(239,68,68,0.3)",
      color: "#ffffff",
      padding: "20px",
      borderRadius: "15px",
      marginTop: "20px",
      marginBottom: "20px",
      fontWeight: "bold",
    }}
  >
    <h3
  style={{
    marginTop: 0,
    marginBottom: "10px",
  }}
>
  Active Traffic Alert
</h3>

<p>{latestAlert.title}</p>

Location: {latestAlert.location}

<br /><br />

Severity: {latestAlert.severity}

<br /><br />

Time: {latestAlert.time}
  </div>
)}



{/* System Health Panel */}

<div className="full-width">

  <div className="section-card">

    <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  }}
>
  <h2
    style={{
      margin: 0,
      fontSize: "26px",
    }}
  >
    🖥 System Health
  </h2>

  <span
    style={{
      color: "#22C55E",
      fontWeight: "700",
    }}
  >
    ● Healthy
  </span>
</div>

   <div
  style={{
    display: "flex",
    flexWrap: "wrap",
    gap: "15px",
    marginTop: "20px",
  }}
>
  <div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "12px 0",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
    }}
  >
    <span>🟢 AI Vision</span>
    <span style={{ color: "#22C55E" }}>Online</span>
  </div>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "12px 0",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
    }}
  >
    <span>🟢 Smart Signal</span>
    <span style={{ color: "#22C55E" }}>Online</span>
  </div>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "12px 0",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
    }}
  >
    <span>🟢 Multi-Lane</span>
    <span style={{ color: "#22C55E" }}>Online</span>
  </div>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "12px 0",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
    }}
  >
    <span>🟢 Backend API</span>
    <span style={{ color: "#22C55E" }}>Online</span>
  </div>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "12px 0",
    }}
  >
    <span>🚑 Emergency</span>

    <span
      style={{
        color: emergencyStatus.emergencyDetected
          ? "#EF4444"
          : "#22C55E",
      }}
    >
      {emergencyStatus.emergencyDetected
        ? "Active"
        : "Normal"}
    </span>
    
  </div>
  
</div>

</div>

<div
  style={{
    marginTop: "25px",
    background: "#0F172A",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "18px",
    textAlign: "center",
  }}
>
  <h2
    style={{
      margin: 0,
      color: "#22C55E",
      fontSize: "32px",
    }}
  >
    99.98%
  </h2>

  <p
    style={{
      marginTop: "8px",
      color: "#94A3B8",
      fontSize: "14px",
    }}
  >
    System Uptime
  </p>
</div>



  </div>
  

</div>

{/* Prediction History */}

        </div>
      
    </MainLayout>

  );
}

export default Dashboard;