import {
  useEffect,
  useState,
} from "react";

import axios from "axios";

function AIDecisionHistory({
  camera,
}) {
  const [history, setHistory] =
    useState([]);

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000";

  useEffect(() => {
    if (!camera?.cameraId) {
      setHistory([]);
      return;
    }

    fetchHistory();

    const interval =
      setInterval(
        fetchHistory,
        5000
      );

    return () =>
      clearInterval(interval);
  }, [camera]);

  const fetchHistory =
    async () => {
      try {
        const res =
          await axios.get(
            `${API_BASE}/api/ai-decision-history/${encodeURIComponent(
              camera.cameraId
            )}`,
            {
              headers: {
                Authorization:
                  `Bearer ${localStorage.getItem(
                    "token"
                  )}`,
              },
            }
          );

        setHistory(
          res.data?.history || []
        );
      } catch (error) {
        console.log(
          "AI decision history error:",
          error
        );

        setHistory([]);
      }
    };

  if (!camera) {
    return null;
  }

  const latest =
    history[0] || null;

  return (
    <div
      className="section-card"
      style={{
        marginBottom: "20px",
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
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              color:
                "var(--text-primary)",
            }}
          >
            🧠 AI Decision History
          </h2>

          <p
            style={{
              color:
                "var(--text-muted)",
              marginTop: "6px",
              marginBottom: 0,
            }}
          >
            Decision changes recorded for{" "}
            <strong
              style={{
                color:
                  "var(--text-primary)",
              }}
            >
              {camera.name}
            </strong>
          </p>
        </div>

        <span
          style={{
            background:
              "var(--accent-soft)",
            color:
              "var(--accent)",
            border:
              "1px solid var(--border)",
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
          {history.length} RECORDS
        </span>
      </div>

      {!latest ? (
        <div
          style={{
            marginTop: "20px",
            padding: "18px",
            borderRadius: "14px",
            background:
              "var(--app-surface-2)",
            border:
              "1px dashed var(--border)",
            color:
              "var(--text-muted)",
          }}
        >
          No decision history available yet.
        </div>
      ) : (
        <>
          {/* Current decision */}

          <div
            style={{
              marginTop: "20px",
              padding: "18px",
              borderRadius: "15px",
              background:
                "var(--app-surface-2)",
              border:
                "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "flex-start",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <span
                  style={{
                    color:
                      "var(--text-subtle)",
                    fontSize:
                      "11px",
                    fontWeight:
                      "800",
                  }}
                >
                  CURRENT AI DECISION
                </span>

                <h3
                  style={{
                    margin:
                      "6px 0 0",
                    color:
                      "var(--text-primary)",
                  }}
                >
                  {latest.decision}
                </h3>
              </div>

              <span
                style={{
                  background:
                    latest.priority ===
                    "CRITICAL"
                      ? "rgba(239,68,68,.12)"
                      : latest.priority ===
                        "HIGH"
                      ? "rgba(249,115,22,.12)"
                      : latest.priority ===
                        "MEDIUM"
                      ? "rgba(245,158,11,.12)"
                      : "rgba(34,197,94,.12)",
                  color:
                    latest.priority ===
                    "CRITICAL"
                      ? "#EF4444"
                      : latest.priority ===
                        "HIGH"
                      ? "#F97316"
                      : latest.priority ===
                        "MEDIUM"
                      ? "#F59E0B"
                      : "#22C55E",
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
                {latest.priority}
              </span>
            </div>

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(150px,1fr))",
                gap:
                  "12px",
                marginTop:
                  "16px",
              }}
            >
              <div>
                <span
                  style={{
                    color:
                      "var(--text-muted)",
                    fontSize:
                      "12px",
                  }}
                >
                  Vehicles
                </span>

                <strong
                  style={{
                    display:
                      "block",
                    marginTop:
                      "4px",
                    color:
                      "var(--text-primary)",
                  }}
                >
                  {latest.vehicleCount ??
                    0}
                </strong>
              </div>

              <div>
                <span
                  style={{
                    color:
                      "var(--text-muted)",
                    fontSize:
                      "12px",
                  }}
                >
                  Congestion
                </span>

                <strong
                  style={{
                    display:
                      "block",
                    marginTop:
                      "4px",
                    color:
                      "var(--text-primary)",
                  }}
                >
                  {latest.congestion ||
                    "LOW"}
                </strong>
              </div>

              <div>
                <span
                  style={{
                    color:
                      "var(--text-muted)",
                    fontSize:
                      "12px",
                  }}
                >
                  Risk
                </span>

                <strong
                  style={{
                    display:
                      "block",
                    marginTop:
                      "4px",
                    color:
                      "var(--text-primary)",
                  }}
                >
                  {latest.riskLevel ||
                    "LOW"}
                </strong>
              </div>

              <div>
                <span
                  style={{
                    color:
                      "var(--text-muted)",
                    fontSize:
                      "12px",
                  }}
                >
                  Confidence
                </span>

                <strong
                  style={{
                    display:
                      "block",
                    marginTop:
                      "4px",
                    color:
                      "var(--text-primary)",
                  }}
                >
                  {Number(
                    latest.confidence ||
                      0
                  ) *
                    100 >
                  0
                    ? `${(
                        Number(
                          latest.confidence
                        ) * 100
                      ).toFixed(1)}%`
                    : "0.0%"}
                </strong>
              </div>
            </div>

            <div
              style={{
                marginTop:
                  "15px",
                paddingTop:
                  "13px",
                borderTop:
                  "1px solid var(--border)",
              }}
            >
              <strong
                style={{
                  color:
                    "var(--text-primary)",
                }}
              >
                Action:
              </strong>{" "}
              <span
                style={{
                  color:
                    "var(--text-secondary)",
                }}
              >
                {latest.action}
              </span>
            </div>
          </div>

          {/* Timeline */}

          <div
            style={{
              marginTop:
                "20px",
            }}
          >
            <h3
              style={{
                margin:
                  "0 0 12px",
                color:
                  "var(--text-primary)",
              }}
            >
              Decision Timeline
            </h3>

            <div
              style={{
                display:
                  "grid",
                gap:
                  "12px",
              }}
            >
              {history.map(
                (item) => {
                  const trendColor =
                    item.trend ===
                    "RISING FAST"
                      ? "#EF4444"
                      : item.trend ===
                        "RISING"
                      ? "#F59E0B"
                      : item.trend ===
                        "FALLING FAST"
                      ? "#22C55E"
                      : item.trend ===
                        "FALLING"
                      ? "#16A34A"
                      : "var(--text-muted)";

                  return (
                    <div
                      key={
                        item._id
                      }
                      style={{
                        background:
                          "var(--app-surface-2)",
                        padding:
                          "15px",
                        borderRadius:
                          "14px",
                        border:
                          "1px solid var(--border)",
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
                        <strong
                          style={{
                            color:
                              "var(--text-primary)",
                          }}
                        >
                          {
                            item.decision
                          }
                        </strong>

                        <span
                          style={{
                            color:
                              trendColor,
                            fontSize:
                              "11px",
                            fontWeight:
                              "800",
                          }}
                        >
                          {item.trend ||
                            "STABLE"}
                        </span>
                      </div>

                      <div
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit,minmax(130px,1fr))",
                          gap:
                            "10px",
                          marginTop:
                            "10px",
                        }}
                      >
                        <span
                          style={{
                            color:
                              "var(--text-muted)",
                            fontSize:
                              "12px",
                          }}
                        >
                          Vehicles:{" "}
                          <strong
                            style={{
                              color:
                                "var(--text-primary)",
                            }}
                          >
                            {item.vehicleCount ??
                              0}
                          </strong>
                        </span>

                        <span
                          style={{
                            color:
                              "var(--text-muted)",
                            fontSize:
                              "12px",
                          }}
                        >
                          Change:{" "}
                          <strong
                            style={{
                              color:
                                item.vehicleChange >
                                0
                                  ? "#EF4444"
                                  : item.vehicleChange <
                                    0
                                  ? "#22C55E"
                                  : "var(--text-primary)",
                            }}
                          >
                            {item.vehicleChange >
                            0
                              ? `+${item.vehicleChange}`
                              : item.vehicleChange}
                          </strong>
                        </span>

                        <span
                          style={{
                            color:
                              "var(--text-muted)",
                            fontSize:
                              "12px",
                          }}
                        >
                          Congestion:{" "}
                          <strong
                            style={{
                              color:
                                "var(--text-primary)",
                            }}
                          >
                            {item.congestion ||
                              "LOW"}
                          </strong>
                        </span>
                      </div>

                      <p
                        style={{
                          margin:
                            "10px 0 0",
                          color:
                            "var(--text-secondary)",
                          lineHeight:
                            "1.5",
                        }}
                      >
                        {
                          item.action
                        }
                      </p>

                      <small
                        style={{
                          display:
                            "block",
                          marginTop:
                            "10px",
                          color:
                            "var(--text-subtle)",
                        }}
                      >
                        {new Date(
                          item.createdAt
                        ).toLocaleString()}
                      </small>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AIDecisionHistory;