package com.dashboard.dashboard.github;

import com.dashboard.common.ApiErrors;
import com.dashboard.common.SecureTokens;
import com.dashboard.dashboard.DashboardService;
import com.dashboard.widget.ProviderClient;
import jakarta.servlet.http.HttpSession;
import java.io.Serializable;
import java.time.Instant;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GithubConnection {

  private static final String SESSION_KEY = "githubAttempt";

  private record Attempt(
      String state, String verifier, long userId, Instant expiresAt) implements Serializable {
  }

  private final String clientId;
  private final String clientSecret;
  private final String callbackUrl;
  private final ProviderClient client;
  private final SecureTokens tokens;
  private final TokenCipher cipher;
  private final DashboardService subscriptions;

  public GithubConnection(
      @Value("${app.github.client-id:}") String clientId,
      @Value("${app.github.client-secret:}") String clientSecret,
      @Value("${app.github.callback}") String callbackUrl,
      ProviderClient client,
      SecureTokens tokens,
      TokenCipher cipher,
      DashboardService subscriptions) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.callbackUrl = callbackUrl;
    this.client = client;
    this.tokens = tokens;
    this.cipher = cipher;
    this.subscriptions = subscriptions;
  }

  public boolean configured() {
    return !clientId.isBlank() && !clientSecret.isBlank() && cipher.configured();
  }

  public String begin(long userId, HttpSession session) {
    if (!configured()) {
      throw ApiErrors.badRequest("GitHub connection is not configured by the server administrator");
    }
    String state = tokens.urlSafe(32);
    String verifier = tokens.urlSafe(32);
    session.setAttribute(SESSION_KEY, new Attempt(state, verifier, userId, Instant.now().plusSeconds(600)));
    return "https://github.com/login/oauth/authorize?" + ProviderClient.form(Map.of(
        "client_id", clientId,
        "redirect_uri", callbackUrl,
        "scope", "read:user",
        "state", state,
        "code_challenge", tokens.sha256Base64Url(verifier),
        "code_challenge_method", "S256"));
  }

  public void complete(long userId, HttpSession session, String state, String code) {
    Attempt attempt;
    // Consume the attempt before validation, so every callback is single-use.
    synchronized (session) {
      attempt = (Attempt) session.getAttribute(SESSION_KEY);
      session.removeAttribute(SESSION_KEY);
    }
    if (attempt == null || attempt.userId() != userId
        || attempt.expiresAt().isBefore(Instant.now())
        || state == null || state.length() > 128
        || !tokens.constantTimeEquals(attempt.state(), state)
        || code == null || code.isBlank() || code.length() > 512) {
      throw ApiErrors.badRequest("Invalid or expired GitHub authorization. Please connect again.");
    }

    var response = client.post("https://github.com/login/oauth/access_token", ProviderClient.form(Map.of(
        "client_id", clientId,
        "client_secret", clientSecret,
        "redirect_uri", callbackUrl,
        "code", code,
        "code_verifier", attempt.verifier())));
    String token = response.path("access_token").asText("");
    if (token.isBlank()) {
      throw ApiErrors.badRequest("GitHub authorization was declined. Please connect again.");
    }
    client.get("https://api.github.com/user", token);
    subscriptions.connect(userId, "github", cipher.encrypt(token, userId));
  }

  public String token(long userId) {
    return cipher.decrypt(subscriptions.githubToken(userId), userId);
  }
}
