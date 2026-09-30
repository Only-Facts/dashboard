package com.dashboard.about;

import com.dashboard.dashboard.Catalog;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AboutController {

  private final Catalog catalog;

  public AboutController(Catalog catalog) {
    this.catalog = catalog;
  }

  @GetMapping("/about.json")
  public Map<String, Object> about(HttpServletRequest request) {
    return Map.of(
        "client", Map.of("host", request.getRemoteAddr()),
        "server", Map.of(
            "current_time", Instant.now().getEpochSecond(),
            "services", catalog.services()));
  }
}
