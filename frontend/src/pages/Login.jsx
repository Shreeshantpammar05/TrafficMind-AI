import { API_BASE } from "../config/api.js";
import { useState } from "react";
import axios from "axios";
import {
  useNavigate,
  Link,
} from "react-router-dom";

function Login() {
  const navigate =
    useNavigate();

  const [formData, setFormData] =
    useState({
      email: "",
      password: "",
    });

  const [loading, setLoading] =
    useState(false);



  const handleChange = (e) => {
    setFormData(
      (current) => ({
        ...current,
        [e.target.name]:
          e.target.value,
      })
    );
  };

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      try {
        setLoading(true);

        const res =
          await axios.post(
            `${API_BASE}/api/login`,
            formData
          );

        /*
         * Government application is pending.
         */
        if (
          res.data?.role ===
            "government" &&
          res.data?.verificationStatus !==
            "approved"
        ) {
          localStorage.removeItem(
            "token"
          );

          localStorage.setItem(
            "role",
            "government"
          );

          localStorage.setItem(
            "verificationStatus",
            res.data
              ?.verificationStatus ||
              "pending"
          );

          localStorage.setItem(
            "governmentOfficerType",
            res.data
              ?.governmentOfficerType ||
              ""
          );

          localStorage.setItem(
  "jurisdictionDistrict",
  res.data
    ?.jurisdictionDistrict ||
    ""
);

localStorage.setItem(
  "jurisdictionArea",
  res.data
    ?.jurisdictionArea ||
    ""
);

          navigate("/dashboard");

          return;
        }

        /*
         * Approved login / admin / citizen.
         */
        localStorage.setItem(
          "token",
          res.data.token
        );

        localStorage.setItem(
          "role",
          res.data.role
        );

        localStorage.setItem(
          "verificationStatus",
          res.data
            ?.verificationStatus ||
            "approved"
        );

        localStorage.setItem(
          "governmentOfficerType",
          res.data
            ?.governmentOfficerType ||
            ""
        );

        navigate("/dashboard");
      } catch (error) {
        const response =
          error.response?.data;

        /*
         * The backend can return a pending
         * application response without a token.
         */
        if (
          response?.status ===
            "pending" ||
          response?.verificationStatus ===
            "pending"
        ) {
          localStorage.removeItem(
            "token"
          );

          localStorage.setItem(
            "role",
            "government"
          );

          localStorage.setItem(
            "verificationStatus",
            "pending"
          );

          navigate("/dashboard");

          return;
        }

        localStorage.removeItem(
          "token"
        );

        alert(
          response
            ?.message ||
            "❌ Login Failed"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent:
          "center",
        alignItems:
          "center",
        background:
          "radial-gradient(circle at top right, rgba(37,99,235,.12), transparent 30%), radial-gradient(circle at bottom left, rgba(14,165,233,.08), transparent 30%), var(--app-bg)",
        color:
          "var(--text-primary)",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width:
            "min(420px, 100%)",
          background:
            "var(--app-surface)",
          border:
            "1px solid var(--border-strong)",
          borderRadius:
            "22px",
          padding:
            "40px",
          boxShadow:
            "var(--shadow)",
          backdropFilter:
            "blur(18px)",
          boxSizing:
            "border-box",
        }}
      >
        <div
          style={{
            textAlign:
              "center",
          }}
        >
          <div
            style={{
              width:
                "56px",
              height:
                "56px",
              margin:
                "0 auto 14px",
              borderRadius:
                "16px",
              display:
                "grid",
              placeItems:
                "center",
              background:
                "var(--accent-soft)",
              border:
                "1px solid rgba(59,130,246,.24)",
              fontSize:
                "26px",
            }}
          >
            🚦
          </div>

          <h1
            style={{
              margin:
                "0 0 5px",
              fontSize:
                "34px",
              color:
                "var(--text-primary)",
              fontWeight:
                "850",
              letterSpacing:
                "-.03em",
            }}
          >
            TrafficMind AI
          </h1>

          <p
            style={{
              color:
                "var(--text-muted)",
              marginBottom:
                "35px",
            }}
          >
            Smart City Command Center
          </p>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
        >
          <div
            style={{
              marginBottom:
                "20px",
            }}
          >
            <label
              htmlFor="login-email"
              style={{
                display:
                  "block",
                color:
                  "var(--text-secondary)",
                fontSize:
                  "13px",
                fontWeight:
                  "700",
                marginBottom:
                  "8px",
              }}
            >
              Email
            </label>

            <input
              id="login-email"
              type="email"
              name="email"
              value={
                formData.email
              }
              onChange={
                handleChange
              }
              placeholder="Enter Email"
              autoComplete="email"
              required
              style={{
                width: "100%",
                padding:
                  "13px 14px",
                borderRadius:
                  "11px",
                border:
                  "1px solid var(--border-strong)",
                background:
                  "var(--app-surface-2)",
                color:
                  "var(--text-primary)",
                boxSizing:
                  "border-box",
                outline:
                  "none",
              }}
            />
          </div>

          <div
            style={{
              marginBottom:
                "25px",
            }}
          >
            <label
              htmlFor="login-password"
              style={{
                display:
                  "block",
                color:
                  "var(--text-secondary)",
                fontSize:
                  "13px",
                fontWeight:
                  "700",
                marginBottom:
                  "8px",
              }}
            >
              Password
            </label>

            <input
              id="login-password"
              type="password"
              name="password"
              value={
                formData.password
              }
              onChange={
                handleChange
              }
              placeholder="Enter Password"
              autoComplete="current-password"
              required
              style={{
                width: "100%",
                padding:
                  "13px 14px",
                borderRadius:
                  "11px",
                border:
                  "1px solid var(--border-strong)",
                background:
                  "var(--app-surface-2)",
                color:
                  "var(--text-primary)",
                boxSizing:
                  "border-box",
                outline:
                  "none",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding:
                "14px",
              border:
                "none",
              borderRadius:
                "12px",
              background:
                "linear-gradient(135deg,var(--accent-strong),var(--accent))",
              color:
                "#FFFFFF",
              fontWeight:
                "800",
              fontSize:
                "16px",
              cursor:
                loading
                  ? "not-allowed"
                  : "pointer",
              opacity:
                loading
                  ? 0.7
                  : 1,
            }}
          >
            {loading
              ? "Signing in..."
              : "🔐 Login"}
          </button>
        </form>

        <div
          style={{
            marginTop:
              "20px",
            textAlign:
              "center",
          }}
        >
          <p
            style={{
              color:
                "var(--text-muted)",
              marginBottom:
                "8px",
            }}
          >
            Don't have an account?
          </p>

          <Link
            to="/register"
            style={{
              color:
                "var(--accent)",
              fontWeight:
                "800",
              textDecoration:
                "none",
              fontSize:
                "15px",
            }}
          >
            📝 Create New Account
          </Link>
        </div>

        <div
          style={{
            marginTop:
              "25px",
            paddingTop:
              "16px",
            borderTop:
              "1px solid var(--border)",
            textAlign:
              "center",
            color:
              "var(--text-subtle)",
            fontSize:
              "12px",
            lineHeight:
              "1.5",
          }}
        >
          AI Monitoring • Traffic Analytics •
          Emergency Response
        </div>
      </div>
    </div>
  );
}

export default Login;