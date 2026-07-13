import { Navigate } from "react-router-dom";

function GovernmentRoute({ children }) {
  const role = localStorage.getItem("role");

  const verificationStatus =
    localStorage.getItem(
      "verificationStatus"
    );

  if (
  (role !== "government" && role !== "admin") ||
  verificationStatus !== "approved"
) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

export default GovernmentRoute;