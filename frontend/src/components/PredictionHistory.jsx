import { useEffect, useState } from "react";
import axios from "axios";

function PredictionHistory() {
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/predictions"
      );

      setPredictions(res.data.predictions);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <h2>🤖 Prediction History</h2>

      {predictions.map((item) => (
        <div
          key={item._id}
          style={{
            background: "#334155",
            padding: "10px",
            marginTop: "10px",
            borderRadius: "10px",
          }}
        >
          <strong>{item.area}</strong>

          <p>Risk: {item.risk}</p>

          <p>Weather: {item.weather}</p>
        </div>
      ))}
    </div>
  );
}

export default PredictionHistory;