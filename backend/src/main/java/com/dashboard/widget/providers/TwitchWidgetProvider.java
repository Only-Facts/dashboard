package com.dashboard.widget.providers;

import com.dashboard.common.ApiErrors;
import com.dashboard.dashboard.DashboardService.Widget;
import com.dashboard.dashboard.twitch.TwitchConnection;
import com.dashboard.widget.ProviderClient;
import com.dashboard.widget.WidgetData;
import com.dashboard.widget.WidgetData.Item;
import com.dashboard.widget.WidgetProvider;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

@Component
public class TwitchWidgetProvider implements WidgetProvider {
  private final TwitchConnection twitch;

  public TwitchWidgetProvider(ProviderClient client, TwitchConnection twitch) {
    this.twitch = twitch;
  }

  @Override
  public String service() {
    return "twitch";
  }

  @Override
  public WidgetData fetch(long userId, Widget widget) {
    String userIdValue = user(userId);
    int limit = Integer.parseInt(widget.config().get("limit"));
    JsonNode result = switch (widget.type()) {
      case "followed_live" -> twitch.get(userId,
          "https://api.twitch.tv/helix/streams/followed?user_id=" + userIdValue
              + "&first=" + widget.config().get("limit"));
      case "followed_channels" -> twitch.get(userId,
          "https://api.twitch.tv/helix/channels/followed?user_id=" + userIdValue
              + "&first=" + widget.config().get("limit"));
      case "schedule" -> schedule(userId, userIdValue, limit);
      default -> throw ApiErrors.badRequest("Unknown Twitch widget");
    };
    return new WidgetData("Twitch", Instant.now(), rows(widget.type(), result, limit));
  }

  private JsonNode schedule(long userId, String broadcasterId, int limit) {
    try {
      return twitch.get(userId, "https://api.twitch.tv/helix/schedule?broadcaster_id=" + broadcasterId + "&first=" + limit);
    } catch (ProviderClient.ProviderException exception) {
      if (exception.providerStatus() == 404) {
        return tools.jackson.databind.node.JsonNodeFactory.instance.objectNode();
      }
      throw exception;
    }
  }

  private String user(long userId) {
    JsonNode result = twitch.get(userId, "https://api.twitch.tv/helix/users");
    String id = result.path("data").path(0).path("id").asText("");
    if (id.isBlank()) {
      throw ApiErrors.badGateway("Twitch user could not be identified");
    }
    return id;
  }

  private List<Item> rows(String type, JsonNode result, int limit) {
    List<Item> items = new ArrayList<>();
    JsonNode rows = type.equals("schedule")
        ? result.path("data").path("segments")
        : result.path("data");
    String broadcaster = result.path("data").path("broadcaster_login").asText("");
    for (JsonNode row : rows) {
      if (items.size() >= limit) break;
      if (type.equals("followed_live")) {
        items.add(new Item(row.path("user_name").asText(), row.path("title").asText(),
            twitchUrl(row.path("user_login").asText())));
      } else if (type.equals("followed_channels")) {
        items.add(new Item(row.path("broadcaster_name").asText(),
            "Followed since " + row.path("followed_at").asText(), twitchUrl(row.path("broadcaster_login").asText())));
      } else {
        if (!row.path("canceled_until").isMissingNode() && !row.path("canceled_until").isNull()) continue;
        items.add(new Item(row.path("start_time").asText(),
            row.path("title").asText(), twitchUrl(broadcaster)));
      }
    }
    return items;
  }

  private String twitchUrl(String login) {
    return !login.matches("[A-Za-z0-9_]{1,25}") ? null : "https://www.twitch.tv/" + login;
  }
}
