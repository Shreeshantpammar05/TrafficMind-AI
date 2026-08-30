import BackButton from "../components/BackButton";
import TrafficMap from "../components/TrafficMap";
import EmergencyPredictionPanel from "../components/EmergencyPredictionPanel";
import MainLayout from "../layouts/MainLayout";

import axios from "axios";
import {
  useEffect,
  useState,
} from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";


function normalizeLocationCoordinates(
  coordinates
) {
  if (
    !Array.isArray(coordinates) ||
    coordinates.length < 2
  ) {
    return null;
  }

  let longitude = Number(
    coordinates[0]
  );
  let latitude = Number(
    coordinates[1]
  );

  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude)
  ) {
    return null;
  }

  // Protect the common accidental [lat, lng] ordering.
  if (
    Math.abs(longitude) <= 90 &&
    Math.abs(latitude) > 90
  ) {
    [longitude, latitude] = [
      latitude,
      longitude,
    ];
  }

  if (
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    return null;
  }

  return [
    longitude,
    latitude,
  ];
}

function LocationAutocomplete({
  label,
  value,
  onChange,
  selectedLocation,
  onSelect,
  placeholder,
  showCurrentLocation = false,
  onCurrentLocation,
}) {
  const [
    suggestions,
    setSuggestions,
  ] = useState([]);

  const [
    searching,
    setSearching,
  ] = useState(false);

  const [
    open,
    setOpen,
  ] = useState(false);

  useEffect(() => {
    const query =
      String(value || "").trim();

    if (
      selectedLocation?.label &&
      selectedLocation.label === query
    ) {
      setSuggestions([]);
      setOpen(false);
      setSearching(false);

      return undefined;
    }

    if (query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setSearching(false);

      return undefined;
    }

    let cancelled = false;

    const timer =
      setTimeout(
        async () => {
          try {
            setSearching(true);

            const response =
              await axios.get(
                `${API_BASE}/api/routes/geocode`,
                {
                  headers: {
                    Authorization:
                      `Bearer ${localStorage.getItem(
                        "token"
                      )}`,
                  },

                  params: {
                    text:
                      query
                        .toLowerCase()
                        .includes(
                          "bengaluru"
                        ) ||
                      query
                        .toLowerCase()
                        .includes(
                          "bangalore"
                        )
                        ? query
                        : `${query}, Bengaluru, Karnataka, India`,
                  },
                }
              );

            if (cancelled) {
              return;
            }

            const features =
              Array.isArray(
                response.data
                  ?.features
              )
                ? response.data
                    .features
                : [];

            const items =
              features
                .map(
                  (
                    feature,
                    index
                  ) => {
                    const labelText =
                      feature
                        ?.properties
                        ?.display_name ||
                      feature
                        ?.properties
                        ?.name ||
                      feature?.name ||
                      feature
                        ?.display_name ||
                      "";

                    const coordinates =
                      normalizeLocationCoordinates(
                        feature
                          ?.geometry
                          ?.coordinates
                      );

                    if (
                      !labelText ||
                      !coordinates
                    ) {
                      return null;
                    }

                    return {
                      id:
                        feature
                          ?.properties
                          ?.place_id ||
                        feature?.id ||
                        `${labelText}-${index}`,

                      label:
                        String(
                          labelText
                        ).trim(),

                      coordinates,

                      raw: feature,
                    };
                  }
                )
                .filter(Boolean)
                .slice(0, 6);

            setSuggestions(
              items
            );

            setOpen(
              items.length > 0
            );
          } catch (error) {
            if (!cancelled) {
              console.error(
                "Location suggestion error:",
                error
                  ?.response
                  ?.data ||
                  error?.message
              );

              setSuggestions([]);
              setOpen(false);
            }
          } finally {
            if (!cancelled) {
              setSearching(false);
            }
          }
        },
        350
      );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    value,
    selectedLocation?.label,
  ]);

  const handleChange = (
    event
  ) => {
    const nextValue =
      event.target.value;

    onChange(nextValue);

    if (
      selectedLocation &&
      selectedLocation.label !==
        nextValue
    ) {
      onSelect(null);
    }

    setOpen(true);
  };

  const handleSelect = (
    event,
    item
  ) => {
    event.preventDefault();

    const coordinates =
      normalizeLocationCoordinates(
        item?.coordinates
      );

    if (!coordinates) {
      return;
    }

    onChange(item.label);

    onSelect({
      ...item,
      coordinates,
    });

    setSuggestions([]);
    setOpen(false);
    setSearching(false);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom:
            "8px",
        }}
      >
        <label
          style={{
            fontSize: "11px",
            fontWeight: "900",
            color:
              "var(--text-muted)",
            textTransform:
              "uppercase",
            letterSpacing:
              ".08em",
          }}
        >
          {label}
        </label>

        {selectedLocation && (
          <span
            style={{
              color:
                "#22C55E",
              fontSize: "10px",
              fontWeight:
                "900",
            }}
          >
            ✓ EXACT LOCATION
          </span>
        )}
      </div>

      {showCurrentLocation && (
        <button
          type="button"
          onClick={() => {
            onCurrentLocation?.();
            setSuggestions([]);
            setOpen(false);
          }}
          style={{
            marginBottom:
              "8px",
            border:
              "1px solid var(--border)",
            background:
              "var(--app-surface-2)",
            color:
              "var(--text-primary)",
            padding:
              "8px 11px",
            borderRadius:
              "9px",
            cursor:
              "pointer",
            fontWeight:
              "800",
            fontSize:
              "11px",
          }}
        >
          📍 Current Location
        </button>
      )}

      <div
        style={{
          position:
            "relative",
        }}
      >
        <span
          style={{
            position:
              "absolute",
            left: "12px",
            top: "50%",
            transform:
              "translateY(-50%)",
            zIndex: 2,
            pointerEvents:
              "none",
          }}
        >
          🔍
        </span>

        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={
            handleChange
          }
          onFocus={() => {
            if (
              suggestions.length
            ) {
              setOpen(true);
            }
          }}
          autoComplete="off"
          style={{
            width: "100%",
            boxSizing:
              "border-box",
            padding:
              "13px 42px 13px 36px",
            borderRadius:
              "11px",
            border:
              selectedLocation
                ? "1px solid rgba(34,197,94,.6)"
                : "1px solid var(--border)",
            background:
              "var(--app-surface-2)",
            color:
              "var(--text-primary)",
            outline: "none",
            fontWeight: "700",
          }}
        />

        {searching && (
          <span
            style={{
              position:
                "absolute",
              right: "12px",
              top: "50%",
              transform:
                "translateY(-50%)",
              fontSize:
                "11px",
              color:
                "var(--text-muted)",
            }}
          >
            Searching…
          </span>
        )}

        {selectedLocation &&
          !searching && (
            <span
              style={{
                position:
                  "absolute",
                right: "12px",
                top: "50%",
                transform:
                  "translateY(-50%)",
                color:
                  "#22C55E",
                fontWeight:
                  "900",
              }}
            >
              ✓
            </span>
          )}

        {open &&
          suggestions.length >
            0 && (
            <div
              style={{
                position:
                  "absolute",
                left: 0,
                right: 0,
                top:
                  "calc(100% + 6px)",
                zIndex:
                  3000,
                background:
                  "var(--app-surface)",
                border:
                  "1px solid var(--border-strong)",
                borderRadius:
                  "12px",
                boxShadow:
                  "0 18px 45px rgba(0,0,0,.45)",
                overflow:
                  "hidden",
                maxHeight:
                  "270px",
                overflowY:
                  "auto",
              }}
            >
              {suggestions.map(
                (item) => (
                  <button
                    key={
                      item.id
                    }
                    type="button"
                    onMouseDown={(
                      event
                    ) =>
                      handleSelect(
                        event,
                        item
                      )
                    }
                    style={{
                      display:
                        "block",
                      width:
                        "100%",
                      border:
                        "none",
                      borderBottom:
                        "1px solid var(--border)",
                      background:
                        "transparent",
                      color:
                        "var(--text-primary)",
                      textAlign:
                        "left",
                      padding:
                        "13px 14px",
                      cursor:
                        "pointer",
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          "12px",
                        fontWeight:
                          "800",
                        lineHeight:
                          "1.5",
                      }}
                    >
                      📍{" "}
                      {item.label}
                    </div>

                    <div
                      style={{
                        marginTop:
                          "4px",
                        fontSize:
                          "9px",
                        color:
                          "var(--text-muted)",
                      }}
                    >
                      Exact address • click to select
                    </div>
                  </button>
                )
              )}
            </div>
          )}
      </div>
    </div>
  );
}

