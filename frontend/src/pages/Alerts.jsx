import MainLayout from "../layouts/MainLayout";

import {
  FaBell,
  FaCarCrash,
  FaExclamationTriangle,
  FaRoad,
  FaShieldAlt,
  FaAmbulance,
  FaCheckCircle,
  FaClock,
  FaMapMarkerAlt,
  FaUserShield,
  FaSyncAlt,
  FaArrowRight,
} from "react-icons/fa";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

const ALERT_TABS = [
  {
    key: "all",
    label: "All",
  },
  {
    key: "emergency",
    label: "Emergency",
  },
  {
    key: "traffic",
    label: "Traffic",
  },
  {
    key: "accident",
    label: "Accident",
  },
  {
    key: "system",
    label: "System",
  },
];

const getRole = () =>
  localStorage.getItem("role") || "citizen";

const getToken = () =>
  localStorage.getItem("token");

const getHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

const normalizeType = (value) => {
  const type = String(value || "")
    .trim()
    .toLowerCase();

  if (
    type.includes("ambulance") ||
    type.includes("fire") ||
    type.includes("police") ||
    type.includes("emergency")
  ) {
    return "emergency";
  }

  if (
    type.includes("accident") ||
    type.includes("collision") ||
    type.includes("crash")
  ) {
    return "accident";
  }

  if (
    type.includes("traffic") ||
    type.includes("congestion") ||
    type.includes("road") ||
    type.includes("closure")
  ) {
    return "traffic";
  }

  return "system";
};

const normalizePriority = (value) => {
  const priority = String(value || "")
    .trim()
    .toUpperCase();

  if (
    [
      "CRITICAL",
      "HIGH",
      "MEDIUM",
    ].includes(priority)
  ) {
    return priority;
  }

  return "MEDIUM";
};

const normalizeOfficerStatus = (value) => {
  const status = String(value || "")
    .trim()
    .toUpperCase();

  if (
    [
      "SENT",
      "ACKNOWLEDGED",
      "RESPONDING",
      "RESOLVED",
    ].includes(status)
  ) {
    return status;
  }

  return "SENT";
};

const getDisplayTitle = (alert) => {
  if (alert.title) {
    return alert.title;
  }

  if (alert.emergencyType) {
    const readable =
      String(alert.emergencyType)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) =>
          char.toUpperCase()
        );

    return `${readable} Detected`;
  }

  if (alert.type) {
    return String(alert.type)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  }

  return "TrafficMind Alert";
};

const getDisplayMessage = (alert) => {
  if (alert.message) {
    return alert.message;
  }

  if (alert.locationName) {
    return `Emergency detected at ${alert.locationName}.`;
  }

  if (alert.location) {
    return `Activity detected at ${alert.location}.`;
  }

  return "TrafficMind AI generated a new alert.";
};

