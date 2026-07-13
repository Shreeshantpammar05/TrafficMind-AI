import { useState, useEffect } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";

function AccidentDashboard() {

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
      "https://trafficmind-ai.onrender.com/api/accident/status"
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
        Loading Accident Data...
      </h2>
    </MainLayout>
  );
}

  return (
    <MainLayout>

  <div className="hero-header">

    <div>

      <h1>
        🚨 Accident Dashboard
      </h1>

      <p
        style={{
          color: "#94a3b8",
          fontSize: "18px",
          fontWeight: "600",
        }}
      >
        AI Accident Detection
      </p>

      <p
        style={{
          color: "#cbd5e1",
        }}
      >
        Real-time accident
        monitoring, emergency
        alerts, and incident
        response management.
      </p>

    </div>

    <div
      style={{
        background:
          data.accidentDetected
            ? "#dc2626"
            : "#16a34a",
        padding: "10px 18px",
        borderRadius: "25px",
        fontWeight: "bold",
      }}
    >
      {data.accidentDetected
        ? "🚨 Active Incident"
        : "🟢 No Active Incident"}
    </div>

  </div>

  <div className="cards">

    <div className="card">

      <h3>
        🚨 Accident Status
      </h3>

      <h2>
        {data.accidentDetected
          ? "DETECTED"
          : "CLEAR"}
      </h2>

    </div>

    <div className="card">

      <h3>
        ⚡ Alert Level
      </h3>

      <h2>
        {data.accidentDetected
          ? "HIGH"
          : "LOW"}
      </h2>

    </div>

    <div className="card">

      <h3>
        🚑 Emergency Units
      </h3>

      <h2>
        {data.accidentDetected
          ? "DISPATCHED"
          : "READY"}
      </h2>

    </div>

    <div className="card">

      <h3>
        🤖 AI Detection
      </h3>

      <h2>
        ACTIVE
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
      🚨 Incident Analysis
    </h2>

    <p>
      Status:
      {" "}
      {data.accidentDetected
        ? "Accident Detected"
        : "No Accident"}
    </p>

    <p>
      Alert:
      {" "}
      {data.alert}
    </p>

  </div>

</MainLayout>
  );
}

export default AccidentDashboard;