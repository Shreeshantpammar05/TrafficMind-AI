import {
  FaChevronRight,
  FaHome,
  FaRobot,
  FaCog,
  FaExclamationTriangle,
  FaAmbulance,
  FaBell,
  FaUserCircle,
} from "react-icons/fa";

import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useLocation,
} from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

function Sidebar({
  sidebarOpen,
}) {
  const location =
    useLocation();

  const [hovered, setHovered] =
    useState(null);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const role =
    localStorage.getItem("role") ||
    "citizen";

  const isOfficer =
    role === "government" ||
    role === "admin";

  /*
   * =========================================================
   * COMMON MENU
   * =========================================================
   *
   * Citizens can use these pages.
   */
  const menuItems = [
    {
      name: "Command Center",
      icon: <FaHome />,
      path: "/dashboard",
    },

    {
      name: "Incident Management",
      icon:
        <FaExclamationTriangle />,
      path: "/incidents",
    },
  ];

  /*
   * =========================================================
   * GOVERNMENT + ADMIN MENU
   * =========================================================
   *
   * Emergency Response must NOT appear for citizens.
   */
  if (isOfficer) {
    menuItems.push(
      {
        name: "AI Vision",
        icon: <FaRobot />,
        path: "/ai-vision",
      },
      {
        name: "Emergency Response",
        icon: <FaAmbulance />,
        path: "/emergency-response",
      }
    );
  }

  /*
   * =========================================================
   * ADMIN ONLY
   * =========================================================
   */
  if (role === "admin") {
    menuItems.push({
      name: "Administration",
      icon: <FaCog />,
      path: "/admin",
    });
  }

  /*
   * =========================================================
   * UNREAD OFFICER ALERTS
   * =========================================================
   */
  const fetchUnreadAlerts =
    async () => {
      try {
        const token =
          localStorage.getItem(
            "token"
          );

        if (!token) {
          setUnreadCount(0);
          return;
        }

        let count = 0;

        /*
         * Officer alerts are only relevant
         * to government/admin users.
         */
        if (isOfficer) {
          try {
            const officerResponse =
              await fetch(
                `${API_BASE}/api/officer-alerts/my`,
                {
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                }
              );

            if (
              officerResponse.ok
            ) {
              const officerData =
                await officerResponse.json();

              const officerAlerts =
                Array.isArray(
                  officerData.alerts
                )
                  ? officerData.alerts
                  : [];

              count +=
                officerAlerts.filter(
                  (alert) =>
                    !alert.isRead
                ).length;
            }
          } catch (
            officerError
          ) {
            console.log(
              officerError
            );
          }
        }

        setUnreadCount(
          Math.min(
            count,
            99
          )
        );
      } catch (error) {
        console.log(
          "Sidebar alert count error:",
          error
        );
      }
    };

  useEffect(() => {
    fetchUnreadAlerts();

    const interval =
      setInterval(
        fetchUnreadAlerts,
        15000
      );

    return () =>
      clearInterval(
        interval
      );
  }, [
    role,
    isOfficer,
  ]);

  const renderMenuItem =
    (
      item,
      index
    ) => {
      const isActive =
        location.pathname ===
        item.path;

      const isHovered =
        hovered === index;

      const itemTextColor =
        isActive
          ? "#FFFFFF"
          : "var(--text-primary)";

      return (
        <Link
          key={item.path}
          to={item.path}
          style={{
            textDecoration:
              "none",
            color:
              itemTextColor,
            display:
              "block",
          }}
        >
          <div
            onMouseEnter={() =>
              setHovered(index)
            }
            onMouseLeave={() =>
              setHovered(null)
            }
            style={{
              padding:
                "14px 18px",

              fontWeight:
                "700",

              marginBottom:
                "10px",

              borderRadius:
                "12px",

              cursor:
                "pointer",

              border:
                isActive
                  ? "1px solid rgba(59,130,246,.35)"
                  : "1px solid transparent",

              background:
                isActive
                  ? "linear-gradient(135deg,var(--accent-strong),var(--accent))"
                  : isHovered
                  ? "var(--accent-soft)"
                  : "transparent",

              boxShadow:
                isActive
                  ? "0 0 20px rgba(59,130,246,.18)"
                  : "none",

              borderLeft:
                isHovered
                  ? "4px solid var(--accent)"
                  : "4px solid transparent",

              transform:
                isHovered
                  ? "translateX(4px)"
                  : isActive
                  ? "translateX(2px)"
                  : "translateX(0)",

              transition:
                "all .3s ease",

              boxSizing:
                "border-box",
            }}
          >
            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "space-between",

                gap:
                  "10px",
              }}
            >
              <div
                style={{
                  display:
                    "flex",

                  alignItems:
                    "center",

                  gap:
                    "12px",

                  minWidth:
                    0,
                }}
              >
                <div
                  style={{
                    fontSize:
                      "18px",

                    color:
                      isActive
                        ? "#FFFFFF"
                        : "var(--accent)",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    flexShrink:
                      0,
                  }}
                >
                  {item.icon}
                </div>

                <span
                  style={{
                    color:
                      itemTextColor,

                    lineHeight:
                      "1.3",

                    overflowWrap:
                      "anywhere",
                  }}
                >
                  {item.name}
                </span>

                {item.path ===
                  "/alerts" &&
                  unreadCount >
                    0 && (
                    <span
                      style={{
                        minWidth:
                          "22px",

                        height:
                          "22px",

                        padding:
                          "0 6px",

                        display:
                          "inline-flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "center",

                        borderRadius:
                          "999px",

                        background:
                          isActive
                            ? "#fff"
                            : "#ef4444",

                        color:
                          isActive
                            ? "var(--accent)"
                            : "#fff",

                        fontSize:
                          "11px",

                        fontWeight:
                          "800",

                        flexShrink:
                          0,
                      }}
                    >
                      {unreadCount >
                      99
                        ? "99+"
                        : unreadCount}
                    </span>
                  )}
              </div>

              <FaChevronRight
                style={{
                  fontSize:
                    "12px",

                  color:
                    isActive
                      ? "rgba(255,255,255,.82)"
                      : "var(--text-muted)",

                  opacity:
                    isHovered ||
                    isActive
                      ? 1
                      : 0,

                  transform:
                    isHovered
                      ? "translateX(4px)"
                      : "translateX(0)",

                  transition:
                    "all .3s ease",

                  flexShrink:
                    0,
                }}
              />
            </div>
          </div>
        </Link>
      );
    };

  /*
   * Use large indexes for the fixed bottom
   * items so hover state doesn't conflict
   * with the main navigation.
   */
  const profileIndex =
    1000;

  const alertsIndex =
    1001;

  return (
    <aside
      style={{
        width:
          sidebarOpen
            ? "260px"
            : "0px",

        transition:
          "all .3s ease",

        overflow:
          "hidden",

        height:
          "100vh",

        overflowY:
          "auto",

        position:
          "fixed",

        top: 0,

        left: 0,

        bottom: 0,

        background:
          "var(--app-surface)",

        color:
          "var(--text-primary)",

        padding:
          sidebarOpen
            ? "25px"
            : "0px",

        borderRight:
          sidebarOpen
            ? "1px solid var(--border)"
            : "none",

        boxShadow:
          sidebarOpen
            ? "5px 0 20px rgba(0,0,0,.08)"
            : "none",

        boxSizing:
          "border-box",

        zIndex:
          1100,

        isolation:
          "isolate",
      }}
    >
      {/* =================================================
          BRAND
          ================================================= */}

      <div
        style={{
          display:
            "flex",

          alignItems:
            "center",

          gap:
            "14px",

          padding:
            "14px",

          marginBottom:
            "30px",

          borderRadius:
            "16px",

          background:
            "var(--glass)",

          border:
            "1px solid var(--border)",

          backdropFilter:
            "blur(10px)",

          boxSizing:
            "border-box",
        }}
      >
        <div
          style={{
            width:
              "12px",

            height:
              "12px",

            borderRadius:
              "50%",

            background:
              "var(--accent)",

            boxShadow:
              "0 0 14px rgba(59,130,246,.55)",

            flexShrink:
              0,
          }}
        />

        <div>
          <h2
            style={{
              margin:
                0,

              fontSize:
                "22px",

              lineHeight:
                "1.1",

              fontWeight:
                "800",

              color:
                "var(--text-primary)",
            }}
          >
            TrafficMind AI
          </h2>

          <p
            style={{
              margin:
                "6px 0 0",

              fontSize:
                "13px",

              lineHeight:
                "1.45",

              color:
                "var(--text-muted)",

              fontWeight:
                "500",
            }}
          >
            Smart City Command Center
          </p>
        </div>
      </div>

      {/* Divider */}

      <div
        style={{
          height:
            "1px",

          background:
            "var(--border)",

          marginBottom:
            "20px",
        }}
      />

      {/* =================================================
          MAIN NAVIGATION
          ================================================= */}

      {menuItems.map(
        (
          item,
          index
        ) =>
          renderMenuItem(
            item,
            index
          )
      )}

      {/* =================================================
          PROFILE
          EVERY AUTHENTICATED USER
          ================================================= */}

      <div
        style={{
          marginTop:
            "8px",
        }}
      >
        {renderMenuItem(
          {
            name:
              "My Profile",

            icon:
              <FaUserCircle />,

            path:
              "/profile",
          },
          profileIndex
        )}
      </div>

      {/* =================================================
          ALERTS
          ================================================= */}

      <div
        style={{
          marginTop:
            "12px",

          paddingTop:
            "18px",

          borderTop:
            "1px solid var(--border)",
        }}
      >
        {renderMenuItem(
          {
            name:
              "Alerts",

            icon:
              <FaBell />,

            path:
              "/alerts",
          },
          alertsIndex
        )}
      </div>

      {/* =================================================
          FOOTER
          ================================================= */}

      <div
        style={{
          marginTop:
            "10px",

          paddingTop:
            "20px",

          borderTop:
            "1px solid var(--border)",
        }}
      >
        <p
          style={{
            margin:
              "6px 0",

            color:
              "var(--text-muted)",

            fontSize:
              "13px",
          }}
        >
          Role:{" "}
          <strong
            style={{
              color:
                "var(--text-secondary)",
            }}
          >
            {role}
          </strong>
        </p>

        <p
          style={{
            marginTop:
              "15px",

            color:
              "var(--text-subtle)",

            fontSize:
              "12px",

            textAlign:
              "center",
          }}
        >
          TrafficMind AI © 2026
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;