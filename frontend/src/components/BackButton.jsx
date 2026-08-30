import {
  FaArrowLeft,
} from "react-icons/fa";

import {
  useNavigate,
} from "react-router-dom";

function BackButton() {
  const navigate =
    useNavigate();

  return (
    <button
      type="button"
      onClick={() =>
        navigate(-1)
      }
      style={{
        display: "inline-flex",
        alignItems:
          "center",
        justifyContent:
          "center",
        gap: "8px",

        background:
          "var(--app-surface)",
        color:
          "var(--text-primary)",

        border:
          "1px solid var(--border)",

        borderRadius:
          "10px",

        padding:
          "10px 16px",

        cursor:
          "pointer",

        marginBottom:
          "20px",

        fontWeight:
          "700",

        boxShadow:
          "0 6px 18px rgba(15,23,42,.08)",

        transition:
          "background .25s ease, color .25s ease, border-color .25s ease, transform .25s ease, box-shadow .25s ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.background =
          "var(--accent-soft)";
        event.currentTarget.style.borderColor =
          "var(--accent)";
        event.currentTarget.style.transform =
          "translateX(-2px)";
        event.currentTarget.style.boxShadow =
          "0 8px 22px rgba(37,99,235,.12)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background =
          "var(--app-surface)";
        event.currentTarget.style.borderColor =
          "var(--border)";
        event.currentTarget.style.transform =
          "translateX(0)";
        event.currentTarget.style.boxShadow =
          "0 6px 18px rgba(15,23,42,.08)";
      }}
    >
      <FaArrowLeft
        size={13}
      />
      Back
    </button>
  );
}

export default BackButton;