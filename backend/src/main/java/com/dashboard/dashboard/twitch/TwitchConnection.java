package com.dashboard.dashboard.twitch;

import com.dashboard.common.ApiErrors;
import com.dashboard.common.SecureTokens;
import com.dashboard.dashboard.DashboardService;
import com.dashboard.dashboard.DashboardRepository;
import tools.jackson.databind.JsonNode;
import com.dashboard.dashboard.github.TokenCipher;
import com.dashboard.widget.ProviderClient;
import jakarta.servlet.http.HttpSession;
import java.io.Serializable;
import java.time.Instant;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TwitchConnection {
  private static final String SESSION_KEY = "twitchAttempt";
  private record Attempt(String state, long userId, Instant expiresAt)
      implements Serializable {}

  private final String clientId;
  private final String clientSecret;
  private final String callbackUrl;
  private final ProviderClient client;
  private final SecureTokens tokens;
  private final TokenCipher cipher;
  private final DashboardService subscriptions;
  private final DashboardRepository repository;

  public TwitchConnection(
      @Value("${app.twitch.client-id:}") String clientId,
      @Value("${app.twitch.client-secret:}") String clientSecret,
      @Value("${app.twitch.callback}") String callbackUrl,
      ProviderClient client, SecureTokens tokens, TokenCipher cipher,
      DashboardService subscriptions, DashboardRepository repository) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.callbackUrl = callbackUrl;
    this.client = client;
    this.tokens = tokens;
    this.cipher = cipher;
    this.subscriptions = subscriptions;
    this.repository = repository;
  }

  public boolean configured() {
    return !clientId.isBlank() && !clientSecret.isBlank() && !callbackUrl.isBlank()
        && cipher.configured();
  }

  public String clientId() {
    return clientId;
  }

  public String begin(long userId, HttpSession session) {
    if (!configured()) {
      throw ApiErrors.badRequest("Twitch connection is not configured by the server administrator");
    }
    String state = tokens.urlSafe(32);
    session.setAttribute(SESSION_KEY, new Attempt(state, userId, Instant.now().plusSeconds(600)));
    return "https://id.twitch.tv/oauth2/authorize?" + ProviderClient.form(Map.of(
        "client_id", clientId, "redirect_uri", callbackUrl, "response_type", "code",
        "scope", "user:read:follows", "state", state));
  }

  public void complete(long userId, HttpSession session, String state, String code) {
    Attempt attempt;
    synchronized (session) {
      attempt = (Attempt) session.getAttribute(SESSION_KEY);
      session.removeAttribute(SESSION_KEY);
    }
    if (attempt == null || attempt.userId() != userId
        || attempt.expiresAt().isBefore(Instant.now())
        || state == null || state.length() > 128
        || !tokens.constantTimeEquals(attempt.state(), state)
        || code == null || code.isBlank() || code.length() > 512) {
      throw ApiErrors.badRequest("Invalid or expired Twitch authorization. Please connect again.");
    }
    var response = client.post("https://id.twitch.tv/oauth2/token", ProviderClient.form(Map.of(
        "client_id", clientId, "client_secret", clientSecret, "code", code,
        "redirect_uri", callbackUrl, "grant_type", "authorization_code")));
    String token = response.path("access_token").asText("");
    if (token.isBlank()) {
      throw ApiErrors.badRequest("Twitch authorization was declined. Please connect again.");
    }
    JsonNode identity = validate(token);
    String refreshToken = response.path("refresh_token").asText("");
    if (refreshToken.isBlank()) {
      throw ApiErrors.badRequest("Twitch authorization did not return a refresh token. Please try again.");
    }
    subscriptions.connect(
        userId,
        "twitch",
        cipher.encrypt("twitch", token + "\n" + refreshToken + "\n" + identity.path("user_id").asText(), userId));
  }

  // Serialize refreshes so simultaneous widgets do not rotate the same refresh token.
  public synchronized String token(long userId) {
    return credentials(userId)[0];
  }

  public synchronized JsonNode get(long userId, String url) {
    String token = token(userId);
    try {
      return client.get(url, token, clientId);
    } catch (ProviderClient.ProviderException exception) {
      if (exception.providerStatus() != 401) throw exception;
      return client.get(url, refresh(userId), clientId);
    }
  }

  public synchronized void validateSession(long userId) {
    String token = token(userId);
    try {
      validate(token);
    } catch (ProviderClient.ProviderException exception) {
      if (exception.providerStatus() != 401) throw exception;
      refresh(userId);
    }
  }

  private JsonNode validate(String token) {
    JsonNode identity = client.get("https://id.twitch.tv/oauth2/validate", token);
    boolean follows = false;
    for (JsonNode scope : identity.path("scopes")) {
      follows |= "user:read:follows".equals(scope.asText());
    }
    if (!clientId.equals(identity.path("client_id").asText())
        || !identity.path("user_id").asText().matches("[0-9]+") || !follows) {
      throw ApiErrors.badRequest("Reconnect Twitch to grant access to followed channels");
    }
    return identity;
  }

  private String[] credentials(long userId) {
    return cipher.decrypt("twitch", subscriptions.twitchToken(userId), userId).split("\\n", -1);
  }

  private String refresh(long userId) {
    String previous = subscriptions.twitchToken(userId);
    String[] credentials = cipher.decrypt("twitch", previous, userId).split("\\n", -1);
    if (credentials.length < 2 || credentials[1].isBlank()) {
      repository.invalidateTwitchToken(userId, previous);
      throw ApiErrors.badRequest("Reconnect Twitch to continue");
    }
    JsonNode response;
    try {
      response = client.post("https://id.twitch.tv/oauth2/token", ProviderClient.form(Map.of(
          "client_id", clientId, "client_secret", clientSecret,
          "grant_type", "refresh_token", "refresh_token", credentials[1])));
    } catch (ProviderClient.ProviderException exception) {
      if (exception.providerStatus() == 400 || exception.providerStatus() == 401) {
        repository.invalidateTwitchToken(userId, previous);
        throw ApiErrors.badRequest("Reconnect Twitch to continue");
      }
      throw exception;
    }
    String access = response.path("access_token").asText();
    String refresh = response.path("refresh_token").asText();
    if (access.isBlank() || refresh.isBlank()) throw ApiErrors.badGateway("Twitch did not return usable tokens");
    JsonNode identity = validate(access);
    if (credentials.length > 2 && !credentials[2].equals(identity.path("user_id").asText())) {
      repository.invalidateTwitchToken(userId, previous);
      throw ApiErrors.badRequest("Reconnect Twitch to continue");
    }
    String replacement = cipher.encrypt("twitch", access + "\n" + refresh + "\n" + identity.path("user_id").asText(), userId);
    if (!repository.replaceTwitchToken(userId, previous, replacement)) {
      throw ApiErrors.badRequest("Twitch connection changed. Try again.");
    }
    return access;
  }
}
