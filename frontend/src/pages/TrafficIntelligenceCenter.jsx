import RouteRecommendation from "../components/RouteRecommendation";
import WeatherWidget from "../components/WeatherWidget";
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

function TrafficIntelligenceCenter() {
  return (
    <MainLayout>

  <div className="hero-header">

    <div>

      <h1>
        📈 Traffic Intelligence Center
      </h1>

      <p
        style={{
          color: "#94a3b8",
          fontSize: "18px",
          fontWeight: "600",
        }}
      >
        AI Analytics & Forecasting
      </p>

      <p
        style={{
          color: "#cbd5e1",
        }}
      >
        Predict congestion patterns,
        identify hotspots, analyze
        historical trends, and
        optimize city-wide traffic
        operations.
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
      📊 Intelligence Active
    </div>

  </div>

  <div className="cards">

    <div className="card">
      <h3>📈 Predictions Today</h3>
      <h2>128</h2>
    </div>

    <div className="card">
      <h3>🗺️ Hotspots</h3>
      <h2>9</h2>
    </div>

    <div className="card">
      <h3>🤖 AI Accuracy</h3>
      <h2>96%</h2>
    </div>

    <div className="card">
      <h3>📊 Reports</h3>
      <h2>342</h2>
    </div>

  </div>

  {/* Weather */}

<div className="full-width">
  <div className="section-card">
    <h2 style={{ marginBottom: "15px" }}>
      🌦 Environmental Monitoring
    </h2>
    <WeatherWidget />
  </div>
</div>

{/* Intelligence Layer */}

<div className="dashboard-grid">

  <div className="section-card">
   <h2
  style={{
    marginBottom: "10px",
    fontSize: "24px",
    fontWeight: "700",
  }}
>
  AI Intelligence Center
</h2>

<p
  style={{
    color: "#94a3b8",
    marginBottom: "20px",
  }}
>
  AI-powered route optimization, congestion prediction and traffic recommendations.
</p>

<RouteRecommendation />
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
        🗺️ Traffic Heatmap
      </h2>

      <p>
        View congestion hotspots
        and traffic density zones.
      </p>

      <Link to="/heatmap">
        <button>
          Open Dashboard
        </button>
      </Link>

    </div>

    <div className="card">

      <h2>
        📊 Analysis History
      </h2>

      <p>
        Review previous AI
        analysis and reports.
      </p>

      <Link to="/analysis-history">
        <button>
          Open Dashboard
        </button>
      </Link>

    </div>

  </div>

</MainLayout>
  );
}

export default TrafficIntelligenceCenter;