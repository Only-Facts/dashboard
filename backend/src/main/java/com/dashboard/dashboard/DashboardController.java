package com.dashboard.dashboard;

import static com.dashboard.auth.AuthService.id;

import com.dashboard.common.ApiErrors;
import com.dashboard.dashboard.github.GithubConnection;
import com.dashboard.dashboard.twitch.TwitchConnection;
import com.dashboard.dashboard.spotify.SpotifyConnection;
import com.dashboard.widget.WidgetData;
import com.dashboard.widget.WidgetDataService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class DashboardController {

  private final DashboardService widgets;
  private final WidgetDataService data;
  private final Catalog catalog;
  private final GithubConnection github;
  private final TwitchConnection twitch;
  private final SpotifyConnection spotify;
  private final String frontendUrl;

  public DashboardController(
      DashboardService widgets,
      WidgetDataService data,
      Catalog catalog,
      GithubConnection github,
      TwitchConnection twitch,
      SpotifyConnection spotify,
      @Value("${app.frontend-url}") String frontendUrl) {
    this.widgets = widgets;
    this.data = data;
    this.catalog = catalog;
    this.github = github;
    this.twitch = twitch;
    this.spotify = spotify;
    this.frontendUrl = stripTrailingSlash(frontendUrl);
  }

  public record Order(List<Long> ids) {
  }

  @GetMapping("/api/widgets")
  public List<DashboardService.Widget> list(Authentication authentication) {
    return widgets.list(id(authentication));
  }

  @PostMapping("/api/widgets")
  public ResponseEntity<DashboardService.Widget> create(
      Authentication authentication,
      @Valid @RequestBody DashboardService.Input input) {
    DashboardService.Widget widget = widgets.save(id(authentication), null, input);
    return ResponseEntity.status(HttpStatus.CREATED).body(widget);
  }

  @PutMapping("/api/widgets/{id}")
  public DashboardService.Widget update(
      Authentication authentication,
      @PathVariable("id") long widgetId,
      @Valid @RequestBody DashboardService.Input input) {
    long userId = id(authentication);
    DashboardService.Widget widget = widgets.save(userId, widgetId, input);
    data.evictUser(userId);
    return widget;
  }

  @DeleteMapping("/api/widgets/{id}")
  public ResponseEntity<Void> delete(
      Authentication authentication,
      @PathVariable("id") long widgetId) {
    long userId = id(authentication);
    widgets.delete(userId, widgetId);
    data.evictUser(userId);
    return ResponseEntity.noContent().build();
  }

  @PutMapping("/api/widgets/order")
  public ResponseEntity<Void> reorder(
      Authentication authentication,
      @RequestBody Order order) {
    widgets.reorder(id(authentication), order.ids());
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/api/widgets/{id}/data")
  public WidgetData data(
      Authentication authentication,
      @PathVariable("id") long widgetId) {
    return data.data(id(authentication), widgetId);
  }

  private static final List<String[]> PUBLIC_WIDGETS = List.of(
      new String[]{"weather", "temperature"},
      new String[]{"currency", "rate"},
      new String[]{"news", "latest"},
      new String[]{"air_quality", "aqi"});

  @GetMapping("/api/public/widgets")
  public List<DashboardService.Widget> publicWidgets() {
    return PUBLIC_WIDGETS.stream()
        .map(widget -> publicWidget(widget[0], widget[1]))
        .toList();
  }

  @GetMapping("/api/public/widgets/{service}/{type}/data")
  public WidgetData publicWidgetData(
      @PathVariable String service,
      @PathVariable String type,
      @RequestParam Map<String, String> config) {
    return config.isEmpty() ? data.publicData(service, type) : data.publicDataWithConfig(service, type, config);
  }

  @GetMapping("/api/public/steam/players")
  public WidgetData publicSteamPlayers(@RequestParam String game) {
    return data.publicSteamPlayers(game);
  }

  private DashboardService.Widget publicWidget(String service, String type) {
    Catalog.WidgetType definition = catalog.type(service, type);
    Map<String, String> config = definition.params().stream()
        .collect(java.util.stream.Collectors.toMap(
            Catalog.Param::name,
            Catalog.Param::defaultValue,
            (first, ignored) -> first,
            java.util.LinkedHashMap::new));
    return new DashboardService.Widget(
        publicWidgetId(service, type),
        service,
        type,
        definition.description(),
        config,
        300,
        PUBLIC_WIDGETS.stream()
            .map(widget -> widget[0] + ":" + widget[1])
            .toList()
            .indexOf(service + ":" + type));
  }

  private long publicWidgetId(String service, String type) {
    return -Math.abs((service + ":" + type).hashCode());
  }

  public record ServiceView(
      String name,
      String label,
      boolean oauth,
      boolean connected,
      boolean available,
      List<Catalog.WidgetType> widgets) {
  }

  @GetMapping("/api/public/services")
  public List<ServiceView> publicServices() {
    return catalog.services().stream()
        .filter(service -> !service.oauth())
        .map(service -> new ServiceView(service.name(), service.label(), false, true, true, service.widgets()))
        .toList();
  }

  @GetMapping("/api/services")
  public List<ServiceView> services(Authentication authentication) {
    long userId = id(authentication);
    return catalog.services().stream()
        .map(service -> view(userId, service))
        .toList();
  }

  @PostMapping("/api/services/{name}/connect")
  public Map<String, String> connect(
      Authentication authentication,
      @PathVariable String name,
      HttpServletRequest request) {
    long userId = id(authentication);
    Catalog.Service service = catalog.service(name);
    if (service.oauth()) {
      String url = switch (name) {
        case "github" -> github.begin(userId, request.getSession());
        case "twitch" -> twitch.begin(userId, request.getSession());
        case "spotify" -> spotify.begin(userId, request.getSession(), request.getServerName());
        default -> throw ApiErrors.badRequest("Unknown service");
      };
      return Map.of("url", url);
    }

    widgets.connect(userId, name, null);
    return Map.of();
  }

  @DeleteMapping("/api/services/{name}")
  public ResponseEntity<Void> disconnect(
      Authentication authentication,
      @PathVariable String name) {
    long userId = id(authentication);
    widgets.disconnect(userId, name);
    data.evictUser(userId);
    return ResponseEntity.noContent().build();
  }

  private ServiceView view(long userId, Catalog.Service service) {
    return new ServiceView(
        service.name(),
        service.label(),
        service.oauth(),
        widgets.connected(userId, service.name()),
        !service.oauth() || switch (service.name()) {
          case "github" -> github.configured();
          case "twitch" -> twitch.configured();
          case "spotify" -> spotify.configured();
          default -> false;
        },
        service.widgets());
  }

  @GetMapping("/api/services/github/callback")
  public ResponseEntity<Void> callback(
      Authentication authentication,
      HttpServletRequest request,
      @RequestParam(required = false) String state,
      @RequestParam(required = false) String code) {
    long userId = id(authentication);
    String status = complete(userId, request, state, code);
    data.evictUser(userId);
    return redirect(status);
  }

  private String complete(
      long userId,
      HttpServletRequest request,
      String state,
      String code) {
    try {
      github.complete(userId, request.getSession(), state, code);
      return "connected";
    } catch (ResponseStatusException exception) {
      return "failed";
    }
  }

  @GetMapping("/api/services/twitch/callback")
  public ResponseEntity<Void> twitchCallback(
      Authentication authentication, HttpServletRequest request,
      @RequestParam(required = false) String state,
      @RequestParam(required = false) String code) {
    long userId = id(authentication);
    String status;
    try {
      twitch.complete(userId, request.getSession(), state, code);
      status = "connected";
    } catch (ResponseStatusException exception) {
      status = "failed";
    }
    data.evictUser(userId);
    return ResponseEntity.status(HttpStatus.SEE_OTHER)
        .location(URI.create(frontendUrl + "?twitch=" + status)).build();
  }

  @GetMapping("/api/services/spotify/callback")
  public ResponseEntity<Void> spotifyCallback(Authentication authentication, HttpServletRequest request,
      @RequestParam(required = false) String state, @RequestParam(required = false) String code) {
    long userId = id(authentication);
    String status;
    try {
      spotify.complete(userId, request.getSession(), state, code);
      status = "connected";
    } catch (ResponseStatusException exception) {
      status = "failed";
    }
    data.evictUser(userId);
    return ResponseEntity.status(HttpStatus.SEE_OTHER)
        .location(URI.create(spotify.frontendUrl(frontendUrl) + "?service=spotify&status=" + status)).build();
  }

  private ResponseEntity<Void> redirect(String status) {
    return ResponseEntity
        .status(HttpStatus.SEE_OTHER)
        .location(URI.create(frontendUrl + "?github=" + status))
        .build();
  }

  private static String stripTrailingSlash(String value) {
    return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
  }

  @GetMapping("/about.json")
  public Map<String, Object> about(HttpServletRequest request) {
    return Map.of(
        "client", Map.of("host", request.getRemoteAddr()),
        "server", Map.of(
            "current_time", Instant.now().getEpochSecond(),
            "services", catalog.services()));
  }

  @GetMapping("/api/health")
  public Map<String, String> health() {
    return Map.of("status", "ok", "message", "Dashboard backend is running");
  }
}
