import { useEffect, useState } from "react";
import axios from "axios";

function NotificationPanel() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(
  "https://trafficmind-ai.onrender.com/api/notifications"
);

const data = await res.json();

console.log(data);

setNotifications(data.notifications);

      setNotifications(res.data.notifications);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "90px",
        right: "20px",
        width: "380px",
        maxHeight: "500px",
        overflowY: "auto",
        background:
          "linear-gradient(145deg,#111827,#1e293b)",
        color: "white",
        borderRadius: "20px",
        padding: "20px",
        border:
          "1px solid rgba(59,130,246,0.35)",
        boxShadow:
          "0 20px 40px rgba(0,0,0,0.4)",
        zIndex: 9999,
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: "20px",
        }}
      >
        🔔 Notifications
      </h2>

      {notifications.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: "#94A3B8",
          }}
        >
          No notifications
        </div>
      ) : (
        notifications.map((item) => (
          <div
            key={item._id}
            style={{
              background: "#1E293B",
              padding: "15px",
              borderRadius: "12px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                fontWeight: "700",
                marginBottom: "6px",
              }}
            >
              {item.title}
            </div>

            <div
              style={{
                color: "#CBD5E1",
                fontSize: "14px",
              }}
            >
              {item.message}
            </div>

            <div
              style={{
                marginTop: "8px",
                fontSize: "12px",
                color: "#64748B",
              }}
            >
              {new Date(item.createdAt).toLocaleString()}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default NotificationPanel;