const getAlertTime = (alert) => {
  const dateValue =
    alert.sentAt ||
    alert.createdAt ||
    alert.updatedAt ||
    alert.timestamp;

  if (!dateValue) {
    return "Just now";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return date.toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
};

const normalizeOfficerAlert = (alert) => ({
  id:
    alert._id ||
    alert.alertId,

  source: "officer",

  title:
    getDisplayTitle(alert),

  message:
    getDisplayMessage(alert),

  tab:
    "emergency",

  priority:
    normalizePriority(
      alert.priority
    ),

  status:
    normalizeOfficerStatus(
      alert.status
    ),

  isRead:
    Boolean(
      alert.isRead
    ),

  cameraId:
    alert.currentCameraId ||
    "",

  location:
    alert.locationName ||
    "",

  emergencyType:
    alert.emergencyType ||
    "",

  jurisdictionArea:
    alert.jurisdictionArea ||
    "",

  jurisdictionDistrict:
    alert.jurisdictionDistrict ||
    "",

  latitude:
    alert.latitude,

  longitude:
    alert.longitude,

  sentAt:
    alert.sentAt ||
    alert.createdAt,
});

const normalizeGeneralAlert = (alert) => {
  const tab =
    normalizeType(
      alert.type ||
      alert.alertType ||
      alert.category ||
      alert.title
    );

  return {
    id:
      alert._id ||
      alert.id ||
      `${tab}-${alert.createdAt || Date.now()}-${Math.random()}`,

    source: "general",

    title:
      getDisplayTitle(alert),

    message:
      getDisplayMessage(alert),

    tab,

    priority:
      normalizePriority(
        alert.priority ||
        alert.severity
      ),

    status:
      alert.status ||
      "NEW",

    isRead:
      Boolean(
        alert.isRead ||
        alert.read
      ),

    cameraId:
      alert.cameraId ||
      "",

    location:
      alert.location ||
      alert.locationName ||
      "",

    emergencyType:
      alert.emergencyType ||
      "",

    jurisdictionArea:
      "",

    jurisdictionDistrict:
      "",

    latitude:
      alert.latitude,

    longitude:
      alert.longitude,

    sentAt:
      alert.createdAt ||
      alert.timestamp,
  };
};

function PriorityBadge({ priority }) {
  const styles = {
    CRITICAL: {
      background:
        "rgba(239,68,68,.14)",
      color:
        "#ef4444",
      border:
        "1px solid rgba(239,68,68,.25)",
    },

    HIGH: {
      background:
        "rgba(245,158,11,.14)",
      color:
        "#f59e0b",
      border:
        "1px solid rgba(245,158,11,.25)",
    },

    MEDIUM: {
      background:
        "rgba(59,130,246,.12)",
      color:
        "#3b82f6",
      border:
        "1px solid rgba(59,130,246,.22)",
    },
  };

  const style =
    styles[priority] ||
    styles.MEDIUM;

  return (
    <span
      style={{
        ...style,
        display: "inline-flex",
        alignItems:
          "center",
        gap: "6px",
        borderRadius:
          "999px",
        padding:
          "5px 10px",
        fontSize: "11px",
        fontWeight: "800",
        letterSpacing:
          ".04em",
      }}
    >
      {priority}
    </span>
  );
}

function AlertIcon({ tab }) {
  if (tab === "emergency") {
    return <FaAmbulance />;
  }

  if (tab === "accident") {
    return <FaCarCrash />;
  }

  if (tab === "traffic") {
    return <FaRoad />;
  }

  return <FaBell />;
}

function StatusBadge({ status }) {
  const styles = {
    SENT: {
      color: "#ef4444",
      background:
        "rgba(239,68,68,.10)",
    },

    ACKNOWLEDGED: {
      color: "#f59e0b",
      background:
        "rgba(245,158,11,.10)",
    },

    RESPONDING: {
      color: "#3b82f6",
      background:
        "rgba(59,130,246,.10)",
    },

    RESOLVED: {
      color: "#16a34a",
      background:
        "rgba(34,197,94,.10)",
    },

    NEW: {
      color: "#2563eb",
      background:
        "rgba(37,99,235,.10)",
    },

    READ: {
      color:
        "var(--text-muted)",
      background:
        "var(--glass)",
    },
  };

  const style =
    styles[status] ||
    styles.READ;

  return (
    <span
      style={{
        ...style,
        display: "inline-flex",
        alignItems:
          "center",
        gap: "5px",
        padding:
          "5px 9px",
        borderRadius:
          "999px",
        fontSize:
          "11px",
        fontWeight:
          "800",
      }}
    >
      {status}
    </span>
  );
}

function EmptyState({ role }) {
  return (
    <div
      style={{
        minHeight:
          "360px",
        display: "flex",
        flexDirection:
          "column",
        alignItems:
          "center",
        justifyContent:
          "center",
        textAlign:
          "center",
        padding:
          "30px",
        color:
          "var(--text-muted)",
      }}
    >
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius:
            "20px",
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          fontSize:
            "28px",
          color:
            "var(--accent)",
          background:
            "var(--accent-soft)",
          marginBottom:
            "18px",
        }}
      >
        <FaBell />
      </div>

      <h2
        style={{
          margin:
            "0 0 8px",
          color:
            "var(--text-primary)",
          fontSize:
            "22px",
        }}
      >
        No alerts right now
      </h2>

      <p
        style={{
          margin: 0,
          maxWidth:
            "520px",
          lineHeight:
            "1.65",
        }}
      >
        {role === "citizen"
          ? "Public traffic and safety notifications will appear here."
          : "Your assigned emergency and operational alerts will appear here."}
      </p>
    </div>
  );
}

