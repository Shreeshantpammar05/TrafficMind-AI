import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [isMobile, setIsMobile] =
    useState(
      typeof window !== "undefined" &&
        window.innerWidth <= 760
    );

  useEffect(() => {
    const handleResize = () => {
      const mobile =
        window.innerWidth <= 760;

      setIsMobile(mobile);

      // Keep the sidebar collapsed on mobile.
      if (mobile) {
        setSidebarOpen(false);
      }
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

  const toggleSidebar = () => {
    setSidebarOpen(
      (current) => !current
    );
  };

  const contentLeftMargin =
    isMobile
      ? "0px"
      : sidebarOpen
      ? "220px"
      : "0px";

  return (
    <div
      style={{
        minHeight:
          "100vh",
        background:
          "var(--app-bg)",
        color:
          "var(--text-primary)",
        transition:
          "background .35s ease, color .35s ease",
        overflowX:
          "hidden",
      }}
    >
      <Navbar
        sidebarOpen={
          sidebarOpen
        }
        toggleSidebar={
          toggleSidebar
        }
      />

      <div
        style={{
          display:
            "flex",
          minHeight:
            "100vh",
        }}
      >
        <Sidebar
          sidebarOpen={
            sidebarOpen
          }
        />

        <main
          style={{
            flex: 1,
            marginLeft:
              contentLeftMargin,
            transition:
              "margin-left .3s ease, padding .3s ease",
            padding: isMobile
              ? "82px 14px 24px"
              : "100px 30px 30px",
            minHeight:
              "100vh",
            background:
              "var(--app-bg)",
            boxSizing:
              "border-box",
            width:
              "100%",
            minWidth:
              0,
            overflowX:
              "hidden",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;