package com.dashboard.widget.providers;

import com.dashboard.dashboard.DashboardService.Widget;
import com.dashboard.widget.ProviderClient;
import com.dashboard.widget.WidgetData.Item;
import com.dashboard.widget.WidgetData;
import com.dashboard.widget.WidgetProvider;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class NewsWidgetProvider implements WidgetProvider {

  private static final String API = "https://hn.algolia.com/api/v1/";

  private final ProviderClient client;

  public NewsWidgetProvider(ProviderClient client) {
    this.client = client;
  }

  @Override
  public String service() {
    return "news";
  }

  @Override
  public WidgetData fetch(long userId, Widget widget) {
    var rows = client.get(searchUrl(widget)).path("hits");
    List<Item> items = new ArrayList<>();
    for (var row : rows) {
      items.add(new Item(
          row.path("points").asText() + " points · " + row.path("author").asText(),
          row.path("title").asText(),
          "https://news.ycombinator.com/item?id=" + row.path("objectID").asLong()));
    }
    return new WidgetData("Hacker News / Algolia", Instant.now(), items);
  }

  private String searchUrl(Widget widget) {
    String endpoint = widget.type().equals("latest") ? "search_by_date" : "search";
    return API
        + endpoint
        + "?tags=story&hitsPerPage=" + widget.config().get("limit")
        + "&query=" + ProviderClient.value(widget.config().get("query"));
  }
}
