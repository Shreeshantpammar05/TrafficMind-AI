import {
  useEffect,
  useState,
} from "react";

import axios from "axios";
import MainLayout from "../layouts/MainLayout";

import AdminAnalytics from "../components/AdminAnalytics";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

function AdminCenter() {
  const [governmentUsers, setGovernmentUsers] =
    useState([]);

  const [loadingUsers, setLoadingUsers] =
    useState(true);

  const [actionUserId, setActionUserId] =
    useState(null);

  const getAuthHeaders = () => ({
    Authorization:
      `Bearer ${localStorage.getItem(
        "token"
      )}`,
  });

  const fetchGovernmentUsers =
    async () => {
      try {
        setLoadingUsers(true);

        const res =
          await axios.get(
            `${API_BASE}/api/government-users`,
            {
              headers:
                getAuthHeaders(),
            }
          );

        setGovernmentUsers(
          Array.isArray(res.data)
            ? res.data
            : res.data?.users || []
        );
      } catch (error) {
        console.log(
          "Government users error:",
          error
        );
      } finally {
        setLoadingUsers(false);
      }
    };

  useEffect(() => {
    fetchGovernmentUsers();
  }, []);

  const approveUser =
    async (id) => {
      try {
        setActionUserId(id);

        await axios.put(
          `${API_BASE}/api/government-users/${id}/approve`,
          {},
          {
            headers:
              getAuthHeaders(),
          }
        );

        await fetchGovernmentUsers();
      } catch (error) {
        console.log(
          "Approve user error:",
          error
        );
      } finally {
        setActionUserId(null);
      }
    };

  const rejectUser =
    async (id) => {
      try {
        setActionUserId(id);

        await axios.put(
          `${API_BASE}/api/government-users/${id}/reject`,
          {},
          {
            headers:
              getAuthHeaders(),
          }
        );

        await fetchGovernmentUsers();
      } catch (error) {
        console.log(
          "Reject user error:",
          error
        );
      } finally {
        setActionUserId(null);
      }
    };

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
          <div>
            <h1
              style={{
                margin: 0,
              }}
            >
              Admin Center
            </h1>

            

            <p
              style={{
                color:
                  "rgba(255,255,255,.84)",
                maxWidth: "720px",
                lineHeight: "1.6",
                marginBottom: 0,
                fontSize: "14px",
              }}
            >
              Manage government verification
              requests and review the existing
              platform administration analytics.
            </p>
          </div>

          <div
            style={{
              background: "#A855F7",
              color: "#FFFFFF",
              padding: "10px 18px",
              borderRadius: "25px",
              fontWeight: "700",
              whiteSpace: "nowrap",
              boxShadow:
                "0 8px 22px rgba(168,85,247,.20)",
            }}
          >
            🟣 ADMIN
          </div>
        </div>

        {/* ADMIN ANALYTICS */}

        <div
          className="section-card"
          style={{
            marginBottom: "25px",
            padding: "24px",
          }}
        >
          

          <AdminAnalytics />
        </div>

        {/* GOVERNMENT VERIFICATION */}

        <div
          className="section-card"
          style={{
            marginBottom: "25px",
          }}
        >
          <div
        style={{
          height: "520px",
          overflowY: "auto",
          paddingRight:
            "10px",
          scrollbarGutter:
            "stable",
        }}
      >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "20px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                }}
              >
                🛡️ Government Verification
              </h2>

              <p
                style={{
                  color:
                    "var(--text-muted)",
                  marginTop: "6px",
                  marginBottom: 0,
                  lineHeight: "1.5",
                }}
              >
                Review submitted government
                accounts and manage their
                verification status.
              </p>
            </div>

            <div
              style={{
                background:
                  "var(--app-surface-2)",
                border:
                  "1px solid var(--border)",
                color:
                  "var(--accent)",
                padding: "9px 16px",
                borderRadius: "20px",
                fontWeight: "700",
                whiteSpace: "nowrap",
              }}
            >
              {governmentUsers.length} REQUESTS
            </div>
          </div>

          {/* Loading */}

          {loadingUsers && (
            <div
              style={{
                textAlign: "center",
                padding: "50px 20px",
                color:
                  "var(--text-muted)",
                background:
                  "var(--app-surface-2)",
                border:
                  "1px dashed var(--border)",
                borderRadius: "15px",
              }}
            >
              Loading verification requests...
            </div>
          )}

          {/* Empty State */}

          {!loadingUsers &&
            governmentUsers.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "50px 20px",
                  background:
                    "var(--app-surface-2)",
                  borderRadius: "15px",
                  color:
                    "var(--text-muted)",
                  border:
                    "1px dashed var(--border)",
                }}
              >
                No government verification
                requests found.
              </div>
            )}

          {/* User Requests */}

          {!loadingUsers &&
            governmentUsers.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gap: "15px",
                }}
              >
                {governmentUsers.map(
                  (user) => {
                    const isProcessing =
                      actionUserId ===
                      user._id;

                    const status = (
                      user.verificationStatus ||
                      "pending"
                    ).toLowerCase();

                    const statusColor =
                      status === "approved"
                        ? "#22C55E"
                        : status === "rejected"
                        ? "#EF4444"
                        : "#F59E0B";

                    return (
                      <div
                        key={user._id}
                        style={{
                          background:
                            "var(--app-surface-2)",
                          border:
                            "1px solid var(--border)",
                          borderRadius:
                            "16px",
                          padding: "20px",
                          color:
                            "var(--text-primary)",
                          boxShadow:
                            "0 10px 28px rgba(15,23,42,.05)",
                          transition:
                            "transform .25s ease, border-color .25s ease, box-shadow .25s ease",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "flex-start",
                            gap: "20px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <h3
                              style={{
                                margin: 0,
                                color:
                                  "var(--text-primary)",
                              }}
                            >
                              {user.name}
                            </h3>

                            <p
                              style={{
                                marginTop: "6px",
                                marginBottom: 0,
                                color:
                                  "var(--text-muted)",
                                fontSize: "13px",
                              }}
                            >
                              {user.email}
                            </p>
                          </div>

                          <span
                            style={{
                              color:
                                statusColor,
                              background:
                                `${statusColor}14`,
                              border:
                                `1px solid ${statusColor}55`,
                              padding:
                                "6px 12px",
                              borderRadius:
                                "20px",
                              fontSize:
                                "12px",
                              fontWeight:
                                "800",
                              textTransform:
                                "uppercase",
                            }}
                          >
                            {status}
                          </span>
                        </div>

                        <div
                          style={{
                            marginTop:
                              "15px",
                            padding:
                              "12px 14px",
                            borderRadius:
                              "12px",
                            background:
                              "var(--app-surface-3)",
                            border:
                              "1px solid var(--border)",
                            boxShadow:
                              "inset 0 1px 0 rgba(255,255,255,.03)",
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              color:
                                "var(--text-secondary)",
                              lineHeight:
                                "1.5",
                            }}
                          >
                            <strong
                              style={{
                                color:
                                  "var(--text-primary)",
                              }}
                            >
                              Government ID:
                            </strong>{" "}
                            {user.governmentProof ||
                              "Not provided"}
                          </p>
                        </div>

                        <div
                          style={{
                            display:
                              "flex",
                            gap: "10px",
                            marginTop:
                              "18px",
                            flexWrap:
                              "wrap",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              approveUser(
                                user._id
                              )
                            }
                            disabled={
                              isProcessing ||
                              status ===
                                "approved"
                            }
                            style={{
                              background:
                                "#16A34A",
                              color:
                                "#FFFFFF",
                              border:
                                "none",
                              padding:
                                "10px 16px",
                              borderRadius:
                                "9px",
                              cursor:
                                isProcessing ||
                                status ===
                                  "approved"
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                isProcessing ||
                                status ===
                                  "approved"
                                  ? 0.6
                                  : 1,
                              fontWeight:
                                "700",
                            }}
                          >
                            {isProcessing
                              ? "Processing..."
                              : "✅ Approve"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              rejectUser(
                                user._id
                              )
                            }
                            disabled={
                              isProcessing ||
                              status ===
                                "rejected"
                            }
                            style={{
                              background:
                                "#DC2626",
                              color:
                                "#FFFFFF",
                              border:
                                "none",
                              padding:
                                "10px 16px",
                              borderRadius:
                                "9px",
                              cursor:
                                isProcessing ||
                                status ===
                                  "rejected"
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                isProcessing ||
                                status ===
                                  "rejected"
                                  ? 0.6
                                  : 1,
                              fontWeight:
                                "700",
                            }}
                          >
                            {isProcessing
                              ? "Processing..."
                              : "❌ Reject"}
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
        </div>
      </div>
      </div>
    </MainLayout>
  );
}

export default AdminCenter;