import { API_BASE } from "../config/api.js";
import {
  useEffect,
  useState,
} from "react";

import axios from "axios";



function WeatherWidget({
  location,
}) {
  const [
    weather,
    setWeather,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    if (!location) {
      return;
    }

    fetchWeather(
      location.latitude,
      location.longitude
    );
  }, [
    location,
  ]);


  const fetchWeather =
    async (
      latitude,
      longitude
    ) => {
      try {
        setLoading(
          true
        );

        setError("");

        const res =
          await axios.get(
            `${API_BASE}/api/weather`,
            {
              params: {
                latitude,
                longitude,
              },

              headers: {
                Authorization:
                  `Bearer ${localStorage.getItem(
                    "token"
                  )}`,
              },
            }
          );

        setWeather(
          res.data
        );
      } catch (err) {
        console.log(
          "WeatherWidget error:",
          err
        );

        setWeather(
          null
        );

        setError(
          err.response?.data
            ?.error ||
          "Weather data unavailable."
        );
      } finally {
        setLoading(
          false
        );
      }
    };


  if (!location) {
    return (
      <p>
        Select a location to view weather.
      </p>
    );
  }

  if (loading) {
    return (
      <p>
        Loading weather...
      </p>
    );
  }

  if (error) {
    return (
      <p>
        {error}
      </p>
    );
  }

  if (!weather) {
    return (
      <p>
        Weather data unavailable.
      </p>
    );
  }


  return (
    <div>
      <h2>
        🌦️ Live Weather
      </h2>

      <h3>
        {weather.name ||
          "Selected Location"}
      </h3>

      <p>
        Temperature:
        {" "}
        {weather.temperature ??
          "--"}
        °C
      </p>

      <p>
        Condition:
        {" "}
        {weather.condition ||
          "Unavailable"}
      </p>
    </div>
  );
}

export default WeatherWidget;