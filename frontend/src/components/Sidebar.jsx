import { FaChevronRight } from "react-icons/fa";
import {
  FaFire,
  FaRoute,
} from "react-icons/fa";
import {
  FaHome,
  FaTrafficLight,
  FaChartLine,
  FaClipboardList,
  FaRobot,
  FaAmbulance,
  FaCog,
  FaPlayCircle,
  FaVideo,
} from "react-icons/fa";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Sidebar({ sidebarOpen }) {
  const location = useLocation();

  const [hovered, setHovered] =
    useState(null);

    const role = localStorage.getItem("role");

 const menuItems = [
{
  name: "Command Center",
  icon: <FaHome />,
  path: "/dashboard",
},

{
  name: "Traffic Operations",
  icon: <FaTrafficLight />,
  path: "/traffic-operations",
},

{
  name: "Emergency Operations",
  icon: <FaAmbulance />,
  path: "/emergency-operations",
},
];
if (
  role === "government" ||
  role === "admin"
) {
  menuItems.push(
    {
  name: "AI Surveillance",
  icon: <FaRobot />,
  path: "/ai-surveillance",
},

{
  name: "Administration",
  icon: <FaCog />,
  path: "/admin",
},

{
  name: "Demo Control",
  icon: <FaPlayCircle />,
  path: "/demo-control",
},
  );
}

  return (
   <div
 
  style={{
  width: sidebarOpen ? "220px" : "0px",
  transition: "all .3s ease",
  overflow: "hidden",
    height: "100vh",
overflowY: "auto",

  position: "fixed",
top: "0",
left: "0",
bottom: "0",
overflowY: "auto",


    background:
  "linear-gradient(180deg,#0f172a 0%,#020617 100%)",
    color: "white",
    padding: sidebarOpen ? "25px" : "0px",
    borderRight: sidebarOpen
  ? "1px solid rgba(255,255,255,0.08)"
  : "none",
   boxShadow: sidebarOpen
  ? "5px 0 20px rgba(0,0,0,0.2)"
  : "none",
  }}
>
    <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "14px",
    marginBottom: "30px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(10px)",
  }}
>
  <div
    style={{
      width: "55px",
      height: "55px",
      borderRadius: "14px",
      background: "linear-gradient(135deg, #2563EB, #38BDF8)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "26px",
      boxShadow: "0 0 18px rgba(59,130,246,0.5)",
    }}
  >
    🚦
  </div>

  <div>
    <h2
      style={{
        margin: 0,
        fontSize: "22px",
        fontWeight: "800",
        color: "#FFFFFF",
      }}
    >
      TrafficMind AI
    </h2>

    <p
      style={{
        margin: "4px 0 0",
        fontSize: "13px",
        color: "#94A3B8",
        fontWeight: "500",
      }}
    >
      Smart City Command Center
    </p>
  </div>
</div>

<div
  style={{
    height: "1px",
    background: "rgba(255,255,255,0.08)",
    marginBottom: "20px",
  }}
/>

<div
  style={{
    background: "#111827",
    padding: "15px",
    borderRadius: "12px",
    marginBottom: "20px",
    border: "1px solid rgba(59,130,246,0.25)",
  }}
>
  <div
    style={{
      fontWeight: "700",
      marginBottom: "8px",
    }}
  >
    <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "8px",
  }}
>
  <span
    style={{
      width: "10px",
      height: "10px",
      background: "#22c55e",
      borderRadius: "50%",
      boxShadow:
        "0 0 12px #22c55e",
    }}
  />

  System Status
</div>
  </div>

  <div
    style={{
      color: "#94a3b8",
      fontSize: "13px",
    }}
  >
    AI Monitoring Active
  </div>

  <div
    style={{
      color: "#22c55e",
      fontSize: "12px",
      marginTop: "6px",
      fontWeight: "600",
    }}
  >
    All Systems Operational
  </div>
</div>

      {menuItems.map((item, index) => (
        <Link
          key={index}
          to={item.path}
          style={{
            textDecoration: "none",
            color: "white",
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
              padding: "14px 18px",
             fontWeight: "800",
              transition: "all 0.3s ease",
              marginBottom: "10px",
              borderRadius: "12px",
              cursor: "pointer",

              border:
  location.pathname === item.path
    ? "1px solid rgba(59,130,246,0.4)"
    : "1px solid transparent",

              background:
                location.pathname ===
                item.path
                  ? "linear-gradient(135deg,#2563eb,#3b82f6)"
                  : "transparent",

              boxShadow:
                location.pathname ===
                item.path
                  ?  "0 0 20px rgba(59,130,246,0.4)"
                  : "none",

              transition: "all 0.3s ease",

              borderLeft:
  hovered === index
    ? "4px solid #3b82f6"
    : "4px solid transparent",

transform:
  hovered === index
    ? "translateX(4px)"
    : location.pathname === item.path
    ? "translateX(5px)"
    : "translateX(0)",
            }}
          >
            <>
  <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  }}
>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
    }}
  >
    <div
      style={{
        fontSize: "18px",
        color:
          location.pathname === item.path
            ? "#ffffff"
            : "#60a5fa",
      }}
    >
      {item.icon}
    </div>

    <span>{item.name}</span>
  </div>

  <FaChevronRight
    style={{
      fontSize: "12px",
      color: "#94A3B8",
      opacity:
        hovered === index ||
        location.pathname === item.path
          ? 1
          : 0,
      transform:
        hovered === index
          ? "translateX(4px)"
          : "translateX(0)",
      transition: "all .3s ease",
    }}
  />
</div>

  {hovered === index && (
    <div
      style={{
        marginTop: "8px",
        fontSize: "12px",
        color: "#cbd5e1",
        fontWeight: "500",
      }}
    >
      {item.path === "/dashboard" &&
        "System Overview"}

      {item.path === "/ai-vision" &&
        "AI Status: Online"}

      {item.path === "/traffic-control" &&
        "Signals Optimized"}

      {item.path === "/emergency-center" &&
        "Emergency Ready"}

      {item.path ===
        "/traffic-intelligence-center" &&
        "Analytics Active"}

      {item.path === "/incidents" &&
        "Incident Tracking"}

      {item.path === "/admin" &&
        "System Healthy"}

      {item.path === "/demo-control" &&
        "Presentation Ready"}
    </div>
  )}
</>
          </div>
        </Link>
      ))}

      <div
  style={{
    marginTop: "30px",
    paddingTop: "20px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  }}
>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "12px",
    }}
  >
    <div
      style={{
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        background: "#22c55e",
        boxShadow: "0 0 10px #22c55e",
      }}
    />

    <span
      style={{
        color: "#22c55e",
        fontWeight: "600",
        fontSize: "14px",
      }}
    >
      System Online
    </span>
  </div>

  <p
    style={{
      margin: "6px 0",
      color: "#94a3b8",
      fontSize: "13px",
    }}
  >
    Role : {role}
  </p>

  <p
    style={{
      margin: "6px 0",
      color: "#94a3b8",
      fontSize: "13px",
    }}
  >
    Version : v2.0
  </p>

  <p
    style={{
      marginTop: "15px",
      color: "#64748b",
      fontSize: "12px",
      textAlign: "center",
    }}
  >
    TrafficMind AI © 2026
  </p>
</div>
    </div>
  );
}

export default Sidebar;