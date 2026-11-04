import { API_BASE } from "../config/api.js";
import { useEffect, useState } from "react";
import axios from "axios";

function TrafficZoneStatus({ camera }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");
  const [lastChecked, setLastChecked] =
    useState(null);



  useEffect(() => {
    if (!camera?.cameraId) {
      setData(null);
      setError("");
      setLastChecked(null);
      return;
    }

    fetchDetection();

    const interval = setInterval(
      fetchDetection,
      5000
    );

    return () =>
      clearInterval(interval);
  }, [camera]);

  const fetchDetection = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(
        `${API_BASE}/api/camera-detections/${encodeURIComponent(
          camera.cameraId
        )}/latest`,
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
        res.data?.detection || null
      );

      setLastChecked(new Date());
    } catch (error) {
      console.log(
        "Traffic zone error:",
        error
      );

      setError(
        "Traffic zone data is currently unavailable."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!camera) {
    return (
      <div className="section-card">
        <h2
          style={{
            color:
              "var(--text-primary)",
          }}
        >
          📍 Traffic Zone Intelligence
        </h2>

        <p
          style={{
            color:
              "var(--text-muted)",
            marginBottom: 0,
          }}
        >
          Select a traffic camera to view
          camera-specific AI results.
        </p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="section-card">
        <h2
          style={{
            color:
              "var(--text-primary)",
          }}
        >
          📍 Traffic Zone Intelligence
        </h2>

        <p
          style={{
            color:
              "var(--text-muted)",
            marginBottom: 0,
          }}
        >
          Loading AI results for{" "}
          {camera.name}...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="section-card">
        <h2
          style={{
            color:
              "var(--text-primary)",
          }}
        >
          📍 Traffic Zone Intelligence
        </h2>

        <p
          style={{
            color:
              "var(--text-muted)",
          }}
        >
          No detection data available for{" "}
          {camera.name}.
        </p>

        {error && (
          <p
            style={{
              color: "#F59E0B",
              fontSize: "13px",
              marginBottom: 0,
            }}
          >
            ⚠️ {error}
          </p>
        )}
      </div>
    );
  }

  const averageConfidence =
    Number(
      data.averageConfidence || 0
    ) * 100;

  const maxConfidence =
    Number(
      data.maxConfidence || 0
    ) * 100;

  let confidenceQuality = "LOW";

  if (averageConfidence >= 90) {
    confidenceQuality = "HIGH";
  } else if (
    averageConfidence >= 70
  ) {
    confidenceQuality = "MEDIUM";
  }

  const confidenceColor =
    confidenceQuality === "HIGH"
      ? "#22C55E"
      : confidenceQuality === "MEDIUM"
      ? "#F59E0B"
      : "#EF4444";

  const congestionColor =
    data.congestion === "HIGH"
      ? "#EF4444"
      : data.congestion === "MEDIUM"
      ? "#F59E0B"
      : "#22C55E";

  const risk =
    data.accidentDetected
      ? "CRITICAL"
      : data.emergencyDetected
      ? "EMERGENCY"
      : "NORMAL";

  const riskColor =
    risk === "CRITICAL"
      ? "#EF4444"
      : risk === "EMERGENCY"
      ? "#F97316"
      : "#22C55E";

  const detectionTimestamp =
    data.updatedAt ||
    data.detectedAt;

  const detectionAge =
    detectionTimestamp
      ? Math.max(
          0,
          Math.floor(
            (Date.now() -
              new Date(
                detectionTimestamp
              ).getTime()) /
              1000
          )
        )
      : null;

  const isFresh =
    detectionAge !== null &&
    detectionAge <= 15;

  const sourceLabel =
    String(
      camera.source ?? ""
    ) === "0"
      ? "Local Webcam"
      : camera.source ||
        "Configured Camera Source";

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
          alignItems:
            "flex-start",
          gap: "20px",
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
            📍 Traffic Zone Intelligence
          </h2>

          <p
            style={{
              color:
                "var(--text-muted)",
              marginBottom: 0,
            }}
          >
            {camera.name} —{" "}
            {camera.location}
          </p>
        </div>

        <div
          style={{
            color: isFresh
              ? "#22C55E"
              : "#F59E0B",
            fontWeight: "800",
            background:
              isFresh
                ? "rgba(34,197,94,.10)"
                : "rgba(245,158,11,.10)",
            border:
              `1px solid ${
                isFresh
                  ? "rgba(34,197,94,.22)"
                  : "rgba(245,158,11,.22)"
              }`,
            padding:
              "6px 10px",
            borderRadius:
              "999px",
            fontSize:
              "11px",
            whiteSpace:
              "nowrap",
          }}
        >
          {isFresh
            ? "🟢 AI DATA LIVE"
            : "🟡 DATA STALE"}
        </div>
      </div>

      <div
        style={{
          marginTop: "15px",
          background:
            "var(--app-surface-2)",
          border:
            "1px solid var(--border)",
          padding: "14px",
          borderRadius: "12px",
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: "12px",
        }}
      >
        <div>
          <span
            style={{
              color:
                "var(--text-subtle)",
              fontSize:
                "12px",
            }}
          >
            Camera ID
          </span>

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
            {camera.cameraId}
          </strong>
        </div>

        <div>
          <span
            style={{
              color:
                "var(--text-subtle)",
              fontSize:
                "12px",
            }}
          >
            Source
          </span>

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
            {sourceLabel}
          </strong>
        </div>

        <div>
          <span
            style={{
              color:
                "var(--text-subtle)",
              fontSize:
                "12px",
            }}
          >
            AI Enabled
          </span>

          <strong
            style={{
              display:
                "block",
              marginTop:
                "5px",
              color:
                camera.aiEnabled
                  ? "#22C55E"
                  : "#EF4444",
            }}
          >
            {camera.aiEnabled
              ? "YES"
              : "NO"}
          </strong>
        </div>

        <div>
          <span
            style={{
              color:
                "var(--text-subtle)",
              fontSize:
                "12px",
            }}
          >
            Last Detection
          </span>

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
            {detectionAge === null
              ? "No data"
              : detectionAge < 5
              ? "Just now"
              : `${detectionAge}s ago`}
          </strong>
        </div>
      </div>

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
            }}
          >
            🚗 Vehicles
          </span>

          <h2>
            {data.vehicleCount ?? 0}
          </h2>
        </div>

        <div className="card">
          <span
            style={{
              color:
                "var(--text-muted)",
            }}
          >
            🚦 Congestion
          </span>

          <h2
            style={{
              color:
                congestionColor,
            }}
          >
            {data.congestion ||
              "LOW"}
          </h2>
        </div>

        <div className="card">
          <span
            style={{
              color:
                "var(--text-muted)",
            }}
          >
            🤖 AI Confidence
          </span>

          <h2>
            {averageConfidence.toFixed(
              1
            )}
            %
          </h2>
        </div>

        <div className="card">
          <span
            style={{
              color:
                "var(--text-muted)",
            }}
          >
            📊 Confidence Quality
          </span>

          <h2
            style={{
              color:
                confidenceColor,
            }}
          >
            {confidenceQuality}
          </h2>
        </div>

        <div className="card">
          <span
            style={{
              color:
                "var(--text-muted)",
            }}
          >
            🎯 Best Detection
          </span>

          <h2>
            {maxConfidence.toFixed(
              1
            )}
            %
          </h2>
        </div>

        <div className="card">
          <span
            style={{
              color:
                "var(--text-muted)",
            }}
          >
            ⚠️ Risk
          </span>

          <h2
            style={{
              color:
                riskColor,
            }}
          >
            {risk}
          </h2>
        </div>
      </div>

      <div
        style={{
          marginTop: "18px",
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: "15px",
        }}
      >
        <div
          style={{
            background:
              data.accidentDetected
                ? "rgba(239,68,68,.12)"
                : "var(--app-surface-2)",
            border:
              data.accidentDetected
                ? "1px solid rgba(239,68,68,.24)"
                : "1px solid var(--border)",
            padding: "16px",
            borderRadius: "12px",
          }}
        >
          <span
            style={{
              color:
                "var(--text-secondary)",
              fontSize:
                "13px",
              fontWeight:
                "700",
            }}
          >
            Accident Detection
          </span>

          <h3
            style={{
              color:
                data.accidentDetected
                  ? "#EF4444"
                  : "#22C55E",
              marginBottom: 0,
            }}
          >
            {data.accidentDetected
              ? `DETECTED — ${
                  data.accidentSeverity ||
                  "HIGH"
                }`
              : "NO ACCIDENT"}
          </h3>
        </div>

        <div
          style={{
            background:
              data.emergencyDetected
                ? "rgba(249,115,22,.12)"
                : "var(--app-surface-2)",
            border:
              data.emergencyDetected
                ? "1px solid rgba(249,115,22,.24)"
                : "1px solid var(--border)",
            padding: "16px",
            borderRadius: "12px",
          }}
        >
          <span
            style={{
              color:
                "var(--text-secondary)",
              fontSize:
                "13px",
              fontWeight:
                "700",
            }}
          >
            Emergency Status
          </span>

          <h3
            style={{
              color:
                data.emergencyDetected
                  ? "#F97316"
                  : "#22C55E",
              marginBottom: 0,
            }}
          >
            {data.emergencyDetected
              ? "EMERGENCY ACTIVE"
              : "NORMAL"}
          </h3>
        </div>
      </div>

      <div
        style={{
          marginTop: "18px",
          background:
            "var(--app-surface-2)",
          border:
            "1px solid var(--border)",
          padding: "18px",
          borderRadius: "15px",
        }}
      >
        <strong
          style={{
            color:
              "var(--text-primary)",
          }}
        >
          💡 AI Recommendation
        </strong>

        <p
          style={{
            color:
              "var(--text-secondary)",
            marginTop:
              "8px",
            marginBottom: 0,
            lineHeight:
              "1.6",
          }}
        >
          {data.recommendation ||
            "No recommendation available."}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          marginTop: "12px",
          color:
            "var(--text-subtle)",
          fontSize: "12px",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <span>
          Latest result belongs to{" "}
          <strong
            style={{
              color:
                "var(--text-secondary)",
            }}
          >
            {camera.cameraId}
          </strong>
        </span>

        {lastChecked && (
          <span>
            Checked{" "}
            {lastChecked.toLocaleTimeString()}
          </span>
        )}
      </div>

      {error && (
        <p
          style={{
            color:
              "#F59E0B",
            fontSize:
              "13px",
            marginBottom: 0,
          }}
        >
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}

export default TrafficZoneStatus;