import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import { useEffect, useState } from "react";
import axios from "axios";

function TrafficChart() {
  const [data, setData] = useState([]);

 useEffect(() => {
  fetchChartData();

  const interval = setInterval(() => {
    fetchChartData();
  }, 5000);

  return () => clearInterval(interval);
}, []);

  const fetchChartData = async () => {
    try {
      const res = await axios.get(
        "https://trafficmind-ai.onrender.com/api/incidents"
      );

      const incidents = res.data.incidents;

      const areaCount = {};

      incidents.forEach((item) => {
        const area = item.location || "Unknown";

        areaCount[area] =
          (areaCount[area] || 0) + 1;
      });

      const chartData = Object.keys(areaCount).map(
        (area) => ({
          area,
          incidents: areaCount[area],
        })
      );

      setData(chartData);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div
      style={{
        background: "#1e293b",
        padding: "20px",
        borderRadius: "15px",
        marginTop: "30px",
      }}
    >
      <h2>📊 Traffic Analytics</h2>

      <ResponsiveContainer
        width="100%"
        height={320}
      >
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
          />

          <XAxis dataKey="area" />

          <YAxis />

          <Tooltip />

          <Bar
  dataKey="incidents"
  fill="#2563eb"
  radius={[10, 10, 0, 0]}
/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TrafficChart;