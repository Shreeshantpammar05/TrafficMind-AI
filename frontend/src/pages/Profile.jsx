import MainLayout from "../layouts/MainLayout";
import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import axios from "axios";

import {
  FaUser,
  FaEnvelope,
  FaShieldAlt,
  FaIdBadge,
  FaCheckCircle,
  FaClock,
  FaArrowLeft,
} from "react-icons/fa";

function Profile() {
  const navigate =
    useNavigate();

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const API_BASE =
    import.meta.env
      .VITE_API_BASE_URL ||
    "http://localhost:5000";

  useEffect(() => {
    const fetchProfile =
      async () => {
        try {
          setLoading(true);
          setError("");

          const token =
            localStorage.getItem(
              "token"
            );

          if (!token) {
            setError(
              "Authentication required."
            );

            return;
          }

          const response =
            await axios.get(
              `${API_BASE}/api/users/me`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          setUser(
            response.data?.user ||
              null
          );
        } catch (requestError) {
          console.error(
            "Profile fetch error:",
            requestError
          );

          setError(
            requestError.response
              ?.data?.error ||
              "Failed to load profile."
          );
        } finally {
          setLoading(false);
        }
      };

    fetchProfile();
  }, [API_BASE]);

  const role =
    user?.role || "citizen";

  const isOfficer =
    role === "government";

  const isAdmin =
    role === "admin";

  const roleLabel =
    isAdmin
      ? "Administrator"
      : isOfficer
      ? "Government Officer"
      : "Citizen";

  const officerTypeLabel =
    user?.governmentOfficerType ===
    "main_officer"
      ? "Main Officer"
      : user?.governmentOfficerType ===
        "sub_officer"
      ? "Sub Officer"
      : "";

  const verificationLabel =
    user?.verificationStatus ===
    "approved"
      ? "Approved"
      : user?.verificationStatus ===
        "rejected"
      ? "Rejected"
      : "Pending";

  const verificationIcon =
    user?.verificationStatus ===
    "approved"
      ? <FaCheckCircle />
      : <FaClock />;

  const cardStyle = {
    background:
      "var(--app-surface)",
    border:
      "1px solid var(--border)",
    borderRadius:
      "18px",
    padding:
      "22px",
    boxSizing:
      "border-box",
  };

  const labelStyle = {
    fontSize:
      "11px",
    fontWeight:
      "800",
    letterSpacing:
      ".08em",
    textTransform:
      "uppercase",
    color:
      "var(--text-muted)",
    marginBottom:
      "7px",
  };

  const valueStyle = {
    fontSize:
      "15px",
    fontWeight:
      "700",
    color:
      "var(--text-primary)",
    wordBreak:
      "break-word",
  };

  const backButtonStyle = {
    display:
      "inline-flex",
    alignItems:
      "center",
    gap:
      "8px",
    padding:
      "10px 16px",
    marginBottom:
      "18px",
    border:
      "1px solid var(--border-strong)",
    borderRadius:
      "10px",
    background:
      "var(--app-surface)",
    color:
      "var(--text-primary)",
    fontWeight:
      "700",
    cursor:
      "pointer",
    transition:
      "all .2s ease",
  };

  if (loading) {
    return (
      <MainLayout>
      <main
        style={{
          minHeight:
            "100vh",
          padding:
            "35px",
          background:
            "var(--app-bg)",
          color:
            "var(--text-primary)",
        }}
      >
        <div
          style={{
            maxWidth:
              "1000px",
            margin:
              "0 auto",
          }}
        >
          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            style={
              backButtonStyle
            }
          >
            <FaArrowLeft />
            Back
          </button>

          <div
            style={{
              ...cardStyle,
              padding:
                "40px",
              textAlign:
                "center",
              color:
                "var(--text-muted)",
            }}
          >
            Loading your profile...
          </div>
        </div>
      </main>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
      <main
        style={{
          minHeight:
            "100vh",
          padding:
            "35px",
          background:
            "var(--app-bg)",
          color:
            "var(--text-primary)",
        }}
      >
        <div
          style={{
            maxWidth:
              "1000px",
            margin:
              "0 auto",
          }}
        >
          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            style={
              backButtonStyle
            }
          >
            <FaArrowLeft />
            Back
          </button>

          <div
            style={{
              ...cardStyle,
              border:
                "1px solid rgba(239,68,68,.35)",
              color:
                "#ef4444",
            }}
          >
            {error}
          </div>
        </div>
      </main>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
      <main
        style={{
          minHeight:
            "100vh",
          padding:
            "35px",
          background:
            "var(--app-bg)",
          color:
            "var(--text-primary)",
        }}
      >
        <div
          style={{
            maxWidth:
              "1000px",
            margin:
              "0 auto",
          }}
        >
          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            style={
              backButtonStyle
            }
          >
            <FaArrowLeft />
            Back
          </button>

          <div
            style={cardStyle}
          >
            Profile information
            is unavailable.
          </div>
        </div>
      </main>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
    <main
      style={{
        minHeight:
          "100vh",
        padding:
          "35px",
        background:
          "var(--app-bg)",
        color:
          "var(--text-primary)",
        boxSizing:
          "border-box",
      }}
    >
      <div
        style={{
          maxWidth:
            "1050px",
          margin:
            "0 auto",
        }}
      >
        {/* Back */}
        <button
          type="button"
          onClick={() =>
            navigate(-1)
          }
          style={
            backButtonStyle
          }
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              "var(--accent-soft)";
            e.currentTarget.style.borderColor =
              "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              "var(--app-surface)";
            e.currentTarget.style.borderColor =
              "var(--border-strong)";
          }}
        >
          <FaArrowLeft />
          Back
        </button>

        {/* Header */}
        <section
          style={{
            ...cardStyle,
            marginBottom:
              "20px",
            background:
              "linear-gradient(135deg, var(--app-surface), var(--app-surface-2))",
          }}
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap:
                "18px",
              flexWrap:
                "wrap",
            }}
          >
            <div
              style={{
                width:
                  "72px",
                height:
                  "72px",
                borderRadius:
                  "20px",
                display:
                  "grid",
                placeItems:
                  "center",
                background:
                  "var(--accent-soft)",
                border:
                  "1px solid rgba(59,130,246,.25)",
                color:
                  "var(--accent)",
                fontSize:
                  "28px",
                flexShrink:
                  0,
              }}
            >
              <FaUser/>
              
            </div>

            <div
              style={{
                flex:
                  1,
                minWidth:
                  "200px",
              }}
            >
              <div
                style={{
                  fontSize:
                    "11px",
                  fontWeight:
                    "800",
                  color:
                    "var(--accent)",
                  letterSpacing:
                    ".12em",
                  textTransform:
                    "uppercase",
                  marginBottom:
                    "6px",
                }}
              >
                My Profile
              </div>

              <h1
                style={{
                  margin:
                    0,
                  fontSize:
                    "30px",
                  fontWeight:
                    "850",
                  color:
                    "var(--text-primary)",
                }}
              >
                {user.name}
              </h1>

              <p
                style={{
                  margin:
                    "6px 0 0",
                  color:
                    "var(--text-muted)",
                }}
              >
                {roleLabel}
              </p>
            </div>

            <div
              style={{
                padding:
                  "10px 14px",
                borderRadius:
                  "999px",
                background:
                  "var(--accent-soft)",
                border:
                  "1px solid rgba(59,130,246,.25)",
                color:
                  "var(--accent)",
                fontSize:
                  "12px",
                fontWeight:
                  "800",
              }}
            >
              {roleLabel}
            </div>
          </div>
        </section>

        {/* Basic information */}
        <section
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(250px, 1fr))",
            gap:
              "16px",
            marginBottom:
              "20px",
          }}
        >
          <div
            style={cardStyle}
          >
            <div
              style={{
                display:
                  "flex",
                gap:
                  "14px",
                alignItems:
                  "flex-start",
              }}
            >
              <FaUser
                style={{
                  color:
                    "var(--accent)",
                  marginTop:
                    "3px",
                }}
              />

              <div>
                <div
                  style={labelStyle}
                >
                  Full Name
                </div>

                <div
                  style={valueStyle}
                >
                  {user.name}
                </div>
              </div>
            </div>
          </div>

          <div
            style={cardStyle}
          >
            <div
              style={{
                display:
                  "flex",
                gap:
                  "14px",
                alignItems:
                  "flex-start",
              }}
            >
              <FaEnvelope
                style={{
                  color:
                    "var(--accent)",
                  marginTop:
                    "3px",
                }}
              />

              <div>
                <div
                  style={labelStyle}
                >
                  Email
                </div>

                <div
                  style={valueStyle}
                >
                  {user.email}
                </div>
              </div>
            </div>
          </div>

          <div
            style={cardStyle}
          >
            <div
              style={{
                display:
                  "flex",
                gap:
                  "14px",
                alignItems:
                  "flex-start",
              }}
            >
              <FaShieldAlt
                style={{
                  color:
                    "var(--accent)",
                  marginTop:
                    "3px",
                }}
              />

              <div>
                <div
                  style={labelStyle}
                >
                  Account Role
                </div>

                <div
                  style={valueStyle}
                >
                  {roleLabel}
                </div>
              </div>
            </div>
          </div>

          <div
            style={cardStyle}
          >
            <div
              style={{
                display:
                  "flex",
                gap:
                  "14px",
                alignItems:
                  "flex-start",
              }}
            >
              <FaIdBadge
                style={{
                  color:
                    "var(--accent)",
                  marginTop:
                    "3px",
                }}
              />

              <div>
                <div
                  style={labelStyle}
                >
                  User ID
                </div>

                <div
                  style={valueStyle}
                >
                  {user._id}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Government information */}
        {isOfficer && (
          <section
            style={{
              ...cardStyle,
              marginBottom:
                "20px",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap:
                  "10px",
                marginBottom:
                  "20px",
              }}
            >
              <FaIdBadge
                style={{
                  color:
                    "var(--accent)",
                }}
              />

              <h2
                style={{
                  margin:
                    0,
                  fontSize:
                    "19px",
                  color:
                    "var(--text-primary)",
                }}
              >
                Officer Information
              </h2>
            </div>

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap:
                  "16px",
              }}
            >
              <div>
                <div
                  style={labelStyle}
                >
                  Officer Type
                </div>

                <div
                  style={valueStyle}
                >
                  {officerTypeLabel ||
                    "Not assigned"}
                </div>
              </div>

              <div>
                <div
                  style={labelStyle}
                >
                  District
                </div>

                <div
                  style={valueStyle}
                >
                  {user.jurisdictionDistrict ||
                    "Not assigned"}
                </div>
              </div>

              <div>
                <div
                  style={labelStyle}
                >
                  Area
                </div>

                <div
                  style={valueStyle}
                >
                  {user.jurisdictionArea ||
                    "District-wide"}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Verification */}
        <section
          style={cardStyle}
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap:
                "10px",
              marginBottom:
                "20px",
            }}
          >
            {verificationIcon}

            <h2
              style={{
                margin:
                  0,
                fontSize:
                  "19px",
                color:
                  "var(--text-primary)",
              }}
            >
              Account Status
            </h2>
          </div>

          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap:
                "14px",
              padding:
                "16px",
              borderRadius:
                "14px",
              background:
                "var(--app-surface-2)",
              border:
                "1px solid var(--border)",
            }}
          >
            <span
              style={{
                color:
                  user.verificationStatus ===
                  "approved"
                    ? "#22c55e"
                    : user.verificationStatus ===
                      "rejected"
                    ? "#ef4444"
                    : "#f59e0b",
                display:
                  "flex",
                fontSize:
                  "18px",
              }}
            >
              {verificationIcon}
            </span>

            <div>
              <div
                style={{
                  fontWeight:
                    "800",
                  color:
                    "var(--text-primary)",
                }}
              >
                {verificationLabel}
              </div>

              <div
                style={{
                  fontSize:
                    "13px",
                  color:
                    "var(--text-muted)",
                  marginTop:
                    "4px",
                }}
              >
                {isOfficer
                  ? "Government officer verification status"
                  : isAdmin
                  ? "Administrator account"
                  : "Citizen account status"}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
    </MainLayout>
  );
}

export default Profile;