function Alerts() {
  const navigate = useNavigate();

  const role =
    getRole();

  const isOfficer =
    role === "government" ||
    role === "admin";

  const [activeTab, setActiveTab] =
    useState("all");

  const [alerts, setAlerts] =
    useState([]);

  const [selectedAlert, setSelectedAlert] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState(false);

  // =========================================================
  // PHASE 24 — LIVE EMERGENCY DASHBOARD
  // =========================================================

  const [activeEmergency, setActiveEmergency] =
    useState(null);

  const [emergencyLoading, setEmergencyLoading] =
    useState(false);

  const [emergencyPrediction, setEmergencyPrediction] =
    useState(null);

  const [greenCorridor, setGreenCorridor] =
    useState(null);

  const fetchLiveEmergency = useCallback(
    async (silent = true) => {
      if (!isOfficer) {
        setActiveEmergency(null);
        setEmergencyPrediction(null);
        setGreenCorridor(null);
        return;
      }

      try {
        if (!silent) {
          setEmergencyLoading(true);
        }

        const eventResponse =
          await axios.get(
            `${API_BASE}/api/emergency/events/active`,
            {
              headers:
                getHeaders(),
            }
          );

        const event =
          eventResponse.data?.event ||
          null;

        setActiveEmergency(event);

        if (!event?.emergencyId) {
          setEmergencyPrediction(null);
          setGreenCorridor(null);
          return;
        }

        const [predictionResult, corridorResult] =
          await Promise.allSettled([
            axios.get(
              `${API_BASE}/api/emergency-prediction/${encodeURIComponent(
                event.emergencyId
              )}`,
              {
                headers:
                  getHeaders(),
              }
            ),
            axios.get(
              `${API_BASE}/api/signal/green-corridor/${encodeURIComponent(
                event.emergencyId
              )}`,
              {
                headers:
                  getHeaders(),
              }
            ),
          ]);

        if (
          predictionResult.status ===
            "fulfilled"
        ) {
          setEmergencyPrediction(
            predictionResult.value
              ?.data || null
          );
        } else {
          setEmergencyPrediction(
            null
          );
        }

        if (
          corridorResult.status ===
            "fulfilled"
        ) {
          setGreenCorridor(
            corridorResult.value
              ?.data?.greenCorridor ||
              null
          );
        } else {
          setGreenCorridor(
            null
          );
        }
      } catch (err) {
        console.error(
          "Live emergency dashboard error:",
          err?.response?.data ||
            err?.message
        );

        setActiveEmergency(null);
        setEmergencyPrediction(null);
        setGreenCorridor(null);
      } finally {
        if (!silent) {
          setEmergencyLoading(
            false
          );
        }
      }
    },
    []
  );

  useEffect(() => {
    fetchLiveEmergency(false);

    const interval =
      setInterval(() => {
        fetchLiveEmergency(true);
      }, 15000);

    return () =>
      clearInterval(interval);
  }, [
    fetchLiveEmergency,
  ]);

  const fetchAlerts =
    useCallback(
      async (
        showFullLoading = false
      ) => {
        if (showFullLoading) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        try {
          const requests = [];

          if (isOfficer) {
            requests.push(
              axios.get(
                `${API_BASE}/api/officer-alerts/my`,
                {
                  headers:
                    getHeaders(),
                }
              )
            );
          }

          requests.push(
            axios.get(
              `${API_BASE}/api/notifications`,
              {
                headers:
                  getHeaders(),
              }
            )
          );

          const results =
            await Promise.allSettled(
              requests
            );

          const combined = [];

          results.forEach(
            (result, index) => {
              if (
                result.status !==
                "fulfilled"
              ) {
                return;
              }

              const data =
                result.value?.data ||
                {};

              if (
                isOfficer &&
                index === 0
              ) {
                const officerAlerts =
                  Array.isArray(
                    data.alerts
                  )
                    ? data.alerts
                    : [];

                officerAlerts.forEach(
                  (alert) =>
                    combined.push(
                      normalizeOfficerAlert(
                        alert
                      )
                    )
                );

                return;
              }

              let generalAlerts = [];

              if (
                Array.isArray(
                  data.notifications
                )
              ) {
                generalAlerts =
                  data.notifications;
              } else if (
                Array.isArray(
                  data.alerts
                )
              ) {
                generalAlerts =
                  data.alerts;
              } else if (
                Array.isArray(data)
              ) {
                generalAlerts =
                  data;
              }

              generalAlerts.forEach(
                (alert) =>
                  combined.push(
                    normalizeGeneralAlert(
                      alert
                    )
                  )
              );
            }
          );

          const unique =
            Array.from(
              new Map(
                combined
                  .filter(
                    (alert) =>
                      alert.id
                  )
                  .map(
                    (alert) => [
                      String(
                        alert.id
                      ),
                      alert,
                    ]
                  )
              ).values()
            );

          unique.sort(
            (a, b) => {
              const aTime =
                new Date(
                  a.sentAt ||
                    0
                ).getTime();

              const bTime =
                new Date(
                  b.sentAt ||
                    0
                ).getTime();

              return (
                bTime -
                aTime
              );
            }
          );

          setAlerts(
            unique
          );

          setSelectedAlert(
            (current) => {
              if (!current) {
                return (
                  unique[0] ||
                  null
                );
              }

              return (
                unique.find(
                  (item) =>
                    String(
                      item.id
                    ) ===
                    String(
                      current.id
                    )
                ) ||
                unique[0] ||
                null
              );
            }
          );
        } catch (err) {
          console.error(
            "Alerts fetch error:",
            err
          );

          setError(
            "Unable to load alerts."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [isOfficer]
    );

  useEffect(() => {
    fetchAlerts(
      true
    );

    const interval =
      setInterval(
        () => {
          fetchAlerts(
            false
          );
        },
        15000
      );

    return () =>
      clearInterval(
        interval
      );
  }, [
    fetchAlerts,
  ]);

  const filteredAlerts =
    useMemo(() => {
      if (
        activeTab ===
        "all"
      ) {
        return alerts;
      }

      return alerts.filter(
        (alert) =>
          alert.tab ===
          activeTab
      );
    }, [
      activeTab,
      alerts,
    ]);

  const unreadCount =
    alerts.filter(
      (alert) =>
        !alert.isRead
    ).length;

  const updateOfficerStatus =
    async (
      alert,
      nextStatus
    ) => {
      if (
        alert.source !==
          "officer" ||
        !alert.id
      ) {
        return;
      }

      setActionLoading(
        true
      );

      try {
        const response =
          await axios.patch(
            `${API_BASE}/api/officer-alerts/${alert.id}/status`,
            {
              status:
                nextStatus,
            },
            {
              headers:
                getHeaders(),
            }
          );

        const updated =
          response.data?.alert;

        setAlerts(
          (current) =>
            current.map(
              (item) =>
                String(
                  item.id
                ) ===
                String(
                  alert.id
                )
                  ? {
                      ...item,
                      status:
                        updated?.status ||
                        nextStatus,
                      isRead: true,
                    }
                  : item
            )
        );

        setSelectedAlert(
          (current) =>
            current &&
            String(
              current.id
            ) ===
              String(
                alert.id
              )
              ? {
                  ...current,
                  status:
                    updated?.status ||
                    nextStatus,
                  isRead: true,
                }
              : current
        );
      } catch (err) {
        console.error(
          "Officer status update error:",
          err
        );

        setError(
          "Unable to update alert status."
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  const markSelectedAsRead =
    () => {
      setAlerts(
        (current) =>
          current.map(
            (item) =>
              String(
                item.id
              ) ===
              String(
                selectedAlert?.id
              )
                ? {
                    ...item,
                    isRead:
                      true,
                  }
                : item
          )
      );

      setSelectedAlert(
        (current) =>
          current
            ? {
                ...current,
                isRead:
                  true,
              }
            : current
      );
    };

  return (
    <MainLayout>
      <div
        style={{
          maxWidth:
            "1450px",
        margin:
          "0 auto",
        color:
          "var(--text-primary)",
      }}
    >
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          marginBottom: "18px",
          padding: "10px 16px",
          borderRadius: "10px",
          border: "1px solid var(--border-strong)",
          background: "var(--app-surface)",
          color: "var(--text-primary)",
          fontWeight: "700",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background =
            "var(--accent-soft)";
          e.currentTarget.style.borderColor =
            "var(--accent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background =
            "var(--app-surface)";
          e.currentTarget.style.borderColor =
            "var(--border-strong)";
        }}
      >
        ← Back
      </button>

      {/* Header */}

      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "space-between",
          gap: "16px",
          marginBottom:
            "22px",
        }}
      >
        <div>
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: "12px",
            }}
          >
            <FaBell
              style={{
                color:
                  "var(--accent)",
                fontSize:
                  "26px",
              }}
            />

            <h1
              style={{
                margin: 0,
                fontSize:
                  "32px",
                fontWeight:
                  "800",
                letterSpacing:
                  "-.03em",
              }}
            >
              Alerts
            </h1>
          </div>

          <p
            style={{
              margin:
                "7px 0 0",
              color:
                "var(--text-muted)",
              lineHeight:
                "1.55",
            }}
          >
            Important traffic,
            emergency and safety
            notifications.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            fetchAlerts(
              false
            )
          }
          disabled={
            refreshing
          }
          style={{
            border:
              "1px solid var(--border)",
            background:
              "var(--glass)",
            color:
              "var(--text-primary)",
            borderRadius:
              "12px",
            padding:
              "11px 15px",
            display:
              "inline-flex",
            alignItems:
              "center",
            gap: "8px",
            cursor:
              refreshing
                ? "not-allowed"
                : "pointer",
            opacity:
              refreshing
                ? 0.65
                : 1,
            fontWeight:
              "700",
          }}
        >
          <FaSyncAlt
            style={{
              transform:
                refreshing
                  ? "rotate(180deg)"
                  : "rotate(0)",
              transition:
                "transform .3s ease",
            }}
          />
          Refresh
        </button>
      </div>

      {/* Role indicator */}

      <div
        style={{
          display:
            "inline-flex",
          alignItems:
            "center",
          gap: "8px",
          padding:
            "8px 12px",
          borderRadius:
            "999px",
          background:
            "var(--glass)",
          border:
            "1px solid var(--border)",
          color:
            "var(--text-secondary)",
          fontSize:
            "12px",
          fontWeight:
            "700",
          marginBottom:
            "20px",
        }}
      >
        <FaUserShield
          style={{
            color:
              "var(--accent)",
          }}
        />
        {role ===
        "government"
          ? "Sub / Government Officer"
          : role ===
            "admin"
          ? "Administrator"
          : "Citizen"}
      </div>

      {/* Filters */}

      <div
        style={{
          display:
            "flex",
          flexWrap:
            "wrap",
          alignItems:
            "center",
          gap: "9px",
          marginBottom:
            "18px",
        }}
      >
        {ALERT_TABS.map(
          (tab) => {
            const isActive =
              activeTab ===
              tab.key;

            return (
              <button
                type="button"
                key={
                  tab.key
                }
                onClick={() =>
                  setActiveTab(
                    tab.key
                  )
                }
                style={{
                  border:
                    isActive
                      ? "1px solid var(--accent)"
                      : "1px solid var(--border)",
                  background:
                    isActive
                      ? "var(--accent)"
                      : "var(--glass)",
                  color:
                    isActive
                      ? "#fff"
                      : "var(--text-primary)",
                  padding:
                    "9px 15px",
                  borderRadius:
                    "999px",
                  cursor:
                    "pointer",
                  fontWeight:
                    "700",
                  fontSize:
                    "13px",
                }}
              >
                {tab.label}

                {tab.key ===
                  "all" &&
                  unreadCount >
                    0 && (
                    <span
                      style={{
                        marginLeft:
                          "7px",
                        padding:
                          "2px 7px",
                        borderRadius:
                          "999px",
                        background:
                          isActive
                            ? "rgba(255,255,255,.2)"
                            : "rgba(239,68,68,.12)",
                        color:
                          isActive
                            ? "#fff"
                            : "#ef4444",
                        fontSize:
                          "11px",
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
              </button>
            );
          }
        )}
      </div>

      {/* Error */}

      {error && (
        <div
          style={{
            padding:
              "12px 15px",
            borderRadius:
              "12px",
            marginBottom:
              "16px",
            color:
              "#b91c1c",
            background:
              "rgba(239,68,68,.08)",
            border:
              "1px solid rgba(239,68,68,.2)",
          }}
        >
          {error}
        </div>
      )}


      {/* =====================================================
          PHASE 24 — LIVE EMERGENCY DASHBOARD
      ====================================================== */}

      {isOfficer && activeEmergency && (
        <div
          style={{
            marginBottom: "20px",
            padding: "20px",
            borderRadius: "18px",
            background:
              "var(--glass)",
            border:
              "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: "900",
                  color: "#EF4444",
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    ".08em",
                }}
              >
                🚨 Phase 24 • Live Emergency
              </div>

              <div
                style={{
                  marginTop: "5px",
                  fontSize: "19px",
                  fontWeight: "900",
                }}
              >
                {activeEmergency.emergencyId}
              </div>
            </div>

            <PriorityBadge
              priority={
                activeEmergency.priority ||
                "MEDIUM"
              }
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4, minmax(0, 1fr))",
              gap: "10px",
            }}
          >
            {[
              [
                "Vehicle",
                String(
                  activeEmergency.vehicleType ||
                    ""
                )
                  .replaceAll("_", " ")
                  .replace(/\w/g, (c) =>
                    c.toUpperCase()
                  ),
              ],
              [
                "Current Camera",
                activeEmergency.currentCameraId ||
                  "N/A",
              ],
              [
                "Previous Camera",
                activeEmergency.previousCameraId ||
                  "N/A",
              ],
              [
                "Status",
                activeEmergency.status ||
                  "N/A",
              ],
            ].map(
              ([label, value]) => (
                <div
                  key={label}
                  style={{
                    padding: "12px",
                    borderRadius: "11px",
                    border:
                      "1px solid var(--border)",
                    background:
                      "var(--app-surface-2)",
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
                    {label}
                  </div>

                  <div
                    style={{
                      marginTop: "5px",
                      fontSize: "14px",
                      fontWeight: "900",
                    }}
                  >
                    {value}
                  </div>
                </div>
              )
            )}
          </div>

          <div
            style={{
              marginTop: "10px",
              display: "grid",
              gridTemplateColumns:
                "repeat(4, minmax(0, 1fr))",
              gap: "10px",
            }}
          >
            {[
              [
                "Next Expected",
                emergencyPrediction
                  ?.predictedNextCamera
                  ?.cameraId ||
                  greenCorridor
                    ?.nextCameraId ||
                  "N/A",
              ],
              [
                "ETA",
                emergencyPrediction
                  ?.predictedNextCamera
                  ?.etaText ||
                  (Number.isFinite(
                    Number(
                      greenCorridor?.etaSeconds
                    )
                  )
                    ? `${greenCorridor.etaSeconds}s`
                    : "N/A"),
              ],
              [
                "Priority Score",
                Number.isFinite(
                  Number(
                    activeEmergency.priorityScore
                  )
                )
                  ? `${activeEmergency.priorityScore} / 100`
                  : "N/A",
              ],
              [
                "Green Corridor",
                greenCorridor
                  ?.recommendation ||
                  "N/A",
              ],
            ].map(
              ([label, value]) => (
                <div
                  key={label}
                  style={{
                    padding: "12px",
                    borderRadius: "11px",
                    border:
                      "1px solid var(--border)",
                    background:
                      "var(--app-surface-2)",
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
                    {label}
                  </div>

                  <div
                    style={{
                      marginTop: "5px",
                      fontSize: "13px",
                      fontWeight: "900",
                      lineHeight: "1.35",
                    }}
                  >
                    {value}
                  </div>
                </div>
              )
            )}
          </div>

          {greenCorridor?.corridorCameras?.length >
            0 && (
            <div
              style={{
                marginTop: "14px",
                padding: "14px",
                borderRadius: "12px",
                border:
                  "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: "900",
                  color:
                    "var(--text-muted)",
                  textTransform:
                    "uppercase",
                  letterSpacing: ".07em",
                }}
              >
                Emergency Corridor
              </div>

              <div
                style={{
                  marginTop: "9px",
                  display: "flex",
                  alignItems:
                    "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                {greenCorridor.corridorCameras.map(
                  (camera, index) => (
                    <div
                      key={
                        `${camera.cameraId}-${camera.role}`
                      }
                      style={{
                        display:
                          "inline-flex",
                        alignItems:
                          "center",
                        gap: "7px",
                      }}
                    >
                      <span
                        style={{
                          padding:
                            "7px 10px",
                          borderRadius:
                            "9px",
                          background:
                            camera.role ===
                            "CURRENT"
                              ? "rgba(239,68,68,.12)"
                              : camera.role ===
                                "NEXT_EXPECTED"
                              ? "rgba(139,92,246,.12)"
                              : "var(--app-surface-2)",
                          border:
                            "1px solid var(--border)",
                          fontSize:
                            "11px",
                          fontWeight:
                            "900",
                        }}
                      >
                        {camera.cameraId}
                      </span>

                      {index <
                        greenCorridor
                          .corridorCameras
                          .length -
                          1 && (
                        <FaArrowRight
                          size={10}
                          style={{
                            color:
                              "var(--text-muted)",
                          }}
                        />
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {greenCorridor?.reasons?.length >
            0 && (
            <div
              style={{
                marginTop: "12px",
                fontSize: "11px",
                color:
                  "var(--text-muted)",
                lineHeight: "1.55",
              }}
            >
              {greenCorridor.reasons.map(
                (reason) => (
                  <div key={reason}>
                    ✓ {reason}
                  </div>
                )
              )}
            </div>
          )}

          {emergencyLoading && (
            <div
              style={{
                marginTop: "10px",
                fontSize: "10px",
                color:
                  "var(--text-muted)",
              }}
            >
              Refreshing emergency intelligence…
            </div>
          )}
        </div>
      )}

      {/* Main content */}

      {loading ? (
        <div
          style={{
            minHeight:
              "360px",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            color:
              "var(--text-muted)",
          }}
        >
          Loading alerts...
        </div>
      ) : (
        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "minmax(320px, 1fr) minmax(380px, .9fr)",
            gap: "18px",
            alignItems:
              "stretch",
          }}
        >
          {/* Alert list */}

          <div
            style={{
              background:
                "var(--glass)",
              border:
                "1px solid var(--border)",
              borderRadius:
                "18px",
              overflow:
                "hidden",
              minHeight:
                "560px",
            }}
          >
            <div
              style={{
                padding:
                  "16px 18px",
                borderBottom:
                  "1px solid var(--border)",
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
              }}
            >
              <strong>
                Recent Alerts
              </strong>

              <span
                style={{
                  color:
                    "var(--text-muted)",
                  fontSize:
                    "12px",
                }}
              >
                {filteredAlerts.length}{" "}
                item
                {filteredAlerts.length ===
                1
                  ? ""
                  : "s"}
              </span>
            </div>

            {filteredAlerts.length ===
            0 ? (
              <EmptyState
                role={
                  role
                }
              />
            ) : (
              <div>
                {filteredAlerts.map(
                  (alert) => {
                    const selected =
                      String(
                        selectedAlert?.id
                      ) ===
                      String(
                        alert.id
                      );

                    return (
                      <button
                        key={
                          String(
                            alert.id
                          )
                        }
                        type="button"
                        onClick={() => {
                          setSelectedAlert(
                            alert
                          );

                          if (
                            !alert.isRead
                          ) {
                            setAlerts(
                              (
                                current
                              ) =>
                                current.map(
                                  (
                                    item
                                  ) =>
                                    String(
                                      item.id
                                    ) ===
                                    String(
                                      alert.id
                                    )
                                      ? {
                                          ...item,
                                          isRead:
                                            true,
                                        }
                                      : item
                                )
                            );
                          }
                        }}
                        style={{
                          width:
                            "100%",
                          textAlign:
                            "left",
                          border:
                            "none",
                          borderBottom:
                            "1px solid var(--border)",
                          background:
                            selected
                              ? "var(--accent-soft)"
                              : alert.isRead
                              ? "transparent"
                              : "rgba(59,130,246,.045)",
                          color:
                            "var(--text-primary)",
                          padding:
                            "17px",
                          cursor:
                            "pointer",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            gap:
                              "12px",
                          }}
                        >
                          <div
                            style={{
                              width:
                                "44px",
                              height:
                                "44px",
                              borderRadius:
                                "13px",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              background:
                                alert.priority ===
                                "CRITICAL"
                                  ? "rgba(239,68,68,.12)"
                                  : "var(--accent-soft)",
                              color:
                                alert.priority ===
                                "CRITICAL"
                                  ? "#ef4444"
                                  : "var(--accent)",
                              flexShrink:
                                0,
                              fontSize:
                                "18px",
                            }}
                          >
                            <AlertIcon
                              tab={
                                alert.tab
                              }
                            />
                          </div>

                          <div
                            style={{
                              minWidth:
                                0,
                              flex: 1,
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                gap:
                                  "8px",
                                alignItems:
                                  "center",
                                flexWrap:
                                  "wrap",
                                marginBottom:
                                  "6px",
                              }}
                            >
                              <PriorityBadge
                                priority={
                                  alert.priority
                                }
                              />

                              <span
                                style={{
                                  width:
                                    "7px",
                                  height:
                                    "7px",
                                  borderRadius:
                                    "50%",
                                  background:
                                    alert.isRead
                                      ? "transparent"
                                      : "#ef4444",
                                  flexShrink:
                                    0,
                                }}
                              />
                            </div>

                            <div
                              style={{
                                fontWeight:
                                  "800",
                                fontSize:
                                  "14px",
                                marginBottom:
                                  "4px",
                                overflow:
                                  "hidden",
                                textOverflow:
                                  "ellipsis",
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {
                                alert.title
                              }
                            </div>

                            <div
                              style={{
                                color:
                                  "var(--text-muted)",
                                fontSize:
                                  "12px",
                                lineHeight:
                                  "1.5",
                                display:
                                  "-webkit-box",
                                WebkitLineClamp:
                                  2,
                                WebkitBoxOrient:
                                  "vertical",
                                overflow:
                                  "hidden",
                              }}
                            >
                              {
                                alert.message
                              }
                            </div>

                            <div
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap:
                                  "6px",
                                marginTop:
                                  "8px",
                                color:
                                  "var(--text-subtle)",
                                fontSize:
                                  "11px",
                              }}
                            >
                              <FaClock />
                              {getAlertTime(
                                alert
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>

          {/* Detail */}

          <div
            style={{
              background:
                "var(--glass)",
              border:
                "1px solid var(--border)",
              borderRadius:
                "18px",
              minHeight:
                "560px",
              padding:
                "24px",
            }}
          >
            {selectedAlert ? (
              <>
                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "flex-start",
                    gap:
                      "16px",
                    marginBottom:
                      "18px",
                  }}
                >
                  <div>
                    <PriorityBadge
                      priority={
                        selectedAlert.priority
                      }
                    />

                    <h2
                      style={{
                        margin:
                          "12px 0 7px",
                        fontSize:
                          "23px",
                        lineHeight:
                          "1.2",
                      }}
                    >
                      {
                        selectedAlert.title
                      }
                    </h2>

                    <p
                      style={{
                        margin:
                          "0",
                        color:
                          "var(--text-muted)",
                        lineHeight:
                          "1.65",
                      }}
                    >
                      {
                        selectedAlert.message
                      }
                    </p>
                  </div>

                  {selectedAlert.source ===
                    "officer" && (
                    <StatusBadge
                      status={
                        selectedAlert.status
                      }
                    />
                  )}
                </div>

                <div
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",
                    gap:
                      "10px",
                    marginBottom:
                      "20px",
                  }}
                >
                  {selectedAlert.cameraId && (
                    <div
                      style={{
                        padding:
                          "13px",
                        borderRadius:
                          "12px",
                        border:
                          "1px solid var(--border)",
                        background:
                          "rgba(255,255,255,.02)",
                      }}
                    >
                      <div
                        style={{
                          color:
                            "var(--text-subtle)",
                          fontSize:
                            "11px",
                          marginBottom:
                            "5px",
                        }}
                      >
                        CAMERA
                      </div>

                      <strong>
                        {
                          selectedAlert.cameraId
                        }
                      </strong>
                    </div>
                  )}

                  {selectedAlert.location && (
                    <div
                      style={{
                        padding:
                          "13px",
                        borderRadius:
                          "12px",
                        border:
                          "1px solid var(--border)",
                        background:
                          "rgba(255,255,255,.02)",
                      }}
                    >
                      <div
                        style={{
                          color:
                            "var(--text-subtle)",
                          fontSize:
                            "11px",
                          marginBottom:
                            "5px",
                        }}
                      >
                        LOCATION
                      </div>

                      <strong>
                        {
                          selectedAlert.location
                        }
                      </strong>
                    </div>
                  )}

                  {selectedAlert.jurisdictionDistrict && (
                    <div
                      style={{
                        padding:
                          "13px",
                        borderRadius:
                          "12px",
                        border:
                          "1px solid var(--border)",
                        background:
                          "rgba(255,255,255,.02)",
                      }}
                    >
                      <div
                        style={{
                          color:
                            "var(--text-subtle)",
                          fontSize:
                            "11px",
                          marginBottom:
                            "5px",
                        }}
                      >
                        DISTRICT
                      </div>

                      <strong>
                        {
                          selectedAlert.jurisdictionDistrict
                        }
                      </strong>
                    </div>
                  )}

                  {selectedAlert.jurisdictionArea && (
                    <div
                      style={{
                        padding:
                          "13px",
                        borderRadius:
                          "12px",
                        border:
                          "1px solid var(--border)",
                        background:
                          "rgba(255,255,255,.02)",
                      }}
                    >
                      <div
                        style={{
                          color:
                            "var(--text-subtle)",
                          fontSize:
                            "11px",
                          marginBottom:
                            "5px",
                        }}
                      >
                        ASSIGNED AREA
                      </div>

                      <strong>
                        {
                          selectedAlert.jurisdictionArea
                        }
                      </strong>
                    </div>
                  )}
                </div>

                {selectedAlert.source ===
                  "officer" && (
                  <div
                    style={{
                      padding:
                        "15px",
                      borderRadius:
                        "14px",
                      border:
                        "1px solid var(--border)",
                      marginBottom:
                        "20px",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap:
                          "10px",
                        marginBottom:
                          "10px",
                      }}
                    >
                      <FaShieldAlt
                        style={{
                          color:
                            "var(--accent)",
                        }}
                      />

                      <strong>
                        Alert Workflow
                      </strong>
                    </div>

                    <div
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "repeat(4, minmax(0,1fr))",
                        gap:
                          "8px",
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
                              selectedAlert.status
                            );

                          const reached =
                            index <=
                            currentIndex;

                          return (
                            <div
                              key={
                                status
                              }
                              style={{
                                textAlign:
                                  "center",
                                opacity:
                                  reached
                                    ? 1
                                    : 0.4,
                              }}
                            >
                              <div
                                style={{
                                  height:
                                    "8px",
                                  borderRadius:
                                    "999px",
                                  background:
                                    reached
                                      ? "var(--accent)"
                                      : "var(--border)",
                                  marginBottom:
                                    "7px",
                                }}
                              />

                              <div
                                style={{
                                  fontSize:
                                    "10px",
                                  fontWeight:
                                    "800",
                                  color:
                                    reached
                                      ? "var(--text-primary)"
                                      : "var(--text-subtle)",
                                }}
                              >
                                {status}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

                {selectedAlert.latitude !=
                    null &&
                  selectedAlert.longitude !=
                    null && (
                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap:
                          "9px",
                        padding:
                          "12px 14px",
                        borderRadius:
                          "12px",
                        background:
                          "var(--accent-soft)",
                        color:
                          "var(--text-secondary)",
                        marginBottom:
                          "20px",
                      }}
                    >
                      <FaMapMarkerAlt
                        style={{
                          color:
                            "var(--accent)",
                        }}
                      />

                      <span
                        style={{
                          fontSize:
                            "12px",
                        }}
                      >
                        Coordinates:{" "}
                        {
                          selectedAlert.latitude
                        }
                        ,{" "}
                        {
                          selectedAlert.longitude
                        }
                      </span>
                    </div>
                  )}

                <div
                  style={{
                    display:
                      "flex",
                    flexWrap:
                      "wrap",
                    gap:
                      "10px",
                  }}
                >
                  {selectedAlert.source ===
                    "officer" && (
                    <>
                      {selectedAlert.status ===
                        "SENT" && (
                        <button
                          type="button"
                          disabled={
                            actionLoading
                          }
                          onClick={() =>
                            updateOfficerStatus(
                              selectedAlert,
                              "ACKNOWLEDGED"
                            )
                          }
                          style={{
                            flex:
                              "1 1 170px",
                            border:
                              "none",
                            borderRadius:
                              "12px",
                            padding:
                              "12px 16px",
                            background:
                              "#16a34a",
                            color:
                              "#fff",
                            fontWeight:
                              "800",
                            cursor:
                              "pointer",
                          }}
                        >
                          <FaCheckCircle
                            style={{
                              marginRight:
                                "7px",
                            }}
                          />
                          Acknowledge
                        </button>
                      )}

                      {selectedAlert.status ===
                        "ACKNOWLEDGED" && (
                        <button
                          type="button"
                          disabled={
                            actionLoading
                          }
                          onClick={() =>
                            updateOfficerStatus(
                              selectedAlert,
                              "RESPONDING"
                            )
                          }
                          style={{
                            flex:
                              "1 1 170px",
                            border:
                              "none",
                            borderRadius:
                              "12px",
                            padding:
                              "12px 16px",
                            background:
                              "#f59e0b",
                            color:
                              "#111827",
                            fontWeight:
                              "800",
                            cursor:
                              "pointer",
                          }}
                        >
                          Start Responding
                        </button>
                      )}

                      {selectedAlert.status ===
                        "RESPONDING" && (
                        <button
                          type="button"
                          disabled={
                            actionLoading
                          }
                          onClick={() =>
                            updateOfficerStatus(
                              selectedAlert,
                              "RESOLVED"
                            )
                          }
                          style={{
                            flex:
                              "1 1 170px",
                            border:
                              "none",
                            borderRadius:
                              "12px",
                            padding:
                              "12px 16px",
                            background:
                              "#2563eb",
                            color:
                              "#fff",
                            fontWeight:
                              "800",
                            cursor:
                              "pointer",
                          }}
                        >
                          Mark Resolved
                        </button>
                      )}
                    </>
                  )}

                  <button
                    type="button"
                    onClick={
                      markSelectedAsRead
                    }
                    style={{
                      flex:
                        "1 1 150px",
                      border:
                        "1px solid var(--border)",
                      borderRadius:
                        "12px",
                      padding:
                        "12px 16px",
                      background:
                        "var(--glass)",
                      color:
                        "var(--text-primary)",
                      fontWeight:
                        "700",
                      cursor:
                        "pointer",
                    }}
                  >
                    Mark as Read
                  </button>
                </div>
              </>
            ) : (
              <EmptyState
                role={
                  role
                }
              />
            )}
          </div>
        </div>
      )}

      {/* Mobile */}

      <style>
        {`
          @media (max-width: 900px) {
            .trafficmind-alert-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
      </div>
    </MainLayout>
  );
}

export default Alerts;