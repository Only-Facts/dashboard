package com.dashboard.service;

import static com.dashboard.common.security.AuthenticatedUser.id;

import com.dashboard.dashboard.Catalog;
import com.dashboard.integration.GithubConnection;
import com.dashboard.integration.WidgetDataService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

  public record ServiceView(
      String name,
      String label,
      boolean oauth,
      boolean connected,
      boolean available,
      List<Catalog.WidgetType> widgets) {
  }

  private final Catalog catalog;
  private final ServiceSubscriptionService subscriptions;
  private final WidgetDataService data;
  private final GithubConnection github;

  public ServiceController(
      Catalog catalog,
      ServiceSubscriptionService subscriptions,
      WidgetDataService data,
      GithubConnection github) {
    this.catalog = catalog;
    this.subscriptions = subscriptions;
    this.data = data;
    this.github = github;
  }

  @GetMapping
  public List<ServiceView> services(Authentication authentication) {
    long userId = id(authentication);
    return catalog.services().stream()
        .map(service -> view(userId, service))
        .toList();
  }

  @PostMapping("/{name}/connect")
  public Map<String, String> connect(
      Authentication authentication,
      @PathVariable String name,
      HttpServletRequest request) {
    long userId = id(authentication);
    Catalog.Service service = catalog.service(name);
    if (service.oauth()) {
      return Map.of("url", github.begin(userId, request.getSession()));
    }

    subscriptions.connect(userId, name, null);
    return Map.of();
  }

  @DeleteMapping("/{name}")
  public ResponseEntity<Void> disconnect(
      Authentication authentication,
      @PathVariable String name) {
    long userId = id(authentication);
    subscriptions.disconnect(userId, name);
    data.evictUser(userId);
    return ResponseEntity.noContent().build();
  }

  private ServiceView view(long userId, Catalog.Service service) {
    return new ServiceView(
        service.name(),
        service.label(),
        service.oauth(),
        subscriptions.connected(userId, service.name()),
        !service.oauth() || github.configured(),
        service.widgets());
  }
}
