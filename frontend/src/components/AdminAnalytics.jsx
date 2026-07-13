import { useEffect, useState } from "react";
import axios from "axios";

function AdminAnalytics() {
  const [stats, setStats] = useState({
    totalIncidents: 0,
    highSeverity: 0,
    totalPredictions: 0,
    activeAlerts: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const incidentsRes = await axios.get(
        "https://trafficmind-ai.onrender.com/api/incidents"
      );

      const predictionsRes = await axios.get(
        "https://trafficmind-ai.onrender.com/api/predictions"
      );

      const incidents =
        incidentsRes.data.incidents || [];

      const predictions =
        predictionsRes.data.predictions || [];

      const highSeverity = incidents.filter(
        (item) =>
          item.severity?.toLowerCase() === "high"
      ).length;

      setStats({
        totalIncidents: incidents.length,
        highSeverity,
        totalPredictions: predictions.length,
        activeAlerts: highSeverity,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <h2>👨‍💼 Admin Analytics</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
          marginTop: "20px",
        }}
      >
        <div className="card">
          <h3>📍 Total Incidents</h3>
          <h2>{stats.totalIncidents}</h2>
        </div>

        <div className="card">
          <h3>🔴 High Severity</h3>
          <h2>{stats.highSeverity}</h2>
        </div>

        <div className="card">
          <h3>🤖 Predictions</h3>
          <h2>{stats.totalPredictions}</h2>
        </div>

        <div className="card">
          <h3>🚨 Active Alerts</h3>
          <h2>{stats.activeAlerts}</h2>
        </div>
      </div>
    </div>
  );
}

export default AdminAnalytics;