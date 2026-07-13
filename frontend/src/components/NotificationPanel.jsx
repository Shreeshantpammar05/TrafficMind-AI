function NotificationPanel() {
  return (
    <div
      style={{
        position: "fixed",
        top: "90px",
        right: "20px",

        width: "380px",

        background:
          "linear-gradient(145deg,#111827,#1e293b)",

        color: "white",

        borderRadius: "20px",

        padding: "20px",

        border:
          "1px solid rgba(59,130,246,0.35)",

        boxShadow:
          "0 20px 40px rgba(0,0,0,0.4)",

        zIndex: 9999,

        animation:
          "slideInRight 0.3s ease",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: "20px",
        }}
      >
        🔔 Notification Center
      </h2>

      <div
        style={{
          background: "#1e293b",
          padding: "12px",
          borderRadius: "12px",
          marginBottom: "10px",
        }}
      >
        🚨 New Incident Created
      </div>

      <div
        style={{
          background: "#1e293b",
          padding: "12px",
          borderRadius: "12px",
          marginBottom: "10px",
        }}
      >
        🚦 Traffic Updated
      </div>

      <div
        style={{
          background: "#1e293b",
          padding: "12px",
          borderRadius: "12px",
          marginBottom: "10px",
        }}
      >
        🤖 AI Analysis Completed
      </div>

      <div
        style={{
          background: "#1e293b",
          padding: "12px",
          borderRadius: "12px",
        }}
      >
        📊 New Analytics Generated
      </div>

    </div>
  );
}

export default NotificationPanel;