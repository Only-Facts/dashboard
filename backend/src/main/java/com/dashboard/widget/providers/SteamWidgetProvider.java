package com.dashboard.widget.providers;

import com.dashboard.common.ApiErrors;
import com.dashboard.dashboard.DashboardService.Widget;
import com.dashboard.widget.ProviderClient;
import com.dashboard.widget.WidgetData.Item;
import com.dashboard.widget.WidgetData;
import com.dashboard.widget.WidgetProvider;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

@Component
public class SteamWidgetProvider implements WidgetProvider {

  private final ProviderClient client;

  public SteamWidgetProvider(ProviderClient client) {
    this.client = client;
  }

  @Override
  public String service() {
    return "steam";
  }

  @Override
  public WidgetData fetch(long userId, Widget widget) {
    SteamGame game = resolveGame(widget);
    List<Item> items = switch (widget.type()) {
      case "players" -> players(game.appId());
      case "game_news" -> news(game.appId(), limit(widget));
      case "achievements" -> achievements(game.appId(), limit(widget));
      default -> throw ApiErrors.badRequest("Unknown Steam widget");
    };
    return new WidgetData("Steam · " + game.name(), Instant.now(), items);
  }

  private SteamGame resolveGame(Widget widget) {
    String gameName = widget.config().get("game");
    if (gameName != null && !gameName.isBlank()) {
      return findGame(gameName);
    }

    String legacyAppId = widget.config().get("appid");
    if (legacyAppId != null && legacyAppId.matches("\\d+")) {
      return new SteamGame(legacyAppId, "Steam game");
    }
    throw ApiErrors.badRequest("Enter a Steam game name.");
  }

  private List<Item> players(String appId) {
    JsonNode response = fetchPlayers(appId);
    if (!validPlayerCount(response)) {
      throw ApiErrors.badGateway("Player count unavailable for this game.");
    }
    return List.of(WidgetData.metric("Players online", response, "player_count", ""));
  }

  private SteamGame findGame(String gameName) {
    JsonNode results = client.get(
        "https://store.steampowered.com/api/storesearch/?term="
            + ProviderClient.value(gameName)
            + "&l=english&cc=us")
        .path("items");
    if (!results.isArray() || results.isEmpty() || !results.get(0).path("id").canConvertToInt()) {
      throw ApiErrors.badRequest("No Steam game found for: " + gameName);
    }
    JsonNode game = results.get(0);
    return new SteamGame(
        String.valueOf(game.path("id").asInt()),
        game.path("name").asText(gameName));
  }

  private List<Item> news(String appId, int limit) {
    List<Item> items = new ArrayList<>();
    for (JsonNode row : fetchNews(appId, limit)) {
      if (items.size() >= limit) {
        break;
      }
      items.add(newsItem(row));
    }
    return items;
  }

  private Item newsItem(JsonNode row) {
    String date = Instant.ofEpochSecond(row.path("date").asLong())
        .atOffset(ZoneOffset.UTC)
        .toLocalDate()
        .toString();
    String label = date + " · " + row.path("feedlabel").asText("Steam");
    String url = safeHttpsUrl(row.path("url").asText(""));
    return new Item(label, row.path("title").asText("Untitled"), url);
  }

  private List<Item> achievements(String appId, int limit) {
    List<JsonNode> values = numericAchievements(fetchAchievements(appId));
    return values.stream()
        .sorted(Comparator.comparingDouble((JsonNode row) -> percent(row)).reversed())
        .limit(limit)
        .map(this::achievementItem)
        .toList();
  }

  private List<JsonNode> numericAchievements(JsonNode rows) {
    List<JsonNode> values = new ArrayList<>();
    for (JsonNode row : rows) {
      if (row.path("percent").isNumber()) {
        values.add(row);
      }
    }
    return values;
  }

  private Item achievementItem(JsonNode row) {
    String value = String.format(Locale.ROOT, "%.1f%% of players", percent(row));
    return new Item(row.path("name").asText(), value, null);
  }

  private int limit(Widget widget) {
    return Integer.parseInt(widget.config().get("limit"));
  }

  private boolean validPlayerCount(JsonNode response) {
    return response.path("result").asInt() == 1
        && response.path("player_count").isNumber();
  }

  private double percent(JsonNode row) {
    return row.path("percent").asDouble();
  }

  private String safeHttpsUrl(String value) {
    return value.startsWith("https://") ? value : null;
  }

  private record SteamGame(String appId, String name) {
  }

  private static final String API = "https://api.steampowered.com/";

  private JsonNode fetchPlayers(String appId) {
    return client.get(
        API + "ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=" + appId)
        .path("response");
  }

  private JsonNode fetchNews(String appId, int limit) {
    return client.get(
        API + "ISteamNews/GetNewsForApp/v2/?appid=" + appId
            + "&count=" + limit
            + "&maxlength=1&format=json")
        .path("appnews")
        .path("newsitems");
  }

  private JsonNode fetchAchievements(String appId) {
    return client.get(
        API + "ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=" + appId)
        .path("achievementpercentages")
        .path("achievements");
  }
}
