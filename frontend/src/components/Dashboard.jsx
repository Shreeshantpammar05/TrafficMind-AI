import MainLayout from "../layouts/MainLayout";
import TrafficMap from "./TrafficMap";
import WeatherScene from "./WeatherScene";
import TrafficChart from "./TrafficChart";
import SmartSignalStatus from "./SmartSignalStatus";
import TrafficRecommendation from "./TrafficRecommendation";
import AIPerformanceCenter from "./AIPerformanceCenter";

import socket from "../socket";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  FaCar,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaRoute,
  FaRoad,
  FaVideo,
  FaCloudSun,
} from "react-icons/fa";

import "./Dashboard.css";


// =========================================================
// API CONFIG
// =========================================================

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

const SMART_ROUTE_API =
  import.meta.env.VITE_SMART_ROUTE_API ||
  `${API_BASE}/api/routes/directions`;

const GEOCODING_API_BASE =
  import.meta.env.VITE_GEOCODING_API_BASE_URL ||
  "https://nominatim.openstreetmap.org";


// =========================================================
// Dashboard
// =========================================================

function Dashboard() {
  // =======================================================
  // USER / ROLE
  // =======================================================

  const role =
    localStorage.getItem("role") ||
    "citizen";

  const canAccessAI =
    role === "government" ||
    role === "admin";


  // =======================================================
  // STATE
  // =======================================================

  const [stats, setStats] =
    useState({
      totalIncidents: 0,
      highSeverity: 0,
    });

  const [cameras, setCameras] =
    useState([]);

  const [cameraDetections, setCameraDetections] =
    useState({});

  const [trafficIntelligence, setTrafficIntelligence] =
    useState(null);

  const [predictiveTraffic, setPredictiveTraffic] =
  useState(null);  

  const [latestAlert, setLatestAlert] =
    useState(null);

  const [incidentStatus, setIncidentStatus] =
    useState(null);

  const [emergencyStatus, setEmergencyStatus] =
    useState(null);

  const [weather, setWeather] =
    useState(null);

  const [location, setLocation] =
    useState(null);

  const [locationName, setLocationName] =
    useState("");

  const [locationAccuracy, setLocationAccuracy] =
    useState(null);

  const [locationMode, setLocationMode] =
    useState("current");

  const [locationSearch, setLocationSearch] =
    useState("");

  const [locationSearchLoading, setLocationSearchLoading] =
    useState(false);

  const [locationSearchResults, setLocationSearchResults] =
    useState([]);

  const [locationLoading, setLocationLoading] =
    useState(true);

  const [locationError, setLocationError] =
    useState("");

  const [dashboardLoading, setDashboardLoading] =
    useState(true);

  const [routeMode, setRouteMode] =
    useState(false);

  const [destination, setDestination] =
    useState("");

  const [routeLoading, setRouteLoading] =
    useState(false);

  const [routeResult, setRouteResult] =
    useState(null);

  const [routeError, setRouteError] =
    useState("");

  const [citizenTraffic, setCitizenTraffic] =
  useState(null);  

  const fetchCitizenTraffic =
  async (
    latitude,
    longitude
  ) => {
    try {
      const res =
        await axios.get(
          `${API_BASE}/api/citizen-traffic`,
          {
            params: {
              latitude,
              longitude,
            },
          }
        );

      setCitizenTraffic(
        res.data || null
      );
    } catch (error) {
      console.log(
        "Citizen traffic error:",
        error
      );

      setCitizenTraffic(null);
    }
  };

  // =======================================================
  // RESPONSIVE UI
  // =======================================================

  const [isMobile, setIsMobile] =
    useState(
      typeof window !== "undefined" &&
        window.innerWidth <= 760
    );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(
        window.innerWidth <= 760
      );
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
  }, []);

  // =======================================================
  // AUTH
  // =======================================================

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem(
      "token"
    )}`,
  });


  // =======================================================
  // LOCATION
  // =======================================================

  const reverseGeocodeLocation = async (
    latitude,
    longitude
  ) => {
    try {
      const url = new URL(
        `${GEOCODING_API_BASE}/reverse`
      );

      url.searchParams.set(
        "lat",
        latitude
      );

      url.searchParams.set(
        "lon",
        longitude
      );

      url.searchParams.set(
        "format",
        "jsonv2"
      );

      const response =
        await fetch(
          url.toString(),
          {
            headers: {
              Accept:
                "application/json",
            },
          }
        );

      if (!response.ok) {
        throw new Error(
          "Reverse geocoding failed"
        );
      }

      const data =
        await response.json();

      const address =
        data.address || {};

      const locality =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county ||
        "";

      const state =
        address.state ||
        "";

      const country =
        address.country ||
        "";

      const parts = [
        locality,
        state,
        country,
      ].filter(Boolean);

      setLocationName(
        [...new Set(parts)].join(", ") ||
          data.display_name ||
          "Location name unavailable"
      );
    } catch (error) {
      console.log(
        "Location name error:",
        error
      );

      setLocationName(
        "Location name unavailable"
      );
    }
  };


  const applySelectedLocation = ({
    latitude,
    longitude,
    name,
    accuracy = null,
  }) => {
    setLocation({
      latitude,
      longitude,
      accuracy,
    });

    setLocationAccuracy(
      accuracy
    );

    setLocationName(
      name ||
        "Selected location"
    );

    setLocationError("");
    setLocationLoading(false);
  };


  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(
        "Location services are not supported by this browser."
      );

      setLocationLoading(false);

      return;
    }

    setLocationLoading(true);
    setLocationMode("current");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        const accuracy =
          position.coords.accuracy;

        setLocation({
          latitude,
          longitude,
          accuracy,
        });

        setLocationAccuracy(
          accuracy
        );

        setLocationError("");
        setLocationLoading(false);

        reverseGeocodeLocation(
          latitude,
          longitude
        );
      },
      (error) => {
        console.log(
          "Location error:",
          error
        );

        setLocationError(
          "Current location is unavailable. You can search for a location instead."
        );

        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };


  const searchLocation = async () => {
    const query =
      locationSearch.trim();

    if (!query) {
      setLocationSearchResults(
        []
      );
      return;
    }

    try {
      setLocationSearchLoading(
        true
      );

      const url = new URL(
        `${GEOCODING_API_BASE}/search`
      );

      url.searchParams.set(
        "q",
        query
      );

      url.searchParams.set(
        "format",
        "jsonv2"
      );

      url.searchParams.set(
        "limit",
        "5"
      );

      url.searchParams.set(
        "addressdetails",
        "1"
      );

      const response =
        await fetch(
          url.toString(),
          {
            headers: {
              Accept:
                "application/json",
            },
          }
        );

      if (!response.ok) {
        throw new Error(
          "Location search failed"
        );
      }

      const data =
        await response.json();

      setLocationSearchResults(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.log(
        "Location search error:",
        error
      );

      setLocationSearchResults(
        []
      );

      setLocationError(
        "Unable to search for that location."
      );
    } finally {
      setLocationSearchLoading(
        false
      );
    }
  };


  const selectSearchedLocation =
    (result) => {
      const latitude =
        Number(result.lat);

      const longitude =
        Number(result.lon);

      if (
        !Number.isFinite(
          latitude
        ) ||
        !Number.isFinite(
          longitude
        )
      ) {
        return;
      }

      applySelectedLocation({
        latitude,
        longitude,
        name:
          result.display_name ||
          "Selected location",
      });

      setLocationMode(
        "search"
      );

      setLocationSearchResults(
        []
      );

      setLocationSearch(
        result.display_name ||
          ""
      );
    };


  useEffect(() => {
    requestLocation();
  }, []);



  // =======================================================
  // STATS
  // =======================================================

  const fetchStats = async () => {
    try {
      const res =
        await axios.get(
          `${API_BASE}/api/stats`,
          {
            headers:
              getAuthHeaders(),
          }
        );

      setStats({
        totalIncidents:
          res.data?.totalIncidents ??
          0,

        highSeverity:
          res.data?.highSeverity ??
          0,
      });
    } catch (error) {
      console.log(
        "Stats error:",
        error
      );
    }
  };


  // =======================================================
  // TRAFFIC INTELLIGENCE
  // =======================================================

  const fetchTrafficIntelligence =
    async () => {
      if (!canAccessAI) {
        setTrafficIntelligence(null);
        return;
      }

      try {
        const res =
          await axios.get(
            `${API_BASE}/api/signal/status`,
            {
              headers:
                getAuthHeaders(),
            }
          );

        setTrafficIntelligence(
          res.data || null
        );
      } catch (error) {
        console.log(
          "Traffic intelligence error:",
          error
        );
      }
    };

    const fetchPredictiveTraffic =
  async () => {
    if (!canAccessAI) {
      setPredictiveTraffic(null);
      return;
    }

    try {
      const res =
        await axios.get(
          `${API_BASE}/api/predictive-traffic`,
          {
            headers:
              getAuthHeaders(),
          }
        );

      setPredictiveTraffic(
        res.data || null
      );
    } catch (error) {
      console.log(
        "Predictive traffic error:",
        error
      );

      setPredictiveTraffic(
        null
      );
    }
  };


  // =======================================================
  // INCIDENT
  // =======================================================

  const fetchIncidentStatus =
    async () => {
      try {
        const res =
          await axios.get(
            `${API_BASE}/api/incident-detection/status`,
            {
              headers:
                getAuthHeaders(),
            }
          );

        setIncidentStatus(
          res.data || null
        );
      } catch (error) {
        console.log(
          "Incident status error:",
          error
        );
      }
    };


  // =======================================================
  // EMERGENCY
  // =======================================================

  const fetchEmergencyStatus =
    async () => {
      try {
        const res =
          await axios.get(
            `${API_BASE}/api/emergency/status`,
            {
              headers:
                getAuthHeaders(),
            }
          );

        setEmergencyStatus(
          res.data || null
        );
      } catch (error) {
        console.log(
          "Emergency status error:",
          error
        );
      }
    };


  // =======================================================
  // ALERT
  // =======================================================

  const fetchLatestAlert =
    async () => {
      try {
        const res =
          await axios.get(
            `${API_BASE}/api/alerts/latest`,
            {
              headers:
                getAuthHeaders(),
            }
          );

        setLatestAlert(
          res.data || null
        );
      } catch (error) {
        console.log(
          "Alert error:",
          error
        );

        setLatestAlert(null);
      }
    };


  // =======================================================
  // CAMERAS
  // =======================================================

  const fetchCameras = async () => {
    if (!canAccessAI) {
      setCameras([]);
      setCameraDetections({});
      return;
    }

    try {
      const res =
        await axios.get(
          `${API_BASE}/api/traffic-cameras`,
          {
            headers:
              getAuthHeaders(),
          }
        );

      setCameras(
        res.data?.cameras || []
      );
    } catch (error) {
      console.log(
        "Camera network error:",
        error
      );

      setCameras([]);
    }
  };


  // =======================================================
  // CAMERA DETECTION
  // =======================================================

  const fetchCameraDetections =
    async () => {
      if (!cameras.length) {
        return;
      }

      const result = {};

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

              result[
                camera.cameraId
              ] =
                res.data?.detection ||
                null;
            } catch (error) {
              result[
                camera.cameraId
              ] = null;
            }
          }
        )
      );

      setCameraDetections(
        result
      );
    };


  // =======================================================
  // WEATHER
  // =======================================================

  const fetchWeather =
    async (
      latitude,
      longitude
    ) => {
      if (
        latitude == null ||
        longitude == null
      ) {
        return;
      }

      try {
        /*
         * Uses your backend weather endpoint.
         * The endpoint stays configurable through
         * the existing backend architecture.
         */
        const res =
          await axios.get(
            `${API_BASE}/api/weather`,
            {
              params: {
                latitude,
                longitude,
              },

              headers:
                getAuthHeaders(),
            }
          );

        setWeather(
          res.data || null
        );
      } catch (error) {
        console.log(
          "Weather error:",
          error
        );
      }
    };


 useEffect(() => {
  if (!location) {
    return;
  }

  fetchWeather(
    location.latitude,
    location.longitude
  );

  if (role === "citizen") {
    fetchCitizenTraffic(
      location.latitude,
      location.longitude
    );
  }
}, [location, role]);


  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    const load =
      async () => {
        setDashboardLoading(
          true
        );

        await Promise.all([
          fetchStats(),

          canAccessAI
            ? fetchTrafficIntelligence()
            : Promise.resolve(),

          canAccessAI
            ? fetchPredictiveTraffic()
            : Promise.resolve(),

          fetchIncidentStatus(),
          fetchEmergencyStatus(),
          fetchLatestAlert(),

          canAccessAI
            ? fetchCameras()
            : Promise.resolve(),
        ]);

        setDashboardLoading(
          false
        );
      };

    load();


    const interval =
      setInterval(
        () => {
          fetchStats();

          if (canAccessAI) {
            fetchTrafficIntelligence();
            fetchPredictiveTraffic();
            fetchCameras();
          }

          fetchIncidentStatus();
          fetchEmergencyStatus();
          fetchLatestAlert();
        },
        5000
      );


    const handleIncident =
      () => {
        fetchStats();
        fetchLatestAlert();
        fetchIncidentStatus();
      };


    socket.on(
      "newIncident",
      handleIncident
    );


    return () => {
      clearInterval(
        interval
      );

      socket.off(
        "newIncident",
        handleIncident
      );
    };
  }, [canAccessAI]);


  // =======================================================
  // CAMERA REFRESH
  // =======================================================

  useEffect(() => {
    if (!canAccessAI || !cameras.length) {
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
  }, [cameras, canAccessAI]);


  // =======================================================
  // LIVE VEHICLES
  // =======================================================

  const liveVehicles =
    useMemo(() => {
      return Object.values(
        cameraDetections
      ).reduce(
        (
          total,
          detection
        ) =>
          total +
          Number(
            detection?.vehicleCount ||
              0
          ),
        0
      );
    }, [cameraDetections]);


  // =======================================================
  // NETWORK CONGESTION
  // =======================================================

  const networkCongestion =
    useMemo(() => {
      const values =
        Object.values(
          cameraDetections
        )
          .map(
            (
              detection
            ) =>
              detection?.congestion
          )
          .filter(Boolean);

      if (
        values.includes(
          "HIGH"
        )
      ) {
        return "HIGH";
      }

      if (
        values.includes(
          "MEDIUM"
        )
      ) {
        return "MEDIUM";
      }

      if (
        values.length
      ) {
        return "LOW";
      }

      return "NO DATA";
    }, [cameraDetections]);

    const citizenVehicles =
  citizenTraffic?.totalVehicles ?? 0;

const citizenCameraCount =
  citizenTraffic?.cameraCount ?? 0;

const citizenCongestion =
  citizenTraffic?.congestion ||
  "NO DATA";


  const congestionColor =
    networkCongestion ===
    "HIGH"
      ? "#EF4444"
      : networkCongestion ===
        "MEDIUM"
      ? "#F59E0B"
      : "#22C55E";


  // =======================================================
  // CAMERA HEALTH
  // =======================================================

  const getCameraHealth =
    (camera) => {
      const detection =
        cameraDetections[
          camera.cameraId
        ];

      const timestamp =
        detection?.updatedAt ||
        detection?.detectedAt;

      if (!timestamp) {
        return {
          status:
            "OFFLINE",
          color:
            "#EF4444",
          icon:
            "🔴",
        };
      }

      const age =
        (
          Date.now() -
          new Date(
            timestamp
          ).getTime()
        ) / 1000;

      if (age <= 15) {
        return {
          status:
            "ONLINE",
          color:
            "#22C55E",
          icon:
            "🟢",
        };
      }

      if (age <= 30) {
        return {
          status:
            "STALE",
          color:
            "#F59E0B",
          icon:
            "🟡",
        };
      }

      return {
        status:
          "OFFLINE",
        color:
          "#EF4444",
        icon:
          "🔴",
      };
    };


  const onlineCameras =
    cameras.filter(
      (camera) =>
        getCameraHealth(
          camera
        ).status ===
        "ONLINE"
    ).length;


  // =======================================================
  // ROUTE GEOMETRY
  // =======================================================

  const decodePolyline = (encoded) => {
    const coordinates = [];

    if (
      typeof encoded !==
        "string" ||
      !encoded.length
    ) {
      return coordinates;
    }

    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
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

      const deltaLat =
        result & 1
          ? ~(result >> 1)
          : result >> 1;

      lat += deltaLat;

      shift = 0;
      result = 0;

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

      const deltaLng =
        result & 1
          ? ~(result >> 1)
          : result >> 1;

      lng += deltaLng;

      coordinates.push([
        lat / 1e5,
        lng / 1e5,
      ]);
    }

    return coordinates;
  };


  const normalizeRouteGeometry = (
    geometry
  ) => {
    if (!geometry) {
      return null;
    }

    let value = geometry;

    if (typeof value === "string") {
      const trimmed = value.trim();

      if (!trimmed) {
        return null;
      }

      try {
        value = JSON.parse(trimmed);
      } catch {
        const decoded =
          decodePolyline(trimmed);

        return decoded.length > 1
          ? decoded
          : null;
      }
    }

    if (
      value?.type === "Feature"
    ) {
      return normalizeRouteGeometry(
        value.geometry
      );
    }

    if (
      value?.type === "FeatureCollection"
    ) {
      const firstFeature =
        value.features?.[0];

      return firstFeature
        ? normalizeRouteGeometry(
            firstFeature.geometry
          )
        : null;
    }

    if (
      value?.type === "LineString"
    ) {
      return normalizeRouteGeometry(
        value.coordinates
      );
    }

    if (
      Array.isArray(value) &&
      value.length > 1
    ) {
      const first = value[0];

      if (
        Array.isArray(first) &&
        first.length >= 2 &&
        Number.isFinite(
          Number(first[0])
        ) &&
        Number.isFinite(
          Number(first[1])
        )
      ) {
        return value
          .filter(
            (coordinate) =>
              Array.isArray(
                coordinate
              ) &&
              coordinate.length >=
                2 &&
              Number.isFinite(
                Number(coordinate[0])
              ) &&
              Number.isFinite(
                Number(coordinate[1])
              )
          )
          .map(
            (coordinate) => [
              Number(coordinate[1]),
              Number(coordinate[0]),
            ]
          );
      }
    }

    return null;
  };


  // =======================================================
  // SMART ROUTE
  // =======================================================

  const geocodeDestination =
    async (query) => {
      try {
        const url = new URL(
          `${GEOCODING_API_BASE}/search`
        );

        url.searchParams.set(
          "q",
          query
        );

        url.searchParams.set(
          "format",
          "jsonv2"
        );

        url.searchParams.set(
          "limit",
          "1"
        );

        url.searchParams.set(
          "addressdetails",
          "1"
        );

        const response =
          await fetch(
            url.toString(),
            {
              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        if (!response.ok) {
          throw new Error(
            "Destination search failed"
          );
        }

        const data =
          await response.json();

        const first =
          Array.isArray(data)
            ? data[0]
            : null;

        if (!first) {
          throw new Error(
            "Destination could not be found."
          );
        }

        return {
          latitude:
            Number(first.lat),

          longitude:
            Number(first.lon),

          name:
            first.display_name ||
            query,
        };
      } catch (error) {
        throw new Error(
          error.message ||
            "Destination search failed."
        );
      }
    };


  const openSmartRoute =
    () => {
      setRouteMode(
        true
      );

      setRouteResult(
        null
      );

      setRouteError(
        ""
      );
    };


  const closeSmartRoute =
    () => {
      setRouteMode(
        false
      );

      setRouteResult(
        null
      );

      setRouteError(
        ""
      );

      setDestination("");
    };


  const generateSmartRoute =
    async () => {
      if (!location) {
        setRouteError(
          "Select a traffic location first."
        );

        return;
      }

      if (
        !destination.trim()
      ) {
        setRouteError(
          "Enter a destination."
        );

        return;
      }

      try {
        setRouteLoading(
          true
        );

        setRouteError(
          ""
        );

        const destinationLocation =
          await geocodeDestination(
            destination.trim()
          );

        const traffic =
          Object.entries(
            cameraDetections
          ).map(
            ([
              cameraId,
              detection,
            ]) => ({
              cameraId,

              vehicleCount:
                Number(
                  detection?.vehicleCount ||
                    0
                ),

              congestion:
                detection?.congestion ||
                null,

              accidentDetected:
                detection?.accidentDetected ===
                true,

              accidentSeverity:
                detection?.accidentSeverity ||
                "NONE",
            })
          );

        const response =
          await axios.post(
            SMART_ROUTE_API,
            {
              start: [
                location.longitude,
                location.latitude,
              ],

              end: [
                destinationLocation.longitude,
                destinationLocation.latitude,
              ],

              traffic,

              weather,
            },
            {
              headers:
                getAuthHeaders(),
            }
          );

        const route =
          response.data?.route ||
          null;

        if (!route) {
          throw new Error(
            response.data?.error ||
              "No route was returned."
          );
        }

        const summary =
          route.summary || {};

        const routeGeometry =
          normalizeRouteGeometry(
            route.geometry
          );

        const routeResultData = {
          success:
            true,

          recommendation:
            traffic.some(
              (item) =>
                item.congestion ===
                  "HIGH" ||
                item.accidentDetected
            )
              ? "Traffic-aware route generated"
              : "Fastest route generated",

          distance:
            Number.isFinite(
              summary.distance
            )
              ? `${(
                  summary.distance /
                  1000
                ).toFixed(1)} km`
              : "--",

          duration:
            Number.isFinite(
              summary.duration
            )
              ? `${Math.round(
                  summary.duration /
                    60
                )} min`
              : "--",

          congestion:
            traffic.some(
              (item) =>
                item.congestion ===
                "HIGH"
            )
              ? "HIGH"
              : traffic.some(
                    (item) =>
                      item.congestion ===
                      "MEDIUM"
                  )
              ? "MEDIUM"
              : traffic.length
                ? "LOW"
                : "NO DATA",

          message:
            !routeGeometry
              ? "Route generated, but the map geometry was not returned."
              : traffic.some(
                  (item) =>
                    item.accidentDetected
                )
                ? "An active camera incident was included in the route analysis."
                : "Route generated using the selected location and current traffic intelligence.",

          destinationName:
            destinationLocation.name,

          startCoords: [
            location.longitude,
            location.latitude,
          ],

          endCoords: [
            destinationLocation.longitude,
            destinationLocation.latitude,
          ],

          routeGeometry,
        };

        setRouteResult(
          routeResultData
        );
      } catch (error) {
        console.log(
          "Smart route error:",
          error
        );

        setRouteResult(
          null
        );

        setRouteError(
          error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            "Unable to generate smart route."
        );
      } finally {
        setRouteLoading(
          false
        );
      }
    };



  // =======================================================
  // KPI
  // =======================================================

  const cards =
  role === "citizen"
    ? [
        {
          title:
            "Live Vehicles",

          value:
            citizenVehicles,

          icon:
            <FaCar size={28} />,
        },

        {
          title:
            "Traffic Cameras",

          value:
            citizenCameraCount,

          icon:
            <FaVideo size={28} />,
        },

        {
          title:
            "Traffic Status",

          value:
            citizenCongestion,

          icon:
            <FaRoad size={28} />,
        },

        {
  title: "Active Incidents",
  value:
    citizenTraffic?.cameras?.filter(
      (camera) =>
        camera.accidentDetected ||
        camera.emergencyDetected
    ).length ?? 0,

  icon:
    <FaExclamationTriangle
      size={28}
    />,
},
      ]
    : [
        {
          title:
            "Live Vehicles",

          value:
            liveVehicles,

          icon:
            <FaCar size={28} />,
        },

        {
          title:
            "Traffic Incidents",

          value:
            stats.highSeverity,

          icon:
            <FaExclamationTriangle
              size={28}
            />,
        },

        {
          title:
            "Network Congestion",

          value:
            networkCongestion,

          icon:
            <FaRoad size={28} />,
        },

        {
          title:
            "Online Cameras",

          value:
            onlineCameras,

          icon:
            <FaVideo size={28} />,
        },
      ];


  // =======================================================
  // Loading
  // =======================================================

  if (dashboardLoading) {
    return (
      <MainLayout>
        <div
          className="dashboard trafficmind-themed-page"
          style={{
            padding:
              "30px",
          }}
        >
          <div
            className="section-card"
            style={{
              padding:
                "40px",
              textAlign:
                "center",
            }}
          >
            <h2>
              Connecting to TrafficMind AI...
            </h2>

            <p
              style={{
                color:
                  "var(--text-muted)",
                marginTop:
                  "8px",
              }}
            >
              Loading live traffic intelligence.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <MainLayout>
      <div
        className="dashboard"
        style={{
          flex: 1,
        }}
      >

        {/* =================================================
            HERO
        ================================================= */}

        <div
          className="hero-header"
          style={{
            background:
              "linear-gradient(135deg,#1E3A8A,#2563EB,#38BDF8)",

            borderRadius:
              "18px",

            padding:
              "28px",

            marginBottom:
              "25px",

            display:
              "flex",

            flexDirection:
              isMobile ? "column" : "row",

            justifyContent:
              "space-between",

            alignItems:
              isMobile ? "flex-start" : "center",

            gap:
              isMobile ? "16px" : "20px",

            color:
              "#fff",

            boxShadow:
              "0 10px 30px rgba(37,99,235,.35)",
          }}
        >
          <div>
            <h1
              style={{
                margin:
                  0,
                fontSize:
                  isMobile ? "26px" : "32px",
                lineHeight:
                  "1.1",
                fontWeight:
                  "800",
                letterSpacing:
                  "-.02em",
              }}
            >
              TrafficMind AI
            </h1>

            <p
              style={{
                marginTop:
                  "8px",

                color:
                  "#E2E8F0",

                lineHeight:
                  "1.6",
              }}
            >
              Real-time traffic awareness
              powered by AI.
            </p>
          </div>

          <div
            style={{
              background:
                "rgba(15,23,42,.35)",

              border:
                "1px solid rgba(255,255,255,.20)",

              padding:
                "9px 14px",

              borderRadius:
                "20px",

              fontWeight:
                "700",
            }}
          >
            🟢 LIVE
          </div>
        </div>


        {/* =================================================
            DYNAMIC TRAFFIC + WEATHER ENVIRONMENT
        ================================================= */}

        <WeatherScene
          weather={weather}
          location={location}
          locationName={locationName}
          locationAccuracy={locationAccuracy}
          locationMode={locationMode}
          locationSearch={locationSearch}
          locationSearchLoading={locationSearchLoading}
          locationSearchResults={locationSearchResults}
          locationError={locationError}
          liveVehicles={liveVehicles}
          networkCongestion={role === "citizen"
          ? citizenCongestion
          : networkCongestion}
          congestionColor={congestionColor}
          activeIncidents={stats.highSeverity}
          onUseCurrentLocation={requestLocation}
          onUseSearchMode={() => {
            setLocationMode("search");
            setLocationError("");
          }}
          onSearchChange={setLocationSearch}
          onSearch={searchLocation}
          onSelectLocation={selectSearchedLocation}
        />

        {/* =================================================
            LIVE KPIs
        ================================================= */}

        <div
          className="cards"
          style={{
            marginBottom:
              "25px",
          }}
        >

          {cards.map(
            (
              card,
              index
            ) => (
              <div
                className="card"
                key={index}
                style={{
                  background:
                    "linear-gradient(145deg,var(--app-surface),var(--app-surface-2))",

                  border:
                    "1px solid var(--border)",

                  borderRadius:
                    "18px",

                  padding:
                    "22px",
                }}
              >

                <div
                  style={{
                    display:
                      "flex",

                    justifyContent:
                      "space-between",

                    alignItems:
                      "center",
                  }}
                >
                  <span
                    style={{
                      color:
                        "var(--text-muted)",
                      fontSize:
                        "13px",
                      fontWeight:
                        "600",
                    }}
                  >
                    {card.title}
                  </span>

                  <div
                    style={{
                      color:
                        "#60A5FA",
                    }}
                  >
                    {card.icon}
                  </div>
                </div>

                <h2
                  style={{
                    marginTop:
                      "14px",
                  }}
                >
                  {card.value}
                </h2>

              </div>
            )
          )}

        </div>


        {/* =================================================
            SMART ROUTE INTELLIGENCE
        ================================================= */}

        {routeMode ? (
          <div
            className="section-card"
            style={{
              marginBottom:
                "25px",

              border:
                "1px solid rgba(59,130,246,.30)",
            }}
          >

            <div
              style={{
                display:
                  "flex",

                justifyContent:
                  "space-between",

                alignItems:
                  isMobile ? "flex-start" : "center",

                flexWrap:
                  "wrap",

                gap:
                  "12px",

                marginBottom:
                  "20px",
              }}
            >
              <div>
                <h2>
                  🧠 Smart Route Intelligence
                </h2>

                <p
                  style={{
                    color:
                      "var(--text-muted)",
                  }}
                >
                  Route recommendations use
                  your current location and
                  available live traffic intelligence.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeSmartRoute
                }
                style={{
                  border:
                    "none",

                  background:
                    "var(--app-surface-3)",

                  color:
                    "var(--text-primary)",

                  padding:
                    "9px 13px",

                  borderRadius:
                    "9px",

                  cursor:
                    "pointer",
                }}
              >
                ✕ Close Route
              </button>
            </div>


            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  isMobile
                    ? "1fr"
                    : "1fr 1fr auto",

                gap:
                  "10px",
              }}
            >

              <input
                value={
                  location
                    ? `${locationName || "Selected location"} [${location.latitude.toFixed(
                        5
                      )}, ${location.longitude.toFixed(
                        5
                      )}]`
                    : ""
                }
                readOnly
                placeholder="Current location"
                style={{
                  width:
                    "100%",

                  padding:
                    "12px",

                  borderRadius:
                    "9px",

                  border:
                    "1px solid var(--border-strong)",

                  background:
                    "var(--app-surface)",

                  color:
                    "var(--text-primary)",

                  boxSizing:
                    "border-box",
                }}
              />

              <input
                value={
                  destination
                }
                onChange={(e) =>
                  setDestination(
                    e.target.value
                  )
                }
                placeholder="Enter destination"
                style={{
                  width:
                    "100%",

                  padding:
                    "12px",

                  borderRadius:
                    "9px",

                  border:
                    "1px solid var(--border-strong)",

                  background:
                    "var(--app-surface)",

                  color:
                    "var(--text-primary)",

                  boxSizing:
                    "border-box",
                }}
              />

              <button
                type="button"
                onClick={
                  generateSmartRoute
                }
                disabled={
                  routeLoading
                }
                style={{
                  padding:
                    "12px 18px",

                  border:
                    "none",

                  borderRadius:
                    "9px",

                  background:
                    "#2563EB",

                  color:
                    "white",

                  cursor:
                    "pointer",

                  fontWeight:
                    "700",
                }}
              >
                {routeLoading
                  ? "Generating..."
                  : "🧠 Generate Route"}
              </button>

            </div>


            {routeError && (
              <div
                style={{
                  marginTop:
                    "12px",

                  padding:
                    "12px",

                  borderRadius:
                    "9px",

                  background:
                    "rgba(239,68,68,.10)",

                  color:
                    "#FCA5A5",
                }}
              >
                ⚠️ {routeError}
              </div>
            )}


            {routeResult && (
              <div
                style={{
                  marginTop:
                    "20px",
                }}
              >

                <div
                  style={{
                    display:
                      "grid",

                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(150px,1fr))",

                    gap:
                      "12px",

                    marginBottom:
                      "15px",
                  }}
                >

                  <div className="card">
                    <span>
                      Recommended Route
                    </span>

                    <h3>
                      {routeResult.recommendation ||
                        "Available"}
                    </h3>
                  </div>

                  <div className="card">
                    <span>
                      Distance
                    </span>

                    <h3>
                      {routeResult.distance ??
                        "--"}
                    </h3>
                  </div>

                  <div className="card">
                    <span>
                      ETA
                    </span>

                    <h3>
                      {routeResult.duration ??
                        "--"}
                    </h3>
                  </div>

                  <div className="card">
                    <span>
                      Traffic
                    </span>

                    <h3
                      style={{
                        color:
                          routeResult.congestion ===
                          "HIGH"
                            ? "#EF4444"
                            : routeResult.congestion ===
                              "MEDIUM"
                            ? "#F59E0B"
                            : "#22C55E",
                      }}
                    >
                      {routeResult.congestion ||
                        "--"}
                    </h3>
                  </div>

                </div>


                {routeResult.message && (
                  <div
                    style={{
                      padding:
                        "15px",

                      background:
                        "var(--app-surface)",

                      borderRadius:
                        "12px",

                      color:
                        "var(--text-secondary)",
                    }}
                  >
                    💡{" "}
                    {
                      routeResult.message
                    }
                  </div>
                )}


                {routeResult.destinationName && (
                  <div
                    style={{
                      marginTop:
                        "12px",
                      padding:
                        "12px",
                      borderRadius:
                        "10px",
                      background:
                        "var(--app-surface)",
                      color:
                        "var(--text-secondary)",
                    }}
                  >
                    📍 Destination:{" "}
                    {
                      routeResult.destinationName
                    }
                  </div>
                )}

                {routeResult.routeGeometry &&
                  routeResult.routeGeometry.length > 0 && (
                    <TrafficMap
                      location={location}
                      startCoords={
                        routeResult.startCoords
                      }
                      endCoords={
                        routeResult.endCoords
                      }
                      routeGeometry={
                        routeResult.routeGeometry
                      }
                    />
                  )}

              </div>
            )}

          </div>
        ) : (
          <div
            className="section-card"
            style={{
              marginBottom:
                "25px",
            }}
          >

            <div
              style={{
                display:
                  "flex",

                justifyContent:
                  "space-between",

                alignItems:
                  isMobile ? "flex-start" : "center",

                gap:
                  "15px",

                flexWrap:
                  "wrap",
              }}
            >

              <div>
                <h2>
                  🗺️ Live Traffic Awareness
                </h2>

                <p
                  style={{
                    color:
                      "var(--text-muted)",
                    marginTop:
                      "6px",
                  }}
                >
                  Traffic conditions around
                  your current area.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  openSmartRoute
                }
                style={{
                  border:
                    "none",

                  background:
                    "#2563EB",

                  color:
                    "white",

                  padding:
                    "11px 16px",

                  borderRadius:
                    "10px",

                  cursor:
                    "pointer",

                  fontWeight:
                    "700",
                }}
              >
                🧠 Smart Route
              </button>

            </div>


            <div
              style={{
                marginTop:
                  "18px",

                background:
                  "var(--app-surface)",

                borderRadius:
                  "15px",

                overflow:
                  "hidden",
              }}
            >
              <TrafficMap
  location={location}
/>
            </div>

          </div>
        )}


        {/* =================================================
            TRAFFIC AROUND ME
        ================================================= */}

        <div
          className="section-card"
          style={{
            marginBottom:
              "25px",
          }}
        >

          <h2>
            Traffic Around Me
          </h2>

          <p
            style={{
              color:
                "var(--text-muted)",
              marginTop:
                "6px",
            }}
          >
            AI traffic conditions derived
            from the active camera network.
          </p>


          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit,minmax(180px,1fr))",

              gap:
                "15px",

              marginTop:
                "18px",
            }}
          >

            <div className="card">
              <span>
                Current Traffic
              </span>

              <h2
                style={{
                  color:
                    congestionColor,
                }}
              >
                {networkCongestion}
              </h2>
            </div>


            <div className="card">
              <span>
                Vehicles Nearby
              </span>

              <h2>
                {role === "citizen"
  ? citizenVehicles
  : liveVehicles}
              </h2>
            </div>


            <div className="card">
              <span>
                Active Incidents
              </span>

              <h2>
               {role === "citizen"
  ? (
      citizenTraffic?.cameras?.filter(
        (camera) =>
          camera.accidentDetected ||
          camera.emergencyDetected
      ).length ?? 0
    )
  : stats.highSeverity}
              </h2>
            </div>


            <div className="card">
              <span>
                Current Advice
              </span>

              <p
                style={{
                  color:
                    "var(--text-secondary)",
                  lineHeight:
                    "1.5",
                }}
              >
               {role === "citizen"
  ? citizenCameraCount > 0
    ? `Traffic data is available from ${citizenCameraCount} nearby public cameras.`
    : "No public traffic camera coverage is available for this location."
  : (
      trafficIntelligence?.trafficRecommendation ||
      trafficIntelligence?.recommendation ||
      "Traffic information is currently unavailable."
    )}
              </p>
            </div>

          </div>

        </div>


        {/* =================================================
            PUBLIC ALERTS
        ================================================= */}

        <div
          className="section-card"
          style={{
            marginBottom:
              "25px",
          }}
        >

          <div
            style={{
              display:
                "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",
            }}
          >

            <div>
              <h2>
                 Traffic Alerts
              </h2>

              <p
                style={{
                  color:
                    "var(--text-muted)",
                  marginTop:
                    "6px",
                }}
              >
                Current public traffic and
                safety notifications.
              </p>
            </div>

          </div>


          {latestAlert?.title ? (
            <div
              style={{
                marginTop:
                  "16px",

                padding:
                  "16px",

                borderRadius:
                  "12px",

                background:
                  "rgba(239,68,68,.10)",

                border:
                  "1px solid rgba(239,68,68,.25)",
              }}
            >

              <strong>
                {latestAlert.title}
              </strong>

              {latestAlert.location && (
                <p>
                  Location:{" "}
                  {
                    latestAlert.location
                  }
                </p>
              )}

              {latestAlert.severity && (
                <p>
                  Severity:{" "}
                  {
                    latestAlert.severity
                  }
                </p>
              )}

              {latestAlert.time && (
                <p>
                  Time:{" "}
                  {
                    latestAlert.time
                  }
                </p>
              )}

            </div>
          ) : (
            <div
              style={{
                marginTop:
                  "16px",

                padding:
                  "16px",

                borderRadius:
                  "12px",

                background:
                  "var(--app-surface)",

                color:
                  "var(--text-muted)",
              }}
            >
              ✅ No active traffic alerts.
            </div>
          )}

        </div>


        {/* =================================================
            SMART OPERATIONS
        ================================================= */}

        <div
          className="section-card"
          style={{
            marginBottom:
              "25px",
          }}
        >

          <h2>
            🚦 Traffic Intelligence
          </h2>



          <p
            style={{
              color:
                "var(--text-muted)",
              marginTop:
                "6px",
              marginBottom:
                "20px",
            }}
          >
            Live traffic optimization
            and recommendations.
          </p>

         {canAccessAI && (
  <>
    <SmartSignalStatus />
    <TrafficRecommendation />
  </>
)}



          {canAccessAI && (
            <>
              <div
  style={{
    marginTop: "20px",
    background:
      "var(--app-surface-2)",
    border:
      "1px solid var(--border)",
    borderRadius: "16px",
    padding: "20px",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent:
        "space-between",
      alignItems: "center",
      gap: "12px",
      flexWrap: "wrap",
    }}
  >

  
    <div>
      <h3
        style={{
          margin: 0,
          color:
            "var(--text-primary)",
        }}
      >
        🔮 Predictive Traffic Intelligence
      </h3>

      <p
        style={{
          margin:
            "6px 0 0",
          color:
            "var(--text-muted)",
          fontSize: "13px",
        }}
      >
        Traffic trend analysis from recent camera history.
      </p>
    </div>

    <span
      style={{
        padding:
          "6px 10px",
        borderRadius:
          "999px",
        background:
          "var(--accent-soft)",
        border:
          "1px solid var(--border)",
        color:
          "var(--accent)",
        fontSize: "11px",
        fontWeight: "800",
      }}
    >
      AI FORECAST
    </span>
  </div>

  {!predictiveTraffic ? (
    <div
      style={{
        marginTop:
          "16px",
        padding:
          "18px",
        borderRadius:
          "12px",
        background:
          "var(--app-surface)",
        border:
          "1px dashed var(--border)",
        color:
          "var(--text-muted)",
      }}
    >
      Predictive traffic data unavailable.
    </div>
  ) : (
    <>
      <div
        style={{
          display:
            "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap:
            "12px",
          marginTop:
            "18px",
        }}
      >
        <div className="card">
          <span>
            Current Vehicles
          </span>

          <h2>
            {
              predictiveTraffic
                .totalCurrentVehicles ??
              0
            }
          </h2>
        </div>

        <div className="card">
          <span>
            Predicted Congestion
          </span>

          <h2
            style={{
              color:
                predictiveTraffic.predictedCongestion ===
                "HIGH"
                  ? "#EF4444"
                  : predictiveTraffic.predictedCongestion ===
                    "MEDIUM"
                  ? "#F59E0B"
                  : "#22C55E",
            }}
          >
            {
              predictiveTraffic
                .predictedCongestion ||
              "LOW"
            }
          </h2>
        </div>

        <div className="card">
          <span>
            Predicted Risk
          </span>

          <h2
            style={{
              color:
                predictiveTraffic.predictedRisk ===
                "CRITICAL"
                  ? "#EF4444"
                  : predictiveTraffic.predictedRisk ===
                    "HIGH"
                  ? "#F97316"
                  : predictiveTraffic.predictedRisk ===
                    "MEDIUM"
                  ? "#F59E0B"
                  : "#22C55E",
            }}
          >
            {
              predictiveTraffic
                .predictedRisk ||
              "LOW"
            }
          </h2>
        </div>

        <div className="card">
          <span>
            Rising Cameras
          </span>

          <h2>
            {
              predictiveTraffic
                .risingCameraCount ??
              0
            }
          </h2>
        </div>
      </div>

      {predictiveTraffic.priorityCamera && (
        <div
          style={{
            marginTop:
              "15px",
            padding:
              "15px",
            borderRadius:
              "12px",
            background:
              "var(--app-surface)",
            border:
              "1px solid var(--border)",
          }}
        >
          <span
            style={{
              color:
                "var(--text-muted)",
              fontSize:
                "12px",
              fontWeight:
                "700",
            }}
          >
            PRIORITY CAMERA
          </span>

          <h3
            style={{
              margin:
                "6px 0 0",
              color:
                "var(--text-primary)",
            }}
          >
            {
              predictiveTraffic
                .priorityCamera
                .name
            }
          </h3>

          <p
            style={{
              margin:
                "5px 0 0",
              color:
                "var(--text-muted)",
              fontSize:
                "13px",
            }}
          >
            {
              predictiveTraffic
                .priorityCamera
                .location
            }
          </p>

          <p
            style={{
              margin:
                "10px 0 0",
              color:
                "var(--text-secondary)",
            }}
          >
            Trend:{" "}
            <strong
              style={{
                color:
                  predictiveTraffic
                    .priorityCamera
                    .trend ===
                  "RISING FAST"
                    ? "#EF4444"
                    : predictiveTraffic
                        .priorityCamera
                        .trend ===
                      "RISING"
                    ? "#F59E0B"
                    : "var(--text-primary)",
              }}
            >
              {
                predictiveTraffic
                  .priorityCamera
                  .trend
              }
            </strong>
          </p>
        </div>
      )}
    </>
  )}
</div>
            </>
          )}

        </div>


        {/* =================================================
            AI PERFORMANCE
            Government/Admin only
        ================================================= */}

        {canAccessAI && (
          <AIPerformanceCenter />
        )}


        {/* =================================================
            AI VISION ACCESS
            Government/Admin only
        ================================================= */}

        {canAccessAI && (
          <div
            className="section-card"
            style={{
              marginBottom:
                "25px",

              border:
                "1px solid rgba(59,130,246,.25)",
            }}
          >

            <div
              style={{
                display:
                  "flex",

                justifyContent:
                  "space-between",

                alignItems:
                  "center",

                gap:
                  "15px",

                flexWrap:
                  "wrap",
              }}
            >

              <div>
                <h2>
                  📹 AI Vision Center
                </h2>

                <p
                  style={{
                    color:
                      "var(--text-muted)",
                    marginTop:
                      "6px",
                  }}
                >
                  Authorized camera and
                  YOLO surveillance access.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    "/ai-vision";
                }}
                style={{
                  border:
                    "none",

                  background:
                    "#2563EB",

                  color:
                    "white",

                  padding:
                    "11px 16px",

                  borderRadius:
                    "10px",

                  cursor:
                    "pointer",

                  fontWeight:
                    "700",
                }}
              >
                Open AI Vision
              </button>

            </div>

          </div>
        )}


        {/* =================================================
            OPERATIONS STATUS
        ================================================= */}

        {canAccessAI &&
          (
            emergencyStatus ||
            incidentStatus
          ) && (
            <div
              className="section-card"
              style={{
                marginBottom:
                  "25px",
              }}
            >

              <h2>
                ⚙️ Operations Status
              </h2>

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(220px,1fr))",

                  gap:
                    "20px",

                  marginTop:
                    "18px",
                }}
              >

                <div className="card">
                  <h4>
                    Emergency Operations
                  </h4>

                  <h2>
                    {emergencyStatus
                      ? emergencyStatus.emergencyDetected
                        ? "ACTIVE"
                        : "NORMAL"
                      : "NO DATA"}
                  </h2>

                  <span
                    style={{
                      color:
                        emergencyStatus?.emergencyDetected
                          ? "#EF4444"
                          : "#22C55E",
                    }}
                  >
                    {emergencyStatus
                      ? emergencyStatus.emergencyDetected
                        ? "Response Running"
                        : "No Emergency"
                      : "Unavailable"}
                  </span>
                </div>


                <div className="card">
                  <h4>
                    Incident Monitoring
                  </h4>

                  <h2>
                    {incidentStatus
                      ? incidentStatus.incidentDetected
                        ? "ALERT"
                        : "NORMAL"
                      : "NO DATA"}
                  </h2>

                  <span
                    style={{
                      color:
                        incidentStatus?.incidentDetected
                          ? "#EF4444"
                          : "#22C55E",
                    }}
                  >
                    {incidentStatus
                      ? incidentStatus.incidentDetected
                        ? "Incident detected"
                        : "No active incident"
                      : "Unavailable"}
                  </span>
                </div>

              </div>

            </div>
          )}


        {/* =================================================
            TRAFFIC ANALYTICS
        ================================================= */}

        <div
          className="dashboard-grid"
          style={{
            marginBottom:
              "25px",
          }}
        >

          <div className="section-card">

            <h2>
              📊 Traffic Analytics
            </h2>

            <p
              style={{
                color:
                  "var(--text-muted)",
                marginTop:
                  "6px",
                marginBottom:
                  "18px",
              }}
            >
              Live traffic trends and
              congestion insights.
            </p>

            <div
              style={{
                background:
                  "var(--app-surface)",

                borderRadius:
                  "18px",

                padding:
                  "20px",

                border:
                  "1px solid var(--border)",
              }}
            >
              <TrafficChart />
            </div>

          </div>

        </div>


      </div>
    </MainLayout>
  );
}

export default Dashboard;