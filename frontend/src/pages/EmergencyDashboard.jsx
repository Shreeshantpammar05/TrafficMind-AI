import { useState, useEffect } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";

function EmergencyDashboard() {

  const [data, setData] =
    useState(null);

  useEffect(() => {

    fetchData();

    const interval =
      setInterval(fetchData, 5000);

    return () =>
      clearInterval(interval);

  }, []);

  const fetchData = async () => {

    const res = await axios.get(
      "http://localhost:5000/api/emergency/status"
    );

    setData(res.data);

  };

 if (!data) {
  return (
    <MainLayout>
      <h2
        style={{
          textAlign: "center",
          marginTop: "50px",
        }}
      >
        Loading Emergency Data...
      </h2>
    </MainLayout>
  );
}

  return (
    <MainLayout>

     <div className="hero-header">

  <div>

    <h1>
      🚑 Emergency Operations Center
    </h1>

    <p
      style={{
        color: "#94a3b8",
        fontSize: "18px",
        fontWeight: "600",
      }}
    >
      AI Emergency Response System
    </p>

    <p
      style={{
        color: "#cbd5e1",
      }}
    >
      Monitor emergency vehicle
      detection, green corridor
      activation, and priority
      traffic management.
    </p>

  </div>

  <div
    style={{
      background:
        data.emergencyDetected
          ? "#dc2626"
          : "#16a34a",
      padding: "10px 18px",
      borderRadius: "25px",
      fontWeight: "bold",
    }}
  >
    {data.emergencyDetected
      ? "🚨 Emergency Active"
      : "🟢 System Ready"}
  </div>

</div>

<div className="cards">

  <div className="card">

    <h3>
      🚑 Emergency Status
    </h3>

    <h2>
      {data.emergencyDetected
        ? "DETECTED"
        : "CLEAR"}
    </h2>

  </div>

  <div className="card">

    <h3>
      🚦 Traffic Priority
    </h3>

    <h2>
      {data.priority}
    </h2>

  </div>

  <div className="card">

    <h3>
      🛣 Green Corridor
    </h3>

    <h2>
      {data.emergencyDetected
        ? "ACTIVE"
        : "STANDBY"}
    </h2>

  </div>

  <div className="card">

    <h3>
      🤖 AI Status
    </h3>

    <h2
      style={{
        color: "#22c55e",
      }}
    >
      ONLINE
    </h2>

  </div>

</div>

<div
  className="section-card"
  style={{
    marginTop: "20px",
  }}
>

  <h2>
    🚑 Emergency Response Engine
  </h2>

  <p>
    Emergency Detected:
    {" "}
    {data.emergencyDetected
      ? "Yes"
      : "No"}
  </p>

  <p>
    Priority Level:
    {" "}
    {data.priority}
  </p>

  <p>
    Green Corridor:
    {" "}
    {data.emergencyDetected
      ? "Activated"
      : "Standby"}
  </p>

  <p>
    AI Monitoring:
    Active
  </p>

</div>

    </MainLayout>
  );
}

export default EmergencyDashboard;