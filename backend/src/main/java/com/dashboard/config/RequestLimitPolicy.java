package com.dashboard.config;

final class RequestLimitPolicy {

  private static final int AUTH_ATTEMPTS_PER_MINUTE = 12;
  private static final int REGISTER_ATTEMPTS_PER_MINUTE = 6;
  private static final int API_REQUESTS_PER_MINUTE = 600;

  int limit(String path, String method) {
    if (!"POST".equals(method)) {
      return API_REQUESTS_PER_MINUTE;
    }
    if (path.equals("/api/auth/register")) {
      return REGISTER_ATTEMPTS_PER_MINUTE;
    }
    if (path.startsWith("/api/auth/")) {
      return AUTH_ATTEMPTS_PER_MINUTE;
    }
    return API_REQUESTS_PER_MINUTE;
  }

  String bucket(String path, String method) {
    if ("POST".equals(method) && path.startsWith("/api/auth/")) {
      return path;
    }
    return "api";
  }
}
