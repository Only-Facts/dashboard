package com.dashboard.widget.providers;

import com.dashboard.common.ApiErrors;
import com.dashboard.dashboard.DashboardService.Widget;
import com.dashboard.dashboard.spotify.SpotifyConnection;
import com.dashboard.widget.ProviderClient;
import com.dashboard.widget.WidgetData;
import com.dashboard.widget.WidgetData.Item;
import com.dashboard.widget.WidgetProvider;
import java.time.Instant;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

@Component
public class SpotifyWidgetProvider implements WidgetProvider {
  private final SpotifyConnection spotify;
  public SpotifyWidgetProvider(SpotifyConnection spotify) { this.spotify = spotify; }
  @Override public String service() { return "spotify"; }

  @Override public WidgetData fetch(long userId, Widget widget) {
    int limit = Integer.parseInt(widget.config().get("limit"));
    String endpoint = switch (widget.type()) {
      case "recently_played" -> "/me/player/recently-played?limit=" + limit;
      case "top_tracks" -> "/me/top/tracks?limit=" + limit + "&time_range=" + ProviderClient.value(widget.config().get("time_range"));
      case "playlists" -> "/me/playlists?limit=" + limit;
      default -> throw ApiErrors.badRequest("Unknown Spotify widget");
    };
    JsonNode result = spotify.get(userId, "https://api.spotify.com/v1" + endpoint);
    List<Item> items = new ArrayList<>();
    for (JsonNode row : result.path("items")) {
      if (items.size() >= limit) break;
      if (row.isNull()) continue;
      JsonNode entity = widget.type().equals("recently_played") ? row.path("track") : row;
      if (entity.isMissingNode() || entity.isNull()) continue;
      String detail;
      if (widget.type().equals("playlists")) {
        detail = entity.path("owner").path("display_name").asText("Spotify playlist");
      } else {
        List<String> artists = new ArrayList<>();
        for (JsonNode artist : entity.path("artists")) artists.add(artist.path("name").asText());
        detail = String.join(", ", artists);
        if (widget.type().equals("recently_played")) detail += " · " + row.path("played_at").asText();
      }
      items.add(new Item(entity.path("name").asText("Untitled"), detail, safeUrl(entity.path("external_urls").path("spotify").asText(""))));
    }
    return new WidgetData("Spotify", Instant.now(), List.copyOf(items));
  }

  private String safeUrl(String value) {
    try {
      URI uri = URI.create(value);
      return "https".equals(uri.getScheme()) && "open.spotify.com".equals(uri.getHost())
          && uri.getUserInfo() == null && uri.getPort() == -1 ? value : null;
    } catch (IllegalArgumentException exception) { return null; }
  }
}
