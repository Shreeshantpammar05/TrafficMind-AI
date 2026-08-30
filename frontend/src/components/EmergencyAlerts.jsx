import { useEffect, useState } from "react";
import axios from "axios";
import socket from "../socket";

function EmergencyAlerts() {
  const [alerts, setAlerts] = useState([]);

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000";

  useEffect(() => {
    fetchAlerts();

    const handleNewIncident = () => {
      fetchAlerts();
    };

    socket.on("newIncident", handleNewIncident);

    return () => {
      socket.off("newIncident", handleNewIncident);
    };
  }, []);

  const fetchAlerts = async () => {
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

      const highSeverity = incidents.filter(
        (incident) =>
          incident.severity?.toLowerCase() === "high"
      );

      setAlerts(highSeverity);
    } catch (error) {
      console.log("Emergency alerts error:", error);
      setAlerts([]);
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
          gap: "14px",
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
            🚨 Emergency Alert Center
          </h2>

          <p
            style={{
              margin: "7px 0 0",
              color: "var(--text-muted)",
              fontSize: "13px",
              lineHeight: 1.5,
            }}
          >
            High-severity incidents requiring immediate attention.
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
          {alerts.length} ACTIVE
        </span>
      </div>

      {alerts.length === 0 ? (
        <div
          style={{
            padding: "28px 18px",
            textAlign: "center",
            color: "var(--success)",
            background: "rgba(34,197,94,.08)",
            border: "1px solid rgba(34,197,94,.18)",
            borderRadius: "14px",
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontSize: "26px", marginBottom: "8px" }}>
            ✅
          </div>
          <strong
            style={{
              display: "block",
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            No Active Emergency Alerts
          </strong>
          <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            The emergency feed is currently clear.
          </span>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {alerts.map((alert) => (
            <article
              key={alert._id}
              style={{
                background: "rgba(127,29,29,.12)",
                padding: "16px",
                borderRadius: "14px",
                border: "1px solid rgba(239,68,68,.20)",
                borderLeft: "4px solid var(--danger)",
                color: "var(--text-secondary)",
                lineHeight: 1.55,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "10px",
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    color: "var(--danger)",
                    fontSize: "15px",
                  }}
                >
                  🚨 CRITICAL INCIDENT
                </h4>

                <span
                  style={{
                    color: "var(--danger)",
                    background: "rgba(239,68,68,.10)",
                    border: "1px solid rgba(239,68,68,.20)",
                    padding: "4px 8px",
                    borderRadius: "999px",
                    fontSize: "10px",
                    fontWeight: "800",
                  }}
                >
                  {alert.severity || "HIGH"}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(190px,1fr))",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    background: "var(--app-surface-3)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                  }}
                >
                  <div
                    style={{
                      color: "var(--text-subtle)",
                      fontSize: "10px",
                      fontWeight: "800",
                      textTransform: "uppercase",
                    }}
                  >
                    Location
                  </div>
                  <strong
                    style={{
                      display: "block",
                      marginTop: "4px",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                    }}
                  >
                    {alert.location || "Unknown"}
                  </strong>
                </div>

                <div
                  style={{
                    background: "var(--app-surface-3)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                  }}
                >
                  <div
                    style={{
                      color: "var(--text-subtle)",
                      fontSize: "10px",
                      fontWeight: "800",
                      textTransform: "uppercase",
                    }}
                  >
                    Type
                  </div>
                  <strong
                    style={{
                      display: "block",
                      marginTop: "4px",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                    }}
                  >
                    {alert.incidentType || "Unknown"}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid rgba(239,68,68,.18)",
                  color: "var(--warning)",
                  fontWeight: "800",
                  fontSize: "13px",
                }}
              >
                🚓 Action: Immediate Response Required
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default EmergencyAlerts;