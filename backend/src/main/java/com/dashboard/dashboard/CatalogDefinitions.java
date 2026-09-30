package com.dashboard.dashboard;

import java.util.List;

final class CatalogDefinitions {

  private static final Catalog.Param CITY = string("city", "City", "Bordeaux");
  private static final Catalog.Param APP_ID = integer(
      "appid",
      "Steam app ID (e.g. 440 for Team Fortress 2)",
      "440");
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

  private CatalogDefinitions() {
  }

  static List<Catalog.Service> services() {
    return List.of(
        weather(),
        github(),
        currency(),
        news(),
        airQuality(),
        steam());
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
        widget("players", "Current player count", APP_ID),
        widget("game_news", "Latest game news", APP_ID, LIMIT),
        widget("achievements", "Global achievement rates", APP_ID, LIMIT));
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
}
