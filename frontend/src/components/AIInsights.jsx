function AICommandCenter({
  totalIncidents,
  highSeverity,
}) {
  let trafficRisk = "LOW";

  if (highSeverity >= 5) {
    trafficRisk = "HIGH";
  } else if (highSeverity >= 2) {
    trafficRisk = "MEDIUM";
  }

  return (
    <div
      style={{
        background: "#0f172a",
        padding: "20px",
        borderRadius: "15px",
        color: "white",
      }}
    >
      <h2>🧠 AI Command Center</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(5,1fr)",
          gap: "15px",
          marginTop: "15px",
        }}
      >
        <div>
          <h4>🚦 Traffic Risk</h4>
          <p>{trafficRisk}</p>
        </div>

        <div>
          <h4>🚨 Critical Alerts</h4>
          <p>{highSeverity}</p>
        </div>

        <div>
          <h4>📊 Incidents</h4>
          <p>{totalIncidents}</p>
        </div>

        <div>
          <h4>🌦 Weather</h4>
          <p>Connected</p>
        </div>

        <div>
          <h4>🟢 System</h4>
          <p>Operational</p>
        </div>
      </div>
    </div>
  );
}

export default AICommandCenter;