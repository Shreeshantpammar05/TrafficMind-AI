import { Navigate } from "react-router-dom";

function PendingGovernmentAccess() {
  const verificationStatus =
    localStorage.getItem(
      "verificationStatus"
    ) || "pending";

  const isRejected =
    verificationStatus ===
    "rejected";

  return (
    <div
      style={{
        minHeight:
          "100vh",
        display:
          "flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        padding:
          "30px",
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
          width:
            "min(560px, 100%)",
          background:
            "var(--app-surface)",
          border:
            "1px solid var(--border)",
          borderRadius:
            "20px",
          padding:
            "35px",
          boxShadow:
            "var(--shadow)",
          textAlign:
            "center",
        }}
      >
        <div
          style={{
            fontSize:
              "48px",
            marginBottom:
              "15px",
          }}
        >
          {isRejected
            ? "❌"
            : "⏳"}
        </div>

        <h1
          style={{
            margin:
              "0 0 10px",
            color:
              "var(--text-primary)",
          }}
        >
          {isRejected
            ? "Application Rejected"
            : "Application Pending"}
        </h1>

        <p
          style={{
            color:
              "var(--text-secondary)",
            lineHeight:
              "1.6",
            margin:
              "0 auto",
            maxWidth:
              "460px",
          }}
        >
          {isRejected
            ? "Your government officer application was rejected by the administrator. Please contact the administrator for further information."
            : "Your government officer application has been submitted successfully and is waiting for administrator approval."}
        </p>

        {!isRejected && (
          <div
            style={{
              marginTop:
                "20px",
              padding:
                "14px",
              background:
                "var(--accent-soft)",
              border:
                "1px solid var(--border)",
              borderRadius:
                "12px",
              color:
                "var(--text-secondary)",
              fontSize:
                "13px",
              lineHeight:
                "1.5",
            }}
          >
            Government features will become
            available after the administrator
            approves your application.
          </div>
        )}
      </div>
    </div>
  );
}

function ProtectedRoute({
  children,
}) {
  const token =
    localStorage.getItem(
      "token"
    );

  const role =
    localStorage.getItem(
      "role"
    );

  const verificationStatus =
    localStorage.getItem(
      "verificationStatus"
    );

  if (!token) {
    /*
     * A government user can reach the login/pending
     * flow without having a government access token.
     */
    if (
      role === "government" &&
      verificationStatus !==
        "approved"
    ) {
      return (
        <PendingGovernmentAccess />
      );
    }

    return (
      <Navigate to="/login" />
    );
  }

  /*
   * Government users must be approved.
   */
  if (
    role === "government" &&
    verificationStatus !==
      "approved"
  ) {
    return (
      <PendingGovernmentAccess />
    );
  }

  return children;
}

export default ProtectedRoute;