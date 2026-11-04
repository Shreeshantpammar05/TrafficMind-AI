import { API_BASE } from "../config/api.js";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  FaBell,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimes,
  FaAmbulance,
  FaMapMarkerAlt,
  FaVideo,
  FaBuilding,
  FaUserShield,
  FaClock,
  FaRoute,
  FaChevronRight,
  FaSyncAlt,
} from "react-icons/fa";



const STATUS_FLOW = {
  SENT: {
    label: "Sent",
    color: "#F59E0B",
    background:
      "rgba(245, 158, 11, 0.12)",
  },

  ACKNOWLEDGED: {
    label: "Acknowledged",
    color: "#3B82F6",
    background:
      "rgba(59, 130, 246, 0.12)",
  },

  RESPONDING: {
    label: "Responding",
    color: "#8B5CF6",
    background:
      "rgba(139, 92, 246, 0.12)",
  },

  RESOLVED: {
    label: "Resolved",
    color: "#22C55E",
    background:
      "rgba(34, 197, 94, 0.12)",
  },
};

function OfficerAlertPanel({
  onClose,
}) {
  const [alerts, setAlerts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [updatingId, setUpdatingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const fetchAlerts = async (
    showRefresh = false
  ) => {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token =
        localStorage.getItem(
          "token"
        );

      const res =
        await axios.get(
          `${API_BASE}/api/officer-alerts/my`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      setAlerts(
        res.data.alerts || []
      );
    } catch (err) {
      console.error(
        "Failed to fetch officer alerts:",
        err
      );

      setError(
        err?.response?.data?.error ||
          "Unable to load officer alerts."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    const interval =
      setInterval(() => {
        fetchAlerts(true);
      }, 15000);

    return () =>
      clearInterval(interval);
  }, []);

  const updateAlertStatus = async (
    alertId,
    nextStatus
  ) => {
    try {
      setError("");

      setUpdatingId(
        alertId
      );

      const token =
        localStorage.getItem(
          "token"
        );

      await axios.patch(
        `${API_BASE}/api/officer-alerts/${alertId}/status`,
        {
          status:
            nextStatus,
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "application/json",
          },
        }
      );

      await fetchAlerts(
        true
      );
    } catch (err) {
      console.error(
        "Failed to update officer alert:",
        err
      );

      setError(
        err?.response?.data?.error ||
          "Unable to update alert status."
      );
    } finally {
      setUpdatingId(
        null
      );
    }
  };

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "Unknown time";
    }

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "Unknown time";
    }

    return parsed.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const formatRelativeTime =
    (date) => {
      if (!date) {
        return "";
      }

      const parsed =
        new Date(date);

      if (
        Number.isNaN(
          parsed.getTime()
        )
      ) {
        return "";
      }

      const difference =
        Date.now() -
        parsed.getTime();

      const seconds =
        Math.floor(
          difference / 1000
        );

      if (seconds < 60) {
        return `${Math.max(
          seconds,
          0
        )}s ago`;
      }

      const minutes =
        Math.floor(
          seconds / 60
        );

      if (minutes < 60) {
        return `${minutes}m ago`;
      }

      const hours =
        Math.floor(
          minutes / 60
        );

      if (hours < 24) {
        return `${hours}h ago`;
      }

      const days =
        Math.floor(
          hours / 24
        );

      return `${days}d ago`;
    };

  const getPriorityStyle =
    (priority) => {
      switch (priority) {
        case "CRITICAL":
          return {
            color: "#EF4444",
            background:
              "rgba(239, 68, 68, 0.12)",
          };

        case "HIGH":
          return {
            color: "#F97316",
            background:
              "rgba(249, 115, 22, 0.12)",
          };

        case "MEDIUM":
          return {
            color: "#F59E0B",
            background:
              "rgba(245, 158, 11, 0.12)",
          };

        default:
          return {
            color:
              "var(--text-muted)",
            background:
              "var(--app-surface-2)",
          };
      }
    };

  const getStatusConfig =
    (status) => {
      return (
        STATUS_FLOW[
          status
        ] || {
          label:
            status ||
            "Unknown",

          color:
            "var(--text-muted)",

          background:
            "var(--app-surface-2)",
        }
      );
    };

  const getEmergencyIcon =
    (
      emergencyType
    ) => {
      const type =
        String(
          emergencyType || ""
        ).toLowerCase();

      if (
        type.includes(
          "ambulance"
        )
      ) {
        return (
          <FaAmbulance
            size={20}
            color="#EF4444"
          />
        );
      }

      return (
        <FaExclamationTriangle
          size={19}
          color="#F59E0B"
        />
      );
    };

  const getNextAction =
    (status) => {
      switch (status) {
        case "SENT":
          return {
            label:
              "Acknowledge",

            nextStatus:
              "ACKNOWLEDGED",

            icon:
              <FaCheckCircle />,
          };

        case "ACKNOWLEDGED":
          return {
            label:
              "Start Response",

            nextStatus:
              "RESPONDING",

            icon:
              <FaChevronRight />,
          };

        case "RESPONDING":
          return {
            label:
              "Resolve Alert",

            nextStatus:
              "RESOLVED",

            icon:
              <FaCheckCircle />,
          };

        default:
          return null;
      }
    };

  const sortedAlerts =
    useMemo(() => {
      return [
        ...alerts,
      ].sort(
        (a, b) => {
          const aTime =
            new Date(
              a.sentAt ||
                a.createdAt ||
                0
            ).getTime();

          const bTime =
            new Date(
              b.sentAt ||
                b.createdAt ||
                0
            ).getTime();

          return bTime - aTime;
        }
      );
    }, [alerts]);

  const activeAlerts =
    useMemo(() => {
      return sortedAlerts.filter(
        (alert) =>
          alert.status !==
          "RESOLVED"
      );
    }, [sortedAlerts]);

  const resolvedAlerts =
    useMemo(() => {
      return sortedAlerts.filter(
        (alert) =>
          alert.status ===
          "RESOLVED"
      );
    }, [sortedAlerts]);

  return (
    <div
      style={{
        position:
          "fixed",

        top: "74px",

        right: "25px",

        width: "430px",

        maxWidth:
          "calc(100vw - 40px)",

        maxHeight:
          "calc(100vh - 100px)",

        background:
          "var(--app-surface)",

        border:
          "1px solid var(--border)",

        borderRadius:
          "18px",

        boxShadow:
          "0 24px 70px rgba(0,0,0,0.35)",

        backdropFilter:
          "blur(18px)",

        zIndex: 2000,

        overflow: "hidden",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          padding:
            "18px 20px",

          borderBottom:
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
          }}
        >
          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap: "11px",
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius:
                  "12px",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                background:
                  "rgba(245, 158, 11, 0.12)",

                border:
                  "1px solid rgba(245, 158, 11, 0.25)",
              }}
            >
              <FaBell
                color="#F59E0B"
                size={17}
              />
            </div>

            <div>
              <div
                style={{
                  fontSize:
                    "16px",

                  fontWeight:
                    "800",

                  color:
                    "var(--text-primary)",
                }}
              >
                Role-Based Alerts
              </div>

              <div
                style={{
                  marginTop:
                    "3px",

                  fontSize:
                    "11px",

                  color:
                    "var(--text-muted)",
                }}
              >
                Emergency alerts assigned
                to your jurisdiction
              </div>
            </div>
          </div>

          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap: "7px",
            }}
          >
            <button
              type="button"
              onClick={() =>
                fetchAlerts(
                  true
                )
              }
              disabled={
                refreshing
              }
              title="Refresh alerts"
              style={{
                width:
                  "34px",

                height:
                  "34px",

                borderRadius:
                  "9px",

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

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",
              }}
            >
              <FaSyncAlt
                size={12}
                style={{
                  animation:
                    refreshing
                      ? "spin 1s linear infinite"
                      : "none",
                }}
              />
            </button>

            <button
              type="button"
              onClick={
                onClose
              }
              title="Close alerts"
              style={{
                width:
                  "34px",

                height:
                  "34px",

                borderRadius:
                  "9px",

                border:
                  "none",

                background:
                  "transparent",

                color:
                  "var(--text-muted)",

                cursor:
                  "pointer",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",
              }}
            >
              <FaTimes
                size={16}
              />
            </button>
          </div>
        </div>

        {/* SUMMARY */}

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "1fr 1fr",

            gap: "8px",

            marginTop:
              "15px",
          }}
        >
          <div
            style={{
              padding:
                "10px 12px",

              borderRadius:
                "10px",

              background:
                "var(--app-surface-2)",

              border:
                "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize:
                  "10px",

                color:
                  "var(--text-muted)",

                textTransform:
                  "uppercase",

                letterSpacing:
                  ".08em",
              }}
            >
              Active
            </div>

            <div
              style={{
                marginTop:
                  "3px",

                fontSize:
                  "19px",

                fontWeight:
                  "800",

                color:
                  activeAlerts.length >
                  0
                    ? "#EF4444"
                    : "#22C55E",
              }}
            >
              {
                activeAlerts.length
              }
            </div>
          </div>

          <div
            style={{
              padding:
                "10px 12px",

              borderRadius:
                "10px",

              background:
                "var(--app-surface-2)",

              border:
                "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize:
                  "10px",

                color:
                  "var(--text-muted)",

                textTransform:
                  "uppercase",

                letterSpacing:
                  ".08em",
              }}
            >
              Resolved
            </div>

            <div
              style={{
                marginTop:
                  "3px",

                fontSize:
                  "19px",

                fontWeight:
                  "800",

                color:
                  "#22C55E",
              }}
            >
              {
                resolvedAlerts.length
              }
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}

      <div
        style={{
          padding:
            "12px",

          overflowY:
            "auto",

          maxHeight:
            "calc(100vh - 230px)",
        }}
      >
        {loading ? (
          <div
            style={{
              padding:
                "55px 20px",

              textAlign:
                "center",

              color:
                "var(--text-muted)",
            }}
          >
            <FaSyncAlt
              size={22}
              style={{
                marginBottom:
                  "12px",

                animation:
                  "spin 1s linear infinite",
              }}
            />

            <div
              style={{
                fontSize:
                  "13px",
              }}
            >
              Loading officer alerts...
            </div>
          </div>
        ) : error ? (
          <div
            style={{
              padding:
                "20px",

              borderRadius:
                "12px",

              background:
                "rgba(239, 68, 68, 0.08)",

              border:
                "1px solid rgba(239, 68, 68, 0.2)",
            }}
          >
            <div
              style={{
                display:
                  "flex",

                gap: "10px",

                alignItems:
                  "center",
              }}
            >
              <FaExclamationTriangle
                color="#EF4444"
              />

              <div
                style={{
                  fontSize:
                    "13px",

                  color:
                    "var(--text-primary)",

                  fontWeight:
                    "700",
                }}
              >
                Alert service unavailable
              </div>
            </div>

            <div
              style={{
                marginTop:
                  "7px",

                fontSize:
                  "11px",

                lineHeight:
                  "1.5",

                color:
                  "var(--text-muted)",
              }}
            >
              {error}
            </div>

            <button
              type="button"
              onClick={() =>
                fetchAlerts(
                  true
                )
              }
              style={{
                marginTop:
                  "12px",

                padding:
                  "8px 12px",

                borderRadius:
                  "8px",

                border:
                  "none",

                background:
                  "#EF4444",

                color:
                  "#fff",

                cursor:
                  "pointer",

                fontSize:
                  "11px",

                fontWeight:
                  "700",
              }}
            >
              Retry
            </button>
          </div>
        ) : alerts.length ===
          0 ? (
          <div
            style={{
              padding:
                "50px 20px",

              textAlign:
                "center",
            }}
          >
            <div
              style={{
                width:
                  "60px",

                height:
                  "60px",

                margin:
                  "0 auto",

                borderRadius:
                  "18px",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                background:
                  "rgba(34, 197, 94, 0.10)",

                border:
                  "1px solid rgba(34, 197, 94, 0.20)",
              }}
            >
              <FaCheckCircle
                size={28}
                color="#22C55E"
              />
            </div>

            <div
              style={{
                marginTop:
                  "14px",

                fontSize:
                  "15px",

                fontWeight:
                  "800",

                color:
                  "var(--text-primary)",
              }}
            >
              No officer alerts
            </div>

            <div
              style={{
                marginTop:
                  "6px",

                fontSize:
                  "12px",

                color:
                  "var(--text-muted)",

                lineHeight:
                  "1.5",
              }}
            >
              No emergency has been assigned
              to your role or jurisdiction.
            </div>
          </div>
        ) : (
          <>
            {/* ACTIVE */}

            {activeAlerts.length >
              0 && (
              <div>
                <div
                  style={{
                    padding:
                      "3px 4px 8px",

                    fontSize:
                      "10px",

                    fontWeight:
                      "800",

                    color:
                      "var(--text-muted)",

                    textTransform:
                      "uppercase",

                    letterSpacing:
                      ".08em",
                  }}
                >
                  Active Emergency
                </div>

                {activeAlerts.map(
                  (alert) => {
                    const priorityStyle =
                      getPriorityStyle(
                        alert.priority
                      );

                    const statusConfig =
                      getStatusConfig(
                        alert.status
                      );

                    const nextAction =
                      getNextAction(
                        alert.status
                      );

                    const isUpdating =
                      updatingId ===
                      alert._id;

                    return (
                      <div
                        key={
                          alert._id
                        }
                        style={{
                          marginBottom:
                            "12px",

                          padding:
                            "16px",

                          borderRadius:
                            "14px",

                          background:
                            "var(--app-surface-2)",

                          border:
                            "1px solid var(--border)",
                        }}
                      >
                        {/* TOP */}

                        <div
                          style={{
                            display:
                              "flex",

                            justifyContent:
                              "space-between",

                            alignItems:
                              "flex-start",

                            gap: "10px",
                          }}
                        >
                          <div
                            style={{
                              display:
                                "flex",

                              gap: "11px",

                              flex: 1,
                            }}
                          >
                            <div
                              style={{
                                width:
                                  "42px",

                                height:
                                  "42px",

                                borderRadius:
                                  "12px",

                                display:
                                  "flex",

                                alignItems:
                                  "center",

                                justifyContent:
                                  "center",

                                background:
                                  priorityStyle.background,

                                border: `1px solid ${priorityStyle.color}30`,
                              }}
                            >
                              {
                                getEmergencyIcon(
                                  alert.emergencyType
                                )
                              }
                            </div>

                            <div
                              style={{
                                flex: 1,
                              }}
                            >
                              <div
                                style={{
                                  fontSize:
                                    "13px",

                                  fontWeight:
                                    "900",

                                  color:
                                    "var(--text-primary)",

                                  textTransform:
                                    "uppercase",
                                }}
                              >
                                {alert.emergencyType ||
                                  "Emergency"}
                              </div>

                              <div
                                style={{
                                  marginTop:
                                    "3px",

                                  fontSize:
                                    "11px",

                                  color:
                                    "var(--text-muted)",
                                }}
                              >
                                Emergency ID:{" "}
                                {
                                  alert.emergencyId
                                }
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              padding:
                                "5px 8px",

                              borderRadius:
                                "7px",

                              background:
                                priorityStyle.background,

                              color:
                                priorityStyle.color,

                              fontSize:
                                "9px",

                              fontWeight:
                                "900",

                              letterSpacing:
                                ".06em",

                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {
                              alert.priority ||
                              "UNKNOWN"
                            }
                          </div>
                        </div>

                        {/* LOCATION */}

                        <div
                          style={{
                            display:
                              "flex",

                            gap: "10px",

                            marginTop:
                              "15px",

                            padding:
                              "11px",

                            borderRadius:
                              "10px",

                            background:
                              "var(--app-surface)",

                            border:
                              "1px solid var(--border)",
                          }}
                        >
                          <FaMapMarkerAlt
                            color="#EF4444"
                            size={14}
                            style={{
                              marginTop:
                                "2px",

                              flexShrink:
                                0,
                            }}
                          />

                          <div
                            style={{
                              minWidth:
                                0,
                            }}
                          >
                            <div
                              style={{
                                fontSize:
                                  "10px",

                                fontWeight:
                                  "800",

                                color:
                                  "var(--text-muted)",

                                textTransform:
                                  "uppercase",
                              }}
                            >
                              Location
                            </div>

                            <div
                              style={{
                                marginTop:
                                  "3px",

                                fontSize:
                                  "12px",

                                lineHeight:
                                  "1.45",

                                color:
                                  "var(--text-primary)",

                                fontWeight:
                                  "600",
                              }}
                            >
                              {alert.locationName ||
                                "Location unavailable"}
                            </div>
                          </div>
                        </div>

                        {/* CURRENT / NEXT / ETA */}

                        <div
                          style={{
                            display:
                              "grid",

                            gridTemplateColumns:
                              "1fr 1fr",

                            gap: "8px",

                            marginTop:
                              "9px",
                          }}
                        >
                          <div
                            style={{
                              padding:
                                "10px",

                              borderRadius:
                                "10px",

                              background:
                                "var(--app-surface)",

                              border:
                                "1px solid var(--border)",
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",

                                alignItems:
                                  "center",

                                gap: "6px",

                                fontSize:
                                  "9px",

                                color:
                                  "var(--text-muted)",

                                fontWeight:
                                  "700",

                                textTransform:
                                  "uppercase",
                              }}
                            >
                              <FaVideo
                                size={10}
                              />
                              Current Camera
                            </div>

                            <div
                              style={{
                                marginTop:
                                  "4px",

                                fontSize:
                                  "12px",

                                fontWeight:
                                  "800",

                                color:
                                  "var(--text-primary)",
                              }}
                            >
                              {alert.currentCameraId ||
                                "N/A"}
                            </div>
                          </div>

                          <div
                            style={{
                              padding:
                                "10px",

                              borderRadius:
                                "10px",

                              background:
                                "var(--app-surface)",

                              border:
                                "1px solid var(--border)",
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",

                                alignItems:
                                  "center",

                                gap: "6px",

                                fontSize:
                                  "9px",

                                color:
                                  "var(--text-muted)",

                                fontWeight:
                                  "700",

                                textTransform:
                                  "uppercase",
                              }}
                            >
                              <FaBuilding
                                size={10}
                              />
                              District
                            </div>

                            <div
                              style={{
                                marginTop:
                                  "4px",

                                fontSize:
                                  "12px",

                                fontWeight:
                                  "800",

                                color:
                                  "var(--text-primary)",
                              }}
                            >
                              {alert.jurisdictionDistrict ||
                                "N/A"}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display:
                              "grid",

                            gridTemplateColumns:
                              "1fr 1fr",

                            gap: "8px",

                            marginTop:
                              "8px",
                          }}
                        >
                          <div
                            style={{
                              padding:
                                "10px",

                              borderRadius:
                                "10px",

                              background:
                                "var(--app-surface)",

                              border:
                                "1px solid var(--border)",
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",

                                alignItems:
                                  "center",

                                gap: "6px",

                                fontSize:
                                  "9px",

                                color:
                                  "var(--text-muted)",

                                fontWeight:
                                  "700",

                                textTransform:
                                  "uppercase",
                              }}
                            >
                              <FaRoute
                                size={10}
                              />
                              Next Camera
                            </div>

                            <div
                              style={{
                                marginTop:
                                  "4px",

                                fontSize:
                                  "12px",

                                fontWeight:
                                  "800",

                                color:
                                  "var(--text-primary)",
                              }}
                            >
                              {alert.nextCameraId ||
                                "N/A"}
                            </div>
                          </div>

                          <div
                            style={{
                              padding:
                                "10px",

                              borderRadius:
                                "10px",

                              background:
                                "var(--app-surface)",

                              border:
                                "1px solid var(--border)",
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",

                                alignItems:
                                  "center",

                                gap: "6px",

                                fontSize:
                                  "9px",

                                color:
                                  "var(--text-muted)",

                                fontWeight:
                                  "700",

                                textTransform:
                                  "uppercase",
                              }}
                            >
                              <FaClock
                                size={10}
                              />
                              ETA
                            </div>

                            <div
                              style={{
                                marginTop:
                                  "4px",

                                fontSize:
                                  "12px",

                                fontWeight:
                                  "800",

                                color:
                                  "var(--text-primary)",
                              }}
                            >
                              {alert.etaSeconds !=
                              null
                                ? `${Math.floor(
                                    alert.etaSeconds /
                                      60
                                  )}m ${
                                    alert.etaSeconds %
                                    60
                                  }s`
                                : "N/A"}
                            </div>
                          </div>
                        </div>

                        {/* OFFICER */}

                        <div
                          style={{
                            display:
                              "grid",

                            gridTemplateColumns:
                              "1fr 1fr",

                            gap: "8px",

                            marginTop:
                              "8px",
                          }}
                        >
                          <div
                            style={{
                              padding:
                                "10px",

                              borderRadius:
                                "10px",

                              background:
                                "var(--app-surface)",

                              border:
                                "1px solid var(--border)",
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",

                                alignItems:
                                  "center",

                                gap: "6px",

                                fontSize:
                                  "9px",

                                color:
                                  "var(--text-muted)",

                                fontWeight:
                                  "700",

                                textTransform:
                                  "uppercase",
                              }}
                            >
                              <FaUserShield
                                size={10}
                              />
                              Officer
                            </div>

                            <div
                              style={{
                                marginTop:
                                  "4px",

                                fontSize:
                                  "12px",

                                fontWeight:
                                  "800",

                                color:
                                  "var(--text-primary)",
                              }}
                            >
                              {alert.officerType ===
                              "main_officer"
                                ? "Main Officer"
                                : "Sub Officer"}
                            </div>
                          </div>

                          <div
                            style={{
                              padding:
                                "10px",

                              borderRadius:
                                "10px",

                              background:
                                "var(--app-surface)",

                              border:
                                "1px solid var(--border)",
                            }}
                          >
                            <div
                              style={{
                                fontSize:
                                  "9px",

                                color:
                                  "var(--text-muted)",

                                fontWeight:
                                  "700",

                                textTransform:
                                  "uppercase",
                              }}
                            >
                              Jurisdiction
                            </div>

                            <div
                              style={{
                                marginTop:
                                  "4px",

                                fontSize:
                                  "12px",

                                fontWeight:
                                  "800",

                                color:
                                  "var(--text-primary)",
                              }}
                            >
                              {alert.jurisdictionArea ||
                                alert.jurisdictionDistrict ||
                                "N/A"}
                            </div>
                          </div>
                        </div>

                        {/* STATUS */}

                        <div
                          style={{
                            marginTop:
                              "12px",
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
                                "7px",
                            }}
                          >
                            <span
                              style={{
                                fontSize:
                                  "9px",

                                fontWeight:
                                  "800",

                                color:
                                  "var(--text-muted)",

                                textTransform:
                                  "uppercase",

                                letterSpacing:
                                  ".07em",
                              }}
                            >
                              Response Status
                            </span>

                            <span
                              style={{
                                padding:
                                  "5px 8px",

                                borderRadius:
                                  "7px",

                                background:
                                  statusConfig.background,

                                color:
                                  statusConfig.color,

                                fontSize:
                                  "9px",

                                fontWeight:
                                  "900",
                              }}
                            >
                              {
                                statusConfig.label
                              }
                            </span>
                          </div>

                          <div
                            style={{
                              display:
                                "flex",

                              alignItems:
                                "center",

                              gap: "4px",
                            }}
                          >
                            {[
                              "SENT",
                              "ACKNOWLEDGED",
                              "RESPONDING",
                              "RESOLVED",
                            ].map(
                              (
                                status,
                                index
                              ) => {
                                const currentIndex =
                                  [
                                    "SENT",
                                    "ACKNOWLEDGED",
                                    "RESPONDING",
                                    "RESOLVED",
                                  ].indexOf(
                                    alert.status
                                  );

                                const stepConfig =
                                  getStatusConfig(
                                    status
                                  );

                                const completed =
                                  index <=
                                  currentIndex;

                                return (
                                  <div
                                    key={
                                      status
                                    }
                                    style={{
                                      display:
                                        "flex",

                                      alignItems:
                                        "center",

                                      flex:
                                        1,
                                    }}
                                  >
                                    <div
                                      title={
                                        stepConfig.label
                                      }
                                      style={{
                                        width:
                                          "100%",

                                        height:
                                          "5px",

                                        borderRadius:
                                          "20px",

                                        background:
                                          completed
                                            ? stepConfig.color
                                            : "var(--border)",

                                        opacity:
                                          completed
                                            ? 1
                                            : 0.6,
                                      }}
                                    />
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>

                        {/* ACTION */}

                        {nextAction && (
                          <button
                            type="button"
                            disabled={
                              isUpdating
                            }
                            onClick={() =>
                              updateAlertStatus(
                                alert._id,
                                nextAction.nextStatus
                              )
                            }
                            style={{
                              width:
                                "100%",

                              marginTop:
                                "14px",

                              padding:
                                "11px 14px",

                              border:
                                "none",

                              borderRadius:
                                "10px",

                              background:
                                isUpdating
                                  ? "var(--border)"
                                  : statusConfig.color,

                              color:
                                "#fff",

                              cursor:
                                isUpdating
                                  ? "default"
                                  : "pointer",

                              display:
                                "flex",

                              alignItems:
                                "center",

                              justifyContent:
                                "center",

                              gap: "8px",

                              fontSize:
                                "12px",

                              fontWeight:
                                "800",
                            }}
                          >
                            {isUpdating ? (
                              <>
                                <FaSyncAlt
                                  size={11}
                                  style={{
                                    animation:
                                      "spin 1s linear infinite",
                                  }}
                                />

                                Updating...
                              </>
                            ) : (
                              <>
                                {
                                  nextAction.icon
                                }

                                {
                                  nextAction.label
                                }
                              </>
                            )}
                          </button>
                        )}

                        {/* TIME */}

                        <div
                          style={{
                            marginTop:
                              "10px",

                            textAlign:
                              "center",

                            fontSize:
                              "9px",

                            color:
                              "var(--text-muted)",
                          }}
                        >
                          Sent{" "}
                          {formatDate(
                            alert.sentAt ||
                              alert.createdAt
                          )}

                          {" • "}

                          {formatRelativeTime(
                            alert.sentAt ||
                              alert.createdAt
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}

            {/* RESOLVED */}

            {resolvedAlerts.length >
              0 && (
              <div
                style={{
                  marginTop:
                    activeAlerts.length >
                    0
                      ? "8px"
                      : "0",
                }}
              >
                <div
                  style={{
                    padding:
                      "3px 4px 8px",

                    fontSize:
                      "10px",

                    fontWeight:
                      "800",

                    color:
                      "var(--text-muted)",

                    textTransform:
                      "uppercase",

                    letterSpacing:
                      ".08em",
                  }}
                >
                  Resolved Alerts
                </div>

                {resolvedAlerts.map(
                  (alert) => (
                    <div
                      key={
                        alert._id
                      }
                      style={{
                        marginBottom:
                          "8px",

                        padding:
                          "12px",

                        borderRadius:
                          "12px",

                        background:
                          "var(--app-surface-2)",

                        border:
                          "1px solid var(--border)",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",

                          alignItems:
                            "center",

                          gap: "10px",
                        }}
                      >
                        <FaCheckCircle
                          color="#22C55E"
                          size={18}
                        />

                        <div
                          style={{
                            flex: 1,
                          }}
                        >
                          <div
                            style={{
                              fontSize:
                                "12px",

                              fontWeight:
                                "800",

                              color:
                                "var(--text-primary)",
                            }}
                          >
                            {alert.emergencyType ||
                              "Emergency"}
                          </div>

                          <div
                            style={{
                              marginTop:
                                "3px",

                              fontSize:
                                "10px",

                              color:
                                "var(--text-muted)",
                            }}
                          >
                            {
                              alert.emergencyId
                            }
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize:
                              "9px",

                            fontWeight:
                              "800",

                            color:
                              "#22C55E",
                          }}
                        >
                          RESOLVED
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop:
                            "8px",

                          paddingTop:
                            "8px",

                          borderTop:
                            "1px solid var(--border)",

                          fontSize:
                            "10px",

                          color:
                            "var(--text-muted)",
                        }}
                      >
                        Resolved{" "}
                        {formatDate(
                          alert.resolvedAt
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* FOOTER */}

      <div
        style={{
          padding:
            "10px 14px",

          borderTop:
            "1px solid var(--border)",

          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",

          fontSize:
            "9px",

          color:
            "var(--text-muted)",
        }}
      >
        <span>
          Auto refresh: 15 seconds
        </span>

        <span>
          TrafficMind AI • Phase 21
        </span>
      </div>

      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}

export default OfficerAlertPanel;