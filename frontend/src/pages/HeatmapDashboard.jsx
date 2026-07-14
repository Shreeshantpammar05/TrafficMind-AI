import BackButton from "../components/BackButton";
import { useState, useEffect } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";

function HeatmapDashboard() {

  const [locations, setLocations] =
    useState([]);

    const [loading, setLoading] =
  useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {

    const res = await axios.get(
      "https://trafficmind-ai.onrender.com/api/heatmap"
    );

    setLocations(res.data);

    setLoading(false);
  };

  if (loading) {
  return (
    <MainLayout>
      <h2
        style={{
          textAlign: "center",
          marginTop: "50px",
        }}
      >
        Loading Heatmap Data...
      </h2>
    </MainLayout>
  );
}

  return (
    <MainLayout>
      <BackButton />

    <div className="hero-header">

  <div>

    <h1>
      🗺️ Traffic Heatmap Center
    </h1>

    <p
      style={{
        color: "#94a3b8",
        fontSize: "18px",
        fontWeight: "600",
      }}
    >
      Congestion Intelligence
    </p>

    <p
      style={{
        color: "#cbd5e1",
      }}
    >
      Identify congestion hotspots,
      traffic density zones,
      and high-risk locations
      across the city.
    </p>

  </div>

  <div
    style={{
      background: "#2563eb",
      padding: "10px 18px",
      borderRadius: "25px",
      fontWeight: "bold",
    }}
  >
    🗺️ Heatmap Active
  </div>

</div>

<div className="cards">

  <div className="card">
    <h3>🗺️ Locations</h3>
    <h2>{locations.length}</h2>
  </div>

  <div className="card">
   <h3>🚨 High Risk Zones</h3>
    <h2>
      {
        locations.filter(
          (l) =>
            l.congestion === "HIGH"
        ).length
      }
    </h2>
  </div>

  <div className="card">
    <h3>⚠️ Medium Risk Zones</h3>
    <h2>
      {
        locations.filter(
          (l) =>
            l.congestion === "MEDIUM"
        ).length
      }
    </h2>
  </div>

  <div className="card">
    <h3>🤖 AI Status</h3>
    <h2
      style={{
        color: "#22c55e",
      }}
    >
      ACTIVE
    </h2>
  </div>

</div>



     <div
  className="cards"
  style={{
    marginTop: "20px",
  }}
>

{locations.map((loc, index) => (

        <div
          key={index}
          className="card"
        >
          <h2>
  📍 {loc.name}
</h2>

          <h3>
            {loc.congestion === "HIGH"
              ? "🔴 HIGH"
              : loc.congestion === "MEDIUM"
              ? "🟡 MEDIUM"
              : "🟢 LOW"}
          </h3>
        </div>

      ))}

     </div> 

     <div
  className="section-card"
  style={{
    marginTop: "20px",
  }}
>

  <h2>
    🗺️ Congestion Analysis
  </h2>

  <p>
    Total Locations:
    {" "}
    {locations.length}
  </p>

  <p>
    AI Monitoring:
    Active
  </p>

  <p>
    Heatmap Engine:
    Running
  </p>

</div>

    </MainLayout>
  );
}

export default HeatmapDashboard;