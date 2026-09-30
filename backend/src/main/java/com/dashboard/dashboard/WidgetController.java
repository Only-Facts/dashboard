package com.dashboard.dashboard;

import static com.dashboard.common.security.AuthenticatedUser.id;

import com.dashboard.integration.WidgetDataService;
import com.dashboard.integration.widget.WidgetData;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/widgets")
public class WidgetController {

  public record Order(List<Long> ids) {
  }

  private final WidgetStore widgets;
  private final WidgetDataService data;

  public WidgetController(WidgetStore widgets, WidgetDataService data) {
    this.widgets = widgets;
    this.data = data;
  }

  @GetMapping
  public List<WidgetStore.Widget> list(Authentication authentication) {
    return widgets.list(id(authentication));
  }

  @PostMapping
  public ResponseEntity<WidgetStore.Widget> create(
      Authentication authentication,
      @Valid @RequestBody WidgetStore.Input input) {
    WidgetStore.Widget widget = widgets.save(id(authentication), null, input);
    return ResponseEntity.status(HttpStatus.CREATED).body(widget);
  }

  @PutMapping("/{id}")
  public WidgetStore.Widget update(
      Authentication authentication,
      @PathVariable("id") long widgetId,
      @Valid @RequestBody WidgetStore.Input input) {
    long userId = id(authentication);
    WidgetStore.Widget widget = widgets.save(userId, widgetId, input);
    data.evictUser(userId);
    return widget;
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
      Authentication authentication,
      @PathVariable("id") long widgetId) {
    long userId = id(authentication);
    widgets.delete(userId, widgetId);
    data.evictUser(userId);
    return ResponseEntity.noContent().build();
  }

  @PutMapping("/order")
  public ResponseEntity<Void> reorder(
      Authentication authentication,
      @RequestBody Order order) {
    widgets.reorder(id(authentication), order.ids());
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/{id}/data")
  public WidgetData data(
      Authentication authentication,
      @PathVariable("id") long widgetId) {
    return data.data(id(authentication), widgetId);
  }
}
