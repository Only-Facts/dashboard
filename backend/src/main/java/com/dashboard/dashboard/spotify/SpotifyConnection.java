package com.dashboard.dashboard.spotify;

import com.dashboard.common.ApiErrors;
import com.dashboard.common.SecureTokens;
import com.dashboard.dashboard.DashboardRepository;
import com.dashboard.dashboard.DashboardService;
import com.dashboard.dashboard.github.TokenCipher;
import com.dashboard.widget.ProviderClient;
import jakarta.servlet.http.HttpSession;
import java.io.Serializable;
import java.time.Instant;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

@Service
public class SpotifyConnection {
  private static final String SESSION_KEY = "spotifyAttempt";
  private static final String TOKEN_URL = "https://accounts.spotify.com/api/token";
  private record Attempt(String state, long userId, Instant expiresAt) implements Serializable {}
  private final String clientId;
  private final String clientSecret;
  private final String callback;
  private final ProviderClient client;
  private final SecureTokens tokens;
  private final TokenCipher cipher;
  private final DashboardService subscriptions;
  private final DashboardRepository repository;

  public SpotifyConnection(@Value("${app.spotify.client-id:}") String clientId,
      @Value("${app.spotify.client-secret:}") String clientSecret,
      @Value("${app.spotify.callback}") String callback, ProviderClient client,
      SecureTokens tokens, TokenCipher cipher, DashboardService subscriptions,
      DashboardRepository repository) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.callback = callback;
    this.client = client;
    this.tokens = tokens;
    this.cipher = cipher;
    this.subscriptions = subscriptions;
    this.repository = repository;
  }

  public boolean configured() {
    return !clientId.isBlank() && !clientSecret.isBlank() && !callback.isBlank() && cipher.configured();
  }

  public String frontendUrl(String configuredFrontend) {
    java.net.URI frontend = java.net.URI.create(configuredFrontend);
    java.net.URI redirect = java.net.URI.create(callback);
    if ("localhost".equals(frontend.getHost()) && "127.0.0.1".equals(redirect.getHost())) {
      return redirect.getScheme() + "://" + redirect.getRawAuthority();
    }
    return configuredFrontend;
  }

  public String begin(long userId, HttpSession session, String requestHost) {
    if (!configured()) throw ApiErrors.badRequest("Spotify connection is not configured by the server administrator");
    java.net.URI redirect = java.net.URI.create(callback);
    if (!redirect.getHost().equalsIgnoreCase(requestHost)) {
      return redirect.getScheme() + "://" + redirect.getRawAuthority() + "/login?spotify=session_required";
    }
    return begin(userId, session);
  }

  public String begin(long userId, HttpSession session) {
    if (!configured()) throw ApiErrors.badRequest("Spotify connection is not configured by the server administrator");
    String state = tokens.urlSafe(32);
    session.setAttribute(SESSION_KEY, new Attempt(state, userId, Instant.now().plusSeconds(600)));
    return "https://accounts.spotify.com/authorize?" + ProviderClient.form(Map.of(
        "client_id", clientId, "redirect_uri", callback, "response_type", "code", "state", state,
        "scope", "user-read-recently-played user-top-read playlist-read-private playlist-read-collaborative"));
  }

  public synchronized void complete(long userId, HttpSession session, String state, String code) {
    Attempt attempt;
    synchronized (session) {
      attempt = (Attempt) session.getAttribute(SESSION_KEY);
      session.removeAttribute(SESSION_KEY);
    }
    if (attempt == null || attempt.userId() != userId || attempt.expiresAt().isBefore(Instant.now())
        || state == null || state.length() > 128 || !tokens.constantTimeEquals(attempt.state(), state)
        || code == null || code.isBlank() || code.length() > 1024) {
      throw ApiErrors.badRequest("Invalid or expired Spotify authorization. Please connect again.");
    }
    JsonNode response = exchange(Map.of("grant_type", "authorization_code", "code", code, "redirect_uri", callback));
    String access = response.path("access_token").asText("");
    String refresh = response.path("refresh_token").asText("");
    if (access.isBlank() || refresh.isBlank()) throw ApiErrors.badGateway("Spotify did not return usable tokens");
    String spotifyId = identity(access);
    subscriptions.connect(userId, "spotify", cipher.encrypt("spotify", access + "\n" + refresh + "\n" + spotifyId, userId));
  }

  public synchronized JsonNode get(long userId, String url) {
    String previous = protectedToken(userId);
    String[] credentials = cipher.decrypt("spotify", previous, userId).split("\\n", -1);
    try {
      return client.get(url, credentials[0]);
    } catch (ProviderClient.ProviderException exception) {
      if (exception.providerStatus() != 401) throw exception;
      return client.get(url, refresh(userId, previous, credentials));
    }
  }

  private String refresh(long userId, String previous, String[] credentials) {
    if (credentials.length < 3 || credentials[1].isBlank()) {
      repository.invalidateServiceToken(userId, "spotify", previous);
      throw ApiErrors.badRequest("Reconnect Spotify to continue");
    }
    JsonNode response;
    try {
      response = exchange(Map.of("grant_type", "refresh_token", "refresh_token", credentials[1]));
    } catch (ProviderClient.ProviderException exception) {
      if (exception.providerStatus() == 400 || exception.providerStatus() == 401) {
        repository.invalidateServiceToken(userId, "spotify", previous);
        throw ApiErrors.badRequest("Reconnect Spotify to continue");
      }
      throw exception;
    }
    String access = response.path("access_token").asText("");
    String refresh = response.path("refresh_token").asText(credentials[1]);
    if (access.isBlank() || refresh.isBlank()) throw ApiErrors.badGateway("Spotify did not return usable tokens");
    if (!credentials[2].equals(identity(access))) {
      repository.invalidateServiceToken(userId, "spotify", previous);
      throw ApiErrors.badRequest("Reconnect Spotify to continue");
    }
    String replacement = cipher.encrypt("spotify", access + "\n" + refresh + "\n" + credentials[2], userId);
    if (!repository.replaceServiceToken(userId, "spotify", previous, replacement)) {
      throw ApiErrors.badRequest("Spotify connection changed. Try again.");
    }
    return access;
  }

  private String identity(String access) {
    String id = client.get("https://api.spotify.com/v1/me", access).path("id").asText("");
    if (id.isBlank()) throw ApiErrors.badGateway("Spotify user could not be identified");
    return id;
  }

  private String protectedToken(long userId) {
    return repository.serviceToken(userId, "spotify").orElseThrow(() -> ApiErrors.badRequest("Reconnect Spotify to continue"));
  }

  private JsonNode exchange(Map<String, String> body) {
    return client.postBasic(TOKEN_URL, ProviderClient.form(body), clientId, clientSecret);
  }
}
