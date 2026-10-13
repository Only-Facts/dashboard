package com.dashboard.widget;

import com.dashboard.common.ApiErrors;
import com.dashboard.dashboard.DashboardService;
import com.dashboard.dashboard.DashboardService.Widget;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;
import java.util.HashMap;
import java.util.LinkedHashMap;
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
  private final DashboardService widgets;

  public WidgetDataService(
      List<WidgetProvider> providers,
      DashboardService widgets) {
    this.providers = index(providers);
    this.widgets = widgets;
  }

  public WidgetData data(long userId, long widgetId) {
    Widget widget = widgets.get(userId, widgetId);
    requireConnected(userId, widget.service());
    return cache.get(
        new Key(userId, widget),
        key -> provider(widget.service()).fetch(userId, widget));
  }

  public WidgetData publicData(String service, String type) {
    requirePublicService(service);
    var definition = widgets.catalog().type(service, type);
    Map<String, String> config = new LinkedHashMap<>();
    definition.params().forEach(parameter -> config.put(parameter.name(), parameter.defaultValue()));
    Widget widget = new Widget(
        publicWidgetId(service, type),
        service,
        type,
        definition.description(),
        config,
        300,
        0);
    return cache.get(
        new Key(0, widget),
        key -> provider(service).fetch(0, widget));
  }

  public WidgetData publicSteamPlayers(String game) {
    if (game == null || game.isBlank() || game.length() > 120) {
      throw ApiErrors.badRequest("Enter a valid Steam game name.");
    }
    return publicDataWithConfig("steam", "players", Map.of("game", game.trim()));
  }

  public WidgetData publicDataWithConfig(
      String service,
      String type,
      Map<String, String> config) {
    requirePublicService(service);
    widgets.catalog().validate(service, type, config);
    var definition = widgets.catalog().type(service, type);
    Widget widget = new Widget(
        publicWidgetId(service, type + ":" + config),
        service,
        type,
        definition.description(),
        config,
        300,
        0);
    return cache.get(
        new Key(0, widget),
        key -> provider(service).fetch(0, widget));
  }

  private void requirePublicService(String service) {
    if (widgets.catalog().service(service).oauth()) {
      throw ApiErrors.badRequest("This service requires an account connection");
    }
  }

  private long publicWidgetId(String service, String type) {
    return -Math.abs((service + ":" + type).hashCode());
  }

  public void evictUser(long userId) {
    cache.asMap().keySet().removeIf(key -> key.userId() == userId);
  }

  private void requireConnected(long userId, String service) {
    if (!widgets.connected(userId, service)) {
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
