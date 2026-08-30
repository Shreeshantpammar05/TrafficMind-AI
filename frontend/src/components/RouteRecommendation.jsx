import axios from "axios";
import { useState } from "react";

function RouteRecommendation() {
  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");
  const [result, setResult] = useState("");

  const getCoordinates = async (place) => {
    const res = await axios.get(
      "http://localhost:5000/api/routes/geocode",
      {
        params: {
          text: `${place}, Bangalore, Karnataka, India`,
        },
      }
    );

    if (
      !res.data.features ||
      res.data.features.length === 0
    ) {
      throw new Error("Location not found");
    }

    return res.data.features[0]
      .geometry.coordinates;
  };

  const findRoute = async () => {
    try {
      if (!start || !destination) {
        setResult(
          "Please enter both start and destination."
        );
        return;
      }

      setResult("Generating Route...");

      const startCoords =
        await getCoordinates(start);

      const endCoords =
        await getCoordinates(destination);

      const routeRes = await axios.post(
        "http://localhost:5000/api/routes/directions",
        {
          start: startCoords,
          end: endCoords,
        }
      );

      const route = routeRes.data.route;

      if (!route) {
        throw new Error("Route not found");
      }

      const summary = route.summary;

      const distance =
        (summary.distance / 1000).toFixed(2);

      const duration =
        (summary.duration / 60).toFixed(0);

      let trafficStatus = "Low";

      if (duration > 60) {
        trafficStatus = "High";
      } else if (duration > 30) {
        trafficStatus = "Medium";
      }

      setResult(`
Route Generated Successfully

From: ${start}

To: ${destination}

Distance: ${distance} km

Estimated Time: ${duration} mins

Traffic Status: ${trafficStatus}
`);
    } catch (error) {
      console.log(
        "Route Error:",
        error.response?.data || error.message
      );

      setResult(`
Route Generation Failed

Try locations like:

MG Road
Whitefield
Hebbal
Silk Board
Electronic City
KR Puram
Airport
`);
    }
  };

  return (
    <div>
      <h2>
        Smart Route Intelligence
      </h2>

      <input
        type="text"
        placeholder="Start Location"
        value={start}
        onChange={(e) =>
          setStart(e.target.value)
        }
      />

      <br />
      <br />

      <input
        type="text"
        placeholder="Destination"
        value={destination}
        onChange={(e) =>
          setDestination(e.target.value)
        }
      />

      <br />
      <br />

      <button onClick={findRoute}>
        Generate Route
      </button>

      <pre
        style={{
          whiteSpace: "pre-wrap",
          marginTop: "20px",
        }}
      >
        {result}
      </pre>
    </div>
  );
}

export default RouteRecommendation;