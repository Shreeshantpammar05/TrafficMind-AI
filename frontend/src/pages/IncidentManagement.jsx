import MainLayout from "../layouts/MainLayout";
import IncidentForm from "../components/IncidentForm";
import IncidentList from "../components/IncidentList";

function IncidentManagement() {
  return (
    <MainLayout>
      <div
        style={{
          width: "100%",
          color: "var(--text-primary)",
        }}
      >
        {/* PAGE HEADER */}

        <div
          className="hero-header"
          style={{
            marginBottom: "25px",
            gap: "18px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              minWidth: 0,
              flex: "1 1 520px",
            }}
          >
            <h1
              style={{
                margin: 0,
                lineHeight: 1.1,
              }}
            >
             Incident Management Center
            </h1>


            <p
              style={{
                color: "rgba(255,255,255,.84)",
                maxWidth: "700px",
                lineHeight: "1.6",
                marginTop: "8px",
                marginBottom: 0,
                fontSize: "14px",
              }}
            >
              Create, monitor, track, and manage
              traffic incidents across the city
              using the existing incident
              management system.
            </p>
          </div>

         
        </div>

        {/* INCIDENT MANAGEMENT WORKSPACE */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(320px,0.9fr) minmax(420px,1.1fr)",
            gap: "25px",
            alignItems: "stretch",
          }}
        >
          {/* REPORT INCIDENT */}

          <div
            className="section-card"
            style={{
              minWidth: 0,
              padding: "24px",
            }}
          >
            

            <IncidentForm />
          </div>

          {/* INCIDENT LIST */}

          <div
            className="section-card"
            style={{
              minWidth: 0,
              minHeight: "650px",
              padding: "24px",
            }}
          >
            <div
              style={{
                marginBottom: "20px",
                paddingBottom: "4px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                📋 Recent Incidents
              </h2>

              <p
                style={{
                  color: "var(--text-muted)",
                  marginTop: "7px",
                  lineHeight: "1.55",
                  marginBottom: 0,
                  fontSize: "14px",
                }}
              >
                Monitor reported incidents and
                real-time updates from the
                incident system.
              </p>
            </div>

            <IncidentList />
          </div>
        </div>

        

        
      </div>
    </MainLayout>
  );
}

export default IncidentManagement;