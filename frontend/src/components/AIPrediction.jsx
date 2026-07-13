import AICommandCenter from "./AICommandCenter";
import axios from "axios";
import { useState } from "react";

function AIPrediction() {
  const [area, setArea] = useState("");
  const [vehicles, setVehicles] = useState("");
  const [time, setTime] = useState("");
  const [weather, setWeather] = useState("");
  const [result, setResult] = useState("");
  const [risk, setRisk] = useState("");

  const predictTraffic = async () => {
    try {
      const hour = Number(time.split(":")[0]);

      const aiRes = await axios.post(
        "http://localhost:5000/api/ai-predict",
        {
          vehicles: Number(vehicles),
          time: hour,
          weather,
        }
      );

      const predictedRisk = aiRes.data.risk;

      setRisk(predictedRisk);

      setResult(`
Risk: ${predictedRisk}

Area: ${area}

Weather: ${weather}
      `);

      await axios.post(
        "http://localhost:5000/api/predictions",
        {
          area,
          vehicleCount: Number(vehicles),
          time,
          weather,
          risk: predictedRisk,
        }
      );
    } catch (error) {
      console.log(error);
      setResult("AI Prediction Failed");
    }
  };

  return (
    <div
      style={{
        background: "#1e293b",
        padding: "20px",
        borderRadius: "15px",
        color: "white",
      }}
    >
      <h2>🤖 AI Traffic Prediction</h2>

      <input
        type="text"
        placeholder="Area"
        value={area}
        onChange={(e) => setArea(e.target.value)}
      />

      <br />
      <br />

      <input
        type="number"
        placeholder="Vehicle Count"
        value={vehicles}
        onChange={(e) => setVehicles(e.target.value)}
      />

      <br />
      <br />

      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
      />

      <br />
      <br />

      <select
        value={weather}
        onChange={(e) => setWeather(e.target.value)}
      >
        <option value="">
          Select Weather
        </option>

        <option value="Sunny">
          Sunny
        </option>

        <option value="Clouds">
          Clouds
        </option>

        <option value="Rain">
          Rain
        </option>
      </select>

      <br />
      <br />

      <button
        onClick={predictTraffic}
      >
        Predict
      </button>

      <pre
        style={{
          whiteSpace: "pre-wrap",
          marginTop: "20px",
        }}
      >
        {result}
      </pre>

      <AICommandCenter risk={risk} />
    </div>
  );
}

export default AIPrediction;