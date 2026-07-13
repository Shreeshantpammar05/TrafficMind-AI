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
        "http://localhost:5000/api/incidents"
      );

      setIncidents(res.data.incidents);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div style={{ marginTop: "30px" }}>
      <h2>🚨 Recent Incidents</h2>

      {incidents.map((incident) => (
        <div
          key={incident._id}
          style={{
            background: "#1e293b",
            padding: "15px",
            marginTop: "10px",
            borderRadius: "10px",
          }}
        >
          <h3>{incident.location}</h3>
          <p>Type: {incident.incidentType}</p>
          <p>Severity: {incident.severity}</p>
          <p>{incident.description}</p>
        </div>
      ))}
    </div>
  );
}

export default IncidentList;