import { useState } from "react";
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

function IncidentForm() {
  const [formData, setFormData] =
    useState({
      location: "",
      incidentType: "",
      severity: "",
      description: "",
    });

  const [submitting, setSubmitting] =
    useState(false);

  const getAuthHeaders = () => ({
    Authorization:
      `Bearer ${localStorage.getItem(
        "token"
      )}`,
  });

  const handleChange = (e) => {
    setFormData((current) => ({
      ...current,
      [e.target.name]:
        e.target.value,
    }));
  };

  const getCoordinates = async (
    place
  ) => {
    const response =
      await axios.get(
        `${API_BASE}/api/routes/geocode`,
        {
          headers:
            getAuthHeaders(),
          params: {
            text: place,
          },
        }
      );

    const features =
      response.data?.features || [];

    if (features.length === 0) {
      throw new Error(
        "Location not found"
      );
    }

    return (
      features[0].geometry
        ?.coordinates || []
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.location.trim() ||
      !formData.incidentType.trim() ||
      !formData.severity.trim()
    ) {
      alert(
        "Please fill all required fields."
      );
      return;
    }

    try {
      setSubmitting(true);

      const coordinates =
        await getCoordinates(
          formData.location.trim()
        );

      const [longitude, latitude] =
        coordinates;

      if (
        !Number.isFinite(
          Number(latitude)
        ) ||
        !Number.isFinite(
          Number(longitude)
        )
      ) {
        throw new Error(
          "Location coordinates could not be determined."
        );
      }

      const payload = {
        ...formData,
        location:
          formData.location.trim(),
        incidentType:
          formData.incidentType.trim(),
        severity:
          formData.severity.trim(),
        description:
          formData.description.trim(),
        latitude:
          Number(latitude),
        longitude:
          Number(longitude),
      };

      const res =
        await axios.post(
          `${API_BASE}/api/incidents`,
          payload,
          {
            headers:
              getAuthHeaders(),
          }
        );

      alert(
        res.data?.message ||
          "Incident saved successfully."
      );

      setFormData({
        location: "",
        incidentType: "",
        severity: "",
        description: "",
      });
    } catch (error) {
      console.log(
        "Incident creation error:",
        error.response?.data ||
          error.message
      );

      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to save incident."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fieldStyle = {
    width: "100%",
    padding: "12px 13px",
    marginTop: "8px",
    border:
      "1px solid var(--border-strong)",
    borderRadius: "10px",
    background:
      "var(--app-surface-2)",
    color:
      "var(--text-primary)",
    boxSizing: "border-box",
    outline: "none",
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        width: "100%",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          color:
            "var(--text-primary)",
        }}
      >
        Report Incident
      </h2>

      <p
        style={{
          color:
            "var(--text-muted)",
          marginTop: "6px",
          lineHeight: "1.5",
        }}
      >
        Provide the location and incident
        details so the traffic operations
        system can process the report.
      </p>

      <label
        style={{
          display: "block",
          marginTop: "20px",
          color:
            "var(--text-secondary)",
          fontSize: "13px",
          fontWeight: "700",
        }}
      >
        Location
        <input
          type="text"
          name="location"
          placeholder="e.g. Siddapur, Karnataka"
          value={formData.location}
          onChange={handleChange}
          style={fieldStyle}
          required
        />
      </label>

      <label
        style={{
          display: "block",
          marginTop: "16px",
          color:
            "var(--text-secondary)",
          fontSize: "13px",
          fontWeight: "700",
        }}
      >
        Incident Type
        <input
          type="text"
          name="incidentType"
          placeholder="e.g. Accident, Road Block"
          value={
            formData.incidentType
          }
          onChange={handleChange}
          style={fieldStyle}
          required
        />
      </label>

      <label
        style={{
          display: "block",
          marginTop: "16px",
          color:
            "var(--text-secondary)",
          fontSize: "13px",
          fontWeight: "700",
        }}
      >
        Severity
        <input
          type="text"
          name="severity"
          placeholder="e.g. Low, Medium, High"
          value={formData.severity}
          onChange={handleChange}
          style={fieldStyle}
          required
        />
      </label>

      <label
        style={{
          display: "block",
          marginTop: "16px",
          color:
            "var(--text-secondary)",
          fontSize: "13px",
          fontWeight: "700",
        }}
      >
        Description
        <textarea
          name="description"
          placeholder="Describe what happened..."
          value={
            formData.description
          }
          onChange={handleChange}
          style={{
            ...fieldStyle,
            minHeight: "120px",
            resize: "vertical",
          }}
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        style={{
          width: "100%",
          marginTop: "20px",
          padding: "12px 18px",
          border: "none",
          borderRadius: "10px",
          background:
            "var(--accent-strong)",
          color: "#FFFFFF",
          cursor: submitting
            ? "not-allowed"
            : "pointer",
          fontWeight: "800",
          opacity: submitting
            ? 0.65
            : 1,
        }}
      >
        {submitting
          ? "Saving..."
          : "Submit Incident"}
      </button>
    </form>
  );
}

export default IncidentForm;