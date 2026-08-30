import { FaBars, FaBell } from "react-icons/fa";
import OfficerAlertPanel from "./OfficerAlertPanel";

import axios from "axios";
import { useEffect, useState } from "react";
import { useTheme } from "../theme/ThemeContext";
import { FaMoon, FaSun } from "react-icons/fa";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function Navbar({
  toggleSidebar,
  sidebarOpen,
}) {
  const { isDark, toggleTheme } = useTheme();

  // =================================
  // Clock
  // =================================

  const [currentTime, setCurrentTime] =
    useState(new Date());

  // =================================
  // Role Based Officer Alerts
  // =================================

  const [officerAlertCount, setOfficerAlertCount] =
    useState(0);

  const [showOfficerAlerts, setShowOfficerAlerts] =
    useState(false);

  // =================================
  // Fetch Role Based Alerts
  // =================================

  useEffect(() => {
    const fetchOfficerAlerts = async () => {
      try {
        const role = localStorage.getItem("role");

        // Only government and admin users
        // use the officer alert system.
        if (
          role !== "government" &&
          role !== "admin"
        ) {
          setOfficerAlertCount(0);
          return;
        }

        const res = await axios.get(
          `${API_BASE}/api/officer-alerts/my`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem(
                "token"
              )}`,
            },
          }
        );

        setOfficerAlertCount(
          res.data.count || 0
        );
      } catch (error) {
        console.log(
          "Officer alerts error:",
          error
        );
      }
    };

    fetchOfficerAlerts();

    const interval = setInterval(
      fetchOfficerAlerts,
      30000
    );

    return () =>
      clearInterval(interval);
  }, []);

  // =================================
  // Clock
  // =================================

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () =>
      clearInterval(timer);
  }, []);

  // =================================
  // User Role
  // =================================

  const role =
    localStorage.getItem("role");

  const roleConfig = {
    citizen: {
      label: "Citizen",
      color: "#22C55E",
      icon: "🟢",
    },

    government: {
      label: "Government",
      color: "#3B82F6",
      icon: "🔵",
    },

    admin: {
      label: "Admin",
      color: "#A855F7",
      icon: "🟣",
    },
  };

  const currentRole =
    roleConfig[role] ||
    roleConfig.citizen;

  // =================================
  // Logout
  // =================================

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <>
      {/* ================================
          MAIN NAVBAR
      ================================= */}

      <div
        style={{
          background:
            "var(--app-surface)",

          backdropFilter:
            "blur(12px)",

          color:
            "var(--text-primary)",

          position: "fixed",

          top: 0,

          left:
            sidebarOpen
              ? "250px"
              : "0px",

          right: "10px",

          height: "64px",

          padding: "0px 16px",

          display: "flex",

          justifyContent:
            "space-between",

          alignItems: "center",

          borderBottom:
            "1px solid var(--border)",

          transition:
            "all .3s ease",

          zIndex: 1000,
        }}
      >
        {/* ================================
            LEFT SECTION
        ================================= */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
          }}
        >
          {/* Sidebar Toggle */}

          <FaBars
            size={22}
            style={{
              cursor: "pointer",
              color:
                "var(--text-primary)",
            }}
            onClick={toggleSidebar}
          />

          {/* Brand */}

          <h2
            style={{
              margin: 0,
              fontSize: "26px",
              fontWeight: "800",
              color:
                "var(--text-primary)",
              lineHeight: "1.1",
              letterSpacing: "-.02em",
            }}
          >
            🚦 TrafficMind AI
          </h2>

          {/* Platform Label */}

          <div
            style={{
              color: "var(--accent)",
              fontSize: "13px",
              fontWeight: "600",
              lineHeight: "1.35",
            }}
          >
            Smart City Command Center
          </div>
        </div>

        {/* ================================
            RIGHT SECTION
        ================================= */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
          }}
        >
          {/* ============================
              THEME
          ============================= */}

          <button
            type="button"
            onClick={toggleTheme}
            title={
              isDark
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",

              border:
                "1px solid var(--border-strong)",

              background:
                "var(--app-surface-2)",

              color:
                "var(--text-primary)",

              padding: "8px 11px",

              borderRadius: "10px",

              cursor: "pointer",

              fontWeight: "700",
            }}
          >
            {isDark ? (
              <FaSun size={14} />
            ) : (
              <FaMoon size={14} />
            )}

            <span
              style={{
                fontSize: "12px",
              }}
            >
              {isDark
                ? "Light"
                : "Dark"}
            </span>
          </button>

          {/* ============================
              ROLE
          ============================= */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",

              background:
                "var(--app-surface-2)",

              padding: "10px 16px",

              borderRadius: "12px",

              border: `1px solid ${currentRole.color}40`,

              color:
                currentRole.color,

              fontWeight: "600",

              fontSize: "14px",

              minWidth: "150px",

              justifyContent:
                "center",
            }}
          >
            <span
              style={{
                fontSize: "16px",
              }}
            >
              {currentRole.icon}
            </span>

            <span>
              {currentRole.label}
            </span>
          </div>

          {/* ============================
              LOGOUT
          ============================= */}

          <button
            onClick={handleLogout}
            style={{
              background:
                "transparent",

              color:
                "var(--text-muted)",

              border:
                "1px solid var(--border)",

              padding: "8px 14px",

              borderRadius: "8px",

              cursor: "pointer",
            }}
          >
            Logout
          </button>

          {/* ============================
              ROLE BASED ALERTS
          ============================= */}

          {(role === "government" ||
            role === "admin") && (
            <div
              onClick={() =>
                setShowOfficerAlerts(
                  !showOfficerAlerts
                )
              }
              title="Role Based Alerts"
              style={{
                position: "relative",

                width: "46px",

                height: "46px",

                borderRadius: "50%",

                background:
                  "var(--app-surface-2)",

                display: "flex",

                justifyContent:
                  "center",

                alignItems:
                  "center",

                cursor: "pointer",

                border:
                  "1px solid var(--border)",

                transition:
                  "all .3s ease",
              }}
            >
              <FaBell
                color="#F59E0B"
                size={18}
              />

              {officerAlertCount >
                0 && (
                <div
                  style={{
                    position:
                      "absolute",

                    top: "-5px",

                    right: "-5px",

                    width: "20px",

                    height: "20px",

                    borderRadius:
                      "50%",

                    background:
                      "#F59E0B",

                    color: "white",

                    fontSize: "11px",

                    fontWeight: "700",

                    display: "flex",

                    justifyContent:
                      "center",

                    alignItems:
                      "center",
                  }}
                >
                  {officerAlertCount}
                </div>
              )}
            </div>
          )}

          {/* ============================
              TIME / DATE
          ============================= */}

          <div
            style={{
              background:
                "var(--app-surface-2)",

              border:
                "1px solid var(--border)",

              borderRadius: "12px",

              padding: "4px 10px",

              minWidth: "170px",

              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "18px",

                fontWeight: "700",

                color:
                  "var(--text-primary)",
              }}
            >
              🕒{" "}
              {currentTime.toLocaleTimeString()}
            </div>

            <div
              style={{
                marginTop: "4px",

                fontSize: "13px",

                color:
                  "var(--text-muted)",
              }}
            >
              📅{" "}
              {currentTime.toLocaleDateString(
                "en-GB",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================================
          ROLE BASED ALERT PANEL
      ================================= */}

      {showOfficerAlerts && (
        <OfficerAlertPanel
          onClose={() =>
            setShowOfficerAlerts(false)
          }
        />
      )}
    </>
  );
}

export default Navbar;