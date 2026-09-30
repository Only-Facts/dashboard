package com.dashboard.integration.widget;

import com.dashboard.integration.widget.WidgetData.Item;
import tools.jackson.databind.JsonNode;

final class WidgetDataSupport {

  private WidgetDataSupport() {
  }

  static Item metric(String label, JsonNode node, String field, String unit) {
    JsonNode value = node.path(field);
    String text = value.isMissingNode() || value.isNull()
        ? "Unavailable"
        : value.asText() + unit;
    return new Item(label, text, null);
  }

  static String githubUrl(String value) {
    return value.startsWith("https://github.com/") ? value : null;
  }
}
