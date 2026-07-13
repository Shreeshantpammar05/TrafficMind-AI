import { FaBell } from "react-icons/fa";
import { FaExclamationTriangle } from "react-icons/fa";
import { FaSearch } from "react-icons/fa";
import NotificationPanel from "./NotificationPanel";
import EmergencyPanel from "./EmergencyPanel";
import axios from "axios";
import { useEffect, useState } from "react";

function Navbar() {
  const [currentTime, setCurrentTime] = useState(new Date());

  const [alertCount, setAlertCount] = useState(0);

  const [notificationCount, setNotificationCount] =
    useState(0);

    const [showNotifications, setShowNotifications] =
  useState(false);

const [showEmergency, setShowEmergency] =
  useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await axios.get(
          "https://trafficmind-ai.onrender.com/api/incidents"
        );

        const highAlerts =
          res.data.incidents.filter(
            (item) =>
              item.severity?.toLowerCase() ===
              "high"
          );

        setAlertCount(highAlerts.length);

        setNotificationCount(
          res.data.incidents.length
        );
      } catch (error) {
        console.log(error);
      }
    };

    fetchAlerts();

    const interval = setInterval(
      fetchAlerts,
      30000
    );

    return () => clearInterval(interval);
  }, []);

  const role =
  localStorage.getItem("role");

  

  const handleLogout = () => {
  localStorage.clear();
  window.location.href = "/login";
};

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
  roleConfig[role] || roleConfig.citizen;

 return (
  <>

    <div
      style={{
        background:
  "rgba(15,23,42,0.85)",

backdropFilter: "blur(12px)",
        color: "white",

        position: "fixed",
        top: 0,
        left: "260px",
        right: 0,

        height: "80px",

        padding: "0 25px",

        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",

        borderBottom:
          "1px solid rgba(255,255,255,0.1)",

        zIndex: 1000,
      }}
    >
      {/* Left Section */}

<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "30px",
  }}
>
        <h2
          style={{
            margin: 0,
            fontSize: "26px",
          }}
        >
          🚦 TrafficMind AI
        </h2>

        <div
          style={{
            color: "#60a5fa",
            fontSize: "13px",
          }}
        >
          Smart City Command Center
        </div>
      </div>

      <div
  style={{
    display: "flex",
    alignItems: "center",
    background: "#1E293B",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: "12px",
    padding: "10px 15px",
    width: "320px",
  }}
>
  <FaSearch
    color="#94A3B8"
    style={{ marginRight: "10px" }}
  />

  <input
    type="text"
    placeholder="Search anything..."
    style={{
      flex: 1,
      background: "transparent",
      border: "none",
      outline: "none",
      color: "white",
      fontSize: "14px",
    }}
  />
</div>

      {/* Right Section */}

<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "15px",
  }}
>
  <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#1E293B",
    padding: "10px 16px",
    borderRadius: "12px",
    border: `1px solid ${currentRole.color}40`,
    color: currentRole.color,
    fontWeight: "600",
    fontSize: "14px",
    minWidth: "150px",
    justifyContent: "center",
  }}
>
  <span style={{ fontSize: "16px" }}>
    {currentRole.icon}
  </span>

  <span>{currentRole.label}</span>
</div>

  <button
  onClick={handleLogout}
  style={{
    background: "transparent",
    color: "#94a3b8",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
  }}
>
  Logout
</button>

<div
  onClick={() => setShowEmergency(!showEmergency)}
  style={{
    position: "relative",
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    background: "#1E293B",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,.08)",
    transition: "all .3s ease",
  }}
>
  <FaExclamationTriangle
    color="#EF4444"
    size={18}
  />

  {alertCount > 0 && (
    <div
      style={{
        position: "absolute",
        top: "-5px",
        right: "-5px",
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        background: "#EF4444",
        color: "white",
        fontSize: "11px",
        fontWeight: "700",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {alertCount}
    </div>
  )}
</div>

  

       

      <div
  onClick={() => setShowNotifications(!showNotifications)}
  style={{
    position: "relative",
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    background: "#1E293B",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,.08)",
    transition: "all .3s ease",
  }}
>
  <FaBell
    color="#3B82F6"
    size={18}
  />

  {notificationCount > 0 && (
    <div
      style={{
        position: "absolute",
        top: "-5px",
        right: "-5px",
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        background: "#3B82F6",
        color: "white",
        fontSize: "11px",
        fontWeight: "700",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {notificationCount}
    </div>
  )}
</div>

       

       <div
  style={{
    background: "#1E293B",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "10px 16px",
    minWidth: "170px",
    textAlign: "center",
  }}
>
  <div
    style={{
      fontSize: "18px",
      fontWeight: "700",
      color: "#FFFFFF",
    }}
  >
    🕒 {currentTime.toLocaleTimeString()}
  </div>

  <div
    style={{
      marginTop: "4px",
      fontSize: "13px",
      color: "#94A3B8",
    }}
  >
    📅 {currentTime.toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})}
  </div>
</div>

      </div>
    </div>

    {showNotifications && (
      <NotificationPanel />
    )}

    {showEmergency && (
      <EmergencyPanel />
    )}

  </>
);
}

export default Navbar;