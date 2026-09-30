package com.dashboard.integration;

import com.dashboard.common.exception.ApiErrors;
import com.dashboard.dashboard.WidgetStore;
import com.dashboard.dashboard.WidgetStore.Widget;
import com.dashboard.integration.widget.WidgetData;
import com.dashboard.integration.widget.WidgetProvider;
import com.dashboard.service.ServiceSubscriptionService;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class WidgetDataService {

  private record Key(long userId, Widget widget) {
  }

  private final Cache<Key, WidgetData> cache = Caffeine.newBuilder()
      .maximumSize(2_000)
      .expireAfterWrite(Duration.ofSeconds(60))
      .build();

  private final Map<String, WidgetProvider> providers;
  private final WidgetStore widgets;
  private final ServiceSubscriptionService subscriptions;

  public WidgetDataService(
      List<WidgetProvider> providers,
      WidgetStore widgets,
      ServiceSubscriptionService subscriptions) {
    this.providers = index(providers);
    this.widgets = widgets;
    this.subscriptions = subscriptions;
  }

  public WidgetData data(long userId, long widgetId) {
    Widget widget = widgets.get(userId, widgetId);
    requireConnected(userId, widget.service());
    return cache.get(
        new Key(userId, widget),
        key -> provider(widget.service()).fetch(userId, widget));
  }

  public void evictUser(long userId) {
    cache.asMap().keySet().removeIf(key -> key.userId() == userId);
  }

  private void requireConnected(long userId, String service) {
    if (!subscriptions.connected(userId, service)) {
      throw ApiErrors.badRequest("Service disconnected");
    }
  }

  private WidgetProvider provider(String service) {
    WidgetProvider provider = providers.get(service);
    if (provider == null) {
      throw new IllegalStateException("No data provider registered for service: " + service);
    }
    return provider;
  }

  private Map<String, WidgetProvider> index(List<WidgetProvider> providerList) {
    Map<String, WidgetProvider> result = new HashMap<>();
    for (WidgetProvider provider : providerList) {
      rejectDuplicate(result.put(provider.service(), provider), provider.service());
    }
    return Map.copyOf(result);
  }

  private void rejectDuplicate(WidgetProvider previous, String service) {
    if (previous != null) {
      throw new IllegalStateException("Duplicate data provider for service: " + service);
    }
  }
}
