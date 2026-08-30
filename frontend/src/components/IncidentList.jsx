import socket from "../socket";

import {
  useEffect,
  useState,
} from "react";

import axios from "axios";

function IncidentList() {
  const [incidents, setIncidents] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000";

  const getAuthHeaders = () => ({
    Authorization:
      `Bearer ${localStorage.getItem(
        "token"
      )}`,
  });

  useEffect(() => {
    fetchIncidents();

    const handleNewIncident =
      () => {
        fetchIncidents();
      };

    socket.on(
      "newIncident",
      handleNewIncident
    );

    return () => {
      socket.off(
        "newIncident",
        handleNewIncident
      );
    };
  }, []);

  const fetchIncidents =
    async () => {
      try {
        setLoading(true);
        setError("");

        const res =
          await axios.get(
            `${API_BASE}/api/incidents`,
            {
              headers:
                getAuthHeaders(),
            }
          );

        setIncidents(
          res.data?.incidents || []
        );
      } catch (error) {
        console.log(
          "Incident list error:",
          error
        );

        setIncidents([]);
        setError(
          error.response?.data
            ?.error ||
            error.response?.data
              ?.message ||
            "Unable to load incidents."
        );
      } finally {
        setLoading(false);
      }
    };

  const getSeverityColor =
    (severity) => {
      const value =
        String(
          severity || ""
        ).toLowerCase();

      if (value === "critical") {
        return "#DC2626";
      }

      if (value === "high") {
        return "#F97316";
      }

      if (value === "medium") {
        return "#D97706";
      }

      if (value === "low") {
        return "#16A34A";
      }

      return "var(--text-muted)";
    };

  return (
    <div
      style={{
        width: "100%",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "18px",
        }}
      >
        <div>
         

         
        </div>

        {!loading &&
          !error && (
            <span
              style={{
                background:
                  "var(--accent-soft)",
                border:
                  "1px solid var(--border)",
                color:
                  "var(--accent)",
                padding:
                  "6px 10px",
                borderRadius:
                  "999px",
                fontSize:
                  "11px",
                fontWeight:
                  "800",
              }}
            >
              {incidents.length}{" "}
              {incidents.length ===
              1
                ? "INCIDENT"
                : "INCIDENTS"}
            </span>
          )}
      </div>

      <div
        style={{
          height: "520px",
          overflowY: "auto",
          paddingRight:
            "8px",
          scrollbarGutter:
            "stable",
        }}
      >
        {loading ? (
          <div
            style={{
              minHeight:
                "260px",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              textAlign:
                "center",
              color:
                "var(--text-muted)",
              background:
                "var(--app-surface-2)",
              border:
                "1px dashed var(--border)",
              borderRadius:
                "14px",
              padding:
                "20px",
              boxSizing:
                "border-box",
            }}
          >
            <div>
              <div
                style={{
                  fontSize:
                    "24px",
                  marginBottom:
                    "8px",
                }}
              >
                ⏳
              </div>

              Loading incidents...
            </div>
          </div>
        ) : error ? (
          <div
            style={{
              padding:
                "18px",
              borderRadius:
                "14px",
              background:
                "var(--app-surface-2)",
              border:
                "1px solid var(--border)",
              color:
                "var(--text-secondary)",
              lineHeight:
                "1.55",
            }}
          >
            <strong
              style={{
                display:
                  "block",
                color:
                  "var(--text-primary)",
                marginBottom:
                  "6px",
              }}
            >
              ⚠️ Incident feed unavailable
            </strong>

            {error}
          </div>
        ) : incidents.length ===
          0 ? (
          <div
            style={{
              minHeight:
                "260px",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              textAlign:
                "center",
              color:
                "var(--text-muted)",
              border:
                "1px dashed var(--border)",
              borderRadius:
                "14px",
              background:
                "var(--app-surface-2)",
              padding:
                "24px",
              boxSizing:
                "border-box",
            }}
          >
            <div>
              <div
                style={{
                  fontSize:
                    "28px",
                  marginBottom:
                    "8px",
                }}
              >
                📭
              </div>

              <strong
                style={{
                  display:
                    "block",
                  color:
                    "var(--text-primary)",
                  marginBottom:
                    "6px",
                }}
              >
                No incidents found
              </strong>

              <span>
                Reported incidents will
                appear here automatically.
              </span>
            </div>
          </div>
        ) : (
          incidents.map(
            (incident) => {
              const severityColor =
                getSeverityColor(
                  incident.severity
                );

              return (
                <article
                  key={
                    incident._id
                  }
                  style={{
                    background:
                      "var(--app-surface-2)",
                    border:
                      "1px solid var(--border)",
                    borderLeft:
                      `4px solid ${severityColor}`,
                    borderRadius:
                      "15px",
                    padding:
                      "18px",
                    marginBottom:
                      "14px",
                    transition:
                      "transform .25s ease, border-color .25s ease, box-shadow .25s ease",
                    color:
                      "var(--text-primary)",
                    boxShadow:
                      "0 8px 22px rgba(15,23,42,.05)",
                    boxSizing:
                      "border-box",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "flex-start",
                      gap:
                        "12px",
                      flexWrap:
                        "wrap",
                    }}
                  >
                    <div
                      style={{
                        minWidth: 0,
                        flex: "1 1 240px",
                      }}
                    >
                      <h3
                        style={{
                          margin:
                            0,
                          color:
                            "var(--accent)",
                          fontSize:
                            "17px",
                          lineHeight:
                            "1.35",
                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        {incident.location ||
                          "Unknown location"}
                      </h3>

                      <div
                        style={{
                          marginTop:
                            "5px",
                          color:
                            "var(--text-subtle)",
                          fontSize:
                            "11px",
                          textTransform:
                            "uppercase",
                          letterSpacing:
                            ".06em",
                          fontWeight:
                            "700",
                        }}
                      >
                        Traffic incident
                      </div>
                    </div>

                    <span
                      style={{
                        background:
                          `${severityColor}18`,
                        border:
                          `1px solid ${severityColor}45`,
                        color:
                          severityColor,
                        padding:
                          "6px 10px",
                        borderRadius:
                          "999px",
                        fontSize:
                          "11px",
                        fontWeight:
                          "800",
                        whiteSpace:
                          "nowrap",
                        textTransform:
                          "uppercase",
                      }}
                    >
                      {incident.severity ||
                        "Unknown"}
                    </span>
                  </div>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit,minmax(150px,1fr))",
                      gap:
                        "10px",
                      marginTop:
                        "15px",
                    }}
                  >
                    <div
                      style={{
                        background:
                          "var(--app-surface-3)",
                        border:
                          "1px solid var(--border)",
                        borderRadius:
                          "10px",
                        padding:
                          "10px 12px",
                      }}
                    >
                      <span
                        style={{
                          display:
                            "block",
                          fontSize:
                            "10px",
                          color:
                            "var(--text-subtle)",
                          fontWeight:
                            "700",
                          textTransform:
                            "uppercase",
                          letterSpacing:
                            ".05em",
                        }}
                      >
                        Type
                      </span>

                      <strong
                        style={{
                          display:
                            "block",
                          marginTop:
                            "5px",
                          color:
                            "var(--text-primary)",
                          fontSize:
                            "13px",
                        }}
                      >
                        {incident.incidentType ||
                          "Unknown"}
                      </strong>
                    </div>

                    <div
                      style={{
                        background:
                          "var(--app-surface-3)",
                        border:
                          "1px solid var(--border)",
                        borderRadius:
                          "10px",
                        padding:
                          "10px 12px",
                      }}
                    >
                      <span
                        style={{
                          display:
                            "block",
                          fontSize:
                            "10px",
                          color:
                            "var(--text-subtle)",
                          fontWeight:
                            "700",
                          textTransform:
                            "uppercase",
                          letterSpacing:
                            ".05em",
                        }}
                      >
                        Reported
                      </span>

                      <strong
                        style={{
                          display:
                            "block",
                          marginTop:
                            "5px",
                          color:
                            "var(--text-primary)",
                          fontSize:
                            "13px",
                        }}
                      >
                        {incident.createdAt
                          ? new Date(
                              incident.createdAt
                            ).toLocaleString()
                          : "Time unavailable"}
                      </strong>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop:
                        "14px",
                      paddingTop:
                        "13px",
                      borderTop:
                        "1px solid var(--border)",
                    }}
                  >
                    <p
                      style={{
                        margin:
                          0,
                        color:
                          "var(--text-secondary)",
                        lineHeight:
                          "1.6",
                        fontSize:
                          "14px",
                      }}
                    >
                      {incident.description ||
                        "No description provided."}
                    </p>
                  </div>
                </article>
              );
            }
          )
        )}
      </div>
    </div>
  );
}

export default IncidentList;