package com.dashboard.dashboard;

import com.dashboard.common.ApiErrors;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DashboardService {

  private static final int MAX_WIDGETS_PER_USER = 30;

  public record Input(
      @NotBlank @Size(max = 40) String service,
      @NotBlank @Size(max = 60) String type,
      @NotBlank @Size(max = 80) String title,
      @NotNull Map<String, String> config,
      @Min(60) @Max(86_400) int refreshSeconds) {
  }

  public record Widget(
      long id,
      String service,
      String type,
      String title,
      Map<String, String> config,
      int refreshSeconds,
      int position) {
  }

  private final DashboardRepository widgets;
  private final Catalog catalog;

  public DashboardService(
      DashboardRepository widgets,
      Catalog catalog) {
    this.widgets = widgets;
    this.catalog = catalog;
  }

  public List<Widget> list(long userId) {
    return widgets.list(userId);
  }

  public Catalog catalog() {
    return catalog;
  }

  public Widget get(long userId, long widgetId) {
    return widgets.find(userId, widgetId).orElseThrow(this::widgetNotFound);
  }

  @Transactional
  public Widget save(long userId, Long widgetId, Input input) {
    widgets.lock(userId);
    validateInput(userId, input);

    long savedId = widgetId == null
        ? create(userId, input)
        : update(userId, widgetId, input);
    return get(userId, savedId);
  }

  @Transactional
  public void delete(long userId, long widgetId) {
    widgets.lock(userId);
    if (!widgets.delete(userId, widgetId)) {
      throw widgetNotFound();
    }
  }

  @Transactional
  public void reorder(long userId, List<Long> ids) {
    widgets.lock(userId);
    Set<Long> existingIds = list(userId).stream().map(Widget::id).collect(Collectors.toSet());
    if (ids == null || ids.size() != existingIds.size() || !existingIds.equals(new HashSet<>(ids))) {
      throw ApiErrors.badRequest("Order must contain each of your widgets exactly once");
    }
    widgets.updatePositions(userId, ids);
  }

  private void validateInput(long userId, Input input) {
    catalog.validate(input.service(), input.type(), input.config());
    if (!connected(userId, input.service())) {
      throw ApiErrors.badRequest("Connect this service first");
    }
  }

  private long create(long userId, Input input) {
    if (widgets.count(userId) >= MAX_WIDGETS_PER_USER) {
      throw ApiErrors.badRequest("A dashboard supports up to 30 widgets");
    }
    return widgets.insert(userId, input);
  }

  private long update(long userId, long widgetId, Input input) {
    if (!widgets.exists(userId, widgetId)) {
      throw widgetNotFound();
    }
    widgets.update(userId, widgetId, input);
    return widgetId;
  }

  private ResponseStatusException widgetNotFound() {
    return ApiErrors.notFound("Widget not found");
  }

  public boolean connected(long userId, String serviceName) {
    Catalog.Service service = catalog.service(serviceName);
    Optional<Boolean> enabled = widgets.enabled(userId, serviceName);
    return enabled.orElse(!service.oauth());
  }

  @Transactional
  public void connect(long userId, String serviceName, String encryptedToken) {
    widgets.lock(userId);
    catalog.service(serviceName);
    widgets.connect(userId, serviceName, encryptedToken);
  }

  @Transactional
  public void disconnect(long userId, String serviceName) {
    widgets.lock(userId);
    catalog.service(serviceName);
    widgets.deleteByService(userId, serviceName);
    widgets.disconnect(userId, serviceName);
  }

  public String githubToken(long userId) {
    return widgets.githubToken(userId)
        .orElseThrow(() -> ApiErrors.badRequest("Reconnect GitHub to continue"));
  }

  public String twitchToken(long userId) {
    return widgets.twitchToken(userId)
        .orElseThrow(() -> ApiErrors.badRequest("Reconnect Twitch to continue"));
  }
}
