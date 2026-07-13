import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
   const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "https://trafficmind-ai.onrender.com/api/login",
        formData
      );

     localStorage.setItem("token", res.data.token);
localStorage.setItem("role", res.data.role);
localStorage.setItem(
  "verificationStatus",
  res.data.verificationStatus
);
      alert("Login Successful");
      navigate("/dashboard");
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Login Failed"
      );
    }
  };

 return (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background:
        "linear-gradient(135deg,#020617,#0f172a,#1e293b)",
      color: "white",
      padding: "20px",
    }}
  >
    <div
      style={{
        width: "420px",
        background: "rgba(15,23,42,0.85)",
        backdropFilter: "blur(15px)",
        border: "1px solid rgba(59,130,246,0.3)",
        borderRadius: "20px",
        padding: "40px",
        boxShadow:
          "0 20px 50px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            marginBottom: "5px",
            fontSize: "36px",
          }}
        >
          🚦 TrafficMind AI
        </h1>

        <p
          style={{
            color: "#94a3b8",
            marginBottom: "35px",
          }}
        >
          Smart City Command Center
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label>Email</label>

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter Email"
            style={{
              width: "100%",
              padding: "14px",
              marginTop: "8px",
              borderRadius: "10px",
              border:
                "1px solid rgba(255,255,255,0.1)",
              background: "#111827",
              color: "white",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "25px" }}>
          <label>Password</label>

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter Password"
            style={{
              width: "100%",
              padding: "14px",
              marginTop: "8px",
              borderRadius: "10px",
              border:
                "1px solid rgba(255,255,255,0.1)",
              background: "#111827",
              color: "white",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "14px",
            border: "none",
            borderRadius: "12px",
            background:
              "linear-gradient(135deg,#2563eb,#3b82f6)",
            color: "white",
            fontWeight: "700",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Login
        </button>
      </form>

      <div
        style={{
          marginTop: "25px",
          textAlign: "center",
          color: "#94a3b8",
          fontSize: "13px",
        }}
      >
        AI Monitoring • Traffic Analytics • Emergency Response
      </div>
    </div>
  </div>
);
}

export default Login;