function EmergencyResponse() {
  // =========================================================
  // WORKER EMERGENCY FORM
  // =========================================================

  const [emergencyType, setEmergencyType] =
    useState("Ambulance");

  const [start, setStart] =
    useState("");

  const [destination, setDestination] =
    useState("");

  const [selectedStartLocation, setSelectedStartLocation] =
    useState(null);

  const [selectedDestinationLocation, setSelectedDestinationLocation] =
    useState(null);

  const [result, setResult] =
    useState("");

  const [showMap, setShowMap] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  // =========================================================
  // ROUTE DATA
  // =========================================================

  const [startCoords, setStartCoords] =
    useState(null);

  const [endCoords, setEndCoords] =
    useState(null);

  const [routeGeometry, setRouteGeometry] =
    useState([]);

  const [routeSummary, setRouteSummary] =
    useState(null);

  const [nearbyServices, setNearbyServices] =
    useState([]);

  // =========================================================
  // PHASE 22 — EMERGENCY PRIORITY
  // =========================================================

  const [priorityData, setPriorityData] =
    useState(null);

  const [priorityLoading, setPriorityLoading] =
    useState(false);

  const [priorityError, setPriorityError] =
    useState("");

  // =========================================================
  // PHASE 24 — LIVE EMERGENCY DASHBOARD
  // =========================================================

  const [greenCorridorData, setGreenCorridorData] =
    useState(null);

  const [greenCorridorLoading, setGreenCorridorLoading] =
    useState(false);

  const [greenCorridorError, setGreenCorridorError] =
    useState("");

  // =========================================================
  // RESPONSIVE
  // =========================================================

  const [isMobile, setIsMobile] =
    useState(
      typeof window !== "undefined" &&
        window.innerWidth <= 760
    );

  // =========================================================
  // ACTIVE EMERGENCY
  // =========================================================
  //
  // Phase 19 uses the currently active
  // EmergencyEvent and its currentCameraId.
  //
  // This allows the prediction panel to work
  // for both:
  //
  // WORKER_DECLARED
  // AI_DETECTED
  //
  // without creating a second emergency system.
  // =========================================================

  const [activeEmergency, setActiveEmergency] =
    useState(null);

  const [activeEmergencyLoading, setActiveEmergencyLoading] =
    useState(true);

  // =========================================================
  // AUTH HEADERS
  // =========================================================

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem(
      "token"
    )}`,
  });

  // =========================================================
  // PHASE 22 — FETCH DYNAMIC PRIORITY
  // =========================================================

  const fetchEmergencyPriority =
    async (emergencyId) => {
      if (!emergencyId) {
        setPriorityData(null);
        return null;
      }

      try {
        setPriorityLoading(true);
        setPriorityError("");

        const response =
          await axios.get(
            `${API_BASE}/api/emergency/events/${emergencyId}/priority`,
            {
              headers:
                getAuthHeaders(),
            }
          );

        const priority =
          response.data?.priority ||
          null;

        setPriorityData(
          priority
        );

        return priority;
      } catch (error) {
        console.error(
          "Emergency priority fetch error:",
          error?.response?.data ||
            error?.message
        );

        setPriorityData(null);

        setPriorityError(
          error?.response?.data?.error ||
            "Priority intelligence unavailable."
        );

        return null;
      } finally {
        setPriorityLoading(
          false
        );
      }
    };


  // =========================================================
  // PHASE 24 — FETCH LIVE GREEN CORRIDOR
  // =========================================================

  const fetchGreenCorridor =
    async (emergencyId) => {
      if (!emergencyId) {
        setGreenCorridorData(null);
        return null;
      }

      try {
        setGreenCorridorLoading(true);
        setGreenCorridorError("");

        const response =
          await axios.get(
            `${API_BASE}/api/signal/green-corridor/${encodeURIComponent(
              emergencyId
            )}`,
            {
              headers:
                getAuthHeaders(),
            }
          );

        const corridor =
          response.data?.greenCorridor ||
          null;

        setGreenCorridorData(
          corridor
        );

        return corridor;
      } catch (error) {
        console.error(
          "Green corridor fetch error:",
          error?.response?.data ||
            error?.message
        );

        setGreenCorridorData(null);

        setGreenCorridorError(
          error?.response?.data?.error ||
            "Green corridor intelligence unavailable."
        );

        return null;
      } finally {
        setGreenCorridorLoading(
          false
        );
      }
    };

  // =========================================================
  // RESPONSIVE LISTENER
  // =========================================================

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(
        window.innerWidth <= 760
      );
    };

    handleResize();

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

  // =========================================================
  // FETCH ACTIVE EMERGENCY
  // =========================================================

  const fetchActiveEmergency = async (
    silent = false
  ) => {
    try {
      if (!silent) {
        setActiveEmergencyLoading(true);
      }

      const response =
        await axios.get(
          `${API_BASE}/api/emergency/events/active`,
          {
            headers:
              getAuthHeaders(),
          }
        );

      const event =
        response.data?.event ||
        null;

      setActiveEmergency(event);
    } catch (error) {
      console.log(
        "Active emergency fetch error:",
        error?.response?.data ||
          error?.message
      );

      setActiveEmergency(null);
    } finally {
      if (!silent) {
        setActiveEmergencyLoading(
          false
        );
      }
    }
  };


  // =========================================================
  // PHASE 22 — PRIORITY POLLING
  // =========================================================

  useEffect(() => {
    if (
      !activeEmergency?.emergencyId
    ) {
      setPriorityData(null);
      return undefined;
    }

    fetchEmergencyPriority(
      activeEmergency.emergencyId
    );

    const interval =
      setInterval(() => {
        fetchEmergencyPriority(
          activeEmergency.emergencyId
        );
      }, 15000);

    return () =>
      clearInterval(
        interval
      );
  }, [
    activeEmergency?.emergencyId,
  ]);


  // =========================================================
  // PHASE 24 — GREEN CORRIDOR POLLING
  // =========================================================

  useEffect(() => {
    if (
      !activeEmergency?.emergencyId
    ) {
      setGreenCorridorData(null);
      return undefined;
    }

    fetchGreenCorridor(
      activeEmergency.emergencyId
    );

    const interval =
      setInterval(() => {
        fetchGreenCorridor(
          activeEmergency.emergencyId
        );
      }, 10000);

    return () =>
      clearInterval(
        interval
      );
  }, [
    activeEmergency?.emergencyId,
  ]);

  // =========================================================
  // ACTIVE EMERGENCY POLLING
  // =========================================================

  useEffect(() => {
    fetchActiveEmergency();

    const interval =
      setInterval(() => {
        fetchActiveEmergency(true);
      }, 15000);

    return () =>
      clearInterval(interval);
  }, []);

  // =========================================================
  // GEOCODING
  // =========================================================

  const getCoordinates = async (
    place
  ) => {
    const response =
      await axios.get(
        `${API_BASE}/api/routes/geocode`,
        {
          headers:
            getAuthHeaders(),

          params: {
            text: place,
          },
        }
      );

    const features =
      response.data.features ||
      [];

    if (
      features.length === 0
    ) {
      throw new Error(
        "Location not found"
      );
    }

    const coordinates =
      features[0]?.geometry?.coordinates;

    if (
      !Array.isArray(coordinates) ||
      coordinates.length < 2
    ) {
      throw new Error(
        "Selected location has invalid coordinates"
      );
    }

    return [
      Number(coordinates[0]),
      Number(coordinates[1]),
    ];
  };

  // =========================================================
  // CURRENT LOCATION
  // =========================================================

  const useCurrentLocation = () => {
    if (
      !navigator.geolocation
    ) {
      setResult(
        "Browser location is not available. Please search for the start location."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          Number(
            position.coords.latitude
          );

        const longitude =
          Number(
            position.coords.longitude
          );

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          setResult(
            "Unable to read your current coordinates."
          );
          return;
        }

        const currentLocation = {
          id: "browser-current-location",
          label: "Current Location",
          coordinates: [
            longitude,
            latitude,
          ],
        };

        setStart(
          currentLocation.label
        );

        setSelectedStartLocation(
          currentLocation
        );

        setStartCoords(
          currentLocation.coordinates
        );

        setResult("");
      },
      (error) => {
        console.error(
          "Current location error:",
          error
        );

        setResult(
          "Unable to access your current location. Please allow location permission or search manually."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // =========================================================
  // EMERGENCY ROUTE GENERATION
  // =========================================================

  const generateResponse =
    async () => {
      const hasStartSelection =
        selectedStartLocation &&
        Array.isArray(
          selectedStartLocation.coordinates
        ) &&
        selectedStartLocation.coordinates.length >= 2 &&
        Number.isFinite(
          Number(
            selectedStartLocation.coordinates[0]
          )
        ) &&
        Number.isFinite(
          Number(
            selectedStartLocation.coordinates[1]
          )
        );

      const hasDestinationSelection =
        selectedDestinationLocation &&
        Array.isArray(
          selectedDestinationLocation.coordinates
        ) &&
        selectedDestinationLocation.coordinates.length >= 2 &&
        Number.isFinite(
          Number(
            selectedDestinationLocation.coordinates[0]
          )
        ) &&
        Number.isFinite(
          Number(
            selectedDestinationLocation.coordinates[1]
          )
        );

      if (!start || !destination) {
        setResult(
          "Please enter both start and destination."
        );

        return;
      }

      if (!hasStartSelection) {
        setResult(
          "Please select a Start Location from the suggestions."
        );

        return;
      }

      if (!hasDestinationSelection) {
        setResult(
          "Please select a Destination from the suggestions."
        );

        return;
      }

      try {
        setLoading(true);

        setShowMap(true);

        setResult("");
        setRouteGeometry([]);
        setRouteSummary(null);

        // -----------------------------------------------------
        // Phase 22:
        // Priority is calculated by the backend engine.
        // The worker form no longer hardcodes priority.
        // -----------------------------------------------------

        const priority = "CRITICAL";

        // -----------------------------------------------------
        // Start location
        // -----------------------------------------------------

        // Use the exact coordinates selected from autocomplete.
        // Do not geocode the text again here.
        const startCoordinate = [
          Number(
            selectedStartLocation.coordinates[0]
          ),
          Number(
            selectedStartLocation.coordinates[1]
          ),
        ];

        setStartCoords(
          startCoordinate
        );

        const longitude =
          Number(startCoordinate[0]);

        const latitude =
          Number(startCoordinate[1]);

        // -----------------------------------------------------
        // Nearby emergency services
        // -----------------------------------------------------

        let emergencyTypeTag =
          "hospital";

        if (
          emergencyType ===
          "Police Vehicle"
        ) {
          emergencyTypeTag =
            "police";
        }

        if (
          emergencyType ===
          "Fire Truck"
        ) {
          emergencyTypeTag =
            "fire_station";
        }

        try {
          const nearbyRes =
            await axios.post(
              `${API_BASE}/api/nearby-services`,
              {
                latitude,
                longitude,
                emergencyTypeTag,
              },
              {
                headers:
                  getAuthHeaders(),
              }
            );

          setNearbyServices(
            nearbyRes.data.elements?.slice(
              0,
              5
            ) || []
          );
        } catch (error) {
          console.log(
            "Nearby services not available:",
            error
          );

          setNearbyServices([]);
        }

        // -----------------------------------------------------
        // Destination
        // -----------------------------------------------------

        // Use the exact coordinates selected from autocomplete.
        // Do not geocode the text again here.
        const endCoordinate = [
          Number(
            selectedDestinationLocation.coordinates[0]
          ),
          Number(
            selectedDestinationLocation.coordinates[1]
          ),
        ];

        setEndCoords(
          endCoordinate
        );

        // -----------------------------------------------------
        // Route
        // -----------------------------------------------------

        const routeRes =
          await axios.post(
            `${API_BASE}/api/routes/directions`,
            {
              start:
                startCoordinate,

              end:
                endCoordinate,
            },
            {
              headers:
                getAuthHeaders(),
            }
          );

        const route =
          routeRes.data.route;

        if (!route) {
          throw new Error(
            "Route not found"
          );
        }

        // -----------------------------------------------------
        // Route geometry
        // -----------------------------------------------------

        if (!route?.geometry) {
          throw new Error(
            "Directions API returned no route geometry."
          );
        }

        setRouteGeometry(
          route.geometry
        );

        // -----------------------------------------------------
        // Route metrics
        // -----------------------------------------------------

        const distance = (
          route.summary.distance /
          1000
        ).toFixed(2);

        const duration = (
          route.summary.duration /
          60
        ).toFixed(0);

        let trafficStatus =
          "Low";

        if (duration > 60) {
          trafficStatus =
            "High";
        } else if (
          duration > 30
        ) {
          trafficStatus =
            "Medium";
        }

        setRouteSummary({
          distanceKm:
            Number(distance),
          durationMinutes:
            Number(duration),
          trafficStatus,
        });

        // -----------------------------------------------------
        // Phase 12:
        // Create persistent emergency event
        // -----------------------------------------------------

        const vehicleTypeMap = {
          Ambulance:
            "ambulance",

          "Fire Truck":
            "fire_truck",

          "Police Vehicle":
            "police_vehicle",
        };

        const vehicleType =
          vehicleTypeMap[
            emergencyType
          ];

        const emergencyRes =
          await axios.post(
            `${API_BASE}/api/emergency/events`,
            {
              vehicleType,

              startLocation: {
                name:
                  selectedStartLocation?.label ||
                  start,
                latitude:
                  startCoordinate[1],
                longitude:
                  startCoordinate[0],
              },

              destination: {
                name:
                  selectedDestinationLocation?.label ||
                  destination,
                latitude:
                  endCoordinate[1],
                longitude:
                  endCoordinate[0],
              },

              priority,

              confidence: 1,

              notes:
                `Worker-declared emergency route generated for ${emergencyType}.`,
            },
            {
              headers:
                getAuthHeaders(),
            }
          );

        const emergencyEvent =
          emergencyRes.data?.event;

        if (!emergencyEvent) {
          throw new Error(
            "Emergency event was not created"
          );
        }

        const calculatedPriority =
          await fetchEmergencyPriority(
            emergencyEvent.emergencyId
          );

        const finalPriority =
          calculatedPriority?.priority ||
          emergencyEvent.priority ||
          "CRITICAL";

        // -----------------------------------------------------
        // Update active emergency immediately
        // -----------------------------------------------------

        setActiveEmergency(
          emergencyEvent
        );

        // -----------------------------------------------------
        // Existing recommendation
        // -----------------------------------------------------

        setResult(
          `Emergency Route Generated

