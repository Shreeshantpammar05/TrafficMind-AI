import { API_BASE } from "../config/api.js";
import {
  useEffect,
  useState,
} from "react";

import axios from "axios";



const ONLINE_THRESHOLD = 15;
const STALE_THRESHOLD = 30;

function TrafficCameraSelector({
  onCameraSelect,
}) {
  const [cameras, setCameras] =
    useState([]);

  const [selectedId, setSelectedId] =
    useState("");

  const [detectionStatus, setDetectionStatus] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  const [showAnalysis, setShowAnalysis] =
    useState(false);

  const [imageRefresh, setImageRefresh] =
    useState(Date.now());

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem(
      "token"
    )}`,
  });

  /* =====================================================
     LOAD CAMERAS
  ===================================================== */

  useEffect(() => {
    fetchCameras();
  }, []);

  /* =====================================================
     LIVE CAMERA STATUS
  ===================================================== */

  useEffect(() => {
    if (cameras.length === 0) {
      return;
    }

    fetchDetectionStatus();

    const interval = setInterval(
      fetchDetectionStatus,
      5000
    );

    return () =>
      clearInterval(interval);
  }, [cameras]);

  /* =====================================================
     LIVE ANNOTATED IMAGE REFRESH
  ===================================================== */

  useEffect(() => {
    const interval = setInterval(() => {
      setImageRefresh(
        Date.now()
      );
    }, 2000);

    return () =>
      clearInterval(interval);
  }, []);

  /* =====================================================
     FETCH CAMERAS
  ===================================================== */

  const fetchCameras = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${API_BASE}/api/traffic-cameras`,
        {
          headers:
            getAuthHeaders(),
        }
      );

      const activeCameras =
        res.data?.cameras || [];

      setCameras(activeCameras);

      if (activeCameras.length > 0) {
        setSelectedId(
          activeCameras[0]._id
        );

        onCameraSelect(
          activeCameras[0]
        );
      }
    } catch (error) {
      console.log(
        "Traffic camera fetch error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     CAMERA HEALTH
  ===================================================== */

  const getHealth = (
    timestamp
  ) => {
    if (!timestamp) {
      return {
        status: "OFFLINE",
        color: "#EF4444",
        background:
          "rgba(239,68,68,.10)",
        icon: "🔴",
        label: "AI OFFLINE",
        age: null,
      };
    }

    const age = Math.max(
      0,
      Math.floor(
        (
          Date.now() -
          new Date(
            timestamp
          ).getTime()
        ) / 1000
      )
    );

    if (
      age <= ONLINE_THRESHOLD
    ) {
      return {
        status: "ONLINE",
        color: "#22C55E",
        background:
          "rgba(34,197,94,.10)",
        icon: "🟢",
        label: "AI ONLINE",
        age,
      };
    }

    if (
      age <= STALE_THRESHOLD
    ) {
      return {
        status: "STALE",
        color: "#F59E0B",
        background:
          "rgba(245,158,11,.10)",
        icon: "🟡",
        label: "AI STALE",
        age,
      };
    }

    return {
      status: "OFFLINE",
      color: "#EF4444",
      background:
        "rgba(239,68,68,.10)",
      icon: "🔴",
      label: "AI OFFLINE",
      age,
    };
  };

  /* =====================================================
     FETCH DETECTION STATUS
  ===================================================== */

  const fetchDetectionStatus =
    async () => {
      const results = {};

      await Promise.all(
        cameras.map(
          async (camera) => {
            try {
              const res =
                await axios.get(
                  `${API_BASE}/api/camera-detections/${encodeURIComponent(
                    camera.cameraId
                  )}/latest`,
                  {
                    headers:
                      getAuthHeaders(),
                  }
                );

              const detection =
                res.data?.detection;

              if (!detection) {
                results[
                  camera.cameraId
                ] = {
                  health:
                    getHealth(null),
                  lastUpdate: null,
                  detection: null,
                };

                return;
              }

              const timestamp =
                detection.updatedAt ||
                detection.detectedAt ||
                null;

              results[
                camera.cameraId
              ] = {
                health:
                  getHealth(timestamp),
                lastUpdate:
                  timestamp,
                detection,
              };
            } catch (error) {
              results[
                camera.cameraId
              ] = {
                health:
                  getHealth(null),
                lastUpdate: null,
                detection: null,
              };
            }
          }
        )
      );

      setDetectionStatus(
        results
      );
    };

  /* =====================================================
     CAMERA CHANGE
  ===================================================== */

  const handleChange = (e) => {
    const id = e.target.value;

    setSelectedId(id);

    setShowAnalysis(false);

    const camera =
      cameras.find(
        (item) =>
          item._id === id
      );

    onCameraSelect(camera);
  };

  /* =====================================================
     FORMAT LAST UPDATE
  ===================================================== */

  const formatLastUpdate = (
    timestamp
  ) => {
    if (!timestamp) {
      return "No data";
    }

    const age = Math.max(
      0,
      Math.floor(
        (
          Date.now() -
          new Date(
            timestamp
          ).getTime()
        ) / 1000
      )
    );

    if (age < 5) {
      return "Just now";
    }

    if (age < 60) {
      return `${age}s ago`;
    }

    return `${Math.floor(
      age / 60
    )}m ago`;
  };

  /* =====================================================
     SELECTED CAMERA
  ===================================================== */

  const selectedCamera =
    cameras.find(
      (camera) =>
        camera._id === selectedId
    );

  const selectedStatus =
    selectedCamera
      ? detectionStatus[
          selectedCamera
            .cameraId
        ]
      : null;

  /* =====================================================
     NETWORK COUNTS
  ===================================================== */

  const onlineCount =
    cameras.filter(
      (camera) =>
        detectionStatus[
          camera.cameraId
        ]?.health?.status ===
        "ONLINE"
    ).length;

  const staleCount =
    cameras.filter(
      (camera) =>
        detectionStatus[
          camera.cameraId
        ]?.health?.status ===
        "STALE"
    ).length;

  const offlineCount =
    cameras.filter(
      (camera) =>
        detectionStatus[
          camera.cameraId
        ]?.health?.status ===
        "OFFLINE"
    ).length;

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div
        className="section-card"
        style={{
          marginBottom:
            "20px",
        }}
      >
        Loading traffic cameras...
      </div>
    );
  }

  /* =====================================================
     NO CAMERAS
  ===================================================== */

  if (cameras.length === 0) {
    return (
      <div
        className="section-card"
        style={{
          color: "var(--text-muted)",
        }}
      >
        No active traffic cameras
        found.
      </div>
    );
  }

  /* =====================================================
     MAIN UI
  ===================================================== */

  return (
    <div
      className="section-card"
      style={{
        marginBottom:
          "20px",
      }}
    >
      {/* ================================================
          NETWORK HEADER
      ================================================= */}

      <div
        style={{
          display:
            "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          gap: "15px",
          flexWrap:
            "wrap",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
            }}
          >
            📹 Traffic Camera Network
          </h2>

          <p
            style={{
              margin:
                "6px 0 0",
              color:
                "var(--text-muted)",
            }}
          >
            Real-time AI camera
            health monitoring
          </p>
        </div>

        <div
          style={{
            background:
              "var(--app-surface-2)",
            padding:
              "8px 12px",
            borderRadius:
              "18px",
            color:
              "var(--text-muted)",
            fontSize:
              "12px",
            fontWeight:
              "700",
          }}
        >
          🔄 Auto refresh: 5s
        </div>
      </div>

      {/* ================================================
          NETWORK SUMMARY
      ================================================= */}

      <div
        style={{
          display:
            "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(150px,1fr))",
          gap: "12px",
          marginTop:
            "18px",
        }}
      >
        <div
          style={{
            background:
              "rgba(34,197,94,.10)",
            border:
              "1px solid rgba(34,197,94,.20)",
            padding:
              "14px",
            borderRadius:
              "12px",
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
            Online
          </span>

          <h2
            style={{
              margin:
                "6px 0 0",
              color:
                "#22C55E",
            }}
          >
            {onlineCount}
          </h2>
        </div>

        <div
          style={{
            background:
              "rgba(245,158,11,.10)",
            border:
              "1px solid rgba(245,158,11,.20)",
            padding:
              "14px",
            borderRadius:
              "12px",
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
            Stale
          </span>

          <h2
            style={{
              margin:
                "6px 0 0",
              color:
                "#F59E0B",
            }}
          >
            {staleCount}
          </h2>
        </div>

        <div
          style={{
            background:
              "rgba(239,68,68,.10)",
            border:
              "1px solid rgba(239,68,68,.20)",
            padding:
              "14px",
            borderRadius:
              "12px",
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
            Offline
          </span>

          <h2
            style={{
              margin:
                "6px 0 0",
              color:
                "#EF4444",
            }}
          >
            {offlineCount}
          </h2>
        </div>

        <div
          style={{
            background:
              "var(--app-surface-2)",
            border:
              "1px solid var(--border)",
            padding:
              "14px",
            borderRadius:
              "12px",
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
            Total Cameras
          </span>

          <h2
            style={{
              margin:
                "6px 0 0",
              color:
                "var(--text-primary)",
            }}
          >
            {cameras.length}
          </h2>
        </div>
      </div>

      {/* ================================================
          CAMERA SELECTOR
      ================================================= */}

      <div
        style={{
          marginTop:
            "22px",
        }}
      >
        <label
          style={{
            display:
              "block",
            color:
              "var(--text-secondary)",
            marginBottom:
              "8px",
            fontWeight:
              "600",
          }}
        >
          Select Traffic Camera
        </label>

        <select
          value={
            selectedId
          }
          onChange={
            handleChange
          }
          style={{
            width:
              "100%",
            padding:
              "12px",
            borderRadius:
              "10px",
            background:
              "var(--app-surface-2)",
            color:
              "white",
            border:
              "1px solid var(--border-strong)",
            boxSizing:
              "border-box",
          }}
        >
          {cameras.map(
            (camera) => {
              const status =
                detectionStatus[
                  camera.cameraId
                ];

              const health =
                status?.health ||
                getHealth(
                  null
                );

              return (
                <option
                  key={
                    camera._id
                  }
                  value={
                    camera._id
                  }
                >
                  {camera.name} —{" "}
                  {
                    camera.location
                  }{" "}
                  |{" "}
                  {
                    health.label
                  }
                </option>
              );
            }
          )}
        </select>
      </div>

      {/* ================================================
          ALL CAMERA HEALTH CARDS
      ================================================= */}

      <div
        style={{
          marginTop:
            "18px",
          display:
            "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: "12px",
        }}
      >
        {cameras.map(
          (camera) => {
            const status =
              detectionStatus[
                camera.cameraId
              ];

            const health =
              status?.health ||
              getHealth(
                null
              );

            const isSelected =
              selectedId ===
              camera._id;

            return (
              <button
                key={
                  camera._id
                }
                type="button"
                onClick={() => {
                  setSelectedId(
                    camera._id
                  );

                  setShowAnalysis(
                    false
                  );

                  onCameraSelect(
                    camera
                  );
                }}
                style={{
                  textAlign:
                    "left",
                  background:
                    isSelected
                      ? "var(--accent-soft)"
                      : "var(--app-surface-2)",
                  border:
                    `1px solid ${
                      isSelected
                        ? "#2563EB"
                        : "rgba(255,255,255,.06)"
                    }`,
                  borderRadius:
                    "14px",
                  padding:
                    "15px",
                  color:
                    "white",
                  cursor:
                    "pointer",
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
                    gap: "10px",
                  }}
                >
                  <strong>
                    📹{" "}
                    {
                      camera.name
                    }
                  </strong>

                  <span
                    style={{
                      color:
                        health.color,
                      fontSize:
                        "12px",
                      fontWeight:
                        "700",
                    }}
                  >
                    {
                      health.icon
                    }{" "}
                    {
                      health.status
                    }
                  </span>
                </div>

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
                  {
                    camera.location
                  }
                </p>

                <div
                  style={{
                    marginTop:
                      "12px",
                    display:
                      "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      background:
                        "var(--app-surface-3)",
                      padding:
                        "8px",
                      borderRadius:
                        "8px",
                    }}
                  >
                    <span
                      style={{
                        color:
                          "var(--text-subtle)",
                        fontSize:
                          "10px",
                      }}
                    >
                      AI
                    </span>

                    <strong
                      style={{
                        display:
                          "block",
                        marginTop:
                          "3px",
                        color:
                          camera.aiEnabled
                            ? "#22C55E"
                            : "#EF4444",
                        fontSize:
                          "12px",
                      }}
                    >
                      {camera.aiEnabled
                        ? "ENABLED"
                        : "DISABLED"}
                    </strong>
                  </div>

                  <div
                    style={{
                      background:
                        "var(--app-surface-3)",
                      padding:
                        "8px",
                      borderRadius:
                        "8px",
                    }}
                  >
                    <span
                      style={{
                        color:
                          "var(--text-subtle)",
                        fontSize:
                          "10px",
                      }}
                    >
                      Last Update
                    </span>

                    <strong
                      style={{
                        display:
                          "block",
                        marginTop:
                          "3px",
                        color:
                          "var(--text-primary)",
                        fontSize:
                          "12px",
                      }}
                    >
                      {formatLastUpdate(
                        status?.lastUpdate
                      )}
                    </strong>
                  </div>
                </div>
              </button>
            );
          }
        )}
      </div>

      {/* ================================================
          SELECTED CAMERA
      ================================================= */}

      {selectedCamera && (
        <div
          style={{
            marginTop:
              "18px",
            background:
              "var(--app-surface-2)",
            border:
              "1px solid var(--border)",
            borderRadius:
              "14px",
            padding:
              "16px",
          }}
        >
          {/* Selected camera header */}

          <div
            style={{
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap:
                "15px",
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <h3
                style={{
                  margin:
                    0,
                }}
              >
                📹{" "}
                {
                  selectedCamera.name
                }
              </h3>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  color:
                    "var(--text-muted)",
                }}
              >
                {
                  selectedCamera.location
                }
              </p>
            </div>

            <div
              style={{
                padding:
                  "8px 12px",
                borderRadius:
                  "18px",
                background:
                  selectedStatus
                    ?.health
                    ?.background ||
                  "rgba(239,68,68,.10)",
                color:
                  selectedStatus
                    ?.health
                    ?.color ||
                  "#EF4444",
                fontWeight:
                  "700",
                fontSize:
                  "12px",
              }}
            >
              {
                selectedStatus
                  ?.health
                  ?.icon ||
                "🔴"
              }{" "}
              {
                selectedStatus
                  ?.health
                  ?.label ||
                "AI OFFLINE"
              }
            </div>
          </div>

          {/* ============================================
              SELECTED STATUS
          ============================================ */}

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(150px,1fr))",
              gap:
                "12px",
              marginTop:
                "15px",
            }}
          >
            <div
              style={{
                background:
                  "var(--app-surface-3)",
                padding:
                  "12px",
                borderRadius:
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
                Camera Status
              </span>

              <strong
                style={{
                  display:
                    "block",
                  marginTop:
                    "5px",
                  color:
                    selectedCamera.status ===
                    "active"
                      ? "#22C55E"
                      : "#EF4444",
                }}
              >
                {
                  selectedCamera
                    .status
                    ?.toUpperCase()
                }
              </strong>
            </div>

            <div
              style={{
                background:
                  "var(--app-surface-3)",
                padding:
                  "12px",
                borderRadius:
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
                AI Status
              </span>

              <strong
                style={{
                  display:
                    "block",
                  marginTop:
                    "5px",
                  color:
                    selectedStatus
                      ?.health
                      ?.color ||
                    "#EF4444",
                }}
              >
                {
                  selectedStatus
                    ?.health
                    ?.status ||
                  "OFFLINE"
                }
              </strong>
            </div>

            <div
              style={{
                background:
                  "var(--app-surface-3)",
                padding:
                  "12px",
                borderRadius:
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
                Last Analysis
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
                {formatLastUpdate(
                  selectedStatus
                    ?.lastUpdate
                )}
              </strong>
            </div>

            <div
              style={{
                background:
                  "var(--app-surface-3)",
                padding:
                  "12px",
                borderRadius:
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
                Vehicles
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
                {
                  selectedStatus
                    ?.detection
                    ?.vehicleCount ??
                  0
                }
              </strong>
            </div>
          </div>

          {/* ============================================
              VIEW ANALYSIS
          ============================================ */}

          <button
            type="button"
            onClick={() =>
              setShowAnalysis(
                !showAnalysis
              )
            }
            style={{
              marginTop:
                "15px",
              width:
                "100%",
              padding:
                "12px 16px",
              border:
                "none",
              borderRadius:
                "10px",
              background:
                showAnalysis
                  ? "var(--app-surface-3)"
                  : "#2563EB",
              color:
                "var(--text-primary)",
              cursor:
                "pointer",
              fontWeight:
                "700",
            }}
          >
            {showAnalysis
              ? "▲ Hide Analysis"
              : "👁 View Analysis"}
          </button>

          {/* ============================================
              ANALYSIS DETAILS
          ============================================ */}

          {showAnalysis && (
            <div
              style={{
                marginTop:
                  "15px",
                background:
                  "var(--app-surface-3)",
                borderRadius:
                  "14px",
                padding:
                  "18px",
                border:
                  "1px solid rgba(59,130,246,.25)",
              }}
            >
              <h3
                style={{
                  marginTop:
                    0,
                }}
              >
                🤖 Current AI Analysis
              </h3>

              {/* ========================================
                  LIVE ANNOTATED CAMERA
              ======================================== */}

              <div
                style={{
                  marginBottom:
                    "20px",
                  background:
                    "var(--app-bg)",
                  borderRadius:
                    "14px",
                  overflow:
                    "hidden",
                  border:
                    "1px solid rgba(59,130,246,.25)",
                }}
              >
                <div
                  style={{
                    padding:
                      "14px 16px",
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    gap:
                      "10px",
                  }}
                >
                  <div>
                    <strong>
                      🎥 Live AI Camera View
                    </strong>

                    <p
                      style={{
                        margin:
                          "4px 0 0",
                        color:
                          "var(--text-subtle)",
                        fontSize:
                          "12px",
                      }}
                    >
                      {
                        selectedCamera
                          .cameraId
                      }{" "}
                      — AI processed
                      frame
                    </p>
                  </div>

                  <span
                    style={{
                      color:
                        selectedStatus
                          ?.health
                          ?.status ===
                        "ONLINE"
                          ? "#22C55E"
                          : "#F59E0B",
                      fontSize:
                        "12px",
                      fontWeight:
                        "700",
                    }}
                  >
                    ●{" "}
                    {
                      selectedStatus
                        ?.health
                        ?.status ===
                      "ONLINE"
                        ? "LIVE"
                        : "LATEST FRAME"
                    }
                  </span>
                </div>

                <img
                  key={
                    `${selectedCamera.cameraId}-${imageRefresh}`
                  }
                  src={`${API_BASE}/results/live_camera_${selectedCamera.cameraId}.jpg?t=${imageRefresh}`}
                  alt={`AI analysis for ${selectedCamera.cameraId}`}
                  style={{
                    width:
                      "100%",
                    display:
                      "block",
                    maxHeight:
                      "520px",
                    objectFit:
                      "contain",
                    background:
                      "#000",
                  }}
                  onError={(
                    e
                  ) => {
                    e.currentTarget.style.display =
                      "none";

                    const parent =
                      e.currentTarget
                        .parentElement;

                    if (
                      parent &&
                      !parent.querySelector(
                        ".camera-image-error"
                      )
                    ) {
                      const message =
                        document.createElement(
                          "div"
                        );

                      message.className =
                        "camera-image-error";

                      message.style.padding =
                        "40px 20px";

                      message.style.textAlign =
                        "center";

                      message.style.color =
                        "var(--text-subtle)";

                      message.innerText =
                        "📷 Annotated camera frame is not available yet.";

                      parent.appendChild(
                        message
                      );
                    }
                  }}
                />
              </div>

              {/* ========================================
                  CURRENT METRICS
              ======================================== */}

              {!selectedStatus
                ?.detection ? (
                <p
                  style={{
                    color:
                      "var(--text-muted)",
                  }}
                >
                  No analysis data
                  available for this
                  camera yet.
                </p>
              ) : (
                <>
                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit,minmax(160px,1fr))",
                      gap:
                        "12px",
                    }}
                  >
                    <div className="card">
                      <span
                        style={{
                          color:
                            "var(--text-muted)",
                          fontSize:
                            "12px",
                        }}
                      >
                        🚗 Vehicles
                      </span>

                      <h2>
                        {
                          selectedStatus
                            .detection
                            .vehicleCount ??
                          0
                        }
                      </h2>
                    </div>

                    <div className="card">
                      <span
                        style={{
                          color:
                            "var(--text-muted)",
                          fontSize:
                            "12px",
                        }}
                      >
                        🚦 Congestion
                      </span>

                      <h2>
                        {
                          selectedStatus
                            .detection
                            .congestion ||
                          "LOW"
                        }
                      </h2>
                    </div>

                    <div className="card">
                      <span
                        style={{
                          color:
                            "var(--text-muted)",
                          fontSize:
                            "12px",
                        }}
                      >
                        🤖 AI Confidence
                      </span>

                      <h2>
                        {(
                          Number(
                            selectedStatus
                              .detection
                              .averageConfidence ||
                            0
                          ) * 100
                        ).toFixed(1)}
                        %
                      </h2>
                    </div>

                    <div className="card">
                      <span
                        style={{
                          color:
                            "var(--text-muted)",
                          fontSize:
                            "12px",
                        }}
                      >
                        ⚠️ Accident
                      </span>

                      <h2
                        style={{
                          color:
                            selectedStatus
                              .detection
                              .accidentDetected
                              ? "#EF4444"
                              : "#22C55E",
                        }}
                      >
                        {
                          selectedStatus
                            .detection
                            .accidentDetected
                            ? "DETECTED"
                            : "NONE"
                        }
                      </h2>
                    </div>
                  </div>

                  {/* Recommendation */}

                  <div
                    style={{
                      marginTop:
                        "15px",
                      padding:
                        "15px",
                      background:
                        "var(--app-surface-2)",
                      borderRadius:
                        "10px",
                    }}
                  >
                    <strong>
                      💡 AI Recommendation
                    </strong>

                    <p
                      style={{
                        color:
                          "var(--text-secondary)",
                        marginBottom:
                          0,
                        marginTop:
                          "8px",
                        lineHeight:
                          "1.6",
                      }}
                    >
                      {
                        selectedStatus
                          .detection
                          .recommendation ||
                        "No recommendation"
                      }
                    </p>
                  </div>

                  <p
                    style={{
                      marginBottom:
                        0,
                      marginTop:
                        "12px",
                      color:
                        "var(--text-subtle)",
                      fontSize:
                        "12px",
                    }}
                  >
                    Last analyzed:{" "}
                    {formatLastUpdate(
                      selectedStatus
                        .lastUpdate
                    )}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TrafficCameraSelector;