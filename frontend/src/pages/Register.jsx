import { API_BASE } from "../config/api.js";
import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import "./AuthPages.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "citizen",
    governmentProof: "",
    governmentOfficerType: "",
    jurisdictionDistrict: "",
    jurisdictionArea: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
      // Clear government-only fields when switching to citizen.
      ...(name === "role" && value === "citizen"
        ? {
            governmentProof: "",
            governmentOfficerType: "",
            jurisdictionDistrict: "",
            jurisdictionArea: "",
          }
        : {}),
      // Main Officer does not need a specific area.
      ...(name === "governmentOfficerType" && value === "main_officer"
        ? { jurisdictionArea: "" }
        : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.role === "government") {
      if (!formData.governmentProof.trim()) {
        alert("Government ID is required.");
        return;
      }

      if (!formData.governmentOfficerType) {
        alert("Please select Main Officer or Sub Officer.");
        return;
      }

      if (!formData.jurisdictionDistrict.trim()) {
        alert("District is required for government officers.");
        return;
      }

      if (
        formData.governmentOfficerType === "sub_officer" &&
        !formData.jurisdictionArea.trim()
      ) {
        alert("Assigned area is required for Sub Officers.");
        return;
      }
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        governmentProof: formData.governmentProof.trim(),
        jurisdictionDistrict: formData.jurisdictionDistrict.trim(),
        jurisdictionArea: formData.jurisdictionArea.trim(),
      };

      const res = await axios.post(`${API_BASE}/api/register`, payload);

      alert(res.data?.message || "Registration successful.");

      setFormData({
        name: "",
        email: "",
        password: "",
        role: "citizen",
        governmentProof: "",
        governmentOfficerType: "",
        jurisdictionDistrict: "",
        jurisdictionArea: "",
      });

      navigate("/login");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="tm-auth-shell tm-register-shell">
      <header className="tm-auth-header">
        <Link to="/" className="tm-auth-brand" aria-label="TrafficMind AI home">
          <span className="tm-auth-brand-mark">T</span>
          <span>TrafficMind <b>AI</b></span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="tm-auth-layout tm-register-layout">
        <section className="tm-auth-intro tm-register-intro" aria-labelledby="register-intro-title">
          <span className="tm-auth-eyebrow">JOIN THE PLATFORM</span>
          <h1 id="register-intro-title">
            One connected workspace.
            <span> Clearer traffic awareness.</span>
          </h1>
          <p>
            Create an account to access the TrafficMind AI environment.
            Choose the account type that matches your role.
          </p>
          <div className="tm-register-note">
            <strong>Government Officer?</strong>
            <span>
              Submit your officer details and jurisdiction. Government
              applications follow the existing verification process.
            </span>
          </div>
        </section>

        <section className="tm-auth-card tm-register-card" aria-labelledby="register-title">
          <div className="tm-auth-card-heading">
            <span className="tm-auth-section-label">ACCOUNT SETUP</span>
            <h2 id="register-title">Create your account</h2>
            <p>Complete the details below to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className="tm-auth-form tm-register-form">
            <div className="tm-form-field">
              <label htmlFor="register-name">Full name</label>
              <input
                id="register-name"
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>

            <div className="tm-form-field">
              <label htmlFor="register-email">Email address</label>
              <input
                id="register-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="tm-form-field">
              <label htmlFor="register-password">Password</label>
              <input
                id="register-password"
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="tm-form-field">
              <label htmlFor="register-role">Account type</label>
              <select
                id="register-role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="citizen">Citizen</option>
                <option value="government">Government Officer</option>
              </select>
            </div>

            {formData.role === "government" && (
              <div className="tm-government-fields">
                <div className="tm-government-heading">
                  <span>GOVERNMENT OFFICER DETAILS</span>
                  <p>Provide the information required for officer verification.</p>
                </div>

                <div className="tm-form-field">
                  <label htmlFor="government-officer-type">Officer type</label>
                  <select
                    id="government-officer-type"
                    name="governmentOfficerType"
                    value={formData.governmentOfficerType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select officer type</option>
                    <option value="main_officer">Main Officer</option>
                    <option value="sub_officer">Sub Officer</option>
                  </select>
                </div>

                <div className="tm-form-field">
                  <label htmlFor="government-proof">Government ID number</label>
                  <input
                    id="government-proof"
                    type="text"
                    name="governmentProof"
                    placeholder="Enter government ID"
                    value={formData.governmentProof}
                    onChange={handleChange}
                    autoComplete="off"
                    required
                  />
                </div>

                <div className="tm-form-field">
                  <label htmlFor="jurisdiction-district">District</label>
                  <input
                    id="jurisdiction-district"
                    type="text"
                    name="jurisdictionDistrict"
                    placeholder="e.g. Bengaluru Urban"
                    value={formData.jurisdictionDistrict}
                    onChange={handleChange}
                    required
                  />
                </div>

                {formData.governmentOfficerType === "sub_officer" && (
                  <div className="tm-form-field">
                    <label htmlFor="jurisdiction-area">Assigned area</label>
                    <input
                      id="jurisdiction-area"
                      type="text"
                      name="jurisdictionArea"
                      placeholder="e.g. Dasarahalli"
                      value={formData.jurisdictionArea}
                      onChange={handleChange}
                      required
                    />
                  </div>
                )}

                <div className="tm-government-hint">
                  {formData.governmentOfficerType === "main_officer"
                    ? "Main Officers are assigned at district level."
                    : "Sub Officers are assigned to a specific area within their district."}
                </div>
              </div>
            )}

            <button className="tm-auth-submit" type="submit" disabled={loading}>
              {loading
                ? "Creating account…"
                : formData.role === "government"
                  ? "Submit officer application"
                  : "Create account"}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="tm-auth-card-footer">
            <span>Already have an account?</span>
            <Link to="/login">Sign in</Link>
          </div>
        </section>
      </div>

      <footer className="tm-auth-footer">
        <Link to="/" className="tm-auth-footer-home">TrafficMind AI</Link>
        <span>Intelligent traffic monitoring for smarter mobility.</span>
      </footer>
    </main>
  );
}

export default Register;
