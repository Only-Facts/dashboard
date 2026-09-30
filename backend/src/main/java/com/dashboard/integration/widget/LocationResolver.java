package com.dashboard.integration.widget;

import com.dashboard.common.exception.ApiErrors;
import com.dashboard.integration.ProviderClient;
import com.dashboard.integration.UrlEncoding;
import org.springframework.stereotype.Component;

@Component
public class LocationResolver {

  private static final String API = "https://geocoding-api.open-meteo.com/v1/search";

  public record Location(double latitude, double longitude, String name, String country) {
    public String coordinatesQuery() {
      return "latitude=" + latitude + "&longitude=" + longitude;
    }
  }

  private final ProviderClient client;

  public LocationResolver(ProviderClient client) {
    this.client = client;
  }

  public Location resolve(String city) {
    var places = client.get(API + "?count=1&name=" + UrlEncoding.value(city))
        .path("results");
    if (places.isEmpty()) {
      throw ApiErrors.badRequest("City not found. Try a nearby city.");
    }

    var place = places.get(0);
    return new Location(
        place.path("latitude").asDouble(),
        place.path("longitude").asDouble(),
        place.path("name").asText(),
        place.path("country").asText());
  }
}
