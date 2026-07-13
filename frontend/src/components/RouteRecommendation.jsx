import axios from "axios";
import { useState } from "react";

function RouteRecommendation() {
  const API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImUyNzBlNDU4YjU4MTQwMWJhNmRkZTFjZmUxODgwMjJmIiwiaCI6Im11cm11cjY0In0=";

  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");
  const [result, setResult] = useState("");

  const getCoordinates = async (place) => {
    const res = await axios.get(
      "https://api.openrouteservice.org/geocode/search",
      {
        params: {
          api_key: API_KEY,
          text: `${place}, Bangalore, Karnataka, India`,
          size: 1,
        },
      }
    );

    if (!res.data.features.length) {
      throw new Error("Location not found");
    }

    const coords =
      res.data.features[0].geometry.coordinates;

    console.log(
      `${place} Coordinates:`,
      coords
    );

    return coords;
  };

  const findRoute = async () => {
    try {
      setResult("Generating Route...");

      const startCoords =
        await getCoordinates(start);

      const endCoords =
        await getCoordinates(destination);

      console.log("START:", startCoords);
      console.log("END:", endCoords);

      const routeRes = await axios.post(
        "https://api.openrouteservice.org/v2/directions/driving-car/json",
        {
          coordinates: [
            startCoords,
            endCoords,
          ],
        },
        {
          headers: {
            Authorization: API_KEY,
            Accept: "application/json",
            "Content-Type":
              "application/json",
          },
        }
      );

      const summary =
        routeRes.data.routes[0].summary;

      const distance =
        (
          summary.distance / 1000
        ).toFixed(2);

      const duration =
        (
          summary.duration / 60
        ).toFixed(0);

      let trafficStatus = "Low";

      if (duration > 60) {
        trafficStatus = "High";
      } else if (duration > 30) {
        trafficStatus = "Medium";
      }

      setResult(`
🛣️ Route Generated Successfully

📍 From: ${start}

📍 To: ${destination}

📏 Distance: ${distance} km

⏱️ Estimated Time: ${duration} mins

🚦 Traffic Status: ${trafficStatus}
`);
    } catch (error) {
      console.log(
        "FULL ERROR:",
        error
      );

      if (error.response) {
        console.log(
          JSON.stringify(
            error.response.data,
            null,
            2
          )
        );
      }

      setResult(`
❌ Route Generation Failed

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
        🛣️ Smart Route Intelligence
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
          setDestination(
            e.target.value
          )
        }
      />

      <br />
      <br />

      <button
        onClick={findRoute}
      >
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