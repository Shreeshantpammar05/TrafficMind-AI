import { API_BASE } from "../config/api.js";
import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import "./AuthPages.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);

      const res = await axios.post(`${API_BASE}/api/login`, formData);

      // Government application is pending.
      if (
        res.data?.role === "government" &&
        res.data?.verificationStatus !== "approved"
      ) {
        localStorage.removeItem("token");
        localStorage.setItem("role", "government");
        localStorage.setItem(
          "verificationStatus",
          res.data?.verificationStatus || "pending"
        );
        localStorage.setItem(
          "governmentOfficerType",
          res.data?.governmentOfficerType || ""
        );
        localStorage.setItem(
          "jurisdictionDistrict",
          res.data?.jurisdictionDistrict || ""
        );
        localStorage.setItem(
          "jurisdictionArea",
          res.data?.jurisdictionArea || ""
        );

        navigate("/dashboard");
        return;
      }

      // Approved login / admin / citizen.
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem(
        "verificationStatus",
        res.data?.verificationStatus || "approved"
      );
      localStorage.setItem(
        "governmentOfficerType",
        res.data?.governmentOfficerType || ""
      );

      navigate("/dashboard");
    } catch (error) {
      const response = error.response?.data;

      // The backend can return a pending application response without a token.
      if (
        response?.status === "pending" ||
        response?.verificationStatus === "pending"
      ) {
        localStorage.removeItem("token");
        localStorage.setItem("role", "government");
        localStorage.setItem("verificationStatus", "pending");
        navigate("/dashboard");
        return;
      }

      localStorage.removeItem("token");
      alert(response?.message || "❌ Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="tm-auth-shell">
      <header className="tm-auth-header">
        <Link to="/" className="tm-auth-brand" aria-label="TrafficMind AI home">
          <span className="tm-auth-brand-mark">T</span>
          <span>TrafficMind <b>AI</b></span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="tm-auth-layout tm-login-layout">
        <section className="tm-auth-intro" aria-labelledby="login-intro-title">
          <span className="tm-auth-eyebrow">SMART CITY INTELLIGENCE</span>
          <h1 id="login-intro-title">
            A clearer view of traffic.
            <span> A smarter way to respond.</span>
          </h1>
          <p>
            Sign in to access your TrafficMind AI workspace for camera
            monitoring, traffic intelligence and incident management.
          </p>
          <div className="tm-auth-benefits">
            <div><span className="tm-auth-benefit-icon">01</span><span>AI-powered camera monitoring</span></div>
            <div><span className="tm-auth-benefit-icon">02</span><span>Traffic and incident visibility</span></div>
            <div><span className="tm-auth-benefit-icon">03</span><span>Centralized operational workspace</span></div>
          </div>
        </section>

        <section className="tm-auth-card" aria-labelledby="login-title">
          <div className="tm-auth-card-heading">
            <span className="tm-auth-section-label">YOUR WORKSPACE</span>
            <h2 id="login-title">Welcome back</h2>
            <p>Enter your account details to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="tm-auth-form">
            <div className="tm-form-field">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="tm-form-field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            <button className="tm-auth-submit" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in to TrafficMind"}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="tm-auth-card-footer">
            <span>Don't have an account?</span>
            <Link to="/register">Create an account</Link>
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

export default Login;
