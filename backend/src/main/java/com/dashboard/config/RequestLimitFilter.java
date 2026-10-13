package com.dashboard.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RequestLimitFilter extends OncePerRequestFilter {

  private static final long MAX_BODY_BYTES = 16_384;
  private static final int AUTH_ATTEMPTS_PER_MINUTE = 12;
  private static final int REGISTER_ATTEMPTS_PER_MINUTE = 6;
  private static final int API_REQUESTS_PER_MINUTE = 600;

  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain chain) throws ServletException, IOException {
    if (bodyTooLarge(request)) {
      reject(response, HttpStatus.PAYLOAD_TOO_LARGE, "Request body is too large.");
      return;
    }
    if (!isApiRequest(request)) {
      chain.doFilter(request, response);
      return;
    }
    if (!withinRateLimit(request)) {
      response.setHeader("Retry-After", "60");
      reject(response, HttpStatus.TOO_MANY_REQUESTS, "Too many requests. Please wait a minute.");
      return;
    }
    chain.doFilter(request, response);
  }

  private boolean bodyTooLarge(HttpServletRequest request) {
    return request.getContentLengthLong() > MAX_BODY_BYTES;
  }

  private boolean isApiRequest(HttpServletRequest request) {
    return request.getRequestURI().startsWith("/api/");
  }

  private boolean withinRateLimit(HttpServletRequest request) {
    String path = request.getRequestURI();
    String method = request.getMethod();
    boolean authPost = "POST".equals(method) && path.startsWith("/api/auth/");
    String bucket = authPost ? path : "api";
    int limit = API_REQUESTS_PER_MINUTE;
    if (authPost) {
      limit = path.equals("/api/auth/register")
          ? REGISTER_ATTEMPTS_PER_MINUTE : AUTH_ATTEMPTS_PER_MINUTE;
    }
    String key = request.getRemoteAddr() + ":" + bucket;
    return allow(key, limit);
  }

  private void reject(
      HttpServletResponse response,
      HttpStatus status,
      String message) throws IOException {
    response.setStatus(status.value());
    response.setContentType("application/json");
    response.setCharacterEncoding("UTF-8");
    response.getWriter().write("{\"error\":\"" + message + "\"}");
  }

  private static final long WINDOW_MILLIS = Duration.ofMinutes(1).toMillis();

  private record Window(long startedAt, int count) {
  }

  private final Cache<String, Window> windows = Caffeine.newBuilder()
      .maximumSize(20_000)
      .expireAfterWrite(Duration.ofMinutes(2))
      .build();

  private boolean allow(String key, int limit) {
    return increment(key) <= limit;
  }

  private int increment(String key) {
    long now = System.currentTimeMillis();
    Window window = windows.asMap().compute(
        key,
        (ignored, previous) -> nextWindow(previous, now));
    return window.count();
  }

  private Window nextWindow(Window previous, long now) {
    if (previous == null || expired(previous, now)) {
      return new Window(now, 1);
    }
    return new Window(previous.startedAt(), previous.count() + 1);
  }

  private boolean expired(Window window, long now) {
    return now - window.startedAt() >= WINDOW_MILLIS;
  }
}
