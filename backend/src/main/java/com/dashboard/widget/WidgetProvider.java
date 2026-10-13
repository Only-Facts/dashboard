package com.dashboard.widget;

import com.dashboard.dashboard.DashboardService.Widget;

public interface WidgetProvider {
  String service();

  WidgetData fetch(long userId, Widget widget);
}
