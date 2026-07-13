import { useEffect, useState } from "react";
import axios from "axios";
import socket from "../socket";

function NotificationCenter() {
  const [notifications, setNotifications] =
    useState([]);

  useEffect(() => {
    fetchNotifications();

    socket.on("newIncident", () => {
      fetchNotifications();
    });

    return () => {
      socket.off("newIncident");
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(
        "https://trafficmind-ai.onrender.com/api/incidents"
      );

      const alerts =
        res.data.incidents
          .filter(
            (item) =>
              item.severity?.toLowerCase() ===
              "high"
          )
          .slice(0, 5);

      setNotifications(alerts);
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
      <h2>🔔 Live Notification Center</h2>

      {notifications.length === 0 ? (
        <p>No Active Alerts</p>
      ) : (
        notifications.map((item) => (
          <div
            key={item._id}
            style={{
              background: "#334155",
              padding: "12px",
              marginTop: "10px",
              borderRadius: "10px",
              borderLeft:
                "4px solid #ef4444",
            }}
          >
            <strong>
              🚨 High Severity Incident
            </strong>

            <br />

            📍 {item.location}

            <br />

            🛣️ {item.type}

            <br />

            ⚠️ Severity:{" "}
            {item.severity}
          </div>
        ))
      )}
    </div>
  );
}

export default NotificationCenter;