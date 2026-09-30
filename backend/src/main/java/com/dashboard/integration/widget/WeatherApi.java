package com.dashboard.integration.widget;

import com.dashboard.integration.ProviderClient;
import tools.jackson.databind.JsonNode;

final class WeatherApi {

  private static final String API = "https://api.open-meteo.com/v1/forecast?";

  private final ProviderClient client;

  WeatherApi(ProviderClient client) {
    this.client = client;
  }

  JsonNode current(LocationResolver.Location location) {
    String fields = String.join(",",
        "temperature_2m",
        "apparent_temperature",
        "wind_speed_10m",
        "relative_humidity_2m",
        "precipitation",
        "rain",
        "snowfall");
    return client.get(API + location.coordinatesQuery() + "&current=" + fields)
        .path("current");
  }

  JsonNode sun(LocationResolver.Location location) {
    return client.get(
        API + location.coordinatesQuery()
            + "&timezone=auto&daily=sunrise,sunset&forecast_days=1");
  }

  JsonNode forecast(LocationResolver.Location location, String days) {
    return client.get(
        API + location.coordinatesQuery()
            + "&timezone=auto"
            + "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum"
            + "&forecast_days=" + days)
        .path("daily");
  }
}
