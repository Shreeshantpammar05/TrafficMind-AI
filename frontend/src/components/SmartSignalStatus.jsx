import {
  useEffect,
  useState,
} from "react";

import axios from "axios";

function SmartSignalStatus() {
  const [data, setData] =
    useState(null);

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
    fetchSignal();

    const interval =
      setInterval(
        fetchSignal,
        5000
      );

    return () =>
      clearInterval(interval);
  }, []);

  const fetchSignal = async () => {
    try {
      const res =
        await axios.get(
          `${API_BASE}/api/smart-signal/multi-lane`,
          {
            headers:
              getAuthHeaders(),
          }
        );

      setData(
        res.data || null
      );

      setError("");
    } catch (error) {
      console.log(
        "Smart signal error:",
        error
      );

      setError(
        "Smart signal data is currently unavailable."
      );
    } finally {
      setLoading(false);
    }
  };

  const congestionColor =
    data?.congestion === "HIGH"
      ? "#EF4444"
      : data?.congestion === "MEDIUM"
      ? "#F59E0B"
      : "#22C55E";

  const riskColor =
    data?.riskLevel === "CRITICAL"
      ? "#EF4444"
      : data?.riskLevel === "HIGH"
      ? "#F97316"
      : data?.riskLevel === "MEDIUM"
      ? "#F59E0B"
      : "#22C55E";

  const predictedColor =
    data?.predictedCongestion ===
    "HIGH"
      ? "#EF4444"
      : data?.predictedCongestion ===
        "MEDIUM"
      ? "#F59E0B"
      : "#22C55E";

  const predictiveRiskColor =
    data?.predictedRisk ===
    "CRITICAL"
      ? "#EF4444"
      : data?.predictedRisk ===
        "HIGH"
      ? "#F97316"
      : data?.predictedRisk ===
        "MEDIUM"
      ? "#F59E0B"
      : "#22C55E";

  if (loading) {
    return (
      <div
        className="section-card"
        style={{
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            color:
              "var(--text-primary)",
          }}
        >
          🚦 Smart Signal Optimization
        </h2>

        <p
          style={{
            color:
              "var(--text-muted)",
            marginTop: "10px",
          }}
        >
          Loading signal intelligence...
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div
        className="section-card"
        style={{
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            color:
              "var(--text-primary)",
          }}
        >
          🚦 Smart Signal Optimization
        </h2>

        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            background:
              "var(--app-surface-2)",
            border:
              "1px solid var(--border)",
            borderRadius: "12px",
            color:
              "var(--text-muted)",
          }}
        >
          {error}
        </div>
      </div>
    );
  }

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
          gap: "15px",
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
            🚦 Smart Signal Optimization
          </h2>

          <p
            style={{
              color:
                "var(--text-muted)",
              marginTop: "6px",
              marginBottom: 0,
            }}
          >
            Signal timing using live traffic
            and predictive intelligence.
          </p>
        </div>

        <div
          style={{
            background:
              "var(--accent-soft)",
            color:
              "#22C55E",
            padding:
              "7px 12px",
            borderRadius:
              "18px",
            fontSize:
              "12px",
            fontWeight:
              "700",
            whiteSpace:
              "nowrap",
            border:
              "1px solid var(--border)",
          }}
        >
          LIVE + AI
        </div>
      </div>

      {/* Current status */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: "15px",
          marginTop: "20px",
        }}
      >
        <div className="card">
          <span
            style={{
              color:
                "var(--text-muted)",
              fontSize:
                "14px",
            }}
          >
            Priority Camera
          </span>

          <h2
            style={{
              marginTop:
                "10px",
              color:
                "var(--text-primary)",
            }}
          >
            {data?.priorityCamera
              ?.cameraId ||
              "NORMAL"}
          </h2>
        </div>

        <div className="card">
          <span
            style={{
              color:
                "var(--text-muted)",
              fontSize:
                "14px",
            }}
          >
            Congestion
          </span>

          <h2
            style={{
              marginTop:
                "10px",
              color:
                congestionColor,
            }}
          >
            {data?.congestion ||
              "LOW"}
          </h2>
        </div>

        <div className="card">
          <span
            style={{
              color:
                "var(--text-muted)",
              fontSize:
                "14px",
            }}
          >
            Risk Level
          </span>

          <h2
            style={{
              marginTop:
                "10px",
              color:
                riskColor,
            }}
          >
            {data?.riskLevel ||
              "LOW"}
          </h2>
        </div>

        <div className="card">
          <span
            style={{
              color:
                "var(--text-muted)",
              fontSize:
                "14px",
            }}
          >
            Signal Time
          </span>

          <h2
            style={{
              marginTop:
                "10px",
              color:
                "var(--text-primary)",
            }}
          >
            {data?.greenTime?.[
              data?.priorityLane
            ] ||
              data?.greenTime?.[
                data?.priorityCamera
                  ?.cameraId
              ] ||
              15}s
          </h2>
        </div>
      </div>

      {/* Predictive status */}

      <div
        style={{
          marginTop: "20px",
          background:
            "var(--app-surface-2)",
          padding: "18px",
          borderRadius: "15px",
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
              "center",
            gap: "12px",
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
              🔮 Predictive Signal Intelligence
            </h3>

            <p
              style={{
                margin:
                  "6px 0 0",
                color:
                  "var(--text-muted)",
                fontSize:
                  "13px",
              }}
            >
              Signal control reacts to predicted traffic,
              not only current traffic.
            </p>
          </div>

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
            PROACTIVE
          </span>
        </div>

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(180px,1fr))",
            gap:
              "12px",
            marginTop:
              "18px",
          }}
        >
          <div className="card">
            <span>
              Predicted Congestion
            </span>

            <h2
              style={{
                color:
                  predictedColor,
                marginTop:
                  "10px",
              }}
            >
              {
                data?.predictedCongestion ||
                "LOW"
              }
            </h2>
          </div>

          <div className="card">
            <span>
              Predicted Risk
            </span>

            <h2
              style={{
                color:
                  predictiveRiskColor,
                marginTop:
                  "10px",
              }}
            >
              {
                data?.predictedRisk ||
                "LOW"
              }
            </h2>
          </div>

          <div className="card">
            <span>
              Rising Cameras
            </span>

            <h2
              style={{
                marginTop:
                  "10px",
              }}
            >
              {
                data?.risingCameraCount ??
                0
              }
            </h2>
          </div>
        </div>

        {data?.priorityCamera && (
          <div
            style={{
              marginTop:
                "15px",
              padding:
                "14px",
              borderRadius:
                "12px",
              background:
                "var(--app-surface)",
              border:
                "1px solid var(--border)",
            }}
          >
            <div
              style={{
                color:
                  "var(--text-muted)",
                fontSize:
                  "11px",
                fontWeight:
                  "800",
              }}
            >
              PRIORITY APPROACH
            </div>

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
              {
                data.priorityCamera.name
              }
            </strong>

            <span
              style={{
                display:
                  "block",
                marginTop:
                  "4px",
                color:
                  "var(--text-muted)",
                fontSize:
                  "12px",
              }}
            >
              {
                data.priorityCamera.location
              }
            </span>
          </div>
        )}

        {data?.predictiveAction && (
          <div
            style={{
              marginTop:
                "14px",
              color:
                "var(--text-secondary)",
              lineHeight:
                "1.55",
            }}
          >
            <strong
              style={{
                color:
                  "var(--text-primary)",
              }}
            >
              AI Action:
            </strong>{" "}
            {data.predictiveAction}
          </div>
        )}
      </div>

      {/* Green times */}

      <div
        style={{
          marginTop: "20px",
          background:
            "var(--app-surface-2)",
          padding: "18px",
          borderRadius: "15px",
          border:
            "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom:
              "12px",
          }}
        >
          <h3
            style={{
              margin: 0,
              color:
                "var(--text-primary)",
            }}
          >
            🟢 Lane Green Times
          </h3>

          <span
            style={{
              color:
                "var(--text-subtle)",
              fontSize:
                "12px",
            }}
          >
            seconds
          </span>
        </div>

        {Object.entries(
          data?.greenTime || {}
        ).length ===
        0 ? (
          <p
            style={{
              color:
                "var(--text-muted)",
              margin: 0,
            }}
          >
            No lane timing data available.
          </p>
        ) : (
          Object.entries(
            data.greenTime || {}
          ).map(
            ([lane, time]) => (
              <div
                key={lane}
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  padding:
                    "10px 0",
                  borderBottom:
                    "1px solid var(--border)",
                  color:
                    "var(--text-secondary)",
                }}
              >
                <span>
                  {lane.toUpperCase()}
                </span>

                <strong
                  style={{
                    color:
                      time >= 60
                        ? "#EF4444"
                        : time >= 30
                        ? "#F59E0B"
                        : "#22C55E",
                  }}
                >
                  {time}s
                </strong>
              </div>
            )
          )
        )}
      </div>

      {error && (
        <p
          style={{
            marginTop:
              "12px",
            color:
              "#F59E0B",
            fontSize:
              "13px",
          }}
        >
          ⚠️ Showing the latest
          available signal data.
        </p>
      )}
    </div>
  );
}

export default SmartSignalStatus;