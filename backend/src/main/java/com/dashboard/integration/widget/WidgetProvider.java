package com.dashboard.integration.widget;

import com.dashboard.dashboard.WidgetStore.Widget;

public interface WidgetProvider {
  String service();

  WidgetData fetch(long userId, Widget widget);
}
