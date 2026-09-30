package com.dashboard.integration;

import com.dashboard.common.exception.ApiErrors;
import com.dashboard.service.ServiceSubscriptionService;
import com.dashboard.integration.oauth.GithubAuthorizationSession;
import com.dashboard.integration.oauth.GithubOAuthClient;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Service;

@Service
public class GithubConnection {

  private final GithubOAuthClient oauth;
  private final GithubAuthorizationSession attempts;
  private final TokenCipher cipher;
  private final ServiceSubscriptionService subscriptions;

  public GithubConnection(
      GithubOAuthClient oauth,
      GithubAuthorizationSession attempts,
      TokenCipher cipher,
      ServiceSubscriptionService subscriptions) {
    this.oauth = oauth;
    this.attempts = attempts;
    this.cipher = cipher;
    this.subscriptions = subscriptions;
  }

  public boolean configured() {
    return oauth.configured() && cipher.configured();
  }

  public String begin(long userId, HttpSession session) {
    requireConfigured();
    GithubAuthorizationSession.Attempt attempt = attempts.begin(userId, session);
    return oauth.authorizationUrl(attempt.state(), attempt.verifier());
  }

  public void complete(
      long userId,
      HttpSession session,
      String state,
      String code) {
    GithubAuthorizationSession.Attempt attempt = attempts.consume(
        userId,
        session,
        state,
        code);

    String token = oauth.exchange(code, attempt.verifier());
    oauth.verify(token);
    subscriptions.connect(userId, "github", cipher.encrypt(token, userId));
  }

  public String token(long userId) {
    return cipher.decrypt(subscriptions.githubToken(userId), userId);
  }

  private void requireConfigured() {
    if (!configured()) {
      throw ApiErrors.badRequest(
          "GitHub connection is not configured by the server administrator");
    }
  }

}
