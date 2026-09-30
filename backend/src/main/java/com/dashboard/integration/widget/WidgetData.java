package com.dashboard.integration.widget;

import java.time.Instant;
import java.util.List;

public record WidgetData(
    String source,
    Instant updatedAt,
    List<Item> items) {

  public record Item(String label, String value, String url) {
  }

  public WidgetData {
    items = List.copyOf(items);
  }
}
