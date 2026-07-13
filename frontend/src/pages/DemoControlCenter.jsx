import MainLayout from "../layouts/MainLayout";
import axios from "axios";

function DemoControlCenter() {

  const simulateTraffic = async () => {
    try {

      await axios.post(
        "http://localhost:5000/api/live-update",
        {
          vehicleCount: 25,
          congestion: "HIGH",
          recommendation:
            "Deploy Traffic Officers",
        }
      );

      alert(
        "🚗 Traffic Simulation Started"
      );

    } catch (error) {
      console.log(error);
    }
  };

  const simulateIncident = async () => {

  try {

    await axios.post(
      "http://localhost:5000/api/live-update",
      {
        vehicleCount: 35,
        congestion: "HIGH",
        recommendation:
          "Possible Accident Detected",
      }
    );

    alert(
      "🚨 Incident Simulation Started"
    );

  } catch (error) {
    console.log(error);
  }

};

 const simulateEmergency = async () => {

  try {

    await axios.post(
      "http://localhost:5000/api/live-update",
      {
        vehicleCount: 20,
        congestion: "MEDIUM",
        recommendation:
          "Green Corridor Activated",

        emergencyDetected: true,
      }
    );

    alert(
      "🚑 Emergency Simulation Started"
    );

  } catch (error) {
    console.log(error);
  }
};

  const resetDemo = async () => {
  try {

    await axios.post(
      "http://localhost:5000/api/live-update",
      {
        vehicleCount: 0,
        congestion: "LOW",
        recommendation:
          "Traffic Flow Normal",
        emergencyDetected: false,
      }
    );

    alert(
      "🔄 Demo Reset Complete"
    );

    window.location.reload();

  } catch (error) {
    console.log(error);
  }
};

  return (
    <MainLayout>

      <div className="hero-header">

  <div>

    <h1>
      🎬 Demo Control Center
    </h1>

    <p
      style={{
        color: "#94a3b8",
        fontSize: "18px",
        fontWeight: "600",
      }}
    >
      Smart City Simulation Engine
    </p>

    <p
      style={{
        color: "#cbd5e1",
      }}
    >
      Demonstrate traffic congestion,
      emergency response,
      accident scenarios and
      AI decision making.
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
    🟢 Demo Ready
  </div>

</div>

<div className="cards">

  <div className="card">
    <h3>🤖 AI Status</h3>
    <h2>ONLINE</h2>
  </div>

  <div className="card">
    <h3>🚦 Traffic Network</h3>
    <h2>ACTIVE</h2>
  </div>

  <div className="card">
    <h3>🚑 Emergency System</h3>
    <h2>READY</h2>
  </div>

  <div className="card">
    <h3>🎬 Demo Mode</h3>
    <h2>ENABLED</h2>
  </div>

</div>



      <div className="cards">

        <div className="card">
          <h2>
            🚗 Simulate Traffic
          </h2>

          <p>
            Create high traffic congestion.
          </p>

          <button
            onClick={simulateTraffic}
          >
            Run Demo
          </button>
        </div>

        <div className="card">
          <h2>
            🚨 Simulate Incident
          </h2>

          <p>
            Create AI traffic incident.
          </p>

          <button
            onClick={simulateIncident}
          >
            Run Demo
          </button>
        </div>

        <div className="card">
          <h2>
            🚑 Simulate Emergency
          </h2>

          <p>
            Activate emergency response.
          </p>

          <button
            onClick={simulateEmergency}
          >
            Run Demo
          </button>
        </div>

        <div className="card">
          <h2>
            🔄 Reset Demo
          </h2>

          <p>
            Reset all demo values.
          </p>

          <button
            onClick={resetDemo}
          >
            Reset
          </button>
        </div>

      </div>

      <div
  className="section-card"
  style={{
    marginTop: "20px",
  }}
>
  <h2>
    🎤 Judge Demo Flow
  </h2>

  <p>1. Simulate Heavy Traffic</p>

  <p>2. Observe AI Detection</p>

  <p>3. Trigger Emergency Response</p>

  <p>4. Review Traffic Intelligence</p>

  <p>5. Reset Demo</p>

</div>

    </MainLayout>
  );
}

export default DemoControlCenter;