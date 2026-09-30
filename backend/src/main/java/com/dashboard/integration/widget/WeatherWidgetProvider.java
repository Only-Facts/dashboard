package com.dashboard.integration.widget;

import com.dashboard.common.exception.ApiErrors;
import com.dashboard.dashboard.WidgetStore.Widget;
import com.dashboard.integration.ProviderClient;
import com.dashboard.integration.widget.WidgetData.Item;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

@Component
public class WeatherWidgetProvider implements WidgetProvider {

  private final WeatherApi api;
  private final LocationResolver locations;

  public WeatherWidgetProvider(ProviderClient client, LocationResolver locations) {
    this.api = new WeatherApi(client);
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
    JsonNode current = api.current(location);
    return List.of(
        WidgetDataSupport.metric("Temperature", current, "temperature_2m", " °C"),
        WidgetDataSupport.metric("Feels like", current, "apparent_temperature", " °C"));
  }

  private List<Item> precipitation(LocationResolver.Location location) {
    JsonNode current = api.current(location);
    return List.of(
        WidgetDataSupport.metric("Precipitation", current, "precipitation", " mm"),
        WidgetDataSupport.metric("Rain", current, "rain", " mm"),
        WidgetDataSupport.metric("Snowfall", current, "snowfall", " cm"));
  }

  private List<Item> wind(LocationResolver.Location location) {
    JsonNode current = api.current(location);
    return List.of(
        WidgetDataSupport.metric("Wind", current, "wind_speed_10m", " km/h"),
        WidgetDataSupport.metric("Humidity", current, "relative_humidity_2m", "%"));
  }

  private List<Item> sun(LocationResolver.Location location) {
    JsonNode response = api.sun(location);
    JsonNode daily = response.path("daily");
    return List.of(
        new Item("Sunrise", sunTime(daily.path("sunrise").path(0)), null),
        new Item("Sunset", sunTime(daily.path("sunset").path(0)), null),
        new Item("Timezone", response.path("timezone").asText("Local time"), null));
  }

  private List<Item> forecast(LocationResolver.Location location, String days) {
    JsonNode daily = api.forecast(location, days);
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
}
