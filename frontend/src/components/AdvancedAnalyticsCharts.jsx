import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const vehicleData = [
  { day: "Mon", vehicles: 1200 },
  { day: "Tue", vehicles: 1500 },
  { day: "Wed", vehicles: 1800 },
  { day: "Thu", vehicles: 1700 },
  { day: "Fri", vehicles: 2200 },
  { day: "Sat", vehicles: 2600 },
  { day: "Sun", vehicles: 2100 },
];

const incidentData = [
  { day: "Mon", incidents: 12 },
  { day: "Tue", incidents: 15 },
  { day: "Wed", incidents: 8 },
  { day: "Thu", incidents: 18 },
  { day: "Fri", incidents: 22 },
  { day: "Sat", incidents: 14 },
  { day: "Sun", incidents: 10 },
];

function AdvancedAnalyticsCharts() {
  return (
    <>
      <div className="section-card">
        <h2
  style={{
    marginBottom: "10px",
    fontSize: "24px",
    fontWeight: "700",
  }}
>
  Vehicle Trend Analysis
</h2>

<p
  style={{
    color: "#94a3b8",
    marginBottom: "20px",
  }}
>
  Weekly vehicle flow across monitored roads.
</p>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={vehicleData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="vehicles"
              stroke="#3b82f6"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="section-card">
        <h2
  style={{
    marginBottom: "10px",
    fontSize: "24px",
    fontWeight: "700",
  }}
>
  Incident Trend Analysis
</h2>

<p
  style={{
    color: "#94a3b8",
    marginBottom: "20px",
  }}
>
  Weekly incident distribution and severity trends.
</p>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={incidentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="incidents"
              fill="#ef4444"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

export default AdvancedAnalyticsCharts;