Emergency ID: ${emergencyEvent.emergencyId}

Vehicle: ${emergencyType}

Source: WORKER_DECLARED

From: ${start}

To: ${destination}

Priority: ${finalPriority}

Priority Score: ${
            calculatedPriority?.priorityScore ??
            emergencyEvent.priorityScore ??
            "N/A"
          }

Distance: ${distance} km

Estimated Time: ${duration} mins

Traffic Status: ${trafficStatus}

AI Recommendation:
Activate Green Corridor

Status:
${emergencyEvent.status}`
        );
      } catch (error) {
        console.log(
          "Emergency route error:",
          error.response?.data ||
            error.message
        );

        const backendMessage =
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "Unable to generate the emergency route.";

        setResult(
          `Route Generation Failed

${backendMessage}`
        );
      } finally {
        setLoading(false);
      }
    };

  // =========================================================
  // RENDER — PROFESSIONAL EMERGENCY RESPONSE CENTER
  // =========================================================

  const currentCamera =
    activeEmergency?.currentCameraId ||
    "—";

  const previousCamera =
    activeEmergency?.previousCameraId ||
    "—";

  const nextCamera =
    greenCorridorData?.nextCameraId ||
    "—";

  const emergencyPriority =
    priorityData?.priority ||
    activeEmergency?.priority ||
    "MEDIUM";

  const priorityScore =
    priorityData?.priorityScore ??
    activeEmergency?.priorityScore ??
    "—";

  const emergencyStatus =
    activeEmergency?.status ||
    "DETECTED";

  const priorityColor =
    emergencyPriority === "CRITICAL"
      ? "#EF4444"
      : emergencyPriority === "HIGH"
      ? "#F97316"
      : emergencyPriority === "MEDIUM"
      ? "#F59E0B"
      : "#22C55E";

  const hasGeneratedRoute =
    Boolean(
      routeSummary &&
      routeGeometry
    );

  return (
    <MainLayout>
      <BackButton />

      <div
        style={{
          maxWidth: "1460px",
          margin: "0 auto",
          paddingBottom: "40px",
        }}
      >
        {/* =====================================================
            HERO
        ====================================================== */}
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "20px",
            marginBottom: "16px",
            padding: isMobile
              ? "24px"
              : "30px 34px",
            background:
              "linear-gradient(135deg,#0B2F9F 0%,#1747D8 45%,#2563EB 72%,#11B5E4 100%)",
            boxShadow:
              "0 18px 55px rgba(37,99,235,.24)",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: "-90px",
              top: "-100px",
              width: "280px",
              height: "280px",
              borderRadius: "50%",
              background:
                "rgba(255,255,255,.08)",
              filter: "blur(2px)",
            }}
          />

          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "flex-end",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: "900",
                  letterSpacing:
                    ".12em",
                  textTransform:
                    "uppercase",
                  color:
                    "rgba(255,255,255,.82)",
                }}
              >
                TrafficMind AI • Emergency Operations
              </div>

              <h1
                style={{
                  margin:
                    "7px 0 7px",
                  fontSize:
                    isMobile
                      ? "28px"
                      : "36px",
                  lineHeight: "1.05",
                  color: "#FFFFFF",
                }}
              >
                Emergency Response Center
              </h1>

              <p
                style={{
                  margin: 0,
                  maxWidth: "730px",
                  color:
                    "rgba(255,255,255,.9)",
                  lineHeight: "1.55",
                  fontSize:
                    isMobile
                      ? "12px"
                      : "14px",
                }}
              >
                Intelligent routing, live emergency
                tracking, predictive camera handoff,
                and explainable AI decisions —
                in one focused operational workspace.
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
                  padding:
                    "8px 12px",
                  borderRadius:
                    "999px",
                  background:
                    "rgba(255,255,255,.12)",
                  border:
                    "1px solid rgba(255,255,255,.18)",
                  color: "#FFFFFF",
                  fontSize: "10px",
                  fontWeight: "900",
                }}
              >
                🟢 LIVE SYSTEM
              </span>

              <span
                style={{
                  padding:
                    "8px 12px",
                  borderRadius:
                    "999px",
                  background:
                    "rgba(220,38,38,.24)",
                  border:
                    "1px solid rgba(255,255,255,.18)",
                  color: "#FFFFFF",
                  fontSize: "10px",
                  fontWeight: "900",
                }}
              >
                🚑 EMERGENCY RESPONSE
              </span>
            </div>
          </div>
        </section>

        {/* =====================================================
            LIVE STATUS
        ====================================================== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              isMobile
                ? "repeat(2,1fr)"
                : "repeat(4,1fr)",
            gap: "10px",
            marginBottom:
              "16px",
          }}
        >
          {[
            [
              "AI ENGINE",
              "ACTIVE",
              "#22C55E",

            ],
            [
              "CURRENT CAMERA",
              currentCamera,
              "#3B82F6",

            ],
            [
              "NEXT CAMERA",
              nextCamera,
              "#8B5CF6",

            ],
            [
              "EMERGENCY STATUS",
              emergencyStatus,
              priorityColor,
              
            ],
          ].map(
            ([
              label,
              value,
              tone,
              icon,
            ]) => (
              <div
                key={label}
                className="section-card"
                style={{
                  padding:
                    "13px 14px",
                  borderRadius:
                    "13px",
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
                      fontSize:
                        "9px",
                      fontWeight:
                        "900",
                      letterSpacing:
                        ".08em",
                      color:
                        "var(--text-muted)",
                    }}
                  >
                    {label}
                  </span>

                  <span>
                    {icon}
                  </span>
                </div>

                <div
                  style={{
                    marginTop:
                      "6px",
                    color: tone,
                    fontSize:
                      "14px",
                    fontWeight:
                      "900",
                    whiteSpace:
                      "nowrap",
                    overflow:
                      "hidden",
                    textOverflow:
                      "ellipsis",
                  }}
                >
                  {value}
                </div>
              </div>
            )
          )}
        </div>

        {/* =====================================================
            ACTIVE EMERGENCY + NEXT CAMERA
        ====================================================== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              isMobile
                ? "1fr"
                : "1.12fr .88fr",
            gap: "14px",
            marginBottom:
              "16px",
          }}
        >
          <section
            className="section-card"
            style={{
              padding:
                isMobile
                  ? "18px"
                  : "21px",
              border:
                activeEmergency
                  ? "1px solid rgba(239,68,68,.35)"
                  : "1px solid var(--border)",
              boxShadow:
                activeEmergency
                  ? "0 14px 35px rgba(239,68,68,.06)"
                  : "none",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "flex-start",
                gap:
                  "12px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize:
                      "10px",
                    fontWeight:
                      "900",
                    color:
                      "#EF4444",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      ".1em",
                  }}
                >
                  Active Emergency
                </div>

                <h2
                  style={{
                    margin:
                      "6px 0 4px",
                    fontSize:
                      isMobile
                        ? "21px"
                        : "26px",
                  }}
                >
                  {activeEmergency?.vehicleType ||
                    "No active emergency"}
                </h2>

                <div
                  style={{
                    fontSize:
                      "10px",
                    color:
                      "var(--text-muted)",
                  }}
                >
                  {activeEmergency?.emergencyId ||
                    "Waiting for emergency event"}
                </div>
              </div>

              <div
                style={{
                  display:
                    "flex",
                  gap:
                    "6px",
                  flexWrap:
                    "wrap",
                  justifyContent:
                    "flex-end",
                }}
              >
                <span
                  style={{
                    padding:
                      "7px 10px",
                    borderRadius:
                      "8px",
                    background:
                      `${priorityColor}16`,
                    color:
                      priorityColor,
                    fontSize:
                      "9px",
                    fontWeight:
                      "900",
                  }}
                >
                  {emergencyPriority}
                </span>

                <span
                  style={{
                    padding:
                      "7px 10px",
                    borderRadius:
                      "8px",
                    background:
                      "rgba(59,130,246,.10)",
                    color:
                      "#3B82F6",
                    fontSize:
                      "9px",
                    fontWeight:
                      "900",
                  }}
                >
                  {emergencyStatus}
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop:
                  "16px",
                display:
                  "grid",
                gridTemplateColumns:
                  isMobile
                    ? "1fr"
                    : "repeat(3,1fr)",
                gap:
                  "9px",
              }}
            >
              {[
                [
                  "Previous Camera",
                  previousCamera,
                ],
                [
                  "Current Camera",
                  currentCamera,
                ],
                [
                  "Detection Confidence",
                  Number.isFinite(
                    Number(
                      activeEmergency?.confidence
                    )
                  )
                    ? `${(
                        Number(
                          activeEmergency.confidence
                        ) * 100
                      ).toFixed(1)}%`
                    : "N/A",
                ],
              ].map(
                ([
                  label,
                  value,
                ]) => (
                  <div
                    key={label}
                    style={{
                      padding:
                        "12px",
                      borderRadius:
                        "10px",
                      background:
                        "var(--app-surface-2)",
                      border:
                        "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          "8px",
                        fontWeight:
                          "900",
                        color:
                          "var(--text-muted)",
                        textTransform:
                          "uppercase",
                        letterSpacing:
                          ".06em",
                      }}
                    >
                      {label}
                    </div>

                    <div
                      style={{
                        marginTop:
                          "6px",
                        fontSize:
                          "14px",
                        fontWeight:
                          "900",
                      }}
                    >
                      {value}
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          <section
            className="section-card"
            style={{
              padding:
                isMobile
                  ? "18px"
                  : "21px",
              background:
                "linear-gradient(145deg,var(--app-surface),rgba(76,29,149,.10))",
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
                <div
                  style={{
                    fontSize:
                      "10px",
                    fontWeight:
                      "900",
                    color:
                      "#6cd880",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      ".1em",
                  }}
                >
                  Predictive Intelligence
                </div>

                <h2
                  style={{
                    margin:
                      "6px 0 0",
                    fontSize:
                      "18px",
                  }}
                >
                  Next-Camera Prediction
                </h2>
              </div>

              <span
                style={{
                  padding:
                    "7px 10px",
                  borderRadius:
                    "999px",
                  background:
                    "rgba(34,197,94,.10)",
                  color:
                    "#22C55E",
                  fontSize:
                    "9px",
                  fontWeight:
                    "900",
                }}
              >
                LIVE
              </span>
            </div>

            <div
              style={{
                marginTop:
                  "19px",
                display:
                  "grid",
                gridTemplateColumns:
                  "1fr auto 1fr",
                alignItems:
                  "center",
                gap:
                  "9px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize:
                      "8px",
                    color:
                      "var(--text-muted)",
                    fontWeight:
                      "900",
                  }}
                >
                  CURRENT
                </div>

                <div
                  style={{
                    marginTop:
                      "5px",
                    fontSize:
                      "18px",
                    fontWeight:
                      "900",
                  }}
                >
                  {currentCamera}
                </div>
              </div>

              <div
                style={{
                  color:
                    "#8B5CF6",
                  fontSize:
                    "20px",
                  fontWeight:
                    "900",
                }}
              >
                →
              </div>

              <div
                style={{
                  textAlign:
                    "right",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "8px",
                    color:
                      "var(--text-muted)",
                    fontWeight:
                      "900",
                  }}
                >
                  PREDICTED NEXT
                </div>

                <div
                  style={{
                    marginTop:
                      "5px",
                    fontSize:
                      "18px",
                    fontWeight:
                      "900",
                    color:
                      "#8B5CF6",
                  }}
                >
                  {nextCamera}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop:
                  "18px",
                height:
                  "6px",
                borderRadius:
                  "999px",
                background:
                  "rgba(139,92,246,.13)",
                overflow:
                  "hidden",
              }}
            >
              <div
                style={{
                  height:
                    "100%",
                  width:
                    nextCamera === "—"
                      ? "12%"
                      : "96%",
                  background:
                    "#8B5CF6",
                  borderRadius:
                    "999px",
                }}
              />
            </div>
          </section>
        </div>

        {/* =====================================================
            PHASE 22 — INTELLIGENCE
        ====================================================== */}
        {!activeEmergencyLoading &&
          activeEmergency && (
            <section
              className="section-card"
              style={{
                marginBottom:
                  "16px",
                padding:
                  isMobile
                    ? "18px"
                    : "21px",
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
                    "12px",
                  flexWrap:
                    "wrap",
                }}
              >
                <div>
                 

                  <h2
                    style={{
                      margin:
                        "6px 0 4px",
                    }}
                  >
                    Emergency Intelligence
                  </h2>

                  <p
                    style={{
                      margin: 0,
                      fontSize:
                        "10px",
                      color:
                        "var(--text-muted)",
                    }}
                  >
                    Explainable priority decision.
                  </p>
                </div>

                <span
                  style={{
                    padding:
                      "8px 12px",
                    borderRadius:
                      "10px",
                    background:
                      `${priorityColor}14`,
                    color:
                      priorityColor,
                    fontSize:
                      "11px",
                    fontWeight:
                      "900",
                  }}
                >
                  {emergencyPriority} PRIORITY
                </span>
              </div>

              {priorityLoading ? (
                <div
                  style={{
                    marginTop:
                      "15px",
                    padding:
                      "15px",
                    borderRadius:
                      "11px",
                    background:
                      "var(--app-surface-2)",
                    color:
                      "var(--text-muted)",
                    fontSize:
                      "11px",
                  }}
                >
                  Calculating live emergency priority...
                </div>
              ) : priorityData ? (
                <div
                  style={{
                    marginTop:
                      "15px",
                    display:
                      "grid",
                    gridTemplateColumns:
                      isMobile
                        ? "1fr"
                        : "1fr 2fr",
                    gap:
                      "10px",
                  }}
                >
                  <div
                    style={{
                      padding:
                        "15px",
                      borderRadius:
                        "11px",
                      background:
                        "var(--app-surface-2)",
                      border:
                        "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          "8px",
                        fontWeight:
                          "900",
                        color:
                          "var(--text-muted)",
                        textTransform:
                          "uppercase",
                      }}
                    >
                      Priority Score
                    </div>

                    <div
                      style={{
                        marginTop:
                          "7px",
                        fontSize:
                          "34px",
                        fontWeight:
                          "900",
                        color:
                          priorityColor,
                      }}
                    >
                      {priorityScore}
                      <span
                        style={{
                          fontSize:
                            "13px",
                          color:
                            "var(--text-muted)",
                        }}
                      >
                        /100
                      </span>
                    </div>

                    <div
                      style={{
                        marginTop:
                          "9px",
                        height:
                          "6px",
                        borderRadius:
                          "999px",
                        background:
                          "var(--border)",
                        overflow:
                          "hidden",
                      }}
                    >
                      <div
                        style={{
                          width:
                            `${Math.max(
                              0,
                              Math.min(
                                100,
                                Number(
                                  priorityScore
                                ) || 0
                              )
                            )}%`,
                          height:
                            "100%",
                          background:
                            priorityColor,
                          borderRadius:
                            "999px",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      padding:
                        "15px",
                      borderRadius:
                        "11px",
                      background:
                        "var(--app-surface-2)",
                      border:
                        "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        fontSize:
                          "8px",
                        fontWeight:
                          "900",
                        color:
                          "var(--text-muted)",
                        textTransform:
                          "uppercase",
                      }}
                    >
                      AI Reasoning
                    </div>

                    <div
                      style={{
                        marginTop:
                          "8px",
                        display:
                          "grid",
                        gap:
                          "7px",
                        fontSize:
                          "11px",
                        color:
                          "var(--text-secondary)",
                      }}
                    >
                      {(
                        priorityData.reasons ||
                        []
                      )
                        .slice(0,5)
                        .map(
                          (
                            reason,
                            index
                          ) => (
                            <div
                              key={`${reason}-${index}`}
                            >
                              <span
                                style={{
                                  color:
                                    "#22C55E",
                                  fontWeight:
                                    "900",
                                }}
                              >
                                ✓
                              </span>{" "}
                              {reason}
                            </div>
                          )
                        )}
                    </div>
                  </div>
                </div>
              ) : null}
            </section>
          )}

        {/* =====================================================
            PHASE 24 — LIVE CORRIDOR
        ====================================================== */}
        {!activeEmergencyLoading &&
          activeEmergency && (
            <section
              className="section-card"
              style={{
                marginBottom:
                  "16px",
                padding:
                  isMobile
                    ? "18px"
                    : "21px",
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
                    "10px",
                  flexWrap:
                    "wrap",
                }}
              >
                <div>

                  <h2
                    style={{
                      margin:
                        "6px 0 0",
                    }}
                  >
                    {activeEmergency.emergencyId}
                  </h2>
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    gap:
                      "7px",
                  }}
                >
                  <span
                    style={{
                      padding:
                        "7px 10px",
                      borderRadius:
                        "999px",
                      border:
                        "1px solid var(--border)",
                      fontSize:
                        "9px",
                      fontWeight:
                        "900",
                    }}
                  >
                    {emergencyStatus}
                  </span>

                  <span
                    style={{
                      padding:
                        "7px 10px",
                      borderRadius:
                        "999px",
                      background:
                        `${priorityColor}13`,
                      color:
                        priorityColor,
                      fontSize:
                        "9px",
                      fontWeight:
                        "900",
                    }}
                  >
                    {emergencyPriority}
                  </span>
                </div>
              </div>

              <div
                style={{
                  marginTop:
                    "14px",
                  display:
                    "grid",
                  gridTemplateColumns:
                    isMobile
                      ? "repeat(2,1fr)"
                      : "repeat(4,1fr)",
                  gap:
                    "9px",
                }}
              >
                {[
                  [
                    "CURRENT",
                    currentCamera,
                  ],
                  [
                    "PREVIOUS",
                    previousCamera,
                  ],
                  [
                    "NEXT EXPECTED",
                    nextCamera,
                  ],
                  [
                    "ETA",
                    greenCorridorData?.etaSeconds !=
                    null
                      ? `${greenCorridorData.etaSeconds}s`
                      : "N/A",
                  ],
                ].map(
                  ([
                    label,
                    value,
                  ]) => (
                    <div
                      key={label}
                      style={{
                        padding:
                          "11px",
                        borderRadius:
                          "10px",
                        background:
                          "var(--app-surface-2)",
                        border:
                          "1px solid var(--border)",
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            "8px",
                          fontWeight:
                            "900",
                          color:
                            "var(--text-muted)",
                        }}
                      >
                        {label}
                      </div>

                      <div
                        style={{
                          marginTop:
                            "6px",
                          fontSize:
                            "13px",
                          fontWeight:
                            "900",
                        }}
                      >
                        {value}
                      </div>
                    </div>
                  )
                )}
              </div>

              {greenCorridorData && (
                <div
                  style={{
                    marginTop:
                      "11px",
                    padding:
                      "13px",
                    borderRadius:
                      "11px",
                    background:
                      "var(--app-surface-2)",
                    border:
                      "1px solid var(--border)",
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
                        "10px",
                      flexWrap:
                        "wrap",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize:
                            "8px",
                          fontWeight:
                            "900",
                          color:
                            "var(--text-muted)",
                          textTransform:
                            "uppercase",
                        }}
                      >
                        Green Corridor Recommendation
                      </div>

                      <div
                        style={{
                          marginTop:
                            "5px",
                          fontSize:
                            "15px",
                          fontWeight:
                            "900",
                        }}
                      >
                        {greenCorridorData.recommendation ||
                          "HOLD_NORMAL"}
                      </div>
                    </div>

                    <div
                      style={{
                        padding:
                          "8px 10px",
                        borderRadius:
                          "9px",
                        border:
                          "1px solid var(--border)",
                        fontSize:
                          "9px",
                        fontWeight:
                          "900",
                      }}
                    >
                      Signal{" "}
                      {greenCorridorData.signalTime ??
                        "N/A"}s
                    </div>
                  </div>

                  {(
                    greenCorridorData.corridorCameras ||
                    []
                  ).length > 0 && (
                    <div
                      style={{
                        display:
                          "flex",
                        gap:
                          "8px",
                        marginTop:
                          "12px",
                        overflowX:
                          "auto",
                        paddingBottom:
                          "3px",
                      }}
                    >
                      {(
                        greenCorridorData.corridorCameras ||
                        []
                      ).map(
                        (camera) => (
                          <div
                            key={`${camera.cameraId}-${camera.role}`}
                            style={{
                              minWidth:
                                "135px",
                              padding:
                                "10px",
                              borderRadius:
                                "10px",
                              background:
                                camera.role ===
                                "CURRENT"
                                  ? "rgba(239,68,68,.08)"
                                  : camera.role ===
                                    "NEXT_EXPECTED"
                                  ? "rgba(139,92,246,.08)"
                                  : "var(--app-surface-2)",
                              border:
                                "1px solid var(--border)",
                            }}
                          >
                            <div
                              style={{
                                fontSize:
                                  "8px",
                                fontWeight:
                                  "900",
                                color:
                                  "var(--text-muted)",
                              }}
                            >
                              {String(
                                camera.role ||
                                  "CAMERA"
                              ).replaceAll(
                                "_",
                                " "
                              )}
                            </div>

                            <div
                              style={{
                                marginTop:
                                  "4px",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  "900",
                              }}
                            >
                              {camera.cameraId}
                            </div>

                            <div
                              style={{
                                marginTop:
                                  "4px",
                                fontSize:
                                  "9px",
                                color:
                                  "var(--text-muted)",
                              }}
                            >
                              {camera.action ||
                                "HOLD_NORMAL"}{" "}
                              •{" "}
                              {camera.etaSeconds ??
                                0}s
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

        {/* =====================================================
            ROUTE GENERATOR + SUMMARY
        ====================================================== */}
        <section
          className="section-card"
          style={{
            marginBottom:
              "16px",
            padding:
              isMobile
                ? "18px"
                : "21px",
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
                "12px",
              flexWrap:
                "wrap",
              marginBottom:
                "16px",
            }}
          >
            <div>
              

              <h2
                style={{
                  margin:
                    "6px 0 3px",
                }}
              >
                Emergency Route Generator
              </h2>

              <p
                style={{
                  margin: 0,
                  fontSize:
                    "10px",
                  color:
                    "var(--text-muted)",
                }}
              >
                Select exact locations, then generate
                the emergency response route.
              </p>
            </div>

            {hasGeneratedRoute && (
              <span
                style={{
                  padding:
                    "8px 11px",
                  borderRadius:
                    "999px",
                  background:
                    "rgba(34,197,94,.10)",
                  border:
                    "1px solid rgba(34,197,94,.24)",
                  color:
                    "#22C55E",
                  fontSize:
                    "9px",
                  fontWeight:
                    "900",
                }}
              >
                ✓ ROUTE GENERATED
              </span>
            )}
          </div>

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                isMobile
                  ? "1fr"
                  : "1fr 1fr",
              gap:
                "12px",
            }}
          >
            <div
              style={{
                gridColumn:
                  isMobile
                    ? "auto"
                    : "1 / -1",
              }}
            >
              <label
                style={{
                  fontSize:
                    "9px",
                  fontWeight:
                    "900",
                  color:
                    "var(--text-muted)",
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    ".08em",
                }}
              >
                Emergency Vehicle
              </label>

              <select
                value={
                  emergencyType
                }
                onChange={(e) =>
                  setEmergencyType(
                    e.target.value
                  )
                }
                style={{
                  width:
                    "100%",
                  marginTop:
                    "7px",
                  padding:
                    "12px",
                  borderRadius:
                    "10px",
                  border:
                    "1px solid var(--border)",
                  background:
                    "var(--app-surface-2)",
                  color:
                    "var(--text-primary)",
                  fontWeight:
                    "800",
                }}
              >
                <option value="Ambulance">
                  🚑 Ambulance
                </option>

                <option value="Fire Truck">
                  🚒 Fire Truck
                </option>

                <option value="Police Vehicle">
                  🚓 Police Vehicle
                </option>
              </select>
            </div>

            <LocationAutocomplete
              label="Start Location"
              value={start}
              onChange={(value) => {
                setStart(value);

                if (
                  selectedStartLocation &&
                  selectedStartLocation.label !==
                    value
                ) {
                  setSelectedStartLocation(
                    null
                  );
                  setStartCoords(null);
                  setRouteGeometry([]);
                  setRouteSummary(null);
                  setResult("");
                }
              }}
              selectedLocation={
                selectedStartLocation
              }
              onSelect={
                setSelectedStartLocation
              }
              placeholder="Search exact start address"
              showCurrentLocation
              onCurrentLocation={
                useCurrentLocation
              }
            />

            <LocationAutocomplete
              label="Destination"
              value={destination}
              onChange={(value) => {
                setDestination(value);

                if (
                  selectedDestinationLocation &&
                  selectedDestinationLocation.label !==
                    value
                ) {
                  setSelectedDestinationLocation(
                    null
                  );
                  setEndCoords(null);
                  setRouteGeometry([]);
                  setRouteSummary(null);
                  setResult("");
                }
              }}
              selectedLocation={
                selectedDestinationLocation
              }
              onSelect={
                setSelectedDestinationLocation
              }
              placeholder="Search exact destination address"
            />
          </div>

          <div
            style={{
              marginTop:
                "13px",
              padding:
                "10px 12px",
              borderRadius:
                "10px",
              background:
                selectedStartLocation &&
                selectedDestinationLocation
                  ? "rgba(34,197,94,.07)"
                  : "var(--app-surface-2)",
              border:
                selectedStartLocation &&
                selectedDestinationLocation
                  ? "1px solid rgba(34,197,94,.18)"
                  : "1px solid var(--border)",
              fontSize:
                "10px",
              color:
                selectedStartLocation &&
                selectedDestinationLocation
                  ? "#22C55E"
                  : "var(--text-muted)",
              fontWeight:
                "700",
            }}
          >
            {selectedStartLocation &&
            selectedDestinationLocation
              ? "✓ Both exact map locations are locked. Routing will use these coordinates."
              : "Select one exact result for Start and one exact result for Destination."}
          </div>

          <button
            onClick={
              generateResponse
            }
            disabled={
              loading ||
              !selectedStartLocation ||
              !selectedDestinationLocation
            }
            style={{
              marginTop:
                "13px",
              width:
                isMobile
                  ? "100%"
                  : "220px",
              padding:
                "13px 18px",
              border:
                "none",
              borderRadius:
                "10px",
              background:
                loading ||
                !selectedStartLocation ||
                !selectedDestinationLocation
                  ? "#4B5563"
                  : "#DC2626",
              color:
                "#FFFFFF",
              cursor:
                loading ||
                !selectedStartLocation ||
                !selectedDestinationLocation
                  ? "not-allowed"
                  : "pointer",
              fontWeight:
                "900",
              boxShadow:
                "0 10px 24px rgba(220,38,38,.18)",
            }}
          >
            {loading
              ? "⏳ Generating Route..."
              : "🚨 START EMERGENCY"}
          </button>
        </section>

        {/* =====================================================
            ROUTE SUMMARY
        ====================================================== */}
        {routeSummary && (
          <section
            className="section-card"
            style={{
              marginBottom:
                "16px",
              padding:
                isMobile
                  ? "18px"
                  : "21px",
              border:
                "1px solid rgba(34,197,94,.25)",
              background:
                "linear-gradient(145deg,var(--app-surface),rgba(20,83,45,.10))",
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
                  "10px",
                flexWrap:
                  "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize:
                      "9px",
                    color:
                      "#22C55E",
                    fontWeight:
                      "900",
                    letterSpacing:
                      ".1em",
                    textTransform:
                      "uppercase",
                  }}
                >
                  ✓ Route Generated
                </div>

                <h2
                  style={{
                    margin:
                      "6px 0 0",
                  }}
                >
                  Recommended Emergency Route
                </h2>
              </div>

              <div
                style={{
                  color:
                    priorityColor,
                  fontWeight:
                    "900",
                  fontSize:
                    "10px",
                }}
              >
                {emergencyPriority} PRIORITY
              </div>
            </div>

            <div
              style={{
                marginTop:
                  "14px",
                display:
                  "grid",
                gridTemplateColumns:
                  isMobile
                    ? "repeat(2,1fr)"
                    : "repeat(4,1fr)",
                gap:
                  "9px",
              }}
            >
              {[
                [
                  "DISTANCE",
                  `${routeSummary.distanceKm} km`,
                  "🛣️",
                ],
                [
                  "EST. TIME",
                  `${routeSummary.durationMinutes} mins`,
                  "⏱️",
                ],
                [
                  "TRAFFIC",
                  routeSummary.trafficStatus,
                  "🚦",
                ],
                [
                  "PRIORITY",
                  `${priorityScore}/100`,
                  "🧠",
                ],
              ].map(
                ([
                  label,
                  value,
                  icon,
                ]) => (
                  <div
                    key={label}
                    style={{
                      padding:
                        "13px",
                      borderRadius:
                        "10px",
                      background:
                        "var(--app-surface-2)",
                      border:
                        "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        fontSize:
                          "8px",
                        color:
                          "var(--text-muted)",
                        fontWeight:
                          "900",
                      }}
                    >
                      <span>
                        {label}
                      </span>
                      <span>
                        {icon}
                      </span>
                    </div>

                    <div
                      style={{
                        marginTop:
                          "7px",
                        fontSize:
                          "18px",
                        fontWeight:
                          "900",
                      }}
                    >
                      {value}
                    </div>
                  </div>
                )
              )}
            </div>

            <div
              style={{
                marginTop:
                  "10px",
                padding:
                  "12px 14px",
                borderRadius:
                  "10px",
                background:
                  "rgba(34,197,94,.07)",
                border:
                  "1px solid rgba(34,197,94,.18)",
              }}
            >
              <div
                style={{
                  fontSize:
                    "8px",
                  fontWeight:
                    "900",
                  color:
                    "var(--text-muted)",
                  textTransform:
                    "uppercase",
                }}
              >
                AI Recommendation
              </div>

              <div
                style={{
                  marginTop:
                    "5px",
                  color:
                    "#22C55E",
                  fontSize:
                    "14px",
                  fontWeight:
                    "900",
                }}
              >
                Activate Green Corridor
              </div>
            </div>
          </section>
        )}

        {/* =====================================================
            ROUTE STATUS
        ====================================================== */}
        {result && (
          <section
            className="section-card"
            style={{
              marginBottom:
                "16px",
              padding:
                isMobile
                  ? "18px"
                  : "21px",
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
                marginBottom:
                  "11px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize:
                      "9px",
                    fontWeight:
                      "900",
                    color:
                      result.includes(
                        "Failed"
                      )
                        ? "#EF4444"
                        : "#22C55E",
                    letterSpacing:
                      ".1em",
                    textTransform:
                      "uppercase",
                  }}
                >
                  🧭 Operation Result
                </div>

                <h2
                  style={{
                    margin:
                      "6px 0 0",
                  }}
                >
                  Emergency Route Status
                </h2>
              </div>

              <span
                style={{
                  padding:
                    "7px 11px",
                  borderRadius:
                    "999px",
                  background:
                    result.includes(
                      "Failed"
                    )
                      ? "rgba(239,68,68,.12)"
                      : "rgba(34,197,94,.12)",
                  color:
                    result.includes(
                      "Failed"
                    )
                      ? "#EF4444"
                      : "#22C55E",
                  fontSize:
                    "9px",
                  fontWeight:
                    "900",
                }}
              >
                {result.includes(
                  "Failed"
                )
                  ? "FAILED"
                  : "GENERATED"}
              </span>
            </div>

            <div
              style={{
                padding:
                  "13px",
                borderRadius:
                  "11px",
                background:
                  "var(--app-surface-2)",
                border:
                  "1px solid var(--border)",
              }}
            >
              <pre
                style={{
                  whiteSpace:
                    "pre-wrap",
                  fontFamily:
                    "inherit",
                  color:
                    "var(--text-secondary)",
                  lineHeight:
                    "1.7",
                  fontSize:
                    "11px",
                  margin: 0,
                }}
              >
                {result}
              </pre>
            </div>
          </section>
        )}

        {/* =====================================================
            NEARBY SERVICES
        ====================================================== */}
        {nearbyServices.length >
          0 && (
          <section
            className="section-card"
            style={{
              marginBottom:
                "16px",
              padding:
                isMobile
                  ? "18px"
                  : "21px",
            }}
          >
            <div
              style={{
                fontSize:
                  "9px",
                fontWeight:
                  "900",
                color:
                  "#22C55E",
                letterSpacing:
                  ".1em",
                textTransform:
                  "uppercase",
              }}
            >
              🏥 Response Support
            </div>

            <h2
              style={{
                margin:
                  "6px 0 3px",
              }}
            >
              Nearby Emergency Services
            </h2>

            <p
              style={{
                margin: 0,
                fontSize:
                  "10px",
                color:
                  "var(--text-muted)",
              }}
            >
              Services discovered near the exact
              selected emergency start location.
            </p>

            <div
              style={{
                marginTop:
                  "12px",
                display:
                  "grid",
                gridTemplateColumns:
                  isMobile
                    ? "1fr"
                    : "repeat(3,1fr)",
                gap:
                  "9px",
              }}
            >
              {nearbyServices
                .slice(0,6)
                .map(
                  (
                    service,
                    index
                  ) => (
                    <div
                      key={index}
                      style={{
                        padding:
                          "12px",
                        borderRadius:
                          "10px",
                        background:
                          "var(--app-surface-2)",
                        border:
                          "1px solid var(--border)",
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            "11px",
                          fontWeight:
                            "900",
                        }}
                      >
                        {service.tags
                          ?.name ||
                          "Emergency Service"}
                      </div>

                      <div
                        style={{
                          marginTop:
                            "4px",
                          fontSize:
                            "9px",
                          color:
                            "var(--text-muted)",
                        }}
                      >
                        Response support
                      </div>
                    </div>
                  )
                )}
            </div>
          </section>
        )}

        {/* =====================================================
            MAP
        ====================================================== */}
        {showMap && (
          <section
            className="section-card"
            style={{
              padding:
                isMobile
                  ? "18px"
                  : "21px",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "flex-end",
                gap:
                  "10px",
                flexWrap:
                  "wrap",
                marginBottom:
                  "14px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize:
                      "9px",
                    fontWeight:
                      "900",
                    color:
                      "#3B82F6",
                    letterSpacing:
                      ".1em",
                    textTransform:
                      "uppercase",
                  }}
                >
                  🗺️ Operational Map
                </div>

                <h2
                  style={{
                    margin:
                      "6px 0 3px",
                  }}
                >
                  Emergency Route Map
                </h2>

                <p
                  style={{
                    margin: 0,
                    fontSize:
                      "10px",
                    color:
                      "var(--text-muted)",
                  }}
                >
                  Route, emergency points, live traffic,
                  services, and the predictive camera corridor.
                </p>
              </div>

              <div
                style={{
                  display:
                    "flex",
                  gap:
                    "7px",
                  flexWrap:
                    "wrap",
                }}
              >
                <span
                  style={{
                    padding:
                      "7px 9px",
                    borderRadius:
                      "999px",
                    background:
                      "rgba(34,197,94,.10)",
                    color:
                      "#22C55E",
                    fontSize:
                      "8px",
                    fontWeight:
                      "900",
                  }}
                >
                  🟢 ROUTE
                </span>

                <span
                  style={{
                    padding:
                      "7px 9px",
                    borderRadius:
                      "999px",
                    background:
                      "rgba(59,130,246,.10)",
                    color:
                      "#3B82F6",
                    fontSize:
                      "8px",
                    fontWeight:
                      "900",
                  }}
                >
                  📹 CAMERAS
                </span>

                <span
                  style={{
                    padding:
                      "7px 9px",
                    borderRadius:
                      "999px",
                    background:
                      "rgba(239,68,68,.10)",
                    color:
                      "#EF4444",
                    fontSize:
                      "8px",
                    fontWeight:
                      "900",
                  }}
                >
                  🚨 INCIDENTS
                </span>
              </div>
            </div>

            <TrafficMap
              startCoords={
                startCoords
              }
              endCoords={
                endCoords
              }
              nearbyServices={
                nearbyServices
              }
              routeGeometry={
                routeGeometry
              }
            />
          </section>
        )}
      </div>
    </MainLayout>
  );
}

export default EmergencyResponse;