import { useEffect, useState } from "react";
import axios from "axios";

function WeatherWidget() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      const apiKey = "4fc4d799adf706c1c243098827e6e5ce";

      const res = await axios.get(
  `https://api.openweathermap.org/data/2.5/weather?q=Bengaluru&appid=${apiKey}&units=metric`
);

console.log(res.data);

      setWeather(res.data);
    } catch (error) {
  alert(
    JSON.stringify(error.response?.data)
  );

  console.log(error.response?.data);
  console.log(error);
}
  };

  if (!weather) return <p>Loading Weather...</p>;

  return (
    <div>
      <h2>🌦️ Live Weather</h2>

      <h3>{weather.name}</h3>

      <p>
        Temperature: {weather.main.temp}°C
      </p>

      <p>
        Condition: {weather.weather[0].main}
      </p>
    </div>
  );
}

export default WeatherWidget;