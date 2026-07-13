import MainLayout from "../layouts/MainLayout";
import { Link } from "react-router-dom";

function TrafficOperations() {
  return (
    <MainLayout>

      <div className="hero-header">
        <div>
          <h1>🚦 Traffic Operations</h1>

          <p
            style={{
              color: "#94a3b8",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            Traffic Management Command
          </p>

          <p
            style={{
              color: "#cbd5e1",
            }}
          >
            Smart signals, lane management,
            traffic intelligence and city-wide
            traffic optimization.
          </p>
        </div>

        <div
          style={{
            background: "#16a34a",
            padding: "10px 18px",
            borderRadius: "25px",
            fontWeight: "bold",
          }}
        >
          🚦 Operations Active
        </div>
      </div>

      <div className="cards">

  <div className="card">
    <h3>🚦 Active Signals</h3>
    <h2>24</h2>
  </div>

  <div className="card">
    <h3>🚗 Managed Lanes</h3>
    <h2>12</h2>
  </div>

  <div className="card">
    <h3>🤖 AI Accuracy</h3>
    <h2>96%</h2>
  </div>

  <div className="card">
    <h3>📈 Traffic Efficiency</h3>
    <h2>94%</h2>
  </div>

</div>

<div
  className="section-card"
  style={{
    marginTop: "20px",
  }}
>
  <h2>
    🚦 Traffic Operations Center
  </h2>

  <p>
    Manage smart signals,
    lane optimization,
    congestion intelligence
    and city-wide traffic flow.
  </p>
</div>

<div
  className="cards"
  style={{
    marginTop: "20px",
  }}
>

  <div className="card">

  <h2>
    🚦 Smart Signal
  </h2>

  <p>
    AI-powered signal timing
    optimization.
  </p>

  <Link to="/smart-signal">
    <button>
      Open Module
    </button>
  </Link>

</div>

  <div className="card">

    <h2>
      🚗 Multi-Lane Control
    </h2>

    <p>
      Dynamic lane allocation
      and congestion balancing.
    </p>
    <Link to="/multi-lane">
  <button>
    Open Module
  </button>
</Link>

  </div>

  <div className="card">

    <h2>
      📈 Traffic Intelligence
    </h2>

    <p>
      Predictions, analytics,
      weather and route insights.
    </p>

    <Link to="/traffic-intelligence-center">
  <button>
    Open Module
  </button>
</Link>

  </div>

</div>

    </MainLayout>
  );
}

export default TrafficOperations;