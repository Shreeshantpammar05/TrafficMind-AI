import {
  useEffect,
  useState,
} from "react";

import axios from "axios";

function AIDecisionPanel({
  camera,
}) {
  const [data, setData] =
    useState(null);

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000";

  useEffect(() => {
    if (!camera?.cameraId) {
      setData(null);
      return;
    }

    fetchDecision();

    const interval =
      setInterval(
        fetchDecision,
        5000
      );

    return () =>
      clearInterval(interval);
  }, [camera]);

  const fetchDecision = async () => {
    try {
      const res =
        await axios.get(
          `${API_BASE}/api/ai-decision/${encodeURIComponent(
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

      setData(
        res.data?.decision ||
          null
      );
    } catch (error) {
      console.log(
        "AI decision error:",
        error
      );
    }
  };

  if (!camera) {
    return (
      <div className="section-card">
        <h2
          style={{
            margin: 0,
            color:
              "var(--text-primary)",
          }}
        >
          🧠 AI Decision Engine
        </h2>

        <p
          style={{
            color:
              "var(--text-muted)",
            marginTop: "8px",
            marginBottom: 0,
            lineHeight: "1.5",
          }}
        >
          Select a traffic camera to
          view AI decisions.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="section-card">
        <h2
          style={{
            margin: 0,
            color:
              "var(--text-primary)",
          }}
        >
          🧠 AI Decision Engine
        </h2>

        <div
          style={{
            marginTop: "15px",
            padding: "16px",
            background:
              "var(--app-surface-2)",
            border:
              "1px dashed var(--border)",
            borderRadius: "12px",
            color:
              "var(--text-muted)",
          }}
        >
          Waiting for AI decision...
        </div>
      </div>
    );
  }

  const priorityColor =
    data.priority ===
    "CRITICAL"
      ? "#EF4444"
      : data.priority ===
        "HIGH"
      ? "#F97316"
      : data.priority ===
        "MEDIUM"
      ? "#F59E0B"
      : "#22C55E";

  const predictionColor =
    data.predictedCongestion ===
    "HIGH"
      ? "#EF4444"
      : data.predictedCongestion ===
        "MEDIUM"
      ? "#F59E0B"
      : "#22C55E";

  const predictiveRiskColor =
    data.predictedRisk ===
    "CRITICAL"
      ? "#EF4444"
      : data.predictedRisk ===
        "HIGH"
      ? "#F97316"
      : data.predictedRisk ===
        "MEDIUM"
      ? "#F59E0B"
      : "#22C55E";

  const confidence =
    Number(
      data.confidence || 0
    );

  return (
    <div
      className="section-card"
      style={{
        marginBottom: "20px",
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
          🧠 AI Decision Engine
        </h2>

        <p
          style={{
            color:
              "var(--text-muted)",
            marginTop: "6px",
            marginBottom: 0,
            lineHeight: "1.5",
          }}
        >
          <strong
            style={{
              color:
                "var(--text-primary)",
            }}
          >
            {camera.name}
          </strong>

          {" — "}

          {camera.location}
        </p>
      </div>

      {/* Core decision */}

      <div
        style={{
          marginTop: "20px",
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: "15px",
        }}
      >
        <div className="card">
          <h3>Decision</h3>

          <h2
            style={{
              color:
                "var(--text-primary)",
            }}
          >
            {data.decision ||
              "—"}
          </h2>
        </div>

        <div className="card">
          <h3>Priority</h3>

          <h2
            style={{
              color:
                priorityColor,
            }}
          >
            {data.priority ||
              "NORMAL"}
          </h2>
        </div>

        <div className="card">
          <h3>AI Confidence</h3>

          <h2>
            {(
              confidence *
              100
            ).toFixed(1)}
            %
          </h2>

          <p
            style={{
              marginTop:
                "5px",
              marginBottom: 0,
              color:
                "var(--text-muted)",
              fontSize:
                "12px",
            }}
          >
            {data.confidenceQuality ||
              "LOW"}{" "}
            confidence
          </p>
        </div>

        <div className="card">
          <h3>Current Risk</h3>

          <h2
            style={{
              color:
                priorityColor,
            }}
          >
            {data.riskLevel ||
              "LOW"}
          </h2>
        </div>
      </div>

      {/* Predictive intelligence */}

      <div
        style={{
          marginTop: "18px",
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
            display:
              "flex",
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
              🔮 Predictive Decision
            </h3>

            <p
              style={{
                margin:
                  "5px 0 0",
                color:
                  "var(--text-muted)",
                fontSize:
                  "12px",
              }}
            >
              Decision uses recent camera
              history and traffic trend.
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
                "10px",
              fontWeight:
                "800",
            }}
          >
            AI FORECAST
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
              "16px",
          }}
        >
          <div className="card">
            <span>
              Trend
            </span>

            <h3
              style={{
                color:
                  data.trend ===
                  "RISING FAST"
                    ? "#EF4444"
                    : data.trend ===
                      "RISING"
                    ? "#F59E0B"
                    : "var(--text-primary)",
              }}
            >
              {data.trend ||
                "STABLE"}
            </h3>
          </div>

          <div className="card">
            <span>
              Predicted Congestion
            </span>

            <h3
              style={{
                color:
                  predictionColor,
              }}
            >
              {
                data.predictedCongestion ||
                "LOW"
              }
            </h3>
          </div>

          <div className="card">
            <span>
              Predicted Risk
            </span>

            <h3
              style={{
                color:
                  predictiveRiskColor,
              }}
            >
              {
                data.predictedRisk ||
                "LOW"
              }
            </h3>
          </div>

          <div className="card">
            <span>
              Current Vehicles
            </span>

            <h3>
              {
                data.vehicleCount ??
                0
              }
            </h3>
          </div>
        </div>
      </div>

      {/* Recommended action */}

      <div
        style={{
          marginTop: "18px",
          background:
            "var(--app-surface-2)",
          padding: "18px",
          borderRadius: "15px",
          border:
            "1px solid var(--border)",
        }}
      >
        <strong
          style={{
            color:
              "var(--text-primary)",
          }}
        >
          Recommended Action
        </strong>

        <p
          style={{
            marginTop:
              "8px",
            color:
              "var(--text-primary)",
            lineHeight:
              "1.6",
            marginBottom:
              "18px",
          }}
        >
          {data.action ||
            "No action available."}
        </p>

        <strong
          style={{
            color:
              "var(--text-primary)",
          }}
        >
          Why?
        </strong>

        <p
          style={{
            marginTop:
              "8px",
            color:
              "var(--text-muted)",
            lineHeight:
              "1.6",
            marginBottom:
              0,
          }}
        >
          {data.explanation ||
            "No explanation available."}
        </p>
      </div>
    </div>
  );
}

export default AIDecisionPanel;