import socket from "../socket";
import { useEffect, useState } from "react";
import axios from "axios";

function IncidentList() {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    fetchIncidents();

    socket.on("newIncident", () => {
      fetchIncidents();
    });

    return () => {
      socket.off("newIncident");
    };
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await axios.get(
        "https://trafficmind-ai.onrender.com/api/incidents"
      );

      setIncidents(res.data.incidents);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <h2
        style={{
          marginBottom: "20px",
        }}
      >
        🚨 Recent Incidents
      </h2>

      <div
        style={{
          height: "520px",
          overflowY: "auto",
          paddingRight: "8px",
        }}
      >
        {incidents.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#94A3B8",
              marginTop: "80px",
            }}
          >
            No Incidents Found
          </div>
        ) : (
          incidents.map((incident) => (
            <div
              key={incident._id}
              style={{
                background: "#1E293B",
                border: "1px solid rgba(59,130,246,.25)",
                borderRadius: "14px",
                padding: "18px",
                marginBottom: "15px",
                transition: ".3s",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: "#60A5FA",
                }}
              >
                📍 {incident.location}
              </h3>

              <p
                style={{
                  marginTop: "12px",
                  color: "#CBD5E1",
                }}
              >
                🚧 Type :
                <strong>
                  {" "}
                  {incident.incidentType}
                </strong>
              </p>

              <p
                style={{
                  color: "#CBD5E1",
                }}
              >
                ⚠️ Severity :
                <strong>
                  {" "}
                  {incident.severity}
                </strong>
              </p>

              <p
                style={{
                  color: "#CBD5E1",
                }}
              >
                📝 {incident.description}
              </p>

              <div
                style={{
                  marginTop: "12px",
                  fontSize: "12px",
                  color: "#64748B",
                }}
              >
                🕒{" "}
                {new Date(
                  incident.createdAt
                ).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default IncidentList;