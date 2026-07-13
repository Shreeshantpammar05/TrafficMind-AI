import MainLayout from "../layouts/MainLayout";

function EmergencyRouting() {
  return (
    <MainLayout>
      <div className="dashboard">

        <div className="hero-header">
          <div>
            <h1>Smart Emergency Routing</h1>

            <p>
              AI-powered emergency vehicle route optimization
            </p>
          </div>

          <div className="status-badge">
            Route Active
          </div>
        </div>

        <div className="section-card">

          <h2>Emergency Route Details</h2>

          

          <p>
            Vehicle:
            <strong> Ambulance</strong>
          </p>

          <p>
            Current Location:
            <strong> MG Road Junction</strong>
          </p>

          <p>
            Destination:
            <strong> City Hospital</strong>
          </p>

          <p>
            Distance:
            <strong> 2.4 KM</strong>
          </p>

          <p>
            ETA:
            <strong> 4 Minutes</strong>
          </p>

          <p>
            Green Corridor:
            <strong style={{ color: "#22c55e" }}>
              {" "}
              Active
            </strong>
          </p>

        </div>
        <div
  style={{
    marginTop: "25px",
    height: "350px",
    background: "#111827",
    borderRadius: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: "700",
    color: "#94a3b8",
  }}
>
  🗺️ Smart Route Map Visualization
</div>

<div
  className="cards"
  style={{
    marginTop: "20px",
  }}
>
  <div className="card">
    <h3>Traffic Signals Cleared</h3>
    <h2>12</h2>
  </div>

  <div className="card">
    <h3>Priority Lanes</h3>
    <h2>3</h2>
  </div>

  <div className="card">
    <h3>Average Speed</h3>
    <h2>58</h2>
  </div>

  <div className="card">
    <h3>AI Confidence</h3>
    <h2>97%</h2>
  </div>
</div>

<div
  className="section-card"
  style={{
    marginTop: "20px",
  }}
>
  <h2>Live Route Status</h2>

  <p>🚑 Ambulance Detected</p>

  <p>📍 Current Position: MG Road Junction</p>

  <p>🏥 Destination: City Hospital</p>

  <p>🟢 Green Corridor Activated</p>

  <p>🚦 Traffic Signals Optimized</p>

  <p>⏱ Estimated Arrival: 4 Minutes</p>
</div>

      </div>
    </MainLayout>
  );
}

export default EmergencyRouting;