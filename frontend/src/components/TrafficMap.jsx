import socket from "../socket";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

function FitRoute({ routeGeometry }) {
  const map = useMap();

  useEffect(() => {
    if (routeGeometry && routeGeometry.length > 0) {
      map.fitBounds(routeGeometry, {
        padding: [50, 50],
      });
    }
  }, [routeGeometry, map]);

  return null;
}

function FollowAmbulance({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom(), {
        duration: 0.8,
      });
    }
  }, [position, map]);

  return null;
}

function TrafficMap({
  startCoords,
  endCoords,
  nearbyServices,
  routeGeometry,
}) {
  const [zones, setZones] = useState([]);
  const [vehicles, setVehicles] =
  useState([]);

const [ambulance, setAmbulance] =
  useState(null);

  const [animatedPosition, setAnimatedPosition] =
  useState(null);

  useEffect(() => {
    fetchZones();
  }, []);

  useEffect(() => {

  socket.on(
    "digitalTwinUpdate",
    (data) => {

      setVehicles(
        data.vehicles
      );

      setAmbulance(
        data.ambulance
      );
    }
  );

  return () => {
    socket.off(
      "digitalTwinUpdate"
    );
  };

}, []);

useEffect(() => {
  if (!routeGeometry || routeGeometry.length === 0) return;

  let index = 0;

  const interval = setInterval(() => {
    if (index >= routeGeometry.length) {
      clearInterval(interval);
      return;
    }

    setAnimatedPosition(routeGeometry[index]);

    index++;
  }, 150);

  return () => clearInterval(interval);

}, [routeGeometry]);

  const fetchZones = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/map-zones"
      );

      setZones(res.data.incidents);
    } catch (error) {
      console.log(error);
    }
  };

  const locationCoordinates = {
    "Silk Board": [12.9177, 77.6238],
    Hebbal: [13.0358, 77.5970],
    "KR Puram": [13.0167, 77.6964],
    "Electronic City": [12.8456, 77.6603],
    Whitefield: [12.9698, 77.7499],
  };

  const smartSignals = [
  {
    id: 1,
    position: [12.9850, 77.6050],
    status: "GREEN",
  },
  {
    id: 2,
    position: [12.9650, 77.5850],
    status: "RED",
  },
];

const incidents = [
  {
    id: 1,
    position: [12.9550, 77.6150],
    severity: "HIGH",
  },
];


  return (
    <div
      style={{
        marginTop: "30px",
        borderRadius: "15px",
        overflow: "hidden",
      }}
    >
      <h2>🗺️ Traffic Map</h2>

      <MapContainer
        center={[12.9716, 77.5946]}
        zoom={11}
        style={{
          height: "60vh",
          width: "100%",
        }}
      >
        {vehicles.map((vehicle) => (
  <Marker
    key={vehicle.id}
    position={[
      vehicle.lat,
      vehicle.lng,
    ]}
  >
    <Popup>
      🚗 Live Vehicle
    </Popup>
  </Marker>
))}

{smartSignals.map((signal) => (
  <Marker
    key={signal.id}
    position={signal.position}
  >
    <Popup>
      🚦 Smart Signal
      <br />
      Status: {signal.status}
    </Popup>
  </Marker>
))}

{ambulance && (
  <Marker
    position={[
      ambulance.lat,
      ambulance.lng,
    ]}
  >
    <Popup>
      🚑 Live Ambulance
    </Popup>
  </Marker>
)}

{incidents.map((incident) => (
  <Marker
    key={incident.id}
    position={incident.position}
  >
    <Popup>
      🚨 Accident Alert
      <br />
      Severity:
      {incident.severity}
    </Popup>
  </Marker>
))}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {animatedPosition && (
  <FollowAmbulance
    position={animatedPosition}
  />
)}

        {routeGeometry &&
  routeGeometry.length > 0 && (
    <FitRoute routeGeometry={routeGeometry} />
)}

        {/* Default Traffic Zones */}

        <Marker position={[12.9177, 77.6238]}>
          <Popup>
            🔴 Silk Board - High Traffic
          </Popup>
        </Marker>

        <Marker position={[13.0358, 77.5970]}>
          <Popup>
            🟡 Hebbal - Medium Traffic
          </Popup>
        </Marker>

        <Marker position={[13.0167, 77.6964]}>
          <Popup>
            🟢 KR Puram - Low Traffic
          </Popup>
        </Marker>

        <Marker position={[12.8456, 77.6603]}>
          <Popup>
            🔴 Electronic City - High Traffic
          </Popup>
        </Marker>

        <Marker position={[12.9698, 77.7499]}>
          <Popup>
            🟡 Whitefield - Medium Traffic
          </Popup>
        </Marker>

        {/* Dynamic Markers from MongoDB */}

        {zones.map((zone) => {
          const coordinates =
            locationCoordinates[zone.location];

          if (!coordinates) return null;

          return (
            <Marker
              key={zone._id}
              position={coordinates}
            >
              <Popup>
                <strong>{zone.location}</strong>
                <br />
                Severity: {zone.severity}
                <br />
                Type: {zone.incidentType}
              </Popup>
            </Marker>
          );
        })}

        {startCoords && endCoords && (
  <>
   {animatedPosition ? (
  <Marker position={animatedPosition}>
    <Popup>
      🚑 Ambulance
    </Popup>
  </Marker>
) : (
  <Marker
    position={[
      startCoords[1],
      startCoords[0],
    ]}
  >
    <Popup>
      🚑 Start Location
    </Popup>
  </Marker>
)}

    <Marker
      position={[
        endCoords[1],
        endCoords[0],
      ]}
    >
      <Popup>
        🎯 Destination
      </Popup>
    </Marker>

   {routeGeometry &&
  routeGeometry.length > 0 && (
    <Polyline
      positions={routeGeometry}
      pathOptions={{
        color: "#22C55E",
        weight: 7,
        opacity: 0.9,
      }}
    />
)}
  </>
)}

{nearbyServices &&
  nearbyServices.map(
    (service, index) => {
      if (
        !service.lat ||
        !service.lon
      )
        return null;

      return (
        <Marker
          key={`service-${index}`}
          position={[
            service.lat,
            service.lon,
          ]}
        >
          <Popup>
            {service.tags?.name ||
              "Emergency Service"}
          </Popup>
        </Marker>
      );
    }
  )}

        
      </MapContainer>
    </div>
  );
}

export default TrafficMap;