package com.dashboard.dashboard.twitch;

import com.dashboard.dashboard.DashboardRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class TwitchTokenValidation {
  private static final Logger LOG = LoggerFactory.getLogger(TwitchTokenValidation.class);
  private final DashboardRepository repository;
  private final TwitchConnection twitch;

  public TwitchTokenValidation(DashboardRepository repository, TwitchConnection twitch) {
    this.repository = repository;
    this.twitch = twitch;
  }

  // Starts immediately and validates even when nobody is loading widgets.
  @Scheduled(fixedDelay = 3_000_000)
  public void validateConnections() {
    if (!twitch.configured()) return;
    for (long userId : repository.twitchUsers()) {
      try {
        twitch.validateSession(userId);
      } catch (RuntimeException exception) {
        LOG.warn("Twitch validation failed for Orbit user {} ({})", userId, exception.getClass().getSimpleName());
      }
    }
  }
}
