import { useEffect, useState } from "react";
import axios from "axios";
import socket from "../socket";

function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000";

  useEffect(() => {
    fetchNotifications();

    const handleNewIncident = () => {
      fetchNotifications();
    };

    socket.on("newIncident", handleNewIncident);

    return () => {
      socket.off("newIncident", handleNewIncident);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/incidents`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "token"
            )}`,
          },
        }
      );

      const incidents = res.data?.incidents || [];

      const alerts = incidents
        .filter(
          (item) =>
            item.severity?.toLowerCase() === "high"
        )
        .slice(0, 5);

      setNotifications(alerts);
    } catch (error) {
      console.log(
        "Notification center error:",
        error
      );
      setNotifications([]);
    }
  };

  return (
    <section
      style={{
        background: "var(--app-surface)",
        padding: "22px",
        borderRadius: "18px",
        color: "var(--text-primary)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow)",
        boxSizing: "border-box",
        width: "100%",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "18px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h2
            style={{
              margin: 0,
              color: "var(--text-primary)",
              lineHeight: 1.2,
            }}
          >
            🔔 Live Notification Center
          </h2>

          <p
            style={{
              margin: "7px 0 0",
              color: "var(--text-muted)",
              fontSize: "13px",
              lineHeight: 1.5,
            }}
          >
            High-severity incidents requiring attention.
          </p>
        </div>

        <span
          style={{
            background: "rgba(239,68,68,.10)",
            color: "var(--danger)",
            border: "1px solid rgba(239,68,68,.22)",
            padding: "7px 11px",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: "800",
            whiteSpace: "nowrap",
          }}
        >
          {notifications.length} ACTIVE
        </span>
      </div>

      {notifications.length === 0 ? (
        <div
          style={{
            padding: "28px 16px",
            textAlign: "center",
            color: "var(--text-muted)",
            background: "var(--app-surface-2)",
            border: "1px dashed var(--border)",
            borderRadius: "14px",
          }}
        >
          <div style={{ fontSize: "25px", marginBottom: "8px" }}>
            🔕
          </div>

          <strong
            style={{
              display: "block",
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            No Active Alerts
          </strong>

          <span style={{ fontSize: "13px" }}>
            New high-severity incidents will appear here.
          </span>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {notifications.map((item) => (
            <article
              key={item._id}
              style={{
                background: "var(--app-surface-2)",
                padding: "14px",
                borderRadius: "13px",
                border: "1px solid rgba(239,68,68,.18)",
                borderLeft: "4px solid var(--danger)",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
              }}
            >
              <strong
                style={{
                  color: "var(--text-primary)",
                  display: "block",
                  marginBottom: "7px",
                }}
              >
                🚨 High Severity Incident
              </strong>

              <div>📍 {item.location || "Unknown location"}</div>
              <div>🛣️ {item.incidentType || "Unknown type"}</div>

              <div
                style={{
                  color: "var(--danger)",
                  fontWeight: "800",
                  marginTop: "4px",
                }}
              >
                ⚠️ Severity: {item.severity || "HIGH"}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default NotificationCenter;