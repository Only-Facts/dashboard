package com.dashboard.widget.providers;

import com.dashboard.common.ApiErrors;
import com.dashboard.dashboard.DashboardService.Widget;
import com.dashboard.widget.LocationResolver;
import com.dashboard.widget.ProviderClient;
import com.dashboard.widget.WidgetData.Item;
import com.dashboard.widget.WidgetData;
import com.dashboard.widget.WidgetProvider;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

@Component
public class WeatherWidgetProvider implements WidgetProvider {

  private final ProviderClient client;
  private final LocationResolver locations;

  public WeatherWidgetProvider(ProviderClient client, LocationResolver locations) {
    this.client = client;
    this.locations = locations;
  }

  @Override
  public String service() {
    return "weather";
  }

  @Override
  public WidgetData fetch(long userId, Widget widget) {
    LocationResolver.Location location = locations.resolve(widget.config().get("city"));
    List<Item> items = new ArrayList<>();
    items.add(locationItem(location));
    items.addAll(itemsFor(widget, location));
    return new WidgetData("Open-Meteo", Instant.now(), items);
  }

  private List<Item> itemsFor(Widget widget, LocationResolver.Location location) {
    return switch (widget.type()) {
      case "temperature" -> temperature(location);
      case "precipitation" -> precipitation(location);
      case "wind" -> wind(location);
      case "forecast" -> forecast(location, widget.config().get("days"));
      case "sun" -> sun(location);
      default -> throw ApiErrors.badRequest("Unknown weather widget");
    };
  }

  private List<Item> temperature(LocationResolver.Location location) {
    JsonNode current = fetchCurrent(location);
    return List.of(
        WidgetData.metric("Temperature", current, "temperature_2m", " °C"),
        WidgetData.metric("Feels like", current, "apparent_temperature", " °C"));
  }

  private List<Item> precipitation(LocationResolver.Location location) {
    JsonNode current = fetchCurrent(location);
    return List.of(
        WidgetData.metric("Precipitation", current, "precipitation", " mm"),
        WidgetData.metric("Rain", current, "rain", " mm"),
        WidgetData.metric("Showers", current, "showers", " mm"),
        WidgetData.metric("Snowfall", current, "snowfall", " cm"),
        new Item("Period", precipitationPeriod(current), null));
  }

  private String precipitationPeriod(JsonNode current) {
    int seconds = current.path("interval").asInt(0);
    return seconds > 0 && seconds % 60 == 0
        ? "Previous " + (seconds / 60) + " minutes"
        : "Current measurement period";
  }

  private List<Item> wind(LocationResolver.Location location) {
    JsonNode current = fetchCurrent(location);
    return List.of(
        WidgetData.metric("Wind", current, "wind_speed_10m", " km/h"),
        WidgetData.metric("Humidity", current, "relative_humidity_2m", "%"));
  }

  private List<Item> sun(LocationResolver.Location location) {
    JsonNode response = fetchSun(location);
    JsonNode daily = response.path("daily");
    return List.of(
        new Item("Sunrise", sunTime(daily.path("sunrise").path(0)), null),
        new Item("Sunset", sunTime(daily.path("sunset").path(0)), null),
        new Item("Timezone", response.path("timezone").asText("Local time"), null));
  }

  private List<Item> forecast(LocationResolver.Location location, String days) {
    JsonNode daily = fetchForecast(location, days);
    List<Item> items = new ArrayList<>();
    for (int index = 0; index < daily.path("time").size(); index++) {
      items.add(forecastItem(daily, index));
    }
    return items;
  }

  private Item forecastItem(JsonNode daily, int index) {
    String temperature = daily.path("temperature_2m_min").get(index).asText()
        + "–" + daily.path("temperature_2m_max").get(index).asText() + " °C";
    String rain = daily.path("precipitation_sum").get(index).asText() + " mm rain";
    return new Item(daily.path("time").get(index).asText(), temperature + " · " + rain, null);
  }

  private Item locationItem(LocationResolver.Location location) {
    return new Item("Location", location.name() + ", " + location.country(), null);
  }

  private String sunTime(JsonNode value) {
    if (value.isMissingNode() || value.isNull() || value.asText().isBlank()) {
      return "Unavailable";
    }
    return value.asText().replace("T", " · ");
  }

  private static final String API = "https://api.open-meteo.com/v1/forecast?";

  private JsonNode fetchCurrent(LocationResolver.Location location) {
    String fields = String.join(",",
        "temperature_2m",
        "apparent_temperature",
        "wind_speed_10m",
        "relative_humidity_2m",
        "precipitation",
        "rain",
        "showers",
        "snowfall");
    return client.get(API + location.coordinatesQuery() + "&current=" + fields)
        .path("current");
  }

  private JsonNode fetchSun(LocationResolver.Location location) {
    return client.get(
        API + location.coordinatesQuery()
            + "&timezone=auto&daily=sunrise,sunset&forecast_days=1");
  }

  private JsonNode fetchForecast(LocationResolver.Location location, String days) {
    return client.get(
        API + location.coordinatesQuery()
            + "&timezone=auto"
            + "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum"
            + "&forecast_days=" + days)
        .path("daily");
  }
}
