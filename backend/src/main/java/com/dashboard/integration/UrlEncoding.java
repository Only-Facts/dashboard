package com.dashboard.integration;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.stream.Collectors;

public final class UrlEncoding {

  private UrlEncoding() {
  }

  public static String value(String input) {
    return URLEncoder.encode(input, StandardCharsets.UTF_8);
  }

  public static String form(Map<String, String> values) {
    return values.entrySet().stream()
        .map(entry -> value(entry.getKey()) + "=" + value(entry.getValue()))
        .collect(Collectors.joining("&"));
  }
}
