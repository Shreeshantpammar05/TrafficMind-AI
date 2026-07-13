import AICommandCenter from "../components/AICommandCenter";
import EmergencyAlerts from "../components/EmergencyAlerts";
import WeatherWidget from "../components/WeatherWidget";
import CriticalZones from "../components/CriticalZones";

function CommandCenter() {
  return (
    <>
      <h1>🚦 Command Center</h1>

      <AICommandCenter />

      <div className="dashboard-grid">
        <div className="section-card">
          <EmergencyAlerts />
        </div>

        <div className="section-card">
          <WeatherWidget />
        </div>
      </div>

      <div className="full-width">
        <div className="section-card">
          <CriticalZones />
        </div>
      </div>
    </>
  );
}

export default CommandCenter;