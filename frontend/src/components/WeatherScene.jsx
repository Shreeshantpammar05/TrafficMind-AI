import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./WeatherScene.css";

function WeatherScene({
  weather,
  location,
  locationName,
  locationAccuracy,
  locationMode,
  locationSearch,
  locationSearchLoading,
  locationSearchResults,
  locationError,
  liveVehicles,
  networkCongestion,
  congestionColor,
  activeIncidents,
  onUseCurrentLocation,
  onUseSearchMode,
  onSearchChange,
  onSearch,
  onSelectLocation,
}) {
  const [now, setNow] = useState(Date.now());
  const [displayScene, setDisplayScene] = useState("day");

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

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const scene = useMemo(() => {
    const raw = weather?.raw || {};
    const condition = String(
      weather?.condition || raw?.weather?.[0]?.main || ""
    ).toLowerCase();
    const description = String(
      weather?.description || raw?.weather?.[0]?.description || ""
    ).toLowerCase();

    const rain = ["rain", "drizzle", "thunderstorm"].some((word) =>
      condition.includes(word)
    ) || /rain|drizzle|thunder/.test(description);

    const clouds = condition.includes("cloud") || /overcast|cloud/.test(description);

    const sunrise = Number(raw?.sys?.sunrise);
    const sunset = Number(raw?.sys?.sunset);
    const epoch = Math.floor(now / 1000);

    let dayPhase = "day";
    if (Number.isFinite(sunrise) && Number.isFinite(sunset)) {
      const sunriseWindow = 60 * 60;
      const sunsetWindow = 90 * 60;
      if (epoch >= sunrise && epoch <= sunrise + sunriseWindow) {
        dayPhase = "sunrise";
      } else if (epoch >= sunset - sunsetWindow && epoch <= sunset) {
        dayPhase = "sunset";
      } else if (epoch < sunrise || epoch > sunset) {
        dayPhase = "night";
      }
    } else {
      const hour = new Date(now).getHours();
      if (hour < 6 || hour >= 19) dayPhase = "night";
      else if (hour < 8) dayPhase = "sunrise";
      else if (hour >= 17) dayPhase = "sunset";
    }

    let key = dayPhase;
    if (rain) key = "rain";
    else if (clouds && dayPhase === "day") key = "cloudy";

    const config = {
      sunrise: { label: "Sunrise", icon: "🌅" },
      day: { label: "Daylight", icon: "☀️" },
      cloudy: { label: "Cloudy", icon: "☁️" },
      rain: { label: "Rainy", icon: "🌧️" },
      sunset: { label: "Sunset", icon: "🌇" },
      night: { label: "Night", icon: "🌙" },
    };

    return { key, ...config[key] };
  }, [weather, now]);

  useEffect(() => {
    setDisplayScene(scene.key);
  }, [scene.key]);

  const localTime = useMemo(() => {
    const timezoneOffset = Number(weather?.raw?.timezone || 0);
    const localDate = new Date(now + timezoneOffset * 1000);
    const hours = localDate.getUTCHours();
    const minutes = String(localDate.getUTCMinutes()).padStart(2, "0");
    const seconds = String(localDate.getUTCSeconds()).padStart(2, "0");
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes}:${seconds} ${period}`;
  }, [weather, now]);

  const temp = weather?.temperature ?? weather?.temp;
  const trafficLabel = networkCongestion || "NO DATA";

  const trafficMode =
    networkCongestion === "HIGH"
      ? "high"
      : networkCongestion === "MEDIUM"
      ? "medium"
      : networkCongestion === "LOW"
      ? "low"
      : "none";

  const trafficStatusText =
    networkCongestion === "HIGH"
      ? "Heavy traffic detected nearby"
      : networkCongestion === "MEDIUM"
      ? "Moderate traffic nearby"
      : networkCongestion === "LOW"
      ? "Traffic flow is calm"
      : "Live traffic data is connecting";

  return (
    <section
      className={`weather-scene weather-scene--${displayScene}`}
      aria-label="Dynamic traffic and weather environment"
    >
      <div className="weather-scene__sky weather-scene__sky--active" />
      <div className="weather-scene__sky weather-scene__sky--day" />
      <div className="weather-scene__sky weather-scene__sky--sunrise" />
      <div className="weather-scene__sky weather-scene__sky--cloudy" />
      <div className="weather-scene__sky weather-scene__sky--rain" />
      <div className="weather-scene__sky weather-scene__sky--sunset" />
      <div className="weather-scene__sky weather-scene__sky--night" />

      {(displayScene === "day" || displayScene === "cloudy") && (
        <>
          <div className="weather-scene__sun" />
          <div className="weather-scene__cloud weather-scene__cloud--one" />
          <div className="weather-scene__cloud weather-scene__cloud--two" />
        </>
      )}

      {displayScene === "sunrise" && (
        <>
          <div className="weather-scene__sun weather-scene__sun--sunrise" />
          <div className="weather-scene__cloud weather-scene__cloud--one" />
          <div className="weather-scene__cloud weather-scene__cloud--two" />
          <div className="weather-scene__horizon-glow" />
        </>
      )}

      {displayScene === "sunset" && (
        <>
          <div className="weather-scene__sun weather-scene__sun--sunset" />
          <div className="weather-scene__cloud weather-scene__cloud--one" />
          <div className="weather-scene__horizon-glow weather-scene__horizon-glow--sunset" />
        </>
      )}

      {displayScene === "night" && (
        <>
          <div className="weather-scene__moon" />
          <div className="weather-scene__stars" />
          <div className="weather-scene__cloud weather-scene__cloud--night" />
        </>
      )}

      {displayScene === "rain" && (
        <>
          <div className="weather-scene__cloud weather-scene__cloud--rain-one" />
          <div className="weather-scene__cloud weather-scene__cloud--rain-two" />
          <div className="weather-scene__rain" />
          <div className="weather-scene__wet-glow" />
        </>
      )}

      <div className="weather-scene__weather-haze" />
      <div className="weather-scene__vignette" />
      <div
        className={`weather-scene__traffic-overlay weather-scene__traffic-overlay--${trafficMode}`}
        aria-hidden="true"
      />
      <div className="weather-scene__ambient-grain" aria-hidden="true" />

      <div
        className="weather-scene__content"
        style={{
          padding: isMobile
            ? "18px"
            : "26px",
        }}
      >
        <div
          className="weather-scene__top"
          style={{
            flexDirection:
              isMobile
                ? "column"
                : "row",
          }}
        >
          <div>
            
            <h2
              className="weather-scene__title"
              style={{
                maxWidth:
                  isMobile
                    ? "100%"
                    : "760px",
              }}
            >
              {scene.icon} {locationName || "Traffic Location"}
            </h2>
            <p className="weather-scene__subtitle">
              Real-time weather, traffic and local conditions.
            </p>
            <div className="weather-scene__scene-meta">
              <span>{scene.label}</span>
              <span>•</span>
              <span>{trafficLabel}</span>
            </div>
          </div>
          <div
            className="weather-scene__status"
            style={{
              alignSelf:
                isMobile
                  ? "flex-start"
                  : "auto",
            }}
          >
            <span className="weather-scene__status-dot" />
            <span>LIVE</span>
          </div>
        </div>

        <div
          className="weather-scene__location-actions"
          style={{
            display: "flex",
            flexDirection:
              isMobile
                ? "column"
                : "row",
          }}
        >
          <button
            type="button"
            className={
              locationMode === "current"
                ? "weather-scene__button weather-scene__button--active"
                : "weather-scene__button"
            }
            onClick={onUseCurrentLocation}
          >
            📍 Current Location
          </button>
          <button
            type="button"
            className={
              locationMode === "search"
                ? "weather-scene__button weather-scene__button--active"
                : "weather-scene__button"
            }
            onClick={onUseSearchMode}
          >
            🔎 Search Location
          </button>
        </div>

        {locationMode === "search" && (
          <div
            className="weather-scene__search"
            style={{
              flexDirection:
                isMobile
                  ? "column"
                  : "row",
            }}
          >
            <input
              value={locationSearch}
              onChange={(event) => onSearchChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onSearch();
              }}
              placeholder="Search city, town, area..."
            />
            <button
              type="button"
              onClick={onSearch}
              disabled={locationSearchLoading}
              style={{
                minHeight:
                  isMobile
                    ? "42px"
                    : undefined,
              }}
            >
              {locationSearchLoading ? "..." : "Search"}
            </button>
            {locationSearchResults.length > 0 && (
              <div className="weather-scene__results">
                {locationSearchResults.map((result) => (
                  <button
                    type="button"
                    key={`${result.place_id}-${result.lat}-${result.lon}`}
                    onClick={() => onSelectLocation(result)}
                    title={`Select ${result.display_name}`}
                  >
                    {result.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div
          className="weather-scene__grid"
          style={{
            gridTemplateColumns:
              isMobile
                ? "1fr"
                : "repeat(2,minmax(0,1fr))",
          }}
        >
          <div className="weather-scene__info-card">
            <div className="weather-scene__label">WEATHER</div>
            <div className="weather-scene__weather-row">
              <div className="weather-scene__weather-icon">{scene.icon}</div>
              <div>
                <div className="weather-scene__temperature">
                  {temp != null ? `${Math.round(Number(temp))}°C` : "--"}
                </div>
                <div className="weather-scene__condition">
                  {weather?.description || weather?.condition || scene.label}
                </div>
              </div>
            </div>
            <div className="weather-scene__meta">
              <span>🕐 {localTime}</span>
              {weather?.humidity != null && <span>💧 {weather.humidity}%</span>}
            </div>
          </div>

          <div className="weather-scene__info-card">
            <div className="weather-scene__label">TRAFFIC AROUND ME</div>
            <div className="weather-scene__traffic-row">
              <div>
                <div
                  className="weather-scene__traffic-value"
                  style={{ color: congestionColor || "#22C55E" }}
                >
                  {trafficLabel}
                </div>
                <div className="weather-scene__traffic-caption">
                  {trafficStatusText}
                </div>
              </div>
              <div className="weather-scene__vehicle-pill">
                🚗 {liveVehicles} vehicles
              </div>
            </div>
            <div className="weather-scene__meta">
              <span>🚨 {activeIncidents ?? 0} active incidents</span>
            </div>
          </div>
        </div>

        <div
          className="weather-scene__footer"
          style={{
            flexDirection:
              isMobile
                ? "column"
                : "row",
            alignItems:
              isMobile
                ? "flex-start"
                : "flex-end",
          }}
        >
          <div>
            <span className="weather-scene__footer-label">SELECTED LOCATION</span>
            <strong>{locationName || "Location unavailable"}</strong>
            {location && (
              <span className="weather-scene__coordinates">
                [{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}]
              </span>
            )}
          </div>
          {Number.isFinite(locationAccuracy) && (
            <div className="weather-scene__accuracy">±{Math.round(locationAccuracy)}m</div>
          )}
        </div>

        {locationError && (
          <div className="weather-scene__error">⚠️ {locationError}</div>
        )}
      </div>
    </section>
  );
}

export default WeatherScene;