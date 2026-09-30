package com.dashboard.dashboard;

import com.dashboard.common.exception.ApiErrors;
import com.dashboard.dashboard.WidgetStore.Widget;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

final class WidgetOrderValidator {

  void validate(List<Widget> widgets, List<Long> requestedIds) {
    Set<Long> existingIds = widgets.stream()
        .map(Widget::id)
        .collect(Collectors.toSet());

    if (!complete(requestedIds, existingIds)) {
      throw ApiErrors.badRequest("Order must contain each of your widgets exactly once");
    }
  }

  private boolean complete(List<Long> requestedIds, Set<Long> existingIds) {
    return requestedIds != null
        && requestedIds.size() == existingIds.size()
        && existingIds.equals(new HashSet<>(requestedIds));
  }
}
