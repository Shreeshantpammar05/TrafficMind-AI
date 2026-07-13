function AICommandCenter({
  totalIncidents,
  highSeverity,
}) {
  let status = "🟢 Stable";

  if (highSeverity >= 5) {
    status = "🔴 Critical";
  } else if (highSeverity >= 2) {
    status = "🟡 Warning";
  }

  return (
    <div
      style={{
        background: "#0f172a",
        padding: "25px",
        borderRadius: "20px",
        color: "white",
        marginBottom: "20px",
      }}
    >
      <h1>🧠 AI Command Center</h1>

      <h3>
        🚦 Total Incidents: {totalIncidents}
      </h3>

      <h3>
        🚨 High Severity: {highSeverity}
      </h3>

      <h3>
        📡 System Status: {status}
      </h3>

      <h3>
        🤖 AI Monitoring Active
      </h3>
    </div>
  );
}

export default AICommandCenter;