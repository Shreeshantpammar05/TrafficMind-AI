import { API_BASE } from "../config/api.js";
import { useEffect, useState } from "react";
import axios from "axios";

import {
  FaRoute,
  FaMapMarkerAlt,
  FaClock,
  FaTrafficLight,
  FaArrowRight,
  FaBrain,
  FaExclamationTriangle,
  FaSyncAlt,
} from "react-icons/fa";



function EmergencyPredictionPanel({
  emergencyId,
}) {
  const [prediction, setPrediction] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const fetchPrediction = async (
    manual = false
  ) => {
    if (!emergencyId) {
      setPrediction(null);
      setLoading(false);
      return;
    }

    try {
      setError("");

      if (manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response =
        await axios.get(
          `${API_BASE}/api/emergency-prediction/${encodeURIComponent(
            emergencyId
          )}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem(
                "token"
              )}`,
            },
          }
        );

      setPrediction(
        response.data
      );
    } catch (err) {
      console.error(
        "Prediction fetch error:",
        err
      );

      setError(
        err?.response?.data?.error ||
          "Unable to load next-camera prediction."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrediction();

    const interval =
      setInterval(() => {
        fetchPrediction(true);
      }, 15000);

    return () =>
      clearInterval(interval);
  }, [emergencyId]);

  if (!emergencyId) {
    return null;
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div
        style={{
          padding: "20px",
          borderRadius: "16px",
          background:
            "var(--app-surface)",
          border:
            "1px solid var(--border)",
          color:
            "var(--text-muted)",
          textAlign: "center",
        }}
      >
        <FaSyncAlt
          style={{
            animation:
              "phase19spin 1s linear infinite",
          }}
        />

        <div
          style={{
            marginTop: "8px",
            fontSize: "12px",
          }}
        >
          Calculating next-camera prediction...
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div
        style={{
          padding: "18px",
          borderRadius: "16px",
          background:
            "rgba(239,68,68,.08)",
          border:
            "1px solid rgba(239,68,68,.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#EF4444",
            fontWeight: "800",
            fontSize: "13px",
          }}
        >
          <FaExclamationTriangle />
          Prediction unavailable
        </div>

        <div
          style={{
            marginTop: "6px",
            fontSize: "11px",
            color:
              "var(--text-muted)",
          }}
        >
          {error}
        </div>

        <button
          type="button"
          onClick={() =>
            fetchPrediction(true)
          }
          style={{
            marginTop: "10px",
            border: "none",
            borderRadius: "8px",
            padding: "8px 12px",
            background: "#EF4444",
            color: "#fff",
            fontSize: "11px",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (
    !prediction ||
    !prediction.predictedNextCamera
  ) {
    return (
      <div
        style={{
          padding: "20px",
          borderRadius: "16px",
          background:
            "var(--app-surface)",
          border:
            "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "800",
            color:
              "var(--text-primary)",
          }}
        >
          <FaRoute />
          Next-Camera Prediction
        </div>

        <div
          style={{
            marginTop: "10px",
            fontSize: "12px",
            color:
              "var(--text-muted)",
          }}
        >
          No downstream camera is currently
          available for prediction.
        </div>
      </div>
    );
  }

  const top =
    prediction.predictedNextCamera;

  const probability =
    Math.round(
      top.probabilityPercent
    );

  return (
    <>
      <div
        style={{
          padding: "18px",
          borderRadius: "18px",
          background:
            "var(--app-surface)",
          border:
            "1px solid var(--border)",
          boxShadow:
            "0 14px 35px rgba(0,0,0,.12)",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "rgba(139,92,246,.12)",
                border:
                  "1px solid rgba(139,92,246,.25)",
              }}
            >
              <FaBrain
                color="#8B5CF6"
                size={16}
              />
            </div>

            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "900",
                  color:
                    "var(--text-primary)",
                }}
              >
                Predictive Next Camera
              </div>

              <div
                style={{
                  marginTop: "2px",
                  fontSize: "10px",
                  color:
                    "var(--text-muted)",
                }}
              >
                Phase 19 • Explainable prediction
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              fetchPrediction(true)
            }
            title="Refresh prediction"
            disabled={refreshing}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border:
                "1px solid var(--border)",
              background:
                "var(--app-surface-2)",
              color:
                "var(--text-muted)",
              cursor:
                refreshing
                  ? "default"
                  : "pointer",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
            }}
          >
            <FaSyncAlt
              size={11}
              style={{
                animation: refreshing
                  ? "phase19spin 1s linear infinite"
                  : "none",
              }}
            />
          </button>
        </div>

        {/* CURRENT → NEXT */}

        <div
          style={{
            marginTop: "16px",
            display: "grid",
            gridTemplateColumns:
              "1fr auto 1fr",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              padding: "13px",
              borderRadius: "12px",
              background:
                "var(--app-surface-2)",
              border:
                "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize: "9px",
                fontWeight: "800",
                color:
                  "var(--text-muted)",
                textTransform:
                  "uppercase",
              }}
            >
              Current
            </div>

            <div
              style={{
                marginTop: "5px",
                fontSize: "14px",
                fontWeight: "900",
                color:
                  "var(--text-primary)",
              }}
            >
              {prediction.currentCameraId}
            </div>
          </div>

          <FaArrowRight
            size={14}
            color="#8B5CF6"
          />

          <div
            style={{
              padding: "13px",
              borderRadius: "12px",
              background:
                "rgba(139,92,246,.08)",
              border:
                "1px solid rgba(139,92,246,.25)",
            }}
          >
            <div
              style={{
                fontSize: "9px",
                fontWeight: "800",
                color:
                  "#8B5CF6",
                textTransform:
                  "uppercase",
              }}
            >
              Predicted Next
            </div>

            <div
              style={{
                marginTop: "5px",
                fontSize: "14px",
                fontWeight: "900",
                color:
                  "var(--text-primary)",
              }}
            >
              {top.cameraId}
            </div>
          </div>
        </div>

        {/* CONFIDENCE */}

        <div
          style={{
            marginTop: "13px",
            padding: "13px",
            borderRadius: "12px",
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
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: "800",
                color:
                  "var(--text-muted)",
                textTransform:
                  "uppercase",
              }}
            >
              Likelihood
            </span>

            <strong
              style={{
                fontSize: "17px",
                color: "#8B5CF6",
              }}
            >
              {probability}%
            </strong>
          </div>

          <div
            style={{
              marginTop: "8px",
              width: "100%",
              height: "7px",
              borderRadius: "20px",
              background:
                "var(--border)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${probability}%`,
                height: "100%",
                borderRadius: "20px",
                background:
                  "#8B5CF6",
                transition:
                  "width .4s ease",
              }}
            />
          </div>
        </div>

        {/* ETA + DISTANCE */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: "8px",
            marginTop: "8px",
          }}
        >
          <div
            style={{
              padding: "11px",
              borderRadius: "11px",
              background:
                "var(--app-surface-2)",
              border:
                "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "6px",
                alignItems: "center",
                fontSize: "9px",
                fontWeight: "800",
                color:
                  "var(--text-muted)",
              }}
            >
              <FaClock />
              ETA
            </div>

            <div
              style={{
                marginTop: "5px",
                fontSize: "14px",
                fontWeight: "900",
                color:
                  "var(--text-primary)",
              }}
            >
              {top.etaText}
            </div>
          </div>

          <div
            style={{
              padding: "11px",
              borderRadius: "11px",
              background:
                "var(--app-surface-2)",
              border:
                "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "6px",
                alignItems: "center",
                fontSize: "9px",
                fontWeight: "800",
                color:
                  "var(--text-muted)",
              }}
            >
              <FaMapMarkerAlt />
              Distance
            </div>

            <div
              style={{
                marginTop: "5px",
                fontSize: "14px",
                fontWeight: "900",
                color:
                  "var(--text-primary)",
              }}
            >
              {top.distanceMeters != null
                ? `${Math.round(
                    top.distanceMeters
                  )} m`
                : "N/A"}
            </div>
          </div>
        </div>

        {/* ROAD / DIRECTION */}

        <div
          style={{
            marginTop: "8px",
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: "8px",
          }}
        >
          <div
            style={{
              padding: "10px",
              borderRadius: "10px",
              background:
                "var(--app-surface-2)",
              border:
                "1px solid var(--border)",
              fontSize: "10px",
            }}
          >
            <div
              style={{
                color:
                  "var(--text-muted)",
                fontWeight: "700",
              }}
            >
              Road
            </div>

            <div
              style={{
                marginTop: "4px",
                color:
                  "var(--text-primary)",
                fontWeight: "800",
              }}
            >
              {top.roadName ||
                "Road data unavailable"}
            </div>
          </div>

          <div
            style={{
              padding: "10px",
              borderRadius: "10px",
              background:
                "var(--app-surface-2)",
              border:
                "1px solid var(--border)",
              fontSize: "10px",
            }}
          >
            <div
              style={{
                color:
                  "var(--text-muted)",
                fontWeight: "700",
              }}
            >
              Direction
            </div>

            <div
              style={{
                marginTop: "4px",
                color:
                  "var(--text-primary)",
                fontWeight: "800",
              }}
            >
              {top.direction ||
                "UNKNOWN"}
            </div>
          </div>
        </div>

        {/* TRAFFIC */}

        <div
          style={{
            marginTop: "8px",
            padding: "10px",
            borderRadius: "10px",
            background:
              "var(--app-surface-2)",
            border:
              "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <FaTrafficLight
            size={13}
            color="#F59E0B"
          />

          <div
            style={{
              fontSize: "10px",
              color:
                "var(--text-muted)",
            }}
          >
            Traffic condition:
          </div>

          <strong
            style={{
              fontSize: "10px",
              color:
                "var(--text-primary)",
            }}
          >
            {top.trafficLevel}
          </strong>
        </div>

        {/* EXPLANATION */}

        {top.factors?.length > 0 && (
          <div
            style={{
              marginTop: "12px",
              padding: "12px",
              borderRadius: "11px",
              background:
                "rgba(139,92,246,.06)",
              border:
                "1px solid rgba(139,92,246,.15)",
            }}
          >
            <div
              style={{
                fontSize: "9px",
                fontWeight: "900",
                color:
                  "#8B5CF6",
                textTransform:
                  "uppercase",
                letterSpacing:
                  ".06em",
              }}
            >
              Why TrafficMind predicts this
            </div>

            {top.factors.map(
              (factor, index) => (
                <div
                  key={`${factor}-${index}`}
                  style={{
                    marginTop: "6px",
                    display: "flex",
                    gap: "7px",
                    fontSize: "10px",
                    color:
                      "var(--text-muted)",
                  }}
                >
                  <span
                    style={{
                      color:
                        "#8B5CF6",
                      fontWeight: "900",
                    }}
                  >
                    ✓
                  </span>

                  <span>
                    {factor}
                  </span>
                </div>
              )
            )}
          </div>
        )}

        {/* ALTERNATIVES */}

        {prediction.predictions?.length >
          1 && (
          <div
            style={{
              marginTop: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "9px",
                fontWeight: "900",
                color:
                  "var(--text-muted)",
                textTransform:
                  "uppercase",
              }}
            >
              <FaRoute size={9} />
              Alternative predictions
            </div>

            {prediction.predictions
              .slice(1, 4)
              .map((item) => (
                <div
                  key={item.cameraId}
                  style={{
                    marginTop: "6px",
                    padding:
                      "8px 10px",
                    borderRadius: "9px",
                    background:
                      "var(--app-surface-2)",
                    border:
                      "1px solid var(--border)",
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    fontSize: "10px",
                  }}
                >
                  <span
                    style={{
                      fontWeight: "800",
                      color:
                        "var(--text-primary)",
                    }}
                  >
                    #{item.rank}{" "}
                    {item.cameraId}
                  </span>

                  <span
                    style={{
                      color:
                        "var(--text-muted)",
                    }}
                  >
                    {Math.round(
                      item.probability *
                        100
                    )}
                    %
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* MODEL NOTE */}

        <div
          style={{
            marginTop: "12px",
            paddingTop: "9px",
            borderTop:
              "1px solid var(--border)",
            fontSize: "9px",
            color:
              "var(--text-muted)",
            lineHeight: "1.5",
          }}
        >
          Explainable prediction using
          camera-graph and live emergency
          context. This is a deterministic
          prediction engine, not a trained
          probability model.
        </div>
      </div>

      <style>
        {`
          @keyframes phase19spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </>
  );
}

export default EmergencyPredictionPanel;