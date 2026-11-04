import { API_BASE } from "../config/api.js";
import { useEffect, useState } from "react";
import axios from "axios";

function AdminAnalytics() {
  const [stats, setStats] = useState({
    totalIncidents: 0,
    highSeverity: 0,
    totalPredictions: 0,
  });

  const [loading, setLoading] =
    useState(true);



  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const token =
        localStorage.getItem("token");

      const headers = {
        Authorization:
          `Bearer ${token}`,
      };

      const [
        incidentsRes,
        predictionsRes,
      ] = await Promise.all([
        axios.get(
          `${API_BASE}/api/incidents`,
          { headers }
        ),

        axios.get(
          `${API_BASE}/api/predictions`,
          { headers }
        ),
      ]);

      const incidents =
        incidentsRes.data?.incidents || [];

      const predictions =
        predictionsRes.data?.predictions || [];

      const highSeverity =
        incidents.filter(
          (item) =>
            item.severity?.toLowerCase() ===
            "high"
        ).length;

      setStats({
        totalIncidents:
          incidents.length,

        highSeverity,

        totalPredictions:
          predictions.length,
      });
    } catch (error) {
      console.log(
        "Admin analytics error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
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
          📊 Admin Analytics
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
          Overview of current incident and
          prediction activity.
        </p>
      </div>

      {loading ? (
        <div
          style={{
            background:
              "var(--app-surface-2)",
            padding: "30px",
            borderRadius: "15px",
            textAlign: "center",
            color:
              "var(--text-muted)",
            border:
              "1px dashed var(--border)",
          }}
        >
          Loading analytics...
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(200px,1fr))",
            gap: "15px",
          }}
        >
          <div
            className="card"
            style={{
              minHeight: "140px",
            }}
          >
            <span
              style={{
                color:
                  "var(--text-muted)",
                fontSize: "14px",
                fontWeight: "700",
              }}
            >
              Total Incidents
            </span>

            <h2
              style={{
                marginTop: "12px",
                fontSize: "36px",
              }}
            >
              {stats.totalIncidents}
            </h2>
          </div>

          <div
            className="card"
            style={{
              minHeight: "140px",
            }}
          >
            <span
              style={{
                color:
                  "var(--text-muted)",
                fontSize: "14px",
                fontWeight: "700",
              }}
            >
              High Severity
            </span>

            <h2
              style={{
                marginTop: "12px",
                fontSize: "36px",
                color: "#EF4444",
              }}
            >
              {stats.highSeverity}
            </h2>
          </div>

          <div
            className="card"
            style={{
              minHeight: "140px",
            }}
          >
            <span
              style={{
                color:
                  "var(--text-muted)",
                fontSize: "14px",
                fontWeight: "700",
              }}
            >
              Predictions
            </span>

            <h2
              style={{
                marginTop: "12px",
                fontSize: "36px",
                color:
                  "var(--accent)",
              }}
            >
              {stats.totalPredictions}
            </h2>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAnalytics;