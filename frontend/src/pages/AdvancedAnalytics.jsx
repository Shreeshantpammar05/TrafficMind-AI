import AdvancedAnalyticsCharts from "../components/AdvancedAnalyticsCharts";
import MainLayout from "../layouts/MainLayout";

function AdvancedAnalytics() {
  return (
    <MainLayout>
      <div className="dashboard">

        <div className="hero-header">
          <div>
            <h1>Advanced Analytics</h1>

            <p>
              Real-time traffic intelligence and AI insights
            </p>
          </div>

          <div className="status-badge">
            Analytics Active
          </div>
        </div>

        <div className="cards">

          <div className="card">
            <h3>Total Vehicles</h3>
            <h2>12,450</h2>
          </div>

          <div className="card">
            <h3>Total Incidents</h3>
            <h2>245</h2>
          </div>

          <div className="card">
            <h3>AI Predictions</h3>
            <h2>94%</h2>
          </div>

          <div className="card">
            <h3>Congestion Index</h3>
            <h2>Low</h2>
          </div>


        </div>

        <div className="dashboard-grid">
  <AdvancedAnalyticsCharts />
</div>

      </div>
    </MainLayout>
  );
}

export default AdvancedAnalytics;