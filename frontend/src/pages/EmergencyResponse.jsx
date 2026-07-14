import BackButton from "../components/BackButton";
import Select from "react-select";
import axios from "axios";
import TrafficMap from "../components/TrafficMap";
import { useState } from "react";
import MainLayout from "../layouts/MainLayout";







function EmergencyResponse() {

  
  const [emergencyType, setEmergencyType] =
    useState("Ambulance");

  const [start, setStart] = useState("");
  const [destination, setDestination] =
    useState("");

  const [result, setResult] =
    useState("");

    const [showMap, setShowMap] =
  useState(false);

  const [startCoords, setStartCoords] =
  useState(null);

const [endCoords, setEndCoords] =
  useState(null);

  const [routeGeometry, setRouteGeometry] =
useState([]);

  const [nearbyServices, setNearbyServices] =
  useState([]);

  const API_KEY =
  "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImUyNzBlNDU4YjU4MTQwMWJhNmRkZTFjZmUxODgwMjJmIiwiaCI6Im11cm11cjY0In0=";

 const getCoordinates = async (place) => {
  const response = await axios.get(
    "https://api.openrouteservice.org/geocode/search",
    {
      params: {
        api_key: API_KEY,
        text: place,
        size: 1,
      },
    }
  );

  const features = response.data.features;

  if (!features || features.length === 0) {
    throw new Error("Location not found");
  }

  return features[0].geometry.coordinates;
};

 const generateResponse = async () => {
  setShowMap(true);

  try {
    let priority = "HIGH";

    if (emergencyType === "Ambulance") {
      priority = "CRITICAL";
    }

   const startCoordinate =
  await getCoordinates(start);

  console.log(
  "START:",
  startCoordinate
);

setStartCoords(startCoordinate);

      const longitude =
  startCoordinate[0];

const latitude =
  startCoordinate[1];

let emergencyTypeTag = "hospital";

if (emergencyType === "Police Vehicle") {
  emergencyTypeTag = "police";
}

if (emergencyType === "Fire Truck") {
  emergencyTypeTag = "fire_station";
}



try {
  const nearbyRes = await axios.post(
    "https://trafficmind-ai.onrender.com/api/nearby-services",
    {
      latitude,
      longitude,
      emergencyTypeTag,
    }
  );

  setNearbyServices(
    nearbyRes.data.elements.slice(0, 5)
  );

} catch (error) {
  console.log("Nearby services not available");

  setNearbyServices([]);
}

  const endCoordinate =
  await getCoordinates(destination);

  console.log(
  "END:",
  endCoordinate
);

setEndCoords(endCoordinate);

 const routeRes = await axios.get(
`https://router.project-osrm.org/route/v1/driving/${startCoordinate[0]},${startCoordinate[1]};${endCoordinate[0]},${endCoordinate[1]}?overview=full&geometries=geojson`
);

   const route =
  routeRes.data.routes[0];

  setRouteGeometry(
route.geometry.coordinates.map(
([lng, lat]) => [lat, lng]
)
);
    const distance =
(
  route.distance / 1000
).toFixed(2);

    const duration =
(
  route.duration / 60
).toFixed(0);
    let trafficStatus = "Low";

    if (duration > 60) {
      trafficStatus = "High";
    } else if (duration > 30) {
      trafficStatus = "Medium";
    }

    setResult(`
🚨 Emergency Route Generated

Vehicle: ${emergencyType}

From: ${start}

To: ${destination}

Priority: ${priority}

📏 Distance: ${distance} km

⏱️ Estimated Time: ${duration} mins

🚦 Traffic Status: ${trafficStatus}

AI Recommendation:
Activate Green Corridor

Status:
Emergency Corridor Active
`);


  } catch (error) {
    console.log(error);

    setResult(`
❌ Route Generation Failed

Try locations like:

MG Road
Whitefield
Hebbal
Silk Board
Electronic City
Airport
`);
  }
};

  return (
    <MainLayout>
      <BackButton />
      <h1
  style={{
    textAlign: "center",
    marginBottom: "30px",
    fontSize: "42px",
  }}
>
  🚨 Emergency Response System
</h1>

      {/* Stats Cards */}

      <div
        className="cards"
        style={{
          marginTop: "20px",
          marginBottom: "20px",
        }}
      >
        <div className="card">
          <h3>🚑 Ambulance Requests</h3>
          <h2>12</h2>
        </div>

        <div className="card">
          <h3>🚒 Fire Emergencies</h3>
          <h2>5</h2>
        </div>

        <div className="card">
          <h3>🚓 Police Requests</h3>
          <h2>8</h2>
        </div>
      </div>

      {/* Form */}

      <div
        className="section-card"
        style={{
          padding: "20px",
        }}
      >
        <h2>
          Emergency Route Generator
        </h2>

        <br />

        <label>
          Emergency Vehicle
        </label>

        <br />

        <select
          value={emergencyType}
          onChange={(e) =>
            setEmergencyType(
              e.target.value
            )
          }
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "10px",
          }}
        >
          <option>
            Ambulance
          </option>

          <option>
            Fire Truck
          </option>

          <option>
            Police Vehicle
          </option>
        </select>

        <br />
        <br />

     <input
  type="text"
  placeholder="Enter Start Location"
  value={start}
  onChange={(e) => setStart(e.target.value)}
  style={{
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #334155",
    background: "#0F172A",
    color: "white",
  }}
/>

        <br />
        <br />

     <input
  type="text"
  placeholder="Enter Destination"
  value={destination}
  onChange={(e) => setDestination(e.target.value)}
  style={{
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #334155",
    background: "#0F172A",
    color: "white",
  }}
/>
        <br />
        <br />

        <button
          onClick={generateResponse}
          style={{
            background: "#dc2626",
            color: "white",
            border: "none",
            padding: "12px 20px",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          🚨 Activate Emergency Route
        </button>

        {result && (
          <div
            style={{
              marginTop: "25px",
              background: "#0f172a",
              padding: "20px",
              borderRadius: "15px",
            }}
          >
            <div
  style={{
    color: "white",
    lineHeight: "2",
    fontSize: "18px",
  }}
>
  <pre
    style={{
      whiteSpace: "pre-wrap",
      fontFamily: "inherit",
    }}
  >
    {result}
  </pre>
</div>
          </div>
        )}

        {nearbyServices.length > 0 && (
  <div
    style={{
      marginTop: "20px",
      background: "#0f172a",
      padding: "20px",
      borderRadius: "15px",
      color: "white",
    }}
  >
    <h3>🏥 Nearby Emergency Services</h3>

    {nearbyServices.map(
      (service, index) => (
        <div
          key={index}
          style={{
            marginBottom: "10px",
          }}
        >
          {service.tags?.name ||
            "Unnamed Service"}
        </div>
      )
    )}
  </div>
)}

        {showMap && (
  <div
    className="section-card"
    style={{
      marginTop: "20px",
    }}
  >
    <h2>🗺️ Emergency Route Map</h2>

    <TrafficMap
  startCoords={startCoords}
  endCoords={endCoords}
  nearbyServices={nearbyServices}
  routeGeometry={routeGeometry}
/>
  </div>
)}
      </div>
    </MainLayout>
  );
}

export default EmergencyResponse;