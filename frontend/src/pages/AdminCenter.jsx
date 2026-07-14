
import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";

import AdminAnalytics from "../components/AdminAnalytics";
import NotificationCenter from "../components/NotificationCenter";
import EmergencyAlerts from "../components/EmergencyAlerts";

function AdminCenter() {
  const [governmentUsers, setGovernmentUsers] = useState([]);

  useEffect(() => {
  fetchGovernmentUsers();
}, []);

const fetchGovernmentUsers = async () => {
  try {
    const res = await axios.get(
      "https://trafficmind-ai.onrender.com/api/government-users"
    );

    setGovernmentUsers(res.data);
  } catch (error) {
    console.log(error);
  }
};

const approveUser = async (id) => {
  try {
    await axios.put(
      `https://trafficmind-ai.onrender.com/api/government-users/${id}/approve`
    );

    fetchGovernmentUsers();
  } catch (error) {
    console.log(error);
  }
};

const rejectUser = async (id) => {
  try {
    await axios.put(
      `https://trafficmind-ai.onrender.com/api/government-users/${id}/reject`
    );

    fetchGovernmentUsers();
  } catch (error) {
    console.log(error);
  }
};

  return (
   <MainLayout>
    

  <div className="hero-header">

    <div>

      <h1>
        🛡 Admin Center
      </h1>

      <p
        style={{
          color: "#94a3b8",
          fontSize: "18px",
          fontWeight: "600",
        }}
      >
        System Administration
      </p>

      <p
        style={{
          color: "#cbd5e1",
        }}
      >
        Monitor platform health,
        emergency notifications,
        analytics, alerts,
        and operational status.
      </p>

    </div>

    <div
      style={{
        background: "#16a34a",
        padding: "10px 18px",
        borderRadius: "25px",
        fontWeight: "bold",
      }}
    >
      🟢 Admin Online
    </div>

  </div>

  <div className="cards">

    <div className="card">
      <h3>👥 Active Users</h3>
      <h2>42</h2>
    </div>

    <div className="card">
      <h3>🚨 Alerts</h3>
      <h2>17</h2>
    </div>

    <div className="card">
      <h3>📊 Analytics</h3>
      <h2>ONLINE</h2>
    </div>

    <div className="card">
      <h3>🖥️ System Health</h3>
      <h2>100%</h2>
    </div>

  </div>

      <div className="dashboard-grid">
        <div className="section-card">
          <AdminAnalytics />
        </div>

      </div>

      <div
  className="section-card"
  style={{ marginTop: "20px" }}
>
  <h2>🏛 Government Verification Requests</h2>

  {governmentUsers.map((user) => (
    <div
      key={user._id}
      style={{
        padding: "15px",
        marginTop: "10px",
        border: "1px solid #334155",
        borderRadius: "10px",
      }}
    >
      <h3>{user.name}</h3>

      <p>Email: {user.email}</p>

      <p>
        Government ID:
        {" "}
        {user.governmentProof}
      </p>

      <p>
        Status:
        {" "}
        {user.verificationStatus}
      </p>

      <div
  style={{
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  }}
>
  <button
    onClick={() => approveUser(user._id)}
  >
    ✅ Approve
  </button>

  <button
    onClick={() => rejectUser(user._id)}
  >
    ❌ Reject
  </button>
</div>

    </div>
  ))}
</div>

      
    </MainLayout>
  );
}

export default AdminCenter;