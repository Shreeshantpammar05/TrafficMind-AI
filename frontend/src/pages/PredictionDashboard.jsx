import { useState, useEffect } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";

function PredictionDashboard() {

  const [prediction, setPrediction] =
    useState(null);

  useEffect(() => {

    fetchPrediction();

    const interval =
      setInterval(fetchPrediction, 5000);

    return () =>
      clearInterval(interval);

  }, []);

  const fetchPrediction = async () => {

    try {

      const res = await axios.get(
        "http://localhost:5000/api/prediction"
      );

      setPrediction(res.data);

    } catch (error) {

      console.log(error);

    }
  };

  if (!prediction) {

  return (
    <MainLayout>
      <h2
        style={{
          textAlign: "center",
          marginTop: "50px",
        }}
      >
        Loading AI Prediction...
      </h2>
    </MainLayout>
  );
}

  return (
    <MainLayout>

    <div className="hero-header">

  <div>

    <h1>
      🔮 Traffic Prediction Center
    </h1>

    <p
      style={{
        color: "#94a3b8",
        fontSize: "18px",
        fontWeight: "600",
      }}
    >
      AI Forecasting Engine
    </p>

    <p
      style={{
        color: "#cbd5e1",
      }}
    >
      Predict future traffic density,
      congestion risks, and vehicle
      flow using intelligent analytics.
    </p>

  </div>

  <div
    style={{
      background: "#8b5cf6",
      padding: "10px 18px",
      borderRadius: "25px",
      fontWeight: "bold",
    }}
  >
    🔮 Prediction Active
  </div>

</div>
     <div className="cards">

        <div className="card">
          <h3>🚗 Current Vehicles</h3>
          <h2>
            {prediction.currentVehicles}
          </h2>
        </div>

        <div className="card">
          <h3>🔮 Predicted Vehicles</h3>
          <h2>
            {prediction.predictedVehicles}
          </h2>
        </div>

        <div className="card">
          <h3>🚦 Forecast</h3>
          <h2>
            {prediction.forecast}
          </h2>
        </div>

        <div className="card">

  <h3>
    🤖 AI Status
  </h3>

  <h2
    style={{
      color: "#22c55e",
    }}
  >
    ACTIVE
  </h2>

</div>

      </div>

      <div
  className="section-card"
  style={{
    marginTop: "20px",
  }}
>

  <h2>
    🔮 Prediction Analysis
  </h2>

  <p>
    Current Vehicles:
    {" "}
    {prediction.currentVehicles}
  </p>

  <p>
    Predicted Vehicles:
    {" "}
    {prediction.predictedVehicles}
  </p>

  <p>
    Forecast:
    {" "}
    {prediction.forecast}
  </p>

  <p>
    AI Prediction Engine:
    Active
  </p>

</div>

    </MainLayout>
  );
}

export default PredictionDashboard;