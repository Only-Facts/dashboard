package com.dashboard.integration.widget;

import com.dashboard.common.exception.ApiErrors;
import com.dashboard.dashboard.WidgetStore.Widget;
import com.dashboard.integration.ProviderClient;
import com.dashboard.integration.widget.WidgetData.Item;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

/** Public game data only: no Steam account credentials or API key required. */
@Component
public class SteamWidgetProvider implements WidgetProvider {

  private final SteamApi api;

  public SteamWidgetProvider(ProviderClient client) {
    this.api = new SteamApi(client);
  }

  @Override
  public String service() {
    return "steam";
  }

  @Override
  public WidgetData fetch(long userId, Widget widget) {
    String appId = widget.config().get("appid");
    List<Item> items = switch (widget.type()) {
      case "players" -> players(appId);
      case "game_news" -> news(appId, limit(widget));
      case "achievements" -> achievements(appId, limit(widget));
      default -> throw ApiErrors.badRequest("Unknown Steam widget");
    };
    return new WidgetData("Steam · App " + appId, Instant.now(), items);
  }

  private List<Item> players(String appId) {
    JsonNode response = api.players(appId);
    if (!validPlayerCount(response)) {
      throw ApiErrors.badGateway("Player count unavailable. Check the Steam app ID.");
    }
    return List.of(WidgetDataSupport.metric("Players online", response, "player_count", ""));
  }

  private List<Item> news(String appId, int limit) {
    List<Item> items = new ArrayList<>();
    for (JsonNode row : api.news(appId, limit)) {
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
    List<JsonNode> values = numericAchievements(api.achievements(appId));
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
}
