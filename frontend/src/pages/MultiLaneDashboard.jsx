import { useState, useEffect } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";

function MultiLaneDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData();

    const interval = setInterval(
      fetchData,
      5000
    );

    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/smart-signal/multi-lane"
      );

      setData(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  if (!data) {
    return (
      <MainLayout>
        <h2>Loading Multi-Lane Data...</h2>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <h1
        style={{
          textAlign: "center",
          marginBottom: "30px",
        }}
      >
        🚦 Multi-Lane Smart Signal Dashboard
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(250px,1fr))",
          gap: "20px",
        }}
      >
        <div className="card">
          <h3>⬆ North Lane</h3>
          <h1>{data.lanes.north}</h1>
        </div>

        <div className="card">
          <h3>⬇ South Lane</h3>
          <h1>{data.lanes.south}</h1>
        </div>

        <div className="card">
          <h3>➡ East Lane</h3>
          <h1>{data.lanes.east}</h1>
        </div>

        <div className="card">
          <h3>⬅ West Lane</h3>
          <h1>{data.lanes.west}</h1>
        </div>

        <div className="card">
          <h3>🚦 Priority Lane</h3>
          <h1>{data.priorityLane}</h1>
        </div>
<div className="card">
  <h3>⏱ North Time</h3>
  <h1>{data.greenTime.north}s</h1>
</div>

<div className="card">
  <h3>⏱ South Time</h3>
  <h1>{data.greenTime.south}s</h1>
</div>

<div className="card">
  <h3>⏱ East Time</h3>
  <h1>{data.greenTime.east}s</h1>
</div>

<div className="card">
  <h3>⏱ West Time</h3>
  <h1>{data.greenTime.west}s</h1>
</div>

      </div>
    </MainLayout>
  );
}

export default MultiLaneDashboard;