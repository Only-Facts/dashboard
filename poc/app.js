const form = document.querySelector("#weather-form");
const cityInput = document.querySelector("#city");
const locationOutput = document.querySelector("#location");
const temperatureOutput = document.querySelector("#temperature");
const errorOutput = document.querySelector("#error");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorOutput.textContent = "";
  temperatureOutput.textContent = "Loading…";

  try {
    const city = cityInput.value.trim();
    const geocodingResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(city)}`
    );
    if (!geocodingResponse.ok) {
      throw new Error("Geocoding provider is unavailable.");
    }

    const geocoding = await geocodingResponse.json();
    const place = geocoding.results?.[0];
    if (!place) {
      throw new Error("City not found.");
    }

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m`
    );
    if (!weatherResponse.ok) {
      throw new Error("Weather provider is unavailable.");
    }

    const weather = await weatherResponse.json();
    locationOutput.textContent = `${place.name}, ${place.country}`;
    temperatureOutput.textContent = `${weather.current.temperature_2m} °C`;
  } catch (error) {
    locationOutput.textContent = "Unable to load weather";
    temperatureOutput.textContent = "";
    errorOutput.textContent =
      error instanceof Error ? error.message : "Unexpected error.";
  }
});
