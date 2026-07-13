import { useState } from "react";
import axios from "axios";

function IncidentForm() {
  const [formData, setFormData] = useState({
    location: "",
    incidentType: "",
    severity: "",
    description: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "https://trafficmind-ai.onrender.com/api/incidents",
        formData
      );

      alert(res.data.message);

      setFormData({
        location: "",
        incidentType: "",
        severity: "",
        description: "",
      });
    } catch (error) {
      console.log(error);
      alert("Failed to save incident");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>🚨 Report Incident</h2>

      <input
        type="text"
        name="location"
        placeholder="Location"
        value={formData.location}
        onChange={handleChange}
      />
      <br /><br />

      <input
        type="text"
        name="incidentType"
        placeholder="Incident Type"
        value={formData.incidentType}
        onChange={handleChange}
      />
      <br /><br />

      <input
        type="text"
        name="severity"
        placeholder="Severity"
        value={formData.severity}
        onChange={handleChange}
      />
      <br /><br />

      <textarea
        name="description"
        placeholder="Description"
        value={formData.description}
        onChange={handleChange}
      />
      <br /><br />

      <button type="submit">Submit Incident</button>
    </form>
  );
}

export default IncidentForm;