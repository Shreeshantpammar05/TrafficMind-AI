import {
  useEffect,
  useState,
} from "react";

import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

function TrafficRecommendation() {
  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const getAuthHeaders = () => ({
    Authorization:
      `Bearer ${localStorage.getItem(
        "token"
      )}`,
  });

  useEffect(() => {
    fetchRecommendation();

    const interval =
      setInterval(
        fetchRecommendation,
        5000
      );

    return () =>
      clearInterval(interval);
  }, []);

  const fetchRecommendation =
    async () => {
      try {
        setError("");

        const res =
          await axios.get(
            `${API_BASE}/api/traffic-recommendation`,
            {
              headers:
                getAuthHeaders(),
            }
          );

        setData(
          res.data || null
        );
      } catch (error) {
        console.log(
          "Traffic recommendation error:",
          error
        );

        setError(
          error.response?.data?.error ||
            "Traffic recommendation is currently unavailable."
        );
      } finally {
        setLoading(false);
      }
    };

  const priorityColor =
    data?.priority === "CRITICAL"
      ? "#EF4444"
      : data?.priority === "HIGH"
      ? "#F97316"
      : data?.priority === "MEDIUM"
      ? "#F59E0B"
      : "#22C55E";

  const priorityLabel =
    data?.priority || "NORMAL";

  if (loading && !data) {
    return (
      <div
        className="section-card"
        style={{
          marginBottom: "20px",
        }}
      >
        <h2>
          💡 AI Traffic Recommendation
        </h2>

        <p
          style={{
            color:
              "var(--text-muted)",
            marginTop: "8px",
            marginBottom: 0,
          }}
        >
          Loading recommendation...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="section-card"
        style={{
          marginBottom: "20px",
        }}
      >
        <h2>
          💡 AI Traffic Recommendation
        </h2>

        <div
          style={{
            marginTop: "15px",
            background:
              "var(--app-surface-2)",
            padding: "18px",
            borderRadius: "15px",
            border:
              "1px solid var(--border)",
            color:
              "var(--text-muted)",
          }}
        >
          {error ||
            "No recommendation available."}
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
      {/* Header */}

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
            💡 AI Traffic Recommendation
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
            Current traffic action
            suggested by the AI
            recommendation service.
          </p>
        </div>

        <div
          style={{
            background:
              "var(--app-surface-2)",
            border:
              "1px solid var(--border)",
            padding:
              "7px 12px",
            borderRadius:
              "18px",
            color:
              priorityColor,
            fontSize:
              "12px",
            fontWeight:
              "800",
            whiteSpace:
              "nowrap",
          }}
        >
          {priorityLabel}
        </div>
      </div>

      {/* Recommendation */}

      <div
        style={{
          marginTop: "20px",
          background:
            "var(--app-surface-2)",
          padding: "20px",
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
            gap: "15px",
          }}
        >
          <span
            style={{
              color:
                "var(--text-muted)",
              fontSize: "13px",
            }}
          >
            Priority
          </span>

          <strong
            style={{
              color:
                priorityColor,
            }}
          >
            {priorityLabel}
          </strong>
        </div>

        <div
          style={{
            marginTop: "18px",
            paddingTop: "18px",
            borderTop:
              "1px solid var(--border)",
          }}
        >
          <span
            style={{
              color:
                "var(--text-muted)",
              fontSize: "13px",
              fontWeight: "700",
              letterSpacing:
                ".02em",
            }}
          >
            Recommended Action
          </span>

          <p
            style={{
              marginTop: "8px",
              color:
                "var(--text-primary)",
              fontSize: "16px",
              lineHeight: "1.65",
              marginBottom: 0,
            }}
          >
            {data.action ||
              "No action available."}
          </p>
        </div>
      </div>

      {/* Latest-data warning */}

      {error && (
        <p
          style={{
            marginTop: "12px",
            marginBottom: 0,
            color:
              "#F59E0B",
            fontSize: "13px",
          }}
        >
          ⚠️ Showing the latest available
          recommendation.
        </p>
      )}
    </div>
  );
}

export default TrafficRecommendation;