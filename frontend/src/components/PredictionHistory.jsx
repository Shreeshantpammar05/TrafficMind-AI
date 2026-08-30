import { useEffect, useState } from "react";
import axios from "axios";

function PredictionHistory() {
  const [predictions, setPredictions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000";

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions =
    async () => {
      try {
        setLoading(true);

        const res =
          await axios.get(
            `${API_BASE}/api/predictions`,
            {
              headers: {
                Authorization:
                  `Bearer ${localStorage.getItem(
                    "token"
                  )}`,
              },
            }
          );

        setPredictions(
          res.data?.predictions || []
        );
      } catch (error) {
        console.log(
          "Prediction history error:",
          error
        );

        setPredictions([]);
      } finally {
        setLoading(false);
      }
    };

  return (
    <div>
      {/* Header */}

      <div
        style={{
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            margin: 0,
            color:
              "var(--text-primary)",
          }}
        >
          🤖 Prediction History
        </h2>

        <p
          style={{
            marginTop: "6px",
            marginBottom: 0,
            color:
              "var(--text-muted)",
            lineHeight: "1.5",
          }}
        >
          Review previously generated traffic
          predictions and risk information.
        </p>
      </div>

      {/* Loading */}

      {loading && (
        <div
          style={{
            background:
              "var(--app-surface-2)",
            padding: "30px",
            borderRadius: "14px",
            textAlign: "center",
            color:
              "var(--text-muted)",
            border:
              "1px dashed var(--border)",
          }}
        >
          Loading prediction history...
        </div>
      )}

      {/* Empty */}

      {!loading &&
        predictions.length ===
          0 && (
          <div
            style={{
              background:
                "var(--app-surface-2)",
              padding: "35px",
              borderRadius: "14px",
              textAlign: "center",
              color:
                "var(--text-muted)",
              border:
                "1px dashed var(--border)",
            }}
          >
            No prediction history found.
          </div>
        )}

      {/* Prediction Records */}

      {!loading &&
        predictions.length >
          0 && (
          <div
            style={{
              display: "grid",
              gap: "12px",
            }}
          >
            {predictions.map(
              (item) => {
                const risk = (
                  item.risk ||
                  "UNKNOWN"
                ).toUpperCase();

                const riskColor =
                  risk === "HIGH"
                    ? "#EF4444"
                    : risk === "MEDIUM"
                    ? "#F59E0B"
                    : risk === "LOW"
                    ? "#22C55E"
                    : "var(--text-muted)";

                return (
                  <div
                    key={item._id}
                    style={{
                      background:
                        "var(--app-surface-2)",
                      border:
                        "1px solid var(--border)",
                      borderRadius:
                        "14px",
                      padding:
                        "18px",
                      color:
                        "var(--text-primary)",
                      transition:
                        "transform .25s ease, border-color .25s ease, box-shadow .25s ease",
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
                        gap: "15px",
                        flexWrap:
                          "wrap",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            color:
                              "var(--text-primary)",
                          }}
                        >
                          📍{" "}
                          {item.area ||
                            "Unknown Area"}
                        </h3>
                      </div>

                      <span
                        style={{
                          color:
                            riskColor,
                          fontWeight:
                            "800",
                          background:
                            `${riskColor}14`,
                          border:
                            `1px solid ${riskColor}55`,
                          padding:
                            "6px 10px",
                          borderRadius:
                            "18px",
                          fontSize:
                            "12px",
                        }}
                      >
                        {risk}
                      </span>
                    </div>

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit,minmax(160px,1fr))",
                        gap:
                          "12px",
                        marginTop:
                          "15px",
                      }}
                    >
                      <div
                        style={{
                          color:
                            "var(--text-secondary)",
                        }}
                      >
                        🚗 Vehicles

                        <strong
                          style={{
                            display:
                              "block",
                            marginTop:
                              "5px",
                            color:
                              "var(--text-primary)",
                          }}
                        >
                          {item.vehicleCount ??
                            0}
                        </strong>
                      </div>

                      <div
                        style={{
                          color:
                            "var(--text-secondary)",
                        }}
                      >
                        🕒 Time

                        <strong
                          style={{
                            display:
                              "block",
                            marginTop:
                              "5px",
                            color:
                              "var(--text-primary)",
                          }}
                        >
                          {item.time ||
                            "Unknown"}
                        </strong>
                      </div>

                      <div
                        style={{
                          color:
                            "var(--text-secondary)",
                        }}
                      >
                        🌦 Weather

                        <strong
                          style={{
                            display:
                              "block",
                            marginTop:
                              "5px",
                            color:
                              "var(--text-primary)",
                          }}
                        >
                          {item.weather ||
                            "Unknown"}
                        </strong>
                      </div>
                    </div>

                    {item.createdAt && (
                      <p
                        style={{
                          marginTop:
                            "15px",
                          marginBottom:
                            0,
                          paddingTop:
                            "10px",
                          borderTop:
                            "1px solid var(--border)",
                          fontSize:
                            "12px",
                          color:
                            "var(--text-subtle)",
                        }}
                      >
                        🕒 Recorded:{" "}
                        {new Date(
                          item.createdAt
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}
    </div>
  );
}

export default PredictionHistory;