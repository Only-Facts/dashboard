package com.dashboard.widget;

import com.dashboard.widget.WidgetData.Item;
import java.time.Instant;
import java.util.List;
import tools.jackson.databind.JsonNode;

public record WidgetData(
    String source,
    Instant updatedAt,
    List<Item> items) {

  public record Item(String label, String value, String url) {
  }

  public WidgetData {
    items = List.copyOf(items);
  }

  public static Item metric(String label, JsonNode node, String field, String unit) {
    JsonNode value = node.path(field);
    String text = value.isMissingNode() || value.isNull()
        ? "Unavailable"
        : value.asText() + unit;
    return new Item(label, text, null);
  }

  public static String githubUrl(String value) {
    return value.startsWith("https://github.com/") ? value : null;
  }
}
