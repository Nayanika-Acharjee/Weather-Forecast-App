const API_KEY = "b663522b3ecd4e5ce824cfe1f23d2463";
const weatherContainer = document.getElementById("forecast");
const getWeatherBtn = document.getElementById("getWeatherBtn");
const locationInput = document.getElementById("locationInput");

getWeatherBtn.addEventListener("click", async () => {
  const city = locationInput.value.trim();
  if (!city) {
    alert("Please enter a city name.");
    return;
  }
  fetchByCity(city);
});

// Auto-fetch weather using geolocation on page load
window.addEventListener("load", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchByCoords(lat, lon);
      },
      (error) => {
        console.error("Geolocation failed:", error);
      }
    );
  }
});

// Auto-refresh every 10 minutes (600000 ms)
setInterval(() => {
  const city = locationInput.value.trim();
  if (city) {
    fetchByCity(city);
  }
}, 600000);

// Fetch by city name
async function fetchByCity(city) {
  try {
    const coords = await getCoordinates(city);
    fetchByCoords(coords.lat, coords.lon);
  } catch (error) {
    console.error("Error:", error);
    alert("Could not fetch weather data.");
  }
}

// Fetch forecast by coordinates
async function fetchByCoords(lat, lon) {
  try {
    const forecast = await getForecast(lat, lon);
    const daily = groupByDay(forecast.list);
    displayForecast(daily);
  } catch (error) {
    console.error("Error:", error);
    alert("Could not fetch weather data.");
  }
}

// Convert city to coordinates
async function getCoordinates(city) {
  const geoURL = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`;
  const response = await fetch(geoURL);
  const data = await response.json();
  if (!data || data.length === 0) {
    throw new Error("Location not found.");
  }
  return {
    lat: data[0].lat,
    lon: data[0].lon,
  };
}

// Get forecast data
async function getForecast(lat, lon) {
  const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  const response = await fetch(forecastURL);
  if (!response.ok) {
    throw new Error("Failed to fetch forecast.");
  }
  return await response.json();
}

// Group forecast data by day
function groupByDay(data) {
  const days = {};
  data.forEach((entry) => {
    const date = entry.dt_txt.split(" ")[0];
    if (!days[date]) days[date] = [];
    days[date].push(entry);
  });
  return Object.entries(days).slice(0, 5);
}

// Render forecast cards
function displayForecast(dailyData) {
  weatherContainer.innerHTML = "";

  dailyData.forEach(([date, entries]) => {
    const midday = entries.find((e) => e.dt_txt.includes("12:00:00")) || entries[0];
    const weatherMain = midday.weather[0].main;
    const minTemp = Math.min(...entries.map((e) => e.main.temp_min)).toFixed(1);
    const maxTemp = Math.max(...entries.map((e) => e.main.temp_max)).toFixed(1);

    const emojiMap = {
      Clear: "☀️",
      Clouds: "☁️",
      Rain: "🌧️",
      Thunderstorm: "⛈️",
      Snow: "❄️",
      Drizzle: "🌦️",
      Mist: "🌫️",
    };

    const emoji = emojiMap[weatherMain] || "🌈";

    const card = document.createElement("div");
    card.className = "weather-card";
    card.innerHTML = `
      <h3>${new Date(date).toDateString()}</h3>
      <div style="font-size: 48px;">${emoji}</div>
      <p>${weatherMain}</p>
      <p>🌡 ${minTemp}°C - ${maxTemp}°C</p>
      <p>💧 Humidity: ${midday.main.humidity}%</p>
      <p>💨 Wind: ${midday.wind.speed} m/s</p>
    `;
    weatherContainer.appendChild(card);
  });

  const lastUpdatedEl = document.getElementById("lastUpdated");
  const now = new Date();
  lastUpdatedEl.textContent = `Last refreshed: ${now.toLocaleString()}`;
}

