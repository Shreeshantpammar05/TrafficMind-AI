import { useState, useEffect } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";

function SmartSignalDashboard() {

  const [signalData, setSignalData] =
    useState(null);

  useEffect(() => {

    fetchSignalData();

    const interval = setInterval(
      fetchSignalData,
      5000
    );

    return () =>
      clearInterval(interval);

  }, []);

  const fetchSignalData = async () => {

    try {

      const res = await axios.get(
        "http://localhost:5000/api/signal/status"
      );

      setSignalData(res.data);

    } catch (error) {

      console.log(error);

    }
  };

  if (!signalData) {

    return (
      <MainLayout>
        <h2
          style={{
            textAlign: "center",
            marginTop: "50px",
          }}
        >
          Loading Signal Data...
        </h2>
      </MainLayout>
    );
  }

  return (
    <MainLayout>

     <div className="hero-header">

  <div>

    <h1>
      🚦 Smart Signal Dashboard
    </h1>

    <p
      style={{
        color: "#94a3b8",
        fontSize: "18px",
        fontWeight: "600",
      }}
    >
      AI Signal Optimization
    </p>

    <p
      style={{
        color: "#cbd5e1",
      }}
    >
      Real-time adaptive signal
      timing based on vehicle
      density and congestion
      analytics.
    </p>

  </div>

  <div
    style={{
      background: "#16a34a",
      padding: "10px 18px",
      borderRadius: "25px",
      fontWeight: "bold",
    }}
  >
    🟢 Signal Network Online
  </div>

</div>

     <div className="cards">

        <div className="card">
          <h3>
            🚗 Vehicles
          </h3>

          <h2>
            {signalData.vehicleCount}
          </h2>
        </div>

        <div className="card">
          <h3>
            🚦 Congestion
          </h3>

          <h2>
            {signalData.congestion}
          </h2>
        </div>

        <div className="card">
          <h3>
            ⏱ Signal Time
          </h3>

          <h2>
            {signalData.signalTime}s
          </h2>
        </div>

        <div className="card">
          <h3>
            📢 Recommendation
          </h3>

          <h3>
            {signalData.recommendation}
          </h3>
        </div>

        <div className="card">

  <h3>
    🤖 AI Status
  </h3>

  <h2>
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
    🚦 Signal Decision Engine
  </h2>

  <p>
    Current Vehicles:
    {" "}
    {signalData.vehicleCount}
  </p>

  <p>
    Congestion:
    {" "}
    {signalData.congestion}
  </p>

  <p>
    Optimized Signal Time:
    {" "}
    {signalData.signalTime}s
  </p>

  <p>
    AI Recommendation:
    {" "}
    {signalData.recommendation}
  </p>

</div>

    </MainLayout>
  );
}

export default SmartSignalDashboard;