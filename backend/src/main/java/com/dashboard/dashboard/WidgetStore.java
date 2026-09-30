package com.dashboard.dashboard;

import com.dashboard.common.exception.ApiErrors;
import com.dashboard.dashboard.persistence.WidgetRepository;
import com.dashboard.service.ServiceSubscriptionService;
import com.dashboard.user.UserLockRepository;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WidgetStore {

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

  private final WidgetRepository widgets;
  private final ServiceSubscriptionService subscriptions;
  private final Catalog catalog;
  private final UserLockRepository userLock;
  private final WidgetOrderValidator orderValidator = new WidgetOrderValidator();

  public WidgetStore(
      WidgetRepository widgets,
      ServiceSubscriptionService subscriptions,
      Catalog catalog,
      UserLockRepository userLock) {
    this.widgets = widgets;
    this.subscriptions = subscriptions;
    this.catalog = catalog;
    this.userLock = userLock;
  }

  public List<Widget> list(long userId) {
    return widgets.list(userId);
  }

  public Widget get(long userId, long widgetId) {
    return widgets.find(userId, widgetId).orElseThrow(this::widgetNotFound);
  }

  @Transactional
  public Widget save(long userId, Long widgetId, Input input) {
    userLock.lock(userId);
    validateInput(userId, input);

    long savedId = widgetId == null
        ? create(userId, input)
        : update(userId, widgetId, input);
    return get(userId, savedId);
  }

  @Transactional
  public void delete(long userId, long widgetId) {
    userLock.lock(userId);
    if (!widgets.delete(userId, widgetId)) {
      throw widgetNotFound();
    }
  }

  @Transactional
  public void reorder(long userId, List<Long> ids) {
    userLock.lock(userId);
    orderValidator.validate(list(userId), ids);
    widgets.updatePositions(userId, ids);
  }

  private void validateInput(long userId, Input input) {
    catalog.validate(input.service(), input.type(), input.config());
    if (!subscriptions.connected(userId, input.service())) {
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
}
