import BackButton from "../components/BackButton";
import MainLayout from "../layouts/MainLayout";

import jsPDF from "jspdf";
import axios from "axios";

import {
  useEffect,
  useState,
} from "react";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

const YOLO_STREAM_BASE =
  import.meta.env.VITE_YOLO_STREAM_BASE_URL ||
  "http://localhost:5050";

const USER_ROLE =
  localStorage.getItem("role") ||
  "citizen";

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

function AIVisionCenter() {
  // =====================================================
  // Existing AI Analysis State
  // =====================================================

  const [result, setResult] =
    useState(null);

  const [imageUrl, setImageUrl] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [fileType, setFileType] =
    useState("image");

  const [loading, setLoading] =
    useState(false);

  // =====================================================
  // Camera State
  // =====================================================

  const [selectedCameraId, setSelectedCameraId] =
    useState(null);

  const [showCameraAnalysis, setShowCameraAnalysis] =
    useState(false);

  const [cameraStatus, setCameraStatus] =
    useState({});

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
  }, [cameras, cameraLoading]);

  const getHealthStatus = (
    timestamp
  ) => {
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

  // =====================================================
  // AI Traffic Analysis
  // =====================================================

  const analyzeTraffic =
    async () => {
      try {
        if (!selectedFile) {
          alert(
            "Please select an image or video."
          );

          return;
        }

        setLoading(true);

        const formData =
          new FormData();

        formData.append(
          "image",
          selectedFile
        );

        const uploadRes =
          await axios.post(
            `${BASE_URL}/api/upload/image`,
            formData,
            {
              headers:
                getAuthHeaders(),
            }
          );

        const imagePath =
          uploadRes.data.imagePath;

        let analysisResponse;

        if (
          fileType ===
          "video"
        ) {
          analysisResponse =
            await axios.get(
              `${BASE_URL}/api/video/analyze-video`,
              {
                headers:
                  getAuthHeaders(),
              }
            );
        } else {
          analysisResponse =
            await axios.get(
              `${BASE_URL}/api/ai/analyze`,
              {
                headers:
                  getAuthHeaders(),
                params: {
                  imagePath,
                },
              }
            );
        }

        const analysis =
          analysisResponse.data;

        setResult(
          analysis
        );

        if (
          analysis.accidentDetected
        ) {
          try {
            await axios.post(
              `${BASE_URL}/api/incidents`,
              {
                location:
                  "AI Surveillance",
                incidentType:
                  "Accident",
                severity:
                  analysis.accidentSeverity,
                description:
                  "AI detected a possible road accident.",
              },
              {
                headers:
                  getAuthHeaders(),
              }
            );

            alert(
              "🚨 Accident Detected!\n\nEmergency incident has been created successfully."
            );
          } catch (error) {
            console.log(
              "Incident creation error:",
              error
            );
          }
        }

        const resultImage =
          `${BASE_URL}/results/annotated_result.jpg?t=${Date.now()}`;

        setImageUrl(
          resultImage
        );

        alert(
          "AI Analysis Success"
        );
      } catch (error) {
        console.log(
          "AI analysis error:",
          error
        );

        alert(
          error.response?.data?.error ||
            error.message ||
            "AI Analysis Failed"
        );
      } finally {
        setLoading(false);
      }
    };

  // =====================================================
  // PDF Report
  // =====================================================

  const downloadReport =
    () => {
      if (!result) {
        alert(
          "Run analysis first."
        );

        return;
      }

      const doc =
        new jsPDF();

      doc.setFontSize(
        18
      );

      doc.text(
        "TrafficMind AI Report",
        20,
        20
      );

      doc.setFontSize(
        12
      );

      doc.text(
        `Vehicle Count: ${
          result.vehicleCount ||
          result.averageVehicleCount ||
          0
        }`,
        20,
        50
      );

      doc.text(
        `Congestion: ${
          result.congestion ||
          "Unknown"
        }`,
        20,
        70
      );

      doc.text(
        `Recommendation: ${
          result.recommendation ||
          "Monitor Traffic"
        }`,
        20,
        90
      );

      if (
        result.accidentDetected
      ) {
        doc.text(
          `Accident Severity: ${
            result.accidentSeverity ||
            "Unknown"
          }`,
          20,
          110
        );
      }

      doc.text(
        `Generated: ${new Date().toLocaleString()}`,
        20,
        130
      );

      doc.save(
        "TrafficMind_AI_Report.pdf"
      );
    };

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
          {String(camera.source || "")
            .trim()
            .toLowerCase()
            .startsWith("rtsp://") ? (
            <img
              src={`${YOLO_STREAM_BASE}/normal-stream/${camera.id}`}
              alt={`Live original camera feed for ${camera.id}`}
              style={{
                display:
                  "block",
                width:
                  "100%",
                height:
                  isMinimized ? "92px" : "280px",
                objectFit:
                  "cover",
                background:
                  "#000",
              }}
            />
          ) : (
            <video
              width="100%"
              height={isMinimized ? "92" : "280"}
              autoPlay
              muted
              loop
              playsInline
              controls={
                false
              }
              style={{
                display:
                  "block",
                width:
                  "100%",
                height:
                  "280px",
                objectFit:
                  "cover",
                background:
                  "#000",
              }}
            >
              <source
                src={
                  camera.video
                }
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
            ● ORIGINAL LIVE CAMERA
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
                          🎥 Normal Live Camera
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

                    {String(selectedCamera.source || "")
                      .trim()
                      .toLowerCase()
                      .startsWith("rtsp://") ? (
                      <img
                        src={`${YOLO_STREAM_BASE}/normal-stream/${selectedCamera.id}`}
                        alt={`Normal live camera for ${selectedCamera.id}`}
                        style={{
                          display: "block",
                          width: "100%",
                          height: isMobile ? "280px" : "430px",
                          objectFit: "cover",
                          background: "#000",
                        }}
                      />
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

                    <img
                      src={`${YOLO_STREAM_BASE}/stream/${selectedCamera.id}`}
                      alt={`Live YOLO analysis for ${selectedCamera.id}`}
                      style={{
                        display: "block",
                        width: "100%",
                        height: isMobile ? "280px" : "430px",
                        objectFit: "cover",
                        background: "#000",
                      }}
                    />
                  </div>
                </div>

                {/* =================================================
                    LIVE REPORT
                ================================================= */}
                {/* =================================================
                    AI METRICS
                ================================================= */}

                {selectedCameraStatus?.detection && (
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

                {selectedCameraStatus?.detection && (
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

      {/* =================================================
          AI ANALYSIS ENGINE
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
            marginBottom:
              "20px",
          }}
        >
          <div>
            <h2>
               AI Traffic Analysis Engine
            </h2>

            <p
              style={{
                color:
                  "var(--text-muted)",
                marginTop:
                  "6px",
              }}
            >
              Upload an image or video
              for the existing AI
              analysis pipeline.
            </p>
          </div>

          
        </div>

        <div
          style={{
            background:
              "var(--app-surface-2)",
            border:
              "2px dashed #3B82F6",
            borderRadius:
              "15px",
            padding:
              "25px",
            textAlign:
              "center",
            marginBottom:
              "20px",
          }}
        >
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(
              e
            ) => {
              const file =
                e.target.files?.[0];

              setSelectedFile(
                file || null
              );

              if (
                file &&
                file.type.startsWith(
                  "video"
                )
              ) {
                setFileType(
                  "video"
                );
              } else {
                setFileType(
                  "image"
                );
              }
            }}
          />

          <p
            style={{
              color:
                "var(--text-muted)",
              marginTop:
                "10px",
            }}
          >
            📤 Select an image or video
            for AI analysis
          </p>
        </div>

        <div
          style={{
            display:
              "flex",
            gap:
              "12px",
            alignItems:
              "center",
            flexWrap:
              "wrap",
          }}
        >
          <button
            onClick={
              analyzeTraffic
            }
            disabled={
              loading
            }
            style={{
              background:
                "#2563EB",
              color:
                "white",
              border:
                "none",
              padding:
                "12px 20px",
              borderRadius:
                "10px",
              cursor:
                loading
                  ? "not-allowed"
                  : "pointer",
              fontWeight:
                "700",
            }}
          >
            {loading
              ? "⏳ Analyzing..."
              : "🚦 Analyze Traffic"}
          </button>

          <button
            onClick={
              downloadReport
            }
            disabled={
              !result
            }
            style={{
              background:
                "#16A34A",
              color:
                "white",
              border:
                "none",
              padding:
                "12px 20px",
              borderRadius:
                "10px",
              cursor:
                !result
                  ? "not-allowed"
                  : "pointer",
              fontWeight:
                "700",
            }}
          >
            📄 Download Report
          </button>
        </div>
      </div>

      {/* =================================================
          AI RESULTS
      ================================================= */}

      {result && (
        <>
          <div
            className="section-card"
            style={{
              marginBottom:
                "20px",
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
              }}
            >
              <div>
                <h2>
                  🤖 AI Analysis Results
                </h2>

                <p
                  style={{
                    color:
                      "var(--text-muted)",
                    marginTop:
                      "6px",
                  }}
                >
                  AI-generated traffic
                  analysis summary.
                </p>
              </div>

              <span
                style={{
                  background:
                    "#16A34A",
                  color:
                    "white",
                  padding:
                    "8px 16px",
                  borderRadius:
                    "20px",
                  fontWeight:
                    "700",
                }}
              >
                ✔ COMPLETE
              </span>
            </div>
          </div>

          <div
            className="cards"
            style={{
              marginBottom:
                "20px",
            }}
          >
            <div className="card">
              <h3>
                🚗 Vehicle Count
              </h3>

              <h2>
                {result.vehicleCount ??
                  result.averageVehicleCount ??
                  0}
              </h2>
            </div>

            {result.peakVehicleCount !=
              null && (
              <div className="card">
                <h3>
                  📈 Peak Vehicles
                </h3>

                <h2>
                  {
                    result.peakVehicleCount
                  }
                </h2>
              </div>
            )}

            <div className="card">
              <h3>
                🚦 Congestion
              </h3>

              <h2
                style={{
                  color:
                    result.congestion ===
                    "High"
                      ? "#EF4444"
                      : result.congestion ===
                        "Medium"
                      ? "#F59E0B"
                      : "#22C55E",
                }}
              >
                {
                  result.congestion ||
                  "Unknown"
                }
              </h2>
            </div>

            <div className="card">
              <h3>
                💡 AI Recommendation
              </h3>

              <p
                style={{
                  fontSize:
                    "16px",
                  fontWeight:
                    "600",
                  color:
                    "var(--text-primary)",
                  lineHeight:
                    "1.6",
                }}
              >
                {
                  result.recommendation ||
                  "No recommendation available"
                }
              </p>
            </div>
          </div>
        </>
      )}

      {/* =================================================
          ACCIDENT DETECTION
      ================================================= */}

      {result?.accidentDetected && (
        <div
          className="section-card"
          style={{
            marginBottom:
              "25px",
            border:
              "2px solid #EF4444",
            background:
              "rgba(239,68,68,.08)",
          }}
        >
          <h2
            style={{
              color:
                "#EF4444",
              marginBottom:
                "15px",
            }}
          >
            🚨 Accident Detected
          </h2>

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                isMobile
                  ? "1fr"
                  : "repeat(2,1fr)",
              gap:
                "20px",
            }}
          >
            <div>
              <p>
                <strong>
                  Severity
                </strong>
              </p>

              <h3
                style={{
                  color:
                    "#EF4444",
                }}
              >
                {
                  result.accidentSeverity
                }
              </h3>
            </div>

            <div>
              <p>
                <strong>
                  AI Status
                </strong>
              </p>

              <h3
                style={{
                  color:
                    "#22C55E",
                }}
              >
                Detection Successful
              </h3>
            </div>
          </div>

          <div
            style={{
              marginTop:
                "20px",
              padding:
                "15px",
              borderRadius:
                "10px",
              background:
                "#991B1B",
              color:
                "white",
              fontWeight:
                "700",
            }}
          >
            Accident detected by AI
            surveillance.
          </div>

          <div
            style={{
              marginTop:
                "20px",
              display:
                "flex",
              gap:
                "15px",
              flexWrap:
                "wrap",
            }}
          >
            <button
              onClick={() => {
                window.location.href =
                  "/emergency-response";
              }}
              style={{
                background:
                  "#DC2626",
                color:
                  "white",
                border:
                  "none",
                padding:
                  "12px 18px",
                borderRadius:
                  "10px",
                cursor:
                  "pointer",
                fontWeight:
                  "700",
              }}
            >
              🚑 Open Emergency Response
            </button>

            <button
              onClick={() => {
                window.location.href =
                  "/emergency-response";
              }}
              style={{
                background:
                  "#16A34A",
                color:
                  "white",
                border:
                  "none",
                padding:
                  "12px 18px",
                borderRadius:
                  "10px",
                cursor:
                  "pointer",
                fontWeight:
                  "700",
              }}
            >
              🟢 Open Emergency Response
            </button>
          </div>
        </div>
      )}

      {/* =================================================
          DETECTION OUTPUT
      ================================================= */}

      {imageUrl && (
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
              marginBottom:
                "15px",
            }}
          >
            <div>
              <h2>
                🤖 Detection Output
              </h2>

              <p
                style={{
                  color:
                    "var(--text-muted)",
                  marginTop:
                    "6px",
                }}
              >
                Annotated traffic detection
                generated by the existing
                YOLO pipeline.
              </p>
            </div>

            <span
              style={{
                background:
                  "#2563EB",
                color:
                  "white",
                padding:
                  "8px 15px",
                borderRadius:
                  "20px",
                fontWeight:
                  "700",
              }}
            >
              AI OUTPUT
            </span>
          </div>

          <img
            src={imageUrl}
            alt="YOLO Result"
            style={{
              width:
                "100%",
              borderRadius:
                "15px",
              border:
                "2px solid rgba(59,130,246,.3)",
            }}
          />
        </div>
      )}
    </MainLayout>
  );
}

export default AIVisionCenter;
