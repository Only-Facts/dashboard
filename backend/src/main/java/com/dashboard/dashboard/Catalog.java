package com.dashboard.dashboard;

import com.dashboard.common.ApiErrors;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class Catalog {

  public record Param(String name, String type, String label, String defaultValue) {
  }

  public record WidgetType(String name, String description, List<Param> params) {
  }

  public record Service(String name, String label, boolean oauth, List<WidgetType> widgets) {
  }

  private static final Catalog.Param CITY = string("city", "City", "Bordeaux");
  private static final Catalog.Param GAME = string(
      "game",
      "Game name",
      "Counter-Strike 2");
  private static final Catalog.Param REPOSITORY = string(
      "repository",
      "Repository (owner/name)",
      "spring-projects/spring-boot");
  private static final Catalog.Param LIMIT = integer("limit", "Items (1–10)", "5");
  private static final Catalog.Param BASE = string(
      "base",
      "Base currency (EUR, USD, GBP…)",
      "EUR");
  private static final Catalog.Param TARGET = string("target", "Target currency", "USD");
  private static final Catalog.Param QUERY = string("query", "Search topic", "programming");

  private static List<Catalog.Service> definitions() {
    return List.of(
        weather(),
        github(),
        currency(),
        news(),
        airQuality(),
        steam(),
        twitch(),
        spotify());
  }

  private static Catalog.Service weather() {
    return service("weather", "Weather", false,
        widget("temperature", "Current temperature", CITY),
        widget("forecast", "Daily forecast", CITY, integer("days", "Days (1–7)", "3")),
        widget("wind", "Wind and humidity", CITY),
        widget("precipitation", "Current precipitation", CITY),
        widget("sun", "Sunrise and sunset", CITY));
  }

  private static Catalog.Service github() {
    return service("github", "GitHub", true,
        widget("repository", "Repository statistics", REPOSITORY),
        widget("commits", "Recent commits", REPOSITORY, LIMIT),
        widget("issues", "Open issues", REPOSITORY, LIMIT));
  }

  private static Catalog.Service currency() {
    return service("currency", "Exchange rates", false,
        widget("rate", "Exchange rate", BASE, TARGET),
        widget("convert", "Currency conversion", BASE, TARGET,
            integer("amount", "Amount (1–1000000)", "100")));
  }

  private static Catalog.Service news() {
    return service("news", "Hacker News", false,
        widget("popular", "Popular stories", QUERY, LIMIT),
        widget("latest", "Latest stories", QUERY, LIMIT));
  }

  private static Catalog.Service airQuality() {
    return service("air_quality", "Air quality", false,
        widget("aqi", "European air quality index", CITY),
        widget("particles", "Particulate pollution", CITY),
        widget("gases", "Air pollution gases", CITY));
  }

  private static Catalog.Service steam() {
    return service("steam", "Steam", false,
        widget("players", "Current player count", GAME),
        widget("game_news", "Latest game news", GAME, LIMIT),
        widget("achievements", "Global achievement rates", GAME, LIMIT));
  }

  private static Catalog.Service twitch() {
    return service("twitch", "Twitch", true,
        widget("followed_live", "Followed live streams", LIMIT),
        widget("followed_channels", "Followed channels", LIMIT),
        widget("schedule", "Your stream schedule", LIMIT));
  }

  private static Catalog.Service spotify() {
    return service("spotify", "Spotify", true,
        widget("recently_played", "Recently played tracks", LIMIT),
        widget("top_tracks", "Your top tracks", LIMIT,
            string("time_range", "Period (short_term, medium_term, long_term)", "medium_term")),
        widget("playlists", "Your playlists", LIMIT));
  }

  private static Catalog.Service service(
      String name,
      String label,
      boolean oauth,
      Catalog.WidgetType... widgets) {
    return new Catalog.Service(name, label, oauth, List.of(widgets));
  }

  private static Catalog.WidgetType widget(
      String name,
      String description,
      Catalog.Param... params) {
    return new Catalog.WidgetType(name, description, List.of(params));
  }

  private static Catalog.Param string(String name, String label, String defaultValue) {
    return new Catalog.Param(name, "string", label, defaultValue);
  }

  private static Catalog.Param integer(String name, String label, String defaultValue) {
    return new Catalog.Param(name, "integer", label, defaultValue);
  }

  private static final List<Service> SERVICES = definitions();

  public List<Service> services() {
    return SERVICES;
  }

  public Service service(String name) {
    return SERVICES.stream()
        .filter(service -> service.name().equals(name))
        .findFirst()
        .orElseThrow(() -> ApiErrors.badRequest("Unknown service"));
  }

  public WidgetType type(String serviceName, String widgetName) {
    return service(serviceName).widgets().stream()
        .filter(widget -> widget.name().equals(widgetName))
        .findFirst()
        .orElseThrow(() -> ApiErrors.badRequest("Unknown widget type"));
  }

  public void validate(String serviceName, String widgetName, Map<String, String> config) {
    validate(type(serviceName, widgetName), legacySteamConfig(serviceName, config));
  }

  private Map<String, String> legacySteamConfig(String serviceName, Map<String, String> config) {
    if (!"steam".equals(serviceName) || config == null || !config.containsKey("appid")
        || config.containsKey("game")) {
      return config;
    }
    String appId = config.get("appid");
    if (appId == null || !appId.matches("\\d+")) {
      throw ApiErrors.badRequest("Steam app ID must be a whole number");
    }
    try {
      if (Integer.parseInt(appId) < 1) {
        throw ApiErrors.badRequest("Steam app ID must be positive");
      }
    } catch (NumberFormatException exception) {
      throw ApiErrors.badRequest("Steam app ID is too large");
    }
    return Map.of("game", appId);
  }

  private static final int MAX_TEXT_LENGTH = 120;
  private static final Set<String> SUPPORTED_CURRENCIES = Set.of(
      "EUR", "USD", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "INR",
      "SEK", "NOK", "DKK", "PLN", "BRL", "NZD", "ZAR", "KRW", "MXN");

  private void validate(Catalog.WidgetType definition, Map<String, String> config) {
    requireCompleteConfig(definition, config);
    for (Catalog.Param parameter : definition.params()) {
      validateParameter(parameter, config.get(parameter.name()));
    }
  }

  private void requireCompleteConfig(
      Catalog.WidgetType definition,
      Map<String, String> config) {
    if (config == null || config.size() != definition.params().size()) {
      throw ApiErrors.badRequest("Provide all widget parameters");
    }
  }

  private void validateParameter(Catalog.Param parameter, String value) {
    requireText(parameter, value);

    switch (parameter.name()) {
      case "appid" -> requireInteger(value, 1, Integer.MAX_VALUE);
      case "limit" -> requireInteger(value, 1, 10);
      case "time_range" -> {
        if (!Set.of("short_term", "medium_term", "long_term").contains(value)) {
          throw ApiErrors.badRequest("Choose short_term, medium_term or long_term");
        }
      }
      case "days" -> requireInteger(value, 1, 7);
      case "amount" -> requireInteger(value, 1, 1_000_000);
      case "repository" -> requireRepository(value);
      case "base", "target" -> requireCurrency(value);
      default -> requireSafeText(value);
    }
  }

  private void requireText(Catalog.Param parameter, String value) {
    if (value == null || value.isBlank() || value.length() > MAX_TEXT_LENGTH) {
      throw ApiErrors.badRequest("Invalid " + parameter.label());
    }
  }

  private void requireInteger(String value, int min, int max) {
    final int number;
    try {
      number = Integer.parseInt(value);
    } catch (NumberFormatException exception) {
      throw ApiErrors.badRequest("Expected a whole number");
    }

    if (number < min || number > max) {
      throw ApiErrors.badRequest("Value must be between " + min + " and " + max);
    }
  }

  private void requireRepository(String value) {
    boolean formatIsValid = value.matches("[A-Za-z0-9_-]{1,39}/[A-Za-z0-9_.-]{1,80}");
    if (!formatIsValid || value.contains("..")) {
      throw ApiErrors.badRequest("Use a valid owner/repository name");
    }
  }

  private void requireCurrency(String value) {
    if (!SUPPORTED_CURRENCIES.contains(value)) {
      throw ApiErrors.badRequest("Unsupported currency code");
    }
  }

  private void requireSafeText(String value) {
    if (value.chars().anyMatch(Character::isISOControl)) {
      throw ApiErrors.badRequest("Invalid parameter text");
    }
  }
}
