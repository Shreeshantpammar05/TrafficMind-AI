import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "#1E293B",
        color: "white",
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: "10px",
        padding: "10px 16px",
        cursor: "pointer",
        marginBottom: "20px",
      }}
    >
      <FaArrowLeft />
      Back
    </button>
  );
}

export default BackButton;