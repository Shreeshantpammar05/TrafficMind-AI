import BackButton from "../components/BackButton";
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

function EmergencyOperations() {
  return (
    <MainLayout>
      <BackButton />

      <div className="hero-header">
        <div>
          <h1>🚨 Emergency Operations</h1>

          <p
            style={{
              color: "#94a3b8",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            Emergency Response Command
          </p>

          <p
            style={{
              color: "#cbd5e1",
            }}
          >
            Incident management,
            emergency routing and
            green corridor operations.
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
          🚑 Emergency Ready
        </div>
      </div>

      <div className="cards">

  <div className="card">
    <h3>🚨 Active Incidents</h3>
    <h2>3</h2>
  </div>

  <div className="card">
    <h3>🚑 Emergency Units</h3>
    <h2>12</h2>
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
      🚑 Emergency Center
    </h2>

    <p>
      Emergency vehicle tracking
      and green corridor control.
    </p>

    <Link to="/emergency-center">
  <button>
    Open Module
  </button>
</Link>

  </div>

  <div className="card">

    <h2>
      📋 Incident Management
    </h2>

    <p>
      Create, monitor and manage
      city incidents.
    </p>

    <Link to="/incidents">
  <button>
    Open Module
  </button>
</Link>

  </div>

  <div className="card">

    <h2>
      🛣 Emergency Routing
    </h2>

    <p>
      Smart routing and ETA
      optimization.
    </p>

    <Link to="/emergency-routing">
  <button>
    Open Module
  </button>
</Link>

  </div>

</div>

    </MainLayout>
  );
}

export default EmergencyOperations;