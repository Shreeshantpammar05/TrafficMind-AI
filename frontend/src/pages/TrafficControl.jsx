import BackButton from "../components/BackButton";
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

function TrafficControl() {
  return (
    <MainLayout>
      <BackButton />

      <div className="hero-header">

        <div>
          <h1>
            🚦 Traffic Control Center
          </h1>

          <p
            style={{
              color: "#94a3b8",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            Smart Signal Operations
          </p>

          <p
            style={{
              color: "#cbd5e1",
            }}
          >
            AI-powered traffic flow
            optimization, lane balancing,
            congestion reduction and
            adaptive signal management.
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
          🟢 Traffic Control Online
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
          <h3>🤖 AI Status</h3>
          <h2>ONLINE</h2>
        </div>

        <div className="card">
          <h3>📈 Efficiency</h3>
          <h2>94%</h2>
        </div>

      </div>

      <div
        className="cards"
        style={{
          marginTop: "20px",
        }}
      >

        <div className="card">

          <h2>🚦 Smart Signal</h2>

          <p>
            AI-powered signal timing
            optimization based on
            traffic congestion.
          </p>

          <Link to="/smart-signal">
            <button>
              Open Dashboard
            </button>
          </Link>

        </div>

        <div className="card">

          <h2>🚗 Multi-Lane Control</h2>

          <p>
            Manage lane priorities,
            congestion balancing and
            signal allocation.
          </p>

          <Link to="/multi-lane">
            <button>
              Open Dashboard
            </button>
          </Link>

        </div>

      </div>

    </MainLayout>
  );
}

export default TrafficControl;