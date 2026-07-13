import { useEffect, useState } from "react";
import axios from "axios";
import socket from "../socket";

function EmergencyAlerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchAlerts();

    socket.on("newIncident", () => {
      fetchAlerts();
    });

    return () => {
      socket.off("newIncident");
    };
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/incidents"
      );

      const highSeverity =
        res.data.incidents.filter(
          (incident) =>
            incident.severity?.toLowerCase() ===
            "high"
        );

      setAlerts(highSeverity);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div
      style={{
        background: "#1e293b",
        padding: "20px",
        borderRadius: "15px",
        color: "white",
      }}
    >
      <h2>🚨 Emergency Alert Center</h2>

      {alerts.length === 0 ? (
        <p>✅ No Active Emergency Alerts</p>
      ) : (
        alerts.map((alert) => (
          <div
            key={alert._id}
            style={{
              background: "#7f1d1d",
              padding: "15px",
              marginTop: "10px",
              borderRadius: "10px",
              borderLeft:
                "5px solid #ef4444",
            }}
          >
            <h4>
              🚨 CRITICAL INCIDENT
            </h4>

            <p>
              📍 Location:
              {" "}
              {alert.location}
            </p>

            <p>
              🛣 Type:
              {" "}
              {alert.incidentType}
            </p>

            <p>
              ⚠ Severity:
              {" "}
              {alert.severity}
            </p>

            <p>
              🚓 Action:
              Immediate Response Required
            </p>
          </div>
        ))
      )}
    </div>
  );
}

export default EmergencyAlerts;