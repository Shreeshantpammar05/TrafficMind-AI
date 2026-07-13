import MainLayout from "../layouts/MainLayout";

function GreenCorridor() {
  return (
    <MainLayout>
      <div className="dashboard">

        <div className="hero-header">
          <div>
            <h1>Green Corridor Command Center</h1>

            <p>
              AI-controlled emergency route signal management
            </p>
          </div>

          <div className="status-badge">
            Corridor Active
          </div>
        </div>

        <div className="cards">

  <div className="card">
    <h3>Emergency Vehicle</h3>
    <h2>🚑</h2>
  </div>

  <div className="card">
    <h3>Signals Cleared</h3>
    <h2>12</h2>
  </div>

  <div className="card">
    <h3>ETA Reduction</h3>
    <h2>3 Min</h2>
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
  <h2>Signal Control Status</h2>

  <p>🚦 Signal 1 → 🟢 GREEN</p>

  <p>🚦 Signal 2 → 🟢 GREEN</p>

  <p>🚦 Signal 3 → 🟢 GREEN</p>

  <p>🚦 Signal 4 → 🔴 HOLD</p>

  <p>🚦 Signal 5 → 🔴 HOLD</p>
</div>

<div
  className="section-card"
  style={{
    marginTop: "20px",
  }}
>
  <h2>Green Corridor Visualization</h2>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "30px",
      fontSize: "32px",
    }}
  >
    <div>🚑</div>

    <div>🟢</div>

    <div>🟢</div>

    <div>🟢</div>

    <div>🏥</div>
  </div>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      marginTop: "10px",
      fontWeight: "600",
    }}
  >
    <span>Emergency</span>
    <span>Signal 1</span>
    <span>Signal 2</span>
    <span>Signal 3</span>
    <span>Hospital</span>
  </div>
</div>

<div
  className="section-card"
  style={{
    marginTop: "20px",
  }}
>
  <h2>AI Corridor Status</h2>

  <p>🤖 AI Monitoring Active</p>

  <p>🚦 Traffic Signals Synchronized</p>

  <p>📡 Real-Time Updates Enabled</p>

  <p>⏱ ETA Reduced by 3 Minutes</p>

  <p>🟢 Emergency Route Clear</p>
</div>

      </div>
    </MainLayout>
  );
}

export default GreenCorridor;