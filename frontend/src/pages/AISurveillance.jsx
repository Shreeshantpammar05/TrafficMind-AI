import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

function AISurveillance() {
  return (
    <MainLayout>

      <div className="hero-header">
        <div>
          <h1>🤖 AI Surveillance</h1>

          <p
            style={{
              color: "#94a3b8",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            AI Monitoring & CCTV Intelligence
          </p>

          <p
            style={{
              color: "#cbd5e1",
            }}
          >
            Vehicle detection,
            CCTV monitoring and
            AI-powered surveillance.
          </p>
        </div>

        <div
          style={{
            background: "#2563eb",
            padding: "10px 18px",
            borderRadius: "25px",
            fontWeight: "bold",
          }}
        >
          🤖 AI Online
        </div>
      </div>

      <div className="cards">

  <div className="card">
    <h3>🎥 CCTV Cameras</h3>
    <h2>24</h2>
  </div>

  <div className="card">
    <h3>🤖 AI Detection</h3>
    <h2>ACTIVE</h2>
  </div>

  <div className="card">
    <h3>🚨 Alerts Today</h3>
    <h2>12</h2>
  </div>

  <div className="card">
    <h3>📡 Monitoring</h3>
    <h2>ONLINE</h2>
  </div>

</div>

<div
  className="cards"
  style={{
    marginTop: "20px",
  }}
>

  <div className="card">

    <h2>
      🤖 AI Vision Center
    </h2>

    <p>
      Vehicle detection,
      congestion analysis
      and AI monitoring.
    </p>

    <Link to="/ai-vision">
  <button>
    Open Module
  </button>
</Link>

  </div>

 

</div>

    </MainLayout>
  );
}

export default AISurveillance;