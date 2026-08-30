import { useState } from "react";
import axios from "axios";
import {
  useNavigate,
  Link,
} from "react-router-dom";

function Register() {
  const navigate =
    useNavigate();

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      password: "",
      role: "citizen",
      governmentProof: "",
      governmentOfficerType: "",
      jurisdictionDistrict: "",
      jurisdictionArea: "",
    });

  const [loading, setLoading] =
    useState(false);

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000";

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData(
      (current) => ({
        ...current,
        [name]: value,

        /*
         * Clear all government-only
         * fields when switching to citizen.
         */
        ...(name === "role" &&
        value === "citizen"
          ? {
              governmentProof:
                "",
              governmentOfficerType:
                "",
              jurisdictionDistrict:
                "",
              jurisdictionArea:
                "",
            }
          : {}),

        /*
         * Main Officer does not need
         * a specific area.
         */
        ...(name ===
          "governmentOfficerType" &&
        value ===
          "main_officer"
          ? {
              jurisdictionArea:
                "",
            }
          : {}),
      })
    );
  };

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      if (
        formData.role ===
        "government"
      ) {
        if (
          !formData.governmentProof.trim()
        ) {
          alert(
            "Government ID is required."
          );
          return;
        }

        if (
          !formData.governmentOfficerType
        ) {
          alert(
            "Please select Main Officer or Sub Officer."
          );
          return;
        }

        if (
          !formData.jurisdictionDistrict.trim()
        ) {
          alert(
            "District is required for government officers."
          );
          return;
        }

        if (
          formData.governmentOfficerType ===
            "sub_officer" &&
          !formData.jurisdictionArea.trim()
        ) {
          alert(
            "Assigned area is required for Sub Officers."
          );
          return;
        }
      }

      try {
        setLoading(true);

        const payload = {
          ...formData,

          name:
            formData.name.trim(),

          email:
            formData.email
              .trim()
              .toLowerCase(),

          governmentProof:
            formData.governmentProof.trim(),

          jurisdictionDistrict:
            formData.jurisdictionDistrict.trim(),

          jurisdictionArea:
            formData.jurisdictionArea.trim(),
        };

        const res =
          await axios.post(
            `${API_BASE}/api/register`,
            payload
          );

        alert(
          res.data?.message ||
            "Registration successful."
        );

        setFormData({
          name: "",
          email: "",
          password: "",
          role: "citizen",
          governmentProof: "",
          governmentOfficerType:
            "",
          jurisdictionDistrict:
            "",
          jurisdictionArea:
            "",
        });

        navigate("/login");
      } catch (error) {
        alert(
          error.response?.data
            ?.message ||
            "Registration Failed"
        );
      } finally {
        setLoading(false);
      }
    };

  const inputStyle = {
    width: "100%",
    padding:
      "13px 14px",
    marginTop:
      "8px",
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
  };

  return (
    <div
      style={{
        minHeight:
          "100vh",
        display:
          "flex",
        justifyContent:
          "center",
        alignItems:
          "center",
        background:
          "radial-gradient(circle at top right, rgba(37,99,235,.12), transparent 30%), radial-gradient(circle at bottom left, rgba(14,165,233,.08), transparent 30%), var(--app-bg)",
        color:
          "var(--text-primary)",
        padding:
          "20px",
        boxSizing:
          "border-box",
      }}
    >
      <div
        style={{
          width:
            "min(450px, 100%)",
          background:
            "var(--app-surface)",
          backdropFilter:
            "blur(18px)",
          borderRadius:
            "22px",
          padding:
            "40px",
          border:
            "1px solid var(--border-strong)",
          boxShadow:
            "var(--shadow)",
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
              fontWeight:
                "850",
              letterSpacing:
                "-.03em",
              color:
                "var(--text-primary)",
            }}
          >
            TrafficMind AI
          </h1>

          <p
            style={{
              color:
                "var(--text-muted)",
              marginBottom:
                "30px",
            }}
          >
            Smart City Registration Portal
          </p>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
        >
          <label
            htmlFor="register-name"
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
                "12px",
            }}
          >
            Full Name

            <input
              id="register-name"
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={
                formData.name
              }
              onChange={
                handleChange
              }
              autoComplete="name"
              required
              style={
                inputStyle
              }
            />
          </label>

          <label
            htmlFor="register-email"
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
                "12px",
            }}
          >
            Email Address

            <input
              id="register-email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={
                formData.email
              }
              onChange={
                handleChange
              }
              autoComplete="email"
              required
              style={
                inputStyle
              }
            />
          </label>

          <label
            htmlFor="register-password"
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
                "12px",
            }}
          >
            Password

            <input
              id="register-password"
              type="password"
              name="password"
              placeholder="Create a password"
              value={
                formData.password
              }
              onChange={
                handleChange
              }
              autoComplete="new-password"
              required
              style={
                inputStyle
              }
            />
          </label>

          <label
            htmlFor="register-role"
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
                "12px",
            }}
          >
            Account Type

            <select
              id="register-role"
              name="role"
              value={
                formData.role
              }
              onChange={
                handleChange
              }
              style={
                inputStyle
              }
            >
              <option value="citizen">
                Citizen
              </option>

              <option value="government">
                Government Officer
              </option>
            </select>
          </label>

          {formData.role ===
            "government" && (
            <>
              <label
                htmlFor="government-officer-type"
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
                    "12px",
                }}
              >
                Government Officer Type

                <select
                  id="government-officer-type"
                  name="governmentOfficerType"
                  value={
                    formData.governmentOfficerType
                  }
                  onChange={
                    handleChange
                  }
                  style={
                    inputStyle
                  }
                  required
                >
                  <option value="">
                    Select Officer Type
                  </option>

                  <option value="main_officer">
                    Main Officer
                  </option>

                  <option value="sub_officer">
                    Sub Officer
                  </option>
                </select>
              </label>

              <label
                htmlFor="government-proof"
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
                    "12px",
                }}
              >
                Government ID Number

                <input
                  id="government-proof"
                  type="text"
                  name="governmentProof"
                  placeholder="Enter government ID"
                  value={
                    formData.governmentProof
                  }
                  onChange={
                    handleChange
                  }
                  autoComplete="off"
                  required
                  style={
                    inputStyle
                  }
                />
              </label>

              <label
                htmlFor="jurisdiction-district"
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
                    "12px",
                }}
              >
                District

                <input
                  id="jurisdiction-district"
                  type="text"
                  name="jurisdictionDistrict"
                  placeholder="e.g. Bengaluru Urban"
                  value={
                    formData.jurisdictionDistrict
                  }
                  onChange={
                    handleChange
                  }
                  required
                  style={
                    inputStyle
                  }
                />
              </label>

              {formData.governmentOfficerType ===
                "sub_officer" && (
                <label
                  htmlFor="jurisdiction-area"
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
                      "12px",
                  }}
                >
                  Assigned Area

                  <input
                    id="jurisdiction-area"
                    type="text"
                    name="jurisdictionArea"
                    placeholder="e.g. Dasarahalli"
                    value={
                      formData.jurisdictionArea
                    }
                    onChange={
                      handleChange
                    }
                    required
                    style={
                      inputStyle
                    }
                  />
                </label>
              )}

              <div
                style={{
                  background:
                    "var(--accent-soft)",
                  border:
                    "1px solid var(--border)",
                  color:
                    "var(--text-secondary)",
                  padding:
                    "12px 14px",
                  borderRadius:
                    "11px",
                  fontSize:
                    "12px",
                  lineHeight:
                    "1.5",
                  marginBottom:
                    "12px",
                }}
              >
                {formData.governmentOfficerType ===
                "main_officer"
                  ? "Main Officers are assigned at district level."
                  : "Sub Officers are assigned to a specific area within their district."}
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={
              loading
            }
            style={{
              width:
                "100%",
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
              cursor:
                loading
                  ? "not-allowed"
                  : "pointer",
              marginTop:
                "8px",
              opacity:
                loading
                  ? 0.7
                  : 1,
            }}
          >
            {loading
              ? "Creating Account..."
              : formData.role ===
                "government"
              ? "Submit Officer Application"
              : "Create Account"}
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
            Already have an account?
          </p>

          <Link
            to="/login"
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
            🔐 Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;