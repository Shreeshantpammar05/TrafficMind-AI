import { API_BASE } from "../config/api.js";
import { useEffect, useState } from "react";
import axios from "axios";



function AIPerformanceCenter() {
  const [evaluation, setEvaluation] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const getAuthHeaders = () => ({
    Authorization:
      `Bearer ${localStorage.getItem("token")}`,
  });

  useEffect(() => {
    fetchEvaluation();
  }, []);

  const fetchEvaluation =
    async () => {
      try {
        setLoading(true);

        const res =
          await axios.get(
            `${API_BASE}/api/ai-evaluations`,
            {
              headers:
                getAuthHeaders(),
            }
          );

        setEvaluation(
          res.data?.evaluations?.[0] ||
            null
        );
      } catch (error) {
        console.log(
          "AI Performance error:",
          error
        );

        setEvaluation(null);
      } finally {
        setLoading(false);
      }
    };

  const metricCards = [
    {
      label: "Precision",
      value:
        `${(
          Number(
            evaluation?.precision || 0
          ) * 100
        ).toFixed(1)}%`,
    },
    {
      label: "Recall",
      value:
        `${(
          Number(
            evaluation?.recall || 0
          ) * 100
        ).toFixed(1)}%`,
    },
    {
      label: "mAP50",
      value:
        `${(
          Number(
            evaluation?.map50 || 0
          ) * 100
        ).toFixed(1)}%`,
    },
    {
      label: "mAP50-95",
      value:
        `${(
          Number(
            evaluation?.map50_95 || 0
          ) * 100
        ).toFixed(1)}%`,
    },
    {
      label: "Validation Images",
      value:
        String(
          evaluation?.datasetImages ?? 0
        ),
    },
    {
      label: "Inference Time",
      value:
        `${evaluation?.inferenceTimeMs ?? 0} ms`,
    },
  ];

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
            margin: 0,
            color:
              "var(--text-primary)",
          }}
        >
          🤖 AI Model Performance
        </h2>

        <div
          style={{
            marginTop: "18px",
            minHeight: "120px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "var(--app-surface-2)",
            border:
              "1px dashed var(--border)",
            borderRadius: "14px",
            color:
              "var(--text-muted)",
          }}
        >
          Loading AI Performance...
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div
        className="section-card"
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
          🤖 AI Model Performance
        </h2>

        <p
          style={{
            color:
              "var(--text-muted)",
            marginTop: "8px",
            marginBottom: 0,
          }}
        >
          No AI evaluation data is
          available yet.
        </p>
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
      <div>
        <h2
          style={{
            margin: 0,
            color:
              "var(--text-primary)",
          }}
        >
          🤖 AI Model Performance
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
          Measured validation performance
          of the accident detection model.
        </p>
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
        {metricCards.map(
          (metric) => (
            <div
              className="card"
              key={metric.label}
              style={{
                minHeight: "125px",
              }}
            >
              <span
                style={{
                  color:
                    "var(--text-muted)",
                  fontSize:
                    "13px",
                  fontWeight:
                    "700",
                }}
              >
                {metric.label}
              </span>

              <h2
                style={{
                  marginTop:
                    "10px",
                  color:
                    "var(--text-primary)",
                }}
              >
                {metric.value}
              </h2>
            </div>
          )
        )}
      </div>

      <div
        style={{
          marginTop: "20px",
          background:
            "var(--app-surface-2)",
          padding: "18px",
          borderRadius: "15px",
          border:
            "1px solid var(--border)",
          color:
            "var(--text-secondary)",
          lineHeight: "1.55",
        }}
      >
        <div>
          <strong
            style={{
              color:
                "var(--text-primary)",
            }}
          >
            Model:
          </strong>{" "}
          {evaluation.modelName ||
            "Unknown"}
        </div>

        <div
          style={{
            marginTop: "12px",
          }}
        >
          <strong
            style={{
              color:
                "var(--text-primary)",
            }}
          >
            Type:
          </strong>{" "}
          {evaluation.modelType ||
            "Unknown"}
        </div>

        <div
          style={{
            marginTop: "12px",
          }}
        >
          <strong
            style={{
              color:
                "var(--text-primary)",
            }}
          >
            Evaluation:
          </strong>{" "}
          Validation dataset
        </div>

        <div
          style={{
            marginTop: "12px",
          }}
        >
          <strong
            style={{
              color:
                "var(--text-primary)",
            }}
          >
            Evaluated:
          </strong>{" "}
          {evaluation.evaluatedAt
            ? new Date(
                evaluation.evaluatedAt
              ).toLocaleString()
            : "Unknown"}
        </div>

        <div
          style={{
            marginTop: "15px",
            paddingTop: "14px",
            borderTop:
              "1px solid var(--border)",
            color:
              "var(--text-muted)",
            fontSize: "13px",
          }}
        >
          Metrics shown are measured on the
          model's validation dataset and are
          not a guarantee of real-world
          performance.
        </div>
      </div>
    </div>
  );
}

export default AIPerformanceCenter;