function EmergencyPanel() {
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
          "1px solid rgba(239,68,68,0.35)",

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
        🚨 Emergency Alerts
      </h2>

      <div
        style={{
          background: "#1e293b",
          padding: "12px",
          borderRadius: "12px",
          marginBottom: "10px",
        }}
      >
        🚑 Ambulance Detected
      </div>

      <div
        style={{
          background: "#1e293b",
          padding: "12px",
          borderRadius: "12px",
          marginBottom: "10px",
        }}
      >
        🚨 Accident Alert
      </div>

      <div
        style={{
          background: "#1e293b",
          padding: "12px",
          borderRadius: "12px",
          marginBottom: "10px",
        }}
      >
        🛣 Green Corridor Activated
      </div>

      <div
        style={{
          background: "#1e293b",
          padding: "12px",
          borderRadius: "12px",
        }}
      >
        🚦 Priority Signal Active
      </div>

    </div>
  );
}

export default EmergencyPanel;