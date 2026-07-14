import BackButton from "../components/BackButton";
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

function EmergencyCenter() {
  return (
   <MainLayout>
    <BackButton />

  <div className="hero-header">

    <div>

      <h1>
        🚑 Emergency Center
      </h1>

      <p
        style={{
          color: "#94a3b8",
          fontSize: "18px",
          fontWeight: "600",
        }}
      >
        Emergency Operations Command
      </p>

      <p
        style={{
          color: "#cbd5e1",
        }}
      >
        Real-time accident detection,
        emergency vehicle tracking,
        green corridor management,
        and rapid response coordination.
      </p>

    </div>

    <div
      style={{
        background: "#dc2626",
        padding: "10px 18px",
        borderRadius: "25px",
        fontWeight: "bold",
      }}
    >
      🚨 Emergency Ready
    </div>

  </div>

  <div className="cards">

    <div className="card">
      <h3>🚑 Emergency Units</h3>
      <h2>12</h2>
    </div>

    <div className="card">
      <h3>🚨 Active Incidents</h3>
      <h2>3</h2>
    </div>

    <div className="card">
      <h3>🟢 Green Corridors</h3>
      <h2>5</h2>
    </div>

    <div className="card">
      <h3>⚡ Response Time</h3>
      <h2>4m</h2>
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
        🚑 Emergency Dashboard
      </h2>

      <p>
        Monitor emergency vehicle
        detection and green corridor
        activation.
      </p>

      <Link to="/emergency">
        <button>
          Open Dashboard
        </button>
      </Link>

    </div>

    <div className="card">

      <h2>
        🚨 Accident Dashboard
      </h2>

      <p>
        Monitor accident alerts
        and incident detection.
      </p>

      <Link to="/accident">
        <button>
          Open Dashboard
        </button>
      </Link>

    </div>

    <div className="card">

      <h2>
        🗺️ Emergency Response
      </h2>

      <p>
        Generate emergency routes,
        nearest services and
        green corridor plans.
      </p>

      <Link to="/emergency-response">
        <button>
          Open System
        </button>
      </Link>

    </div>

  </div>

</MainLayout>
  );
}

export default EmergencyCenter;