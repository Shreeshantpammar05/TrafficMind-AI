
import { API_BASE as BASE_URL } from "../config/api.js";
import BackButton from "../components/BackButton";
import MainLayout from "../layouts/MainLayout";
import DemoModePanel from '../components/DemoModePanel';

import axios from "axios";

import {
  useEffect,
  useState,
} from "react";


function normalizeCamera(camera) {
  if (!camera) return null;

  let video = camera.source || "";

  if (
    video.startsWith("frontend/public/")
  ) {
    video = video.replace(
      "frontend/public",
      ""
    );
  }

  /*
   * CAM-001 currently uses source "0"
   * for the development webcam. Keep the
   * existing browser demo video as fallback
   * until Phase 10 connects the real stream.
   */
  if (
    camera.cameraId === "CAM-001" &&
    (!video || video === "0")
  ) {
    video = "/videos/camera1.mp4";
  }

  return {
    ...camera,
    id: camera.cameraId,
    video,
  };
}

const ONLINE_THRESHOLD = 15;
const STALE_THRESHOLD = 30;

// The legacy MJPEG server is bound to loopback only. Use it directly only
// when this page is running on the same machine in Vite development mode.
const LOCAL_STREAM_BASE = "http://127.0.0.1:5050";
function AIVisionCenter() {
    const USER_ROLE = (
    localStorage.getItem("role") || "citizen"
  ).toLowerCase();
  // =====================================================
  // Camera State
  // =====================================================

  const [selectedCameraId, setSelectedCameraId] =
    useState(null);

  const [showCameraAnalysis, setShowCameraAnalysis] =
    useState(false);

  const [cameraStatus, setCameraStatus] =
    useState({});

  const [demoMonitoringActive, setDemoMonitoringActive] = useState(false);
  const [demoStreamTicket, setDemoStreamTicket] = useState('');
  const [localStreamReady, setLocalStreamReady] = useState(false);

  // Never use the unauthenticated loopback stream from a hosted dashboard.
  const isLocalDashboard =
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname);

  const [cameras, setCameras] =
    useState([]);

  const [cameraLoading, setCameraLoading] =
    useState(true);

  const [cameraError, setCameraError] =
    useState("");

  const [cameraAccessLevel, setCameraAccessLevel] =
    useState("");

  const [cameraJurisdiction, setCameraJurisdiction] =
    useState({
      district: "",
      area: "",
    });

  const canAddCamera =
    USER_ROLE === "admin" ||
    (USER_ROLE === "government" &&
      cameraAccessLevel === "main_officer");

  const canDeleteCamera =
    USER_ROLE === "admin";

  const [isMobile, setIsMobile] =
    useState(
      typeof window !== "undefined" &&
        window.innerWidth <= 760
    );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(
        window.innerWidth <= 760
      );
    };

    handleResize();

    window.addEventListener(
      "resize",
      handleResize
    );

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
  }, []);

  // =====================================================
  // Authentication
  // =====================================================

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem(
      "token"
    )}`,
  });

  // =====================================================
  // Phase 9 — Add CCTV Camera
  // =====================================================

  const [showAddCamera, setShowAddCamera] =
    useState(false);

  const [addCameraLoading, setAddCameraLoading] =
    useState(false);

  const [addCameraError, setAddCameraError] =
    useState("");

  const [cameraForm, setCameraForm] =
    useState({
      cameraId: "",
      name: "",
      location: "",
      city: "Bengaluru",
      district: "Bengaluru Urban",
      area: "",
      latitude: "",
      longitude: "",
      source: "",
      aiEnabled: true,
    });

  const resetCameraForm = () => {
    setCameraForm({
      cameraId: "",
      name: "",
      location: "",
      city: "Bengaluru",
      district: "Bengaluru Urban",
      area: "",
      latitude: "",
      longitude: "",
      source: "",
      aiEnabled: true,
    });
    setAddCameraError("");
  };

  const handleCameraFormChange = (event) => {
    const { name, value, type, checked } =
      event.target;

    setCameraForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleAddCamera = async (event) => {
    event.preventDefault();

    try {
      setAddCameraLoading(true);
      setAddCameraError("");

      const latitude = Number(
        cameraForm.latitude
      );

      const longitude = Number(
        cameraForm.longitude
      );

      if (
        !cameraForm.cameraId.trim() ||
        !cameraForm.name.trim() ||
        !cameraForm.location.trim() ||
        !cameraForm.city.trim() ||
        !cameraForm.district.trim() ||
        !cameraForm.area.trim() ||
        !cameraForm.source.trim() ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        setAddCameraError(
          "All camera details are required, including valid latitude and longitude."
        );
        return;
      }

      const response = await axios.post(
        `${BASE_URL}/api/traffic-cameras`,
        {
          cameraId: cameraForm.cameraId.trim(),
          name: cameraForm.name.trim(),
          location: cameraForm.location.trim(),
          city: cameraForm.city.trim(),
          district: cameraForm.district.trim(),
          area: cameraForm.area.trim(),
          latitude,
          longitude,
          source: cameraForm.source.trim(),
          aiEnabled: cameraForm.aiEnabled,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.error ||
            "Camera creation failed"
        );
      }

      await fetchAuthorizedCameras();
      resetCameraForm();
      setShowAddCamera(false);

      alert(
        "✅ Traffic camera added successfully"
      );
    } catch (error) {
      console.log(
        "Add camera error:",
        error
      );

      setAddCameraError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to add traffic camera"
      );
    } finally {
      setAddCameraLoading(false);
    }
  };

  const handleDeleteCamera = async (camera) => {
    if (!canDeleteCamera) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${camera.name || camera.cameraId}?\n\nThis will remove the camera from TrafficMind AI.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(
        `${BASE_URL}/api/traffic-cameras/${encodeURIComponent(
          camera.cameraId
        )}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (selectedCameraId === camera.id) {
        setSelectedCameraId(null);
        setShowCameraAnalysis(false);
      }

      await fetchAuthorizedCameras();

      alert("✅ Traffic camera deleted successfully");
    } catch (error) {
      console.log(
        "Delete camera error:",
        error
      );

      alert(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to delete traffic camera"
      );
    }
  };

  // =====================================================
  // Authorized Camera Network
  // =====================================================

  useEffect(() => {
    fetchAuthorizedCameras();
  }, []);

  const fetchAuthorizedCameras =
    async () => {
      try {
        setCameraLoading(true);
        setCameraError("");

        const response =
          await axios.get(
            `${BASE_URL}/api/traffic-cameras`,
            {
              headers:
                getAuthHeaders(),
            }
          );

        setCameraAccessLevel(
          response.data?.accessLevel ||
            ""
        );

        setCameraJurisdiction({
          district:
            response.data?.jurisdiction
              ?.district ||
            "",

          area:
            response.data?.jurisdiction
              ?.area ||
            "",
        });

        const authorizedCameras =
          Array.isArray(
            response.data?.cameras
          )
            ? response.data.cameras
                .map(normalizeCamera)
                .filter(Boolean)
            : [];

        setCameras(
          authorizedCameras
        );

        setSelectedCameraId(
          null
        );

        setShowCameraAnalysis(
          false
        );
      } catch (error) {
        console.log(
          "Authorized camera fetch error:",
          error
        );

        setCameras([]);
        setCameraError(
          error.response?.data?.error ||
            error.response?.data?.message ||
            "Failed to load authorized cameras."
        );
      } finally {
        setCameraLoading(false);
      }
    };

  // =====================================================
  // Camera Detection Status
  // =====================================================

  useEffect(() => {
    if (cameraLoading) {
      return;
    }

    fetchCameraStatus();

    const interval = setInterval(
      fetchCameraStatus,
      5000
    );

    return () =>
      clearInterval(interval);
  }, [cameras, cameraLoading, demoMonitoringActive]);

  const getHealthStatus = (
    timestamp
  ) => {
    if (!demoMonitoringActive) {
      return { status: "OFFLINE", label: "AI OFFLINE", color: "#EF4444", background: "rgba(239,68,68,.10)", icon: "🔴" };
    }

    if (!timestamp) {
      return {
        status: "OFFLINE",
        label: "AI OFFLINE",
        color: "#EF4444",
        background:
          "rgba(239,68,68,.10)",
        icon: "🔴",
      };
    }

    const ageSeconds = Math.floor(
      (
        Date.now() -
        new Date(timestamp).getTime()
      ) / 1000
    );

    if (
      ageSeconds <= ONLINE_THRESHOLD
    ) {
      return {
        status: "ONLINE",
        label: "AI ONLINE",
        color: "#22C55E",
        background:
          "rgba(34,197,94,.10)",
        icon: "🟢",
      };
    }

    if (
      ageSeconds <= STALE_THRESHOLD
    ) {
      return {
        status: "STALE",
        label: "AI STALE",
        color: "#F59E0B",
        background:
          "rgba(245,158,11,.10)",
        icon: "🟡",
      };
    }

    return {
      status: "OFFLINE",
      label: "AI OFFLINE",
      color: "#EF4444",
      background:
        "rgba(239,68,68,.10)",
      icon: "🔴",
    };
  };

  const fetchCameraStatus =
    async () => {
      const statuses = {};

      await Promise.all(
        cameras.map(
          async (camera) => {
            try {
              const response =
                await axios.get(
                  `${BASE_URL}/api/camera-detections/${encodeURIComponent(
                    camera.id
                  )}/latest`,
                  {
                    headers:
                      getAuthHeaders(),
                  }
                );

              const detection =
                response.data?.detection;

              if (!detection) {
                statuses[
                  camera.id
                ] = {
                  health:
                    getHealthStatus(null),
                  detection: null,
                  lastUpdate: null,
                };

                return;
              }

              const timestamp =
                detection.updatedAt ||
                detection.detectedAt ||
                null;

              statuses[
                camera.id
              ] = {
                health:
                  getHealthStatus(
                    timestamp
                  ),
                detection,
                lastUpdate:
                  timestamp,
              };
            } catch (error) {
              statuses[
                camera.id
              ] = {
                health:
                  getHealthStatus(null),
                detection: null,
                lastUpdate: null,
              };
            }
          }
        )
      );

      setCameraStatus(
        statuses
      );
    };

  // =====================================================
  // Format Time
  // =====================================================

  const formatLastUpdate = (
    timestamp
  ) => {
    if (!timestamp) {
      return "No data";
    }

    const seconds = Math.max(
      0,
      Math.floor(
        (
          Date.now() -
          new Date(timestamp).getTime()
        ) / 1000
      )
    );

    if (seconds < 5) {
      return "Just now";
    }

    if (seconds < 60) {
      return `${seconds}s ago`;
    }

    return `${Math.floor(
      seconds / 60
    )}m ago`;
  };

  // =====================================================
  // Camera Selection
  // =====================================================

  const handleCameraSelect = (
    cameraId
  ) => {
    if (
      selectedCameraId ===
      cameraId
    ) {
      setShowCameraAnalysis(
        !showCameraAnalysis
      );

      return;
    }

    setSelectedCameraId(
      cameraId
    );

    setShowCameraAnalysis(
      true
    );
  };

  const hideCameraAnalysis =
    () => {
      setShowCameraAnalysis(
        false
      );

      setSelectedCameraId(
        null
      );
    };

  const selectedCamera =
    cameras.find(
      (camera) =>
        camera.id ===
        selectedCameraId
    );

  const selectedCameraStatus =
    selectedCamera
      ? cameraStatus[
          selectedCamera.id
        ]
      : null;

  // In local development, wait for the Edge Agent to start the loopback
  // MJPEG server before attaching the browser to its streams. This avoids
  // an early 404 when Activate is clicked and the runner is still starting.
  useEffect(() => {
    if (!isLocalDashboard || !demoMonitoringActive) {
      setLocalStreamReady(false);
      return undefined;
    }

    let cancelled = false;
    let retryTimer = null;

    const checkLocalStream = async () => {
      try {
        const response = await fetch(`${LOCAL_STREAM_BASE}/health`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Local stream health returned ${response.status}`);
        }

        if (!cancelled) {
          setLocalStreamReady(true);
        }
      } catch (error) {
        if (!cancelled) {
          setLocalStreamReady(false);
          retryTimer = window.setTimeout(checkLocalStream, 1000);
        }
      }
    };

    setLocalStreamReady(false);
    checkLocalStream();

    return () => {
      cancelled = true;
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [demoMonitoringActive, isLocalDashboard]);

  const selectedYoloStreamUrl = !demoMonitoringActive
    ? undefined
    : isLocalDashboard
      ? localStreamReady && selectedCamera
        ? `${LOCAL_STREAM_BASE}/stream/${encodeURIComponent(selectedCamera.id)}`
        : undefined
      : demoStreamTicket && selectedCamera
        ? `${BASE_URL}/api/demo-control/stream/${encodeURIComponent(selectedCamera.id)}?ticket=${encodeURIComponent(demoStreamTicket)}`
        : undefined;

  const selectedNormalStreamUrl =
    isLocalDashboard &&
    demoMonitoringActive &&
    localStreamReady &&
    selectedCamera &&
    String(selectedCamera.source || "").trim().toLowerCase().startsWith("rtsp://")
      ? `${LOCAL_STREAM_BASE}/normal-stream/${encodeURIComponent(selectedCamera.id)}`
      : undefined;

  // =====================================================
  // Camera Counts
  // =====================================================

  const onlineCount =
    cameras.filter(
      (camera) =>
        cameraStatus[
          camera.id
        ]?.health?.status ===
        "ONLINE"
    ).length;

  const staleCount =
    cameras.filter(
      (camera) =>
        cameraStatus[
          camera.id
        ]?.health?.status ===
        "STALE"
    ).length;

  const offlineCount =
    cameras.filter(
      (camera) =>
        cameraStatus[
          camera.id
        ]?.health?.status ===
        "OFFLINE"
    ).length;

  // =====================================================
  // Small Camera Card
  // =====================================================

  const renderCameraCard = (
    camera
  ) => {
    const status =
      cameraStatus[
        camera.id
      ];

    const health =
      status?.health || {
        status: "OFFLINE",
        label: "AI OFFLINE",
        color: "#EF4444",
        background:
          "rgba(239,68,68,.10)",
        icon: "🔴",
      };

    const isSelected =
      selectedCameraId ===
      camera.id;

    const isMinimized =
      showCameraAnalysis &&
      !isSelected;

    return (
      <div
        key={camera.id}
        style={{
          background:
            "var(--app-surface-2)",
          border:
            `1px solid ${
              isSelected
                ? "#2563EB"
                : isMinimized
                ? "rgba(59,130,246,.22)"
                : "var(--border)"
            }`,
          borderRadius:
            isMinimized ? "14px" : "16px",
          overflow:
            "hidden",
          transition:
            "all .55s cubic-bezier(.22,1,.36,1)",
          transform:
            isSelected &&
            showCameraAnalysis
              ? "scale(1)"
              : isMinimized
              ? "scale(.96)"
              : "scale(1)",
          opacity:
            isMinimized ? 0.94 : 1,
          boxShadow:
            isSelected
              ? "0 18px 45px rgba(37,99,235,.20)"
              : isMinimized
              ? "0 8px 25px rgba(0,0,0,.16)"
              : "none",
          width: "100%",
        }}
      >
        {/* Header */}

        <div
          style={{
            padding:
              isMinimized ? "10px 12px" : "15px",
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
            <h3
              style={{
                margin: 0,
                fontSize:
                  isMinimized ? "14px" : "18px",
              }}
            >
              📹{" "}
              {camera.name}
            </h3>

            <p
              style={{
                margin:
                  "4px 0 0",
                color:
                  "var(--text-muted)",
                fontSize:
                  isMinimized ? "11px" : "13px",
              }}
            >
              {
                camera.location
              }
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                color:
                  health.color,
                background:
                  health.background,
                padding:
                  isMinimized ? "5px 7px" : "6px 9px",
                borderRadius:
                  "15px",
                fontSize:
                  isMinimized ? "9px" : "11px",
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

            {canDeleteCamera && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDeleteCamera(camera);
                }}
                style={{
                  border: "1px solid rgba(239,68,68,.35)",
                  background: "rgba(239,68,68,.10)",
                  color: "#EF4444",
                  padding: "6px 9px",
                  borderRadius: "9px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: "800",
                }}
                title="Delete camera"
              >
                🗑 Delete
              </button>
            )}
          </div>
        </div>

        {/* Normal Camera */}

        <div
          style={{
            position:
              "relative",
            height: isMinimized ? "92px" : "280px",
            background:
              "#05070b",
          }}
        >
          {isMinimized ? (
            <div
              style={{
                display: "grid",
                placeItems: "center",
                height: "92px",
                padding: "10px",
                boxSizing: "border-box",
                color: "var(--text-muted)",
                textAlign: "center",
                fontSize: "11px",
                background: "#05070b",
              }}
            >
              Camera preview paused while viewing the selected analysis.
            </div>
          ) : String(camera.source || "")
              .trim()
              .toLowerCase()
              .startsWith("rtsp://") ? (
            isLocalDashboard && demoMonitoringActive && localStreamReady ? (
              <img
                key={`normal-${camera.id}`}
                src={`${LOCAL_STREAM_BASE}/normal-stream/${encodeURIComponent(camera.id)}`}
                alt={`Original live camera feed for ${camera.id}`}
                style={{
                  display: "block",
                  width: "100%",
                  height: "280px",
                  objectFit: "cover",
                  background: "#000",
                }}
              />
            ) : (
              <div
                style={{
                  display: "grid",
                  placeItems: "center",
                  height: "280px",
                  padding: "12px",
                  boxSizing: "border-box",
                  color: "var(--text-muted)",
                  textAlign: "center",
                  fontSize: "12px",
                  background: "#05070b",
                }}
              >
                RTSP camera connected through the Edge Agent. Open View Analysis to see its live feed.
              </div>
            )
          ) : (
            <video
              width="100%"
              height="280"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              controls={false}
              style={{
                display: "block",
                width: "100%",
                height: "280px",
                objectFit: "cover",
                background: "#000",
              }}
            >
              <source
                src={camera.video}
                type="video/mp4"
              />
            </video>
          )}

          <div
            style={{
              position:
                "absolute",
              top:
                "10px",
              left:
                "10px",
              background:
                "rgba(0,0,0,.72)",
              color:
                "white",
              padding:
                isMinimized ? "4px 7px" : "6px 10px",
              borderRadius:
                "8px",
              fontSize:
                isMinimized ? "8px" : "11px",
              fontWeight:
                "700",
            }}
          >
            ● EDGE CAMERA FEED
          </div>
        </div>

        {/* Details */}

        <div
          style={{
            display: isMinimized ? "none" : "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap:
              "10px",
            padding:
              "12px 15px",
          }}
        >
          <div
            style={{
              background:
                "var(--app-surface-2)",
              padding:
                "10px",
              borderRadius:
                "9px",
            }}
          >
            <span
              style={{
                display:
                  "block",
                color:
                  "var(--text-subtle)",
                fontSize:
                  "10px",
              }}
            >
              AI STATUS
            </span>

            <strong
              style={{
                display:
                  "block",
                marginTop:
                  "4px",
                color:
                  health.color,
                fontSize:
                  "12px",
              }}
            >
              {
                health.label
              }
            </strong>
          </div>

          <div
            style={{
              background:
                "var(--app-surface-2)",
              padding:
                "10px",
              borderRadius:
                "9px",
            }}
          >
            <span
              style={{
                display:
                  "block",
                color:
                  "var(--text-subtle)",
                fontSize:
                  "10px",
              }}
            >
              LAST AI UPDATE
            </span>

            <strong
              style={{
                display:
                  "block",
                marginTop:
                  "4px",
                color:
                  "#FFFFFF",
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

        {/* Button */}

        <div
          style={{
            padding:
              isMinimized ? "8px 10px 10px" : "0 15px 15px",
          }}
        >
          <button
            type="button"
            onClick={() =>
              handleCameraSelect(
                camera.id
              )
            }
            style={{
              width:
                "100%",
              padding:
                isMinimized ? "8px 10px" : "12px 16px",
              border:
                "none",
              borderRadius:
                "10px",
              background:
                isSelected &&
                showCameraAnalysis
                  ? "var(--app-surface-3)"
                  : "#2563EB",
              color:
                "#fff",
              cursor:
                "pointer",
              fontWeight:
                "700",
              transition:
                "all .25s ease",
            }}
          >
            {isSelected &&
            showCameraAnalysis
              ? "▲ Hide Analysis"
              : isMinimized
              ? "Open Full Analysis"
              : "👁 View Analysis"}
          </button>
        </div>
      </div>
    );
  };

  // =====================================================
  // Render
  // =====================================================

  return (
    <MainLayout>
      <BackButton />

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        className="hero-header"
        style={{
          marginBottom:
            "25px",
          gap: "18px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1>
             🟢AI Vision Center
          </h1>

          <p
            style={{
              color:
                "var(--text-muted)",
              fontSize:
                "18px",
              fontWeight:
                "600",
              marginTop:
                "8px",
            }}
          >
            Real-Time AI Surveillance
            & Traffic Analysis
          </p>

          
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {canAddCamera && (
            <button
              type="button"
              onClick={() => {
                resetCameraForm();

                setCameraForm((current) => ({
                  ...current,
                  district:
                    USER_ROLE === "government" &&
                    cameraJurisdiction.district
                      ? cameraJurisdiction.district
                      : current.district,
                }));

                setShowAddCamera(true);
              }}
              style={{
                border: "none",
                background: "#2563EB",
                color: "white",
                padding: "10px 16px",
                borderRadius: "22px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              ➕ Add Camera
            </button>
          )}

          <DemoModePanel
            cameras={cameras}
            onSessionChange={(active, ticket) => {
              setDemoMonitoringActive(active);
              setDemoStreamTicket(ticket || "");
            }}
          />

          
        </div>
      </div>

      {/* =================================================
          AI STATUS
      ================================================= */}

      <div
        className="cards"
        style={{
          marginBottom:
            "25px",
        }}
      >
        <div
          className="card"
          style={{
            minHeight:
              "120px",
          }}
        >
          <h3>
           AI Engine
          </h3>

          <h2>
            ONLINE
          </h2>
        </div>

        <div
          className="card"
          style={{
            minHeight:
              "120px",
          }}
        >
          <h3>
            Cameras
          </h3>

          <h2>
            {cameras.length}
          </h2>
        </div>

        <div
          className="card"
          style={{
            minHeight:
              "120px",
          }}
        >
          <h3>
             Online
          </h3>

          <h2
            style={{
              color:
                "#22C55E",
            }}
          >
            {onlineCount}
          </h2>
        </div>

        <div
          className="card"
          style={{
            minHeight:
              "120px",
          }}
        >
          <h3>
             Offline
          </h3>

          <h2
            style={{
              color:
                offlineCount > 0
                  ? "#EF4444"
                  : "#22C55E",
            }}
          >
            {offlineCount}
          </h2>
        </div>
      </div>

      {/* =================================================
          PHASE 9 — ADD CCTV CAMERA MODAL
      ================================================= */}

      {showAddCamera && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,.70)",
            display: "grid",
            placeItems: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "min(760px,100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "var(--app-surface)",
              border: "1px solid var(--border-strong)",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 25px 70px rgba(0,0,0,.45)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "15px",
                marginBottom: "18px",
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>
                  ➕ Add CCTV Camera
                </h2>
                <p
                  style={{
                    color: "var(--text-muted)",
                    margin: "6px 0 0",
                  }}
                >
                  Register a camera with its location and CCTV source.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddCamera(false);
                  resetCameraForm();
                }}
                style={{
                  border: "none",
                  background: "var(--app-surface-3)",
                  color: "var(--text-primary)",
                  borderRadius: "10px",
                  padding: "9px 12px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {addCameraError && (
              <div
                style={{
                  marginBottom: "15px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "rgba(239,68,68,.10)",
                  border: "1px solid rgba(239,68,68,.25)",
                  color: "#EF4444",
                }}
              >
                ⚠️ {addCameraError}
              </div>
            )}

            <form onSubmit={handleAddCamera}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: "14px",
                }}
              >
                {[
                  ["cameraId", "Camera ID", "CAM-005"],
                  ["name", "Camera Name", "Dasarahalli Camera"],
                  ["location", "Location", "Dasarahalli"],
                  ["city", "City", "Bengaluru"],
                  ["district", "District", "Bengaluru Urban"],
                  ["area", "Area", "Dasarahalli"],
                  ["latitude", "Latitude", "13.0450"],
                  ["longitude", "Longitude", "77.4990"],
                  ["source", "CCTV Source", "0 / video path / stream URL"],
                ].map(([name, label, placeholder]) => (
                  <div key={name}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "7px",
                        color: "var(--text-secondary)",
                        fontSize: "13px",
                        fontWeight: "700",
                      }}
                    >
                      {label}
                    </label>

                    <input
                      name={name}
                      value={cameraForm[name]}
                      onChange={handleCameraFormChange}
                      placeholder={placeholder}
                      type={
                        name === "latitude" || name === "longitude"
                          ? "number"
                          : "text"
                      }
                      step="any"
                      required
                      disabled={
                        name === "district" &&
                        USER_ROLE === "government" &&
                        cameraAccessLevel === "main_officer"
                      }
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "11px 12px",
                        borderRadius: "10px",
                        border: "1px solid var(--border-strong)",
                        background: "var(--app-surface-2)",
                        color: "var(--text-primary)",
                        outline: "none",
                      }}
                    />
                  </div>
                ))}
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "16px",
                  color: "var(--text-secondary)",
                  fontWeight: "700",
                }}
              >
                <input
                  type="checkbox"
                  name="aiEnabled"
                  checked={cameraForm.aiEnabled}
                  onChange={handleCameraFormChange}
                />
                Enable AI detection for this camera
              </label>

              <div
                style={{
                  marginTop: "18px",
                  padding: "13px 14px",
                  borderRadius: "11px",
                  background: "var(--accent-soft)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                  lineHeight: "1.5",
                }}
              >
                💡 CCTV source can be a development camera (`0`), a local video path, or an RTSP/HTTP stream URL. TrafficMind AI converts network camera feeds into browser-safe live streams.
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCamera(false);
                    resetCameraForm();
                  }}
                  style={{
                    border: "1px solid var(--border-strong)",
                    background: "var(--app-surface-3)",
                    color: "var(--text-primary)",
                    padding: "11px 16px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontWeight: "700",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={addCameraLoading}
                  style={{
                    border: "none",
                    background: "#2563EB",
                    color: "white",
                    padding: "11px 18px",
                    borderRadius: "10px",
                    cursor: addCameraLoading ? "not-allowed" : "pointer",
                    fontWeight: "700",
                    opacity: addCameraLoading ? 0.7 : 1,
                  }}
                >
                  {addCameraLoading
                    ? "Saving..."
                    : "💾 Add Camera"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          LIVE CAMERA NETWORK
      ================================================= */}

      <div
        className="section-card"
        style={{
          marginBottom:
            "25px",
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
            gap:
              "15px",
            flexWrap:
              "wrap",
            marginBottom:
              "20px",
          }}
        >
          <div>
            <h2>
              📹 Live Traffic Camera Network
            </h2>

            <p
              style={{
                color:
                  "var(--text-muted)",
                marginTop:
                  "6px",
              }}
            >
              Click any camera to open
              the live AI analysis view.
            </p>
          </div>

          <span
            style={{
              background:
                "#16A34A",
              color:
                "white",
              padding:
                "8px 15px",
              borderRadius:
                "20px",
              fontWeight:
                "700",
              fontSize:
                "12px",
            }}
          >
            ● LIVE NETWORK
          </span>
        </div>

        {/* =================================================
            CAMERA ACCESS STATE
        ================================================= */}

        {cameraLoading && (
          <div
            style={{
              marginBottom: "18px",
              padding: "18px",
              borderRadius: "14px",
              background:
                "var(--app-surface-2)",
              border:
                "1px dashed var(--border)",
              color:
                "var(--text-muted)",
              textAlign: "center",
            }}
          >
            Loading authorized camera network...
          </div>
        )}

        {!cameraLoading &&
          cameraError && (
            <div
              style={{
                marginBottom: "18px",
                padding: "18px",
                borderRadius: "14px",
                background:
                  "rgba(239,68,68,.08)",
                border:
                  "1px solid rgba(239,68,68,.25)",
                color:
                  "#EF4444",
              }}
            >
              ⚠️ {cameraError}
            </div>
          )}

        {!cameraLoading &&
          !cameraError &&
          cameras.length === 0 && (
            <div
              style={{
                marginBottom: "18px",
                padding: "24px",
                borderRadius: "14px",
                background:
                  "var(--app-surface-2)",
                border:
                  "1px dashed var(--border)",
                color:
                  "var(--text-muted)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  marginBottom: "8px",
                }}
              >
                📹
              </div>

              <strong
                style={{
                  color:
                    "var(--text-primary)",
                }}
              >
                No Authorized Cameras
              </strong>

              <p
                style={{
                  margin:
                    "7px 0 0",
                  color:
                    "var(--text-muted)",
                }}
              >
                No CCTV cameras are currently
                assigned to your jurisdiction.
              </p>
            </div>
          )}

        {/* =================================================
            CAMERA GRID
        ================================================= */}

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              isMobile
                ? "1fr"
                : showCameraAnalysis
                ? "repeat(3, minmax(0, 1fr))"
                : "repeat(2, minmax(0, 1fr))",
            gap:
              showCameraAnalysis ? "10px" : "18px",
            alignItems:
              "start",
            transition:
              "all .55s cubic-bezier(.22,1,.36,1)",
            alignItems:
              "start",
          }}
        >
          {cameras.map(
            (camera) => {
              const isSelected =
                selectedCameraId ===
                camera.id;

              if (
                showCameraAnalysis &&
                isSelected
              ) {
                return null;
              }

              return (
                <div
                  key={
                    camera.id
                  }
                  style={{
                    /*
                     * Other cameras become compact
                     * when one is selected.
                     */
                    transform:
                      showCameraAnalysis
                        ? "scale(.92)"
                        : "scale(1)",

                    opacity:
                      showCameraAnalysis
                        ? 0.92
                        : 1,

                    transition:
                      "all .55s cubic-bezier(.22,1,.36,1)",
                  }}
                >
                  {renderCameraCard(
                    camera
                  )}
                </div>
              );
            }
          )}
        </div>

        {/* =================================================
            SELECTED CAMERA
        ================================================= */}

        {selectedCamera &&
          showCameraAnalysis && (
            <div
              style={{
                marginTop:
                  "20px",
                transform:
                  "translateY(0) scale(1)",
                opacity:
                  1,
                transition:
                  "all .6s cubic-bezier(.22,1,.36,1)",
              }}
            >
              {/* Selected Camera Header */}

              <div
                style={{
                  background:
                    "var(--app-bg)",
                  border:
                    "1px solid rgba(59,130,246,.35)",
                  borderRadius:
                    "18px",
                  padding:
                    "20px",
                  boxShadow:
                    "0 20px 50px rgba(0,0,0,.28)",
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
                    gap:
                      "15px",
                    flexWrap:
                      "wrap",
                    marginBottom:
                      "18px",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin:
                          0,
                      }}
                    >
                      🤖{" "}
                      {
                        selectedCamera.name
                      }{" "}
                      — Live AI Analysis
                    </h2>

                    <p
                      style={{
                        color:
                          "var(--text-muted)",
                        margin:
                          "6px 0 0",
                      }}
                    >
                      {
                        selectedCamera.location
                      }
                    </p>
                  </div>

                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap:
                        "10px",
                    }}
                  >
                    <span
                      style={{
                        color:
                          selectedCameraStatus
                            ?.health
                            ?.color ||
                          "#EF4444",
                        background:
                          selectedCameraStatus
                            ?.health
                            ?.background ||
                          "rgba(239,68,68,.10)",
                        padding:
                          "8px 12px",
                        borderRadius:
                          "18px",
                        fontSize:
                          "12px",
                        fontWeight:
                          "700",
                      }}
                    >
                      {
                        selectedCameraStatus
                          ?.health
                          ?.icon ||
                        "🔴"
                      }{" "}
                      {
                        selectedCameraStatus
                          ?.health
                          ?.label ||
                        "AI OFFLINE"
                      }
                    </span>

                    <button
                      type="button"
                      onClick={
                        hideCameraAnalysis
                      }
                      style={{
                        border:
                          "none",
                        background:
                          "var(--app-surface-3)",
                        color:
                          "var(--text-primary)",
                        padding:
                          "9px 14px",
                        borderRadius:
                          "10px",
                        cursor:
                          "pointer",
                        fontWeight:
                          "700",
                      }}
                    >
                      ✕ Close
                    </button>
                  </div>
                </div>

                {/* =================================================
                    LIVE CAMERA + TRUE YOLO ANALYSIS
                ================================================= */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile
                      ? "1fr"
                      : "repeat(2, minmax(0, 1fr))",
                    gap: "18px",
                    marginTop: "8px",
                  }}
                >
                  {/* Normal Live Camera */}
                  <div
                    style={{
                      background: "var(--app-surface-3)",
                      border: "1px solid var(--border)",
                      borderRadius: "14px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "13px 15px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <div>
                        <strong>
                          🎥 Edge Camera Feed
                        </strong>

                        <div
                          style={{
                            marginTop: "3px",
                            color: "var(--text-muted)",
                            fontSize: "10px",
                          }}
                        >
                          Original camera feed
                        </div>
                      </div>

                      <span
                        style={{
                          color: "#22C55E",
                          fontSize: "11px",
                          fontWeight: "700",
                        }}
                      >
                        ● LIVE
                      </span>
                    </div>

                    {selectedNormalStreamUrl ? (
                      <img
                        key={`selected-normal-${selectedCamera.id}`}
                        src={selectedNormalStreamUrl}
                        alt={`Original live camera feed for ${selectedCamera.id}`}
                        style={{
                          display: "block",
                          width: "100%",
                          height: isMobile ? "280px" : "430px",
                          objectFit: "cover",
                          background: "#000",
                        }}
                      />
                    ) : String(selectedCamera.source || "")
                      .trim()
                      .toLowerCase()
                      .startsWith("rtsp://") ? (
                      <div
                        style={{
                          display: "grid",
                          placeItems: "center",
                          height: isMobile ? "280px" : "430px",
                          padding: "16px",
                          boxSizing: "border-box",
                          color: "var(--text-muted)",
                          textAlign: "center",
                          background: "#000",
                        }}
                      >
                        {isLocalDashboard && demoMonitoringActive
                          ? "Connecting to the local Edge Agent camera stream..."
                          : "RTSP source is handled by the Edge Agent. The annotated live YOLO feed is shown in the panel beside this one."}
                      </div>
                    ) : (
                      <video
                        width="100%"
                        height={isMobile ? "280" : "430"}
                        autoPlay
                        muted
                        loop
                        playsInline
                        controls={false}
                        style={{
                          display: "block",
                          width: "100%",
                          height: isMobile ? "280px" : "430px",
                          objectFit: "cover",
                          background: "#000",
                        }}
                      >
                        <source
                          src={selectedCamera.video}
                          type="video/mp4"
                        />
                      </video>
                    )}
                  </div>

                  {/* True Live YOLO */}
                  <div
                    style={{
                      background: "var(--app-surface-3)",
                      border: "1px solid rgba(59,130,246,.30)",
                      borderRadius: "14px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "13px 15px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <strong>
                        🧠 True Live YOLO Detection
                      </strong>

                      <span
                        style={{
                          color:
                            selectedCameraStatus?.health?.status ===
                            "ONLINE"
                              ? "#22C55E"
                              : "#F59E0B",
                          fontSize: "11px",
                          fontWeight: "700",
                        }}
                      >
                        ●{" "}
                        {selectedCameraStatus?.health?.status ===
                        "ONLINE"
                          ? "ANALYZING"
                          : "LATEST AI"}
                      </span>
                    </div>

                    {selectedYoloStreamUrl ? (
                      <img
                        key={`yolo-${selectedCamera.id}`}
                        src={selectedYoloStreamUrl}
                        alt={`Live YOLO analysis for ${selectedCamera.id}`}
                        style={{
                          display: "block",
                          width: "100%",
                          height: isMobile ? "280px" : "430px",
                          objectFit: "cover",
                          background: "#000",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          placeItems: "center",
                          width: "100%",
                          height: isMobile ? "280px" : "430px",
                          padding: "16px",
                          boxSizing: "border-box",
                          color: "var(--text-muted)",
                          textAlign: "center",
                          background: "#000",
                        }}
                      >
                        {!demoMonitoringActive
                          ? "Activate monitoring to start live YOLO detection."
                          : isLocalDashboard
                            ? "Waiting for the Edge Agent's local YOLO stream..."
                            : "Waiting for the authenticated live YOLO stream..."}
                      </div>
                    )}
                  </div>
                </div>

                {/* =================================================
                    LIVE REPORT
                ================================================= */}
                {/* =================================================
                    AI METRICS
                ================================================= */}

                {demoMonitoringActive && selectedCameraStatus?.detection && (
                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit,minmax(160px,1fr))",
                      gap:
                        "12px",
                      marginTop:
                        "18px",
                    }}
                  >
                    <div
                      className="card"
                      style={{
                        minHeight:
                          "100px",
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
                        🚗 Vehicles
                      </span>

                      <h2
                        style={{
                          marginTop:
                            "8px",
                        }}
                      >
                        {
                          selectedCameraStatus
                            .detection
                            .vehicleCount ??
                          0
                        }
                      </h2>
                    </div>

                    <div
                      className="card"
                      style={{
                        minHeight:
                          "100px",
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
                        🚦 Congestion
                      </span>

                      <h2
                        style={{
                          marginTop:
                            "8px",
                          color:
                            selectedCameraStatus
                              .detection
                              .congestion ===
                            "HIGH"
                              ? "#EF4444"
                              : selectedCameraStatus
                                  .detection
                                  .congestion ===
                                "MEDIUM"
                              ? "#F59E0B"
                              : "#22C55E",
                        }}
                      >
                        {
                          selectedCameraStatus
                            .detection
                            .congestion
                        }
                      </h2>
                    </div>

                    <div
                      className="card"
                      style={{
                        minHeight:
                          "100px",
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
                        🤖 AI Confidence
                      </span>

                      <h2
                        style={{
                          marginTop:
                            "8px",
                        }}
                      >
                        {(
                          Number(
                            selectedCameraStatus
                              .detection
                              .averageConfidence ||
                            0
                          ) * 100
                        ).toFixed(1)}
                        %
                      </h2>
                    </div>

                    <div
                      className="card"
                      style={{
                        minHeight:
                          "100px",
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
                        ⚠️ Accident
                      </span>

                      <h2
                        style={{
                          marginTop:
                            "8px",
                          color:
                            selectedCameraStatus
                              .detection
                              .accidentDetected
                              ? "#EF4444"
                              : "#22C55E",
                        }}
                      >
                        {
                          selectedCameraStatus
                            .detection
                            .accidentDetected
                            ? "DETECTED"
                            : "NONE"
                        }
                      </h2>
                    </div>
                  </div>
                )}

                {/* =================================================
                    AI RECOMMENDATION
                ================================================= */}

                {demoMonitoringActive && selectedCameraStatus?.detection && (
                  <div
                    style={{
                      marginTop:
                        "15px",
                      background:
                        "var(--app-surface-2)",
                      padding:
                        "15px",
                      borderRadius:
                        "12px",
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
                        selectedCameraStatus
                          .detection
                          .recommendation ||
                        "No recommendation available."
                      }
                    </p>
                  </div>
                )}

                {/* Last update */}

                <div
                  style={{
                    marginTop:
                      "12px",
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    gap:
                      "10px",
                    flexWrap:
                      "wrap",
                    color:
                      "var(--text-subtle)",
                    fontSize:
                      "12px",
                  }}
                >
                  <span>
                    Last AI analysis:{" "}
                    {
                      formatLastUpdate(
                        selectedCameraStatus
                          ?.lastUpdate
                      )
                    }
                  </span>

                  <span>
                    🎥 Live YOLO Stream
                  </span>
                </div>
              </div>
            </div>
          )}
      </div>

    </MainLayout>
  );
}

export default AIVisionCenter;
