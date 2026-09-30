package com.dashboard.dashboard;

import com.dashboard.integration.GithubConnection;
import com.dashboard.integration.WidgetDataService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
public class DashboardController {
  public record ServiceView(String name, String label, boolean oauth, boolean connected, boolean available, List<Catalog.WidgetType> widgets) {}
  public record Order(List<Long> ids) {}
  private final Catalog catalog;
  private final WidgetStore store;
  private final WidgetDataService data;
  private final GithubConnection github;
  private final String frontendUrl;
  public DashboardController(Catalog catalog, WidgetStore store, WidgetDataService data, GithubConnection github,
      @Value("${app.frontend-url}") String frontendUrl) {
    this.catalog = catalog; this.store = store; this.data = data; this.github = github; this.frontendUrl = frontendUrl;
  }
  private long user(Authentication auth) { return (Long) auth.getPrincipal(); }
  @GetMapping("/about.json")
  public Map<String, Object> about(HttpServletRequest request) {
    return Map.of("client", Map.of("host", request.getRemoteAddr()), "server", Map.of("current_time", Instant.now().getEpochSecond(), "services", catalog.services()));
  }
  @GetMapping("/api/services")
  public List<ServiceView> services(Authentication auth) {
    return catalog.services().stream().map(s -> new ServiceView(s.name(), s.label(), s.oauth(), store.connected(user(auth), s.name()),
        !s.oauth() || github.configured(), s.widgets())).toList();
  }
  @PostMapping("/api/services/{name}/connect")
  public Map<String, String> connect(Authentication auth, @PathVariable String name, HttpServletRequest request) {
    if (catalog.service(name).oauth()) return Map.of("url", github.begin(user(auth), request.getSession()));
    store.connect(user(auth), name, null);
    return Map.of();
  }
  @DeleteMapping("/api/services/{name}")
  public ResponseEntity<Void> disconnect(Authentication auth, @PathVariable String name) {
    store.disconnect(user(auth), name); data.evictUser(user(auth)); return ResponseEntity.noContent().build();
  }
  @GetMapping("/api/services/github/callback")
  public ResponseEntity<Void> callback(Authentication auth, HttpServletRequest request,
      @RequestParam(required=false) String state, @RequestParam(required=false) String code) {
    String status;
    try { github.complete(user(auth), request.getSession(), state, code); status = "connected"; }
    catch (org.springframework.web.server.ResponseStatusException exception) { status = "failed"; }
    data.evictUser(user(auth));
    return ResponseEntity.status(303).location(URI.create(frontendUrl + "/?github=" + status)).build();
  }
  @GetMapping("/api/widgets")
  public List<WidgetStore.Widget> widgets(Authentication auth) { return store.list(user(auth)); }
  @PostMapping("/api/widgets")
  public ResponseEntity<WidgetStore.Widget> create(Authentication auth, @Valid @RequestBody WidgetStore.Input input) {
    return ResponseEntity.status(201).body(store.save(user(auth), null, input));
  }
  @PutMapping("/api/widgets/{id}")
  public WidgetStore.Widget update(Authentication auth, @PathVariable long id, @Valid @RequestBody WidgetStore.Input input) {
    var widget = store.save(user(auth), id, input); data.evictUser(user(auth)); return widget;
  }
  @DeleteMapping("/api/widgets/{id}")
  public ResponseEntity<Void> delete(Authentication auth, @PathVariable long id) {
    store.delete(user(auth), id); data.evictUser(user(auth)); return ResponseEntity.noContent().build();
  }
  @PutMapping("/api/widgets/order")
  public ResponseEntity<Void> order(Authentication auth, @RequestBody Order order) {
    store.reorder(user(auth), order.ids()); return ResponseEntity.noContent().build();
  }
  @GetMapping("/api/widgets/{id}/data")
  public WidgetDataService.Data data(Authentication auth, @PathVariable long id) { return data.data(user(auth), id); }
}
