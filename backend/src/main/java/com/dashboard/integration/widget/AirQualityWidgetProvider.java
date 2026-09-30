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
public class AirQualityWidgetProvider implements WidgetProvider {

  private static final String API = "https://air-quality-api.open-meteo.com/v1/air-quality?";

  private final ProviderClient client;
  private final LocationResolver locations;

  public AirQualityWidgetProvider(ProviderClient client, LocationResolver locations) {
    this.client = client;
    this.locations = locations;
  }

  @Override
  public String service() {
    return "air_quality";
  }

  @Override
  public WidgetData fetch(long userId, Widget widget) {
    LocationResolver.Location location = locations.resolve(widget.config().get("city"));
    JsonNode current = current(location);
    List<Item> items = new ArrayList<>();
    items.add(new Item("Location", location.name() + ", " + location.country(), null));
    items.addAll(measurements(widget.type(), current));
    return new WidgetData("Open-Meteo / CAMS", Instant.now(), items);
  }

  private JsonNode current(LocationResolver.Location location) {
    String fields = String.join(",",
        "european_aqi",
        "pm10",
        "pm2_5",
        "nitrogen_dioxide",
        "ozone",
        "sulphur_dioxide");
    return client.get(API + location.coordinatesQuery() + "&current=" + fields)
        .path("current");
  }

  private List<Item> measurements(String type, JsonNode current) {
    return switch (type) {
      case "aqi" -> List.of(WidgetDataSupport.metric(
          "European AQI", current, "european_aqi", " (lower is better)"));
      case "particles" -> particleMeasurements(current);
      case "gases" -> gasMeasurements(current);
      default -> throw ApiErrors.badRequest("Unknown air quality widget");
    };
  }

  private List<Item> particleMeasurements(JsonNode current) {
    return List.of(
        WidgetDataSupport.metric("PM₂.₅", current, "pm2_5", " μg/m³"),
        WidgetDataSupport.metric("PM₁₀", current, "pm10", " μg/m³"));
  }

  private List<Item> gasMeasurements(JsonNode current) {
    return List.of(
        WidgetDataSupport.metric("Nitrogen dioxide (NO₂)", current, "nitrogen_dioxide", " μg/m³"),
        WidgetDataSupport.metric("Ozone (O₃)", current, "ozone", " μg/m³"),
        WidgetDataSupport.metric("Sulphur dioxide (SO₂)", current, "sulphur_dioxide", " μg/m³"));
  }
}
