import MainLayout from "../layouts/MainLayout";
import IncidentForm from "../components/IncidentForm";
import IncidentList from "../components/IncidentList";


function IncidentManagement() {
  return (
    <MainLayout>

      <div className="hero-header">

  <div>

    <h1>
      📋 Incident Management Center
    </h1>

    <p
      style={{
        color: "#94a3b8",
        fontSize: "18px",
        fontWeight: "600",
      }}
    >
      Incident Operations Hub
    </p>

    <p
      style={{
        color: "#cbd5e1",
      }}
    >
      Create, monitor, track and
      manage traffic incidents
      across the city in real-time.
    </p>

  </div>

  <div
    style={{
      background: "#f59e0b",
      padding: "10px 18px",
      borderRadius: "25px",
      fontWeight: "bold",
    }}
  >
    📋 Incident Tracking Active
  </div>

</div>

<div className="cards">

  <div className="card">

    <h3>
      📋 Total Incidents
    </h3>

    <h2>
      LIVE
    </h2>

  </div>

  <div className="card">

    <h3>
      🚨 Monitoring
    </h3>

    <h2>
      ACTIVE
    </h2>

  </div>

  <div className="card">

    <h3>
      🚦 Traffic Alerts
    </h3>

    <h2>
      ONLINE
    </h2>

  </div>

  <div className="card">

    <h3>
      🤖 AI Support
    </h3>

    <h2
      style={{
        color: "#22c55e",
      }}
    >
      ACTIVE
    </h2>

  </div>

</div>
      <div
  className="section-card"
  style={{
    marginTop: "20px",
    marginBottom: "20px",
  }}
>
  <h2>
    🚨 Incident Creation & Tracking
  </h2>

  <p>
    Create incidents and monitor
    real-time traffic events.
  </p>
</div>

<div className="dashboard-grid">
        <div className="section-card">
          <IncidentForm />
        </div>

        <div
  className="section-card"
  style={{
    height: "650px",
  }}
>
  <IncidentList />
</div>
      </div>

     

      
    </MainLayout>

  );
}

export default IncidentManagement;