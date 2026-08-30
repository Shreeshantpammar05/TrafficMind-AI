import {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import "./TrafficMap.css";

import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

const NEARBY_RADIUS_KM = Number(
  import.meta.env
    .VITE_TRAFFIC_NEARBY_RADIUS_KM ||
    "5"
);

// =========================================================
// MAP HELPERS
// =========================================================

function FitRoute({
  routeGeometry,
}) {
  const map = useMap();

  useEffect(() => {
    if (
      !Array.isArray(routeGeometry) ||
      routeGeometry.length < 2
    ) {
      return;
    }

    const validPoints =
      routeGeometry.filter(
        (point) =>
          Array.isArray(point) &&
          point.length >= 2 &&
          Number.isFinite(
            Number(point[0])
          ) &&
          Number.isFinite(
            Number(point[1])
          )
      );

    if (validPoints.length < 2) {
      return;
    }

    try {
      map.fitBounds(
        validPoints,
        {
          padding: [50, 50],
        }
      );
    } catch (error) {
      console.error(
        "TrafficMap route fit error:",
        error
      );
    }
  }, [
    routeGeometry,
    map,
  ]);

  return null;
}

function FitLocation({
  latitude,
  longitude,
}) {
  const map = useMap();

  useEffect(() => {
    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      map.flyTo(
        [latitude, longitude],
        13,
        {
          duration: 0.8,
        }
      );
    }
  }, [
    latitude,
    longitude,
    map,
  ]);

  return null;
}


// =========================================================
// ROUTE GEOMETRY NORMALIZATION
// =========================================================
//
// TrafficMap is shared by multiple parts of TrafficMind.
// Keep existing array support, but also accept the encoded
// polyline string returned by the directions API.
//
// Output is always Leaflet [lat, lng] pairs.
// =========================================================

function decodePolyline(encoded) {
  if (
    typeof encoded !== "string" ||
    encoded.length === 0
  ) {
    return [];
  }

  let index = 0;
  let latitude = 0;
  let longitude = 0;
  const coordinates = [];

  try {
    while (index < encoded.length) {
      let result = 0;
      let shift = 0;
      let byte;

      do {
        if (index >= encoded.length) {
          return coordinates;
        }

        byte =
          encoded.charCodeAt(index++) -
          63;

        result |=
          (byte & 0x1f) << shift;

        shift += 5;
      } while (byte >= 0x20);

      const deltaLatitude =
        result & 1
          ? ~(result >> 1)
          : result >> 1;

      latitude += deltaLatitude;

      result = 0;
      shift = 0;

      do {
        if (index >= encoded.length) {
          return coordinates;
        }

        byte =
          encoded.charCodeAt(index++) -
          63;

        result |=
          (byte & 0x1f) << shift;

        shift += 5;
      } while (byte >= 0x20);

      const deltaLongitude =
        result & 1
          ? ~(result >> 1)
          : result >> 1;

      longitude += deltaLongitude;

      coordinates.push([
        latitude / 1e5,
        longitude / 1e5,
      ]);
    }
  } catch (error) {
    console.error(
      "TrafficMap route polyline decode error:",
      error
    );

    return [];
  }

  return coordinates;
}

function normalizeRouteGeometry(
  geometry
) {
  // Already-normalized Leaflet coordinates:
  // [[lat, lng], [lat, lng], ...]
  if (Array.isArray(geometry)) {
    return geometry
      .map((point) => {
        if (
          !Array.isArray(point) ||
          point.length < 2
        ) {
          return null;
        }

        const first = Number(point[0]);
        const second = Number(point[1]);

        if (
          !Number.isFinite(first) ||
          !Number.isFinite(second)
        ) {
          return null;
        }

        return [
          first,
          second,
        ];
      })
      .filter(Boolean);
  }

  // Directions backend currently returns an encoded
  // Google-compatible polyline string.
  if (typeof geometry === "string") {
    return decodePolyline(
      geometry
    );
  }

  return [];
}

function calculateDistanceKm(
  latitude1,
  longitude1,
  latitude2,
  longitude2
) {
  const earthRadiusKm = 6371;

  const lat1 =
    (latitude1 * Math.PI) /
    180;

  const lat2 =
    (latitude2 * Math.PI) /
    180;

  const deltaLat =
    ((latitude2 - latitude1) *
      Math.PI) /
    180;

  const deltaLon =
    ((longitude2 - longitude1) *
      Math.PI) /
    180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return (
    earthRadiusKm * c
  );
}

function getTrafficLevel(
  detections
) {
  const values =
    detections
      .map(
        (item) =>
          item?.congestion
      )
      .filter(Boolean);

  if (
    values.includes("HIGH")
  ) {
    return "HIGH";
  }

  if (
    values.includes("MEDIUM")
  ) {
    return "MEDIUM";
  }

  if (
    values.includes("LOW")
  ) {
    return "LOW";
  }

  return "NO DATA";
}

function getTrafficColor(
  level
) {
  if (level === "HIGH") {
    return "#EF4444";
  }

  if (level === "MEDIUM") {
    return "#F59E0B";
  }

  if (level === "LOW") {
    return "#22C55E";
  }

  return "var(--text-muted)";
}

// =========================================================
// TRAFFIC MAP
// =========================================================

function TrafficMap({
  location,
  startCoords,
  endCoords,
  nearbyServices,
  routeGeometry,
}) {
  const role =
    localStorage.getItem(
      "role"
    ) || "citizen";

  const canAccessGovernmentData =
    role === "government" ||
    role === "admin";

  const [zones, setZones] =
    useState([]);

  const [cameras, setCameras] =
    useState([]);

  const [
    cameraDetections,
    setCameraDetections,
  ] = useState({});

  const [
    mapLoading,
    setMapLoading,
  ] = useState(true);

  const getAuthHeaders =
    () => ({
      Authorization:
        `Bearer ${localStorage.getItem(
          "token"
        )}`,
    });

  // =========================================================
  // ZONES
  // =========================================================

  const fetchZones =
    async () => {
      /*
       * Citizens should not receive the
       * government operational incident map.
       */
      if (
        !canAccessGovernmentData
      ) {
        setZones([]);
        return;
      }

      try {
        const res =
          await axios.get(
            `${API_BASE}/api/map-zones`,
            {
              headers:
                getAuthHeaders(),
            }
          );

        setZones(
          res.data?.incidents ||
            []
        );
      } catch (error) {
        console.log(
          "Traffic map zones error:",
          error
        );

        setZones([]);
      }
    };

  // =========================================================
  // CAMERA DATA
  // =========================================================

  const fetchCameras =
    async () => {
      try {
        /*
         * -----------------------------------------------
         * CITIZEN
         * -----------------------------------------------
         *
         * Citizens use the public traffic endpoint.
         * It is based on the selected location.
         */
        if (
          role === "citizen"
        ) {
          if (
            !location ||
            !Number.isFinite(
              Number(
                location.latitude
              )
            ) ||
            !Number.isFinite(
              Number(
                location.longitude
              )
            )
          ) {
            setCameras([]);
            setCameraDetections(
              {}
            );

            return;
          }

          const res =
            await axios.get(
              `${API_BASE}/api/citizen-traffic`,
              {
                params: {
                  latitude:
                    location.latitude,

                  longitude:
                    location.longitude,
                },
              }
            );

          const publicCameras =
            Array.isArray(
              res.data?.cameras
            )
              ? res.data.cameras
              : [];

          setCameras(
            publicCameras
          );

          /*
           * The citizen endpoint already
           * provides public detection data,
           * so do not call the protected
           * camera-detection endpoint.
           */
          const detectionMap =
            {};

          publicCameras.forEach(
            (camera) => {
              detectionMap[
                camera.cameraId
              ] = {
                vehicleCount:
                  Number(
                    camera.vehicleCount
                  ) || 0,

                congestion:
                  camera.congestion ||
                  "LOW",

                accidentDetected:
                  camera.accidentDetected ===
                  true,

                emergencyDetected:
                  camera.emergencyDetected ===
                  true,

                accidentSeverity:
                  camera.accidentSeverity ||
                  "NONE",

                detectedAt:
                  camera.detectedAt ||
                  null,
              };
            }
          );

          setCameraDetections(
            detectionMap
          );

          return;
        }

        /*
         * -----------------------------------------------
         * GOVERNMENT / ADMIN
         * -----------------------------------------------
         *
         * Keep the protected endpoint.
         */
        const res =
          await axios.get(
            `${API_BASE}/api/traffic-cameras`,
            {
              headers:
                getAuthHeaders(),
            }
          );

        const authorizedCameras =
          Array.isArray(
            res.data?.cameras
          )
            ? res.data.cameras
            : [];

        setCameras(
          authorizedCameras
        );
      } catch (error) {
        console.log(
          "Traffic camera network error:",
          error
        );

        setCameras([]);
        setCameraDetections(
          {}
        );
      }
    };

  // =========================================================
  // CAMERA DETECTIONS
  // =========================================================

  const fetchCameraDetections =
    async () => {
      /*
       * Citizens already receive
       * detection data from /api/citizen-traffic.
       */
      if (
        role === "citizen"
      ) {
        return;
      }

      if (!cameras.length) {
        setCameraDetections(
          {}
        );

        return;
      }

      const results = {};

      await Promise.all(
        cameras.map(
          async (camera) => {
            try {
              const res =
                await axios.get(
                  `${API_BASE}/api/camera-detections/${encodeURIComponent(
                    camera.cameraId
                  )}/latest`,
                  {
                    headers:
                      getAuthHeaders(),
                  }
                );

              results[
                camera.cameraId
              ] =
                res.data
                  ?.detection ||
                null;
            } catch (
              error
            ) {
              results[
                camera.cameraId
              ] = null;
            }
          }
        )
      );

      setCameraDetections(
        results
      );
    };

  // =========================================================
  // INITIAL / LOCATION REFRESH
  // =========================================================

  useEffect(() => {
    const load =
      async () => {
        setMapLoading(
          true
        );

        await Promise.all([
          fetchZones(),
          fetchCameras(),
        ]);

        setMapLoading(
          false
        );
      };

    load();
  }, [
    location,
    role,
  ]);

  // =========================================================
  // LIVE DETECTION REFRESH
  // =========================================================

  useEffect(() => {
    if (
      role === "citizen"
    ) {
      return;
    }

    fetchCameraDetections();

    const interval =
      setInterval(
        fetchCameraDetections,
        5000
      );

    return () =>
      clearInterval(
        interval
      );
  }, [
    cameras,
    role,
  ]);

  // =========================================================
  // NEARBY CAMERA DATA
  // =========================================================

  const nearbyCameraData =
    useMemo(() => {
      if (
        !location ||
        !cameras.length
      ) {
        return [];
      }

      return cameras
        .map((camera) => {
          const latitude =
            Number(
              camera.latitude ??
                camera.location
                  ?.latitude
            );

          const longitude =
            Number(
              camera.longitude ??
                camera.location
                  ?.longitude
            );

          if (
            !Number.isFinite(
              latitude
            ) ||
            !Number.isFinite(
              longitude
            )
          ) {
            return null;
          }

          const distance =
            calculateDistanceKm(
              location.latitude,
              location.longitude,
              latitude,
              longitude
            );

          return {
            camera,
            latitude,
            longitude,
            distance,
            detection:
              cameraDetections[
                camera.cameraId
              ] || null,
          };
        })
        .filter(Boolean)
        .filter((item) =>
  role === "citizen"
    ? true
    : item.distance <=
      NEARBY_RADIUS_KM
);
    }, [
      cameras,
      cameraDetections,
      location,
    ]);

  // =========================================================
  // TRAFFIC SUMMARY
  // =========================================================

  const nearbyTraffic =
    useMemo(
      () =>
        getTrafficLevel(
          nearbyCameraData.map(
            (item) =>
              item.detection
          )
        ),
      [nearbyCameraData]
    );

  const nearbyVehicleCount =
    useMemo(
      () =>
        nearbyCameraData.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.detection
                ?.vehicleCount ||
                0
            ),
          0
        ),
      [nearbyCameraData]
    );

  // =========================================================
  // MAP CENTER
  // =========================================================

  const mapCenter =
    location
      ? [
          location.latitude,
          location.longitude,
        ]
      : startCoords
      ? [
          startCoords[1],
          startCoords[0],
        ]
      : null;

  // Shared route renderer:
  // accepts either the existing [lat,lng] array or the
  // encoded polyline returned by /api/routes/directions.
  const normalizedRouteGeometry =
    useMemo(
      () =>
        normalizeRouteGeometry(
          routeGeometry
        ),
      [routeGeometry]
    );

  // =========================================================
  // EMPTY STATE
  // =========================================================

  if (!mapCenter) {
    return (
      <div
        style={{
          marginTop: "30px",
          borderRadius:
            "15px",
          background:
            "var(--app-surface)",
          border:
            "1px solid var(--border)",
          padding: "30px",
          textAlign: "center",
          color:
            "var(--text-muted)",
        }}
      >
        📍 Select a location to
        view nearby traffic
        intelligence.
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      className="traffic-map-shell"
      style={{
        marginTop: "30px",
        borderRadius:
          "15px",
        overflow: "hidden",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          gap: "15px",
          flexWrap:
            "wrap",
          marginBottom:
            "12px",
        }}
      >
        <div>
          <h2 className="traffic-map-title">
            Live Traffic Map
          </h2>

          <p
            className="traffic-map-subtitle"
            style={{
              color:
                "var(--text-muted)",
              margin:
                "5px 0 0",
            }}
          >
            Traffic intelligence
            around the selected
            location.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap:
              "wrap",
          }}
        >
          <span
            style={{
              background: `${getTrafficColor(
                nearbyTraffic
              )}22`,

              border: `1px solid ${getTrafficColor(
                nearbyTraffic
              )}66`,

              color:
                getTrafficColor(
                  nearbyTraffic
                ),

              padding:
                "8px 12px",

              borderRadius:
                "20px",

              fontWeight:
                "700",

              fontSize: "13px",
            }}
          >
            {nearbyTraffic ===
            "HIGH"
              ? "🔴 HIGH TRAFFIC"
              : nearbyTraffic ===
                "MEDIUM"
              ? "🟡 MEDIUM TRAFFIC"
              : nearbyTraffic ===
                "LOW"
              ? "🟢 LOW TRAFFIC"
              : "⚪ NO DATA"}
          </span>

          <span
            style={{
              background:
                "var(--app-surface-2)",

              border:
                "1px solid var(--border)",

              color:
                "var(--text-secondary)",

              padding:
                "8px 12px",

              borderRadius:
                "20px",

              fontSize: "13px",
            }}
          >
            🚗{" "}
            {
              nearbyVehicleCount
            }{" "}
            vehicles nearby
          </span>
        </div>
      </div>

      {/* MAP */}

      <MapContainer
        center={mapCenter}
        zoom={13}
        className="traffic-map-canvas"
        style={{
          height: "60vh",
          width: "100%",
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* SELECTED LOCATION */}

        {location && (
          <>
            <FitLocation
              latitude={
                location.latitude
              }
              longitude={
                location.longitude
              }
            />

            <Marker
              position={[
                location.latitude,
                location.longitude,
              ]}
            >
              <Popup>
                <strong>
                  📍 Selected Location
                </strong>

                <br />

                {location.name ||
                  "Selected location"}

                <br />

                {location.latitude.toFixed(
                  5
                )}

                ,{" "}

                {location.longitude.toFixed(
                  5
                )}
              </Popup>
            </Marker>

            <Circle
              center={[
                location.latitude,
                location.longitude,
              ]}
              radius={
                NEARBY_RADIUS_KM *
                1000
              }
              pathOptions={{
                color:
                  "#2563EB",
                fillColor:
                  "#2563EB",
                fillOpacity:
                  0.04,
                weight: 1,
              }}
            />
          </>
        )}

        {/* ROUTE */}

        {normalizedRouteGeometry.length >
          1 && (
          <FitRoute
            routeGeometry={
              normalizedRouteGeometry
            }
          />
        )}

        {/* =====================================================
            PUBLIC TRAFFIC AREAS

            Camera identities are NOT shown.
           ===================================================== */}

        {nearbyCameraData.map(
          (item) => {
            if (
              !item.detection
            ) {
              return null;
            }

            const trafficLevel =
              item.detection
                .congestion ||
              "NO DATA";

            const color =
              getTrafficColor(
                trafficLevel
              );

            return (
              <Circle
                key={
                  item.camera
                    .cameraId
                }
                center={[
                  item.latitude,
                  item.longitude,
                ]}
                radius={
                  trafficLevel ===
                  "HIGH"
                    ? 170
                    : trafficLevel ===
                      "MEDIUM"
                    ? 130
                    : 100
                }
                pathOptions={{
                  color,
                  fillColor:
                    color,
                  fillOpacity:
                    0.22,
                  weight: 2,
                }}
              >
                <Popup>
                  <strong>
                    Traffic Area
                  </strong>

                  <br />

                  Traffic:{" "}
                  {
                    trafficLevel
                  }

                  <br />

                  Vehicles:{" "}
                  {Number(
                    item
                      .detection
                      .vehicleCount ||
                      0
                  )}
                </Popup>
              </Circle>
            );
          }
        )}

        {/* =====================================================
            GOVERNMENT INCIDENT ZONES
            Hidden from citizens.
           ===================================================== */}

        {canAccessGovernmentData &&
          zones.map(
            (zone) => {
              if (
                typeof zone.latitude !==
                  "number" ||
                typeof zone.longitude !==
                  "number"
              ) {
                return null;
              }

              return (
                <Marker
                  key={zone._id}
                  position={[
                    zone.latitude,
                    zone.longitude,
                  ]}
                >
                  <Popup>
                    <strong>
                      🚨{" "}
                      {
                        zone.location
                      }
                    </strong>

                    <br />

                    Severity:{" "}
                    {
                      zone.severity
                    }

                    <br />

                    Type:{" "}
                    {
                      zone.incidentType
                    }
                  </Popup>
                </Marker>
              );
            }
          )}

        {/* =====================================================
            ROUTE MARKERS
           ===================================================== */}

        {startCoords &&
          endCoords && (
            <>
              <Marker
                position={[
                  startCoords[1],
                  startCoords[0],
                ]}
              >
                <Popup>
                  Start Location
                </Popup>
              </Marker>

              <Marker
                position={[
                  endCoords[1],
                  endCoords[0],
                ]}
              >
                <Popup>
                  Destination
                </Popup>
              </Marker>

              {normalizedRouteGeometry.length >
                1 && (
                <Polyline
                  positions={
                    normalizedRouteGeometry
                  }
                  pathOptions={{
                    color:
                      "#22C55E",
                    weight: 7,
                    opacity: 0.9,
                  }}
                />
              )}
            </>
          )}

        {/* =====================================================
            EMERGENCY SERVICES
           ===================================================== */}

        {nearbyServices &&
          nearbyServices.map(
            (
              service,
              index
            ) => {
              if (
                !Number.isFinite(
                  Number(
                    service.lat
                  )
                ) ||
                !Number.isFinite(
                  Number(
                    service.lon
                  )
                )
              ) {
                return null;
              }

              return (
                <Marker
                  key={`service-${index}`}
                  position={[
                    Number(
                      service.lat
                    ),
                    Number(
                      service.lon
                    ),
                  ]}
                >
                  <Popup>
                    {
                      service
                        .tags
                        ?.name ||
                      "Emergency Service"
                    }
                  </Popup>
                </Marker>
              );
            }
          )}
      </MapContainer>

      {mapLoading && (
        <div
          style={{
            marginTop:
              "8px",
            color:
              "var(--text-subtle)",
            fontSize: "12px",
          }}
        >
          Updating live traffic
          intelligence...
        </div>
      )}
    </div>
  );
}

export default TrafficMap;