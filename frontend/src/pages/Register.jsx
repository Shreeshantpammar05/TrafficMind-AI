import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
 const [formData, setFormData] = useState({
  name: "",
  email: "",
  password: "",
  
  role: "citizen",
  governmentProof: "",
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
      "http://localhost:5000/api/register",
      formData
    );

    alert(res.data.message);

navigate("/login");

    setFormData({
  name: "",
  email: "",
  password: "",
  role: "citizen",
  governmentProof: "",
});
  } catch (error) {
    alert(
      error.response?.data?.message ||
      "Registration Failed"
    );
  }
};

const inputStyle = {
  width: "100%",
  padding: "14px",
  marginBottom: "15px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "#111827",
  color: "white",
  boxSizing: "border-box",
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
        width: "450px",
        background: "rgba(15,23,42,0.9)",
        backdropFilter: "blur(15px)",
        borderRadius: "20px",
        padding: "40px",
        border: "1px solid rgba(59,130,246,0.3)",
        boxShadow:
          "0 20px 50px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1>🚦 TrafficMind AI</h1>

        <p
          style={{
            color: "#94a3b8",
            marginBottom: "30px",
          }}
        >
          Smart City Registration Portal
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          style={inputStyle}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          style={inputStyle}
        />

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="citizen">
            Citizen
          </option>

          <option value="government">
            Government Officer
          </option>
        </select>

        {formData.role === "government" && (
          <input
            type="text"
            name="governmentProof"
            placeholder="Government ID Number"
            value={formData.governmentProof}
            onChange={handleChange}
            style={inputStyle}
          />
        )}

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
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          Register
        </button>
      </form>
    </div>
  </div>
);
}

export default Register;