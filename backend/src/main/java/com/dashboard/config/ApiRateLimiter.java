package com.dashboard.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.time.Duration;
import org.springframework.stereotype.Component;

@Component
public class ApiRateLimiter {

  private static final long WINDOW_MILLIS = Duration.ofMinutes(1).toMillis();

  private record Window(long startedAt, int count) {
  }

  private final Cache<String, Window> windows = Caffeine.newBuilder()
      .maximumSize(20_000)
      .expireAfterWrite(Duration.ofMinutes(2))
      .build();

  public boolean allow(String key, int limit) {
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
