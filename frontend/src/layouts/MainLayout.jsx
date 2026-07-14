import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function MainLayout({ children }) {

  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "white",
      }}
    >

      <Navbar
        sidebarOpen={sidebarOpen}
        toggleSidebar={() =>
          setSidebarOpen(!sidebarOpen)
        }
      />

      <div
        style={{
          display: "flex",
        }}
      >
        <Sidebar
          sidebarOpen={sidebarOpen}
        />

        <div
          style={{
            flex: 1,
            marginLeft: sidebarOpen ? "280px" : "0px",
            transition: "all .3s ease",
            padding: "140px 30px 30px 30px",
            minHeight: "100vh",
            background: "#0f172a",
            boxSizing: "border-box",
          }}
        >
          {children}
        </div>

      </div>
    </div>
  );
}

export default MainLayout;