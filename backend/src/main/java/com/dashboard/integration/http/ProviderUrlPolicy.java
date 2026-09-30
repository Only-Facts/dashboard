package com.dashboard.integration.http;

import java.net.URI;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class ProviderUrlPolicy {

  private static final Set<String> ALLOWED_HOSTS = Set.of(
      "api.github.com",
      "github.com",
      "geocoding-api.open-meteo.com",
      "api.open-meteo.com",
      "air-quality-api.open-meteo.com",
      "api.frankfurter.dev",
      "hn.algolia.com",
      "api.steampowered.com");

  public URI validate(String url) {
    URI uri = URI.create(url);
    if (!isAllowed(uri)) {
      throw new IllegalArgumentException("Unsupported provider URL");
    }
    return uri;
  }

  private boolean isAllowed(URI uri) {
    return "https".equals(uri.getScheme())
        && ALLOWED_HOSTS.contains(uri.getHost())
        && uri.getUserInfo() == null
        && uri.getPort() == -1;
  }
}
