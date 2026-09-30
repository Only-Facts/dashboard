package com.dashboard.integration.oauth;

import com.dashboard.common.exception.ApiErrors;
import com.dashboard.common.security.SecureTokens;
import jakarta.servlet.http.HttpSession;
import java.io.Serializable;
import java.time.Instant;
import org.springframework.stereotype.Component;

@Component
public class GithubAuthorizationSession {

  private static final String SESSION_KEY = "githubAttempt";
  private static final int LIFETIME_SECONDS = 600;
  private static final int TOKEN_BYTES = 32;
  private static final int MAX_STATE_LENGTH = 128;
  private static final int MAX_CODE_LENGTH = 512;

  public record Attempt(String state, String verifier) {
  }

  private record StoredAttempt(
      String state,
      String verifier,
      long userId,
      Instant expiresAt) implements Serializable {
  }

  private final SecureTokens tokens;

  public GithubAuthorizationSession(SecureTokens tokens) {
    this.tokens = tokens;
  }

  public Attempt begin(long userId, HttpSession session) {
    String state = tokens.urlSafe(TOKEN_BYTES);
    String verifier = tokens.urlSafe(TOKEN_BYTES);

    session.setAttribute(
        SESSION_KEY,
        new StoredAttempt(state, verifier, userId, expiresAt()));
    return new Attempt(state, verifier);
  }

  public Attempt consume(
      long userId,
      HttpSession session,
      String state,
      String code) {
    StoredAttempt stored = remove(session);
    validate(stored, userId, state, code);
    return new Attempt(stored.state(), stored.verifier());
  }

  private StoredAttempt remove(HttpSession session) {
    synchronized (session) {
      StoredAttempt attempt = (StoredAttempt) session.getAttribute(SESSION_KEY);
      session.removeAttribute(SESSION_KEY);
      return attempt;
    }
  }

  private void validate(
      StoredAttempt attempt,
      long userId,
      String state,
      String code) {
    if (!isValid(attempt, userId, state, code)) {
      throw ApiErrors.badRequest(
          "Invalid or expired GitHub authorization. Please connect again.");
    }
  }

  private boolean isValid(
      StoredAttempt attempt,
      long userId,
      String state,
      String code) {
    return attempt != null
        && attempt.userId() == userId
        && !attempt.expiresAt().isBefore(Instant.now())
        && validState(attempt.state(), state)
        && validCode(code);
  }

  private boolean validState(String expected, String state) {
    return state != null
        && state.length() <= MAX_STATE_LENGTH
        && tokens.constantTimeEquals(expected, state);
  }

  private boolean validCode(String code) {
    return code != null
        && !code.isBlank()
        && code.length() <= MAX_CODE_LENGTH;
  }

  private Instant expiresAt() {
    return Instant.now().plusSeconds(LIFETIME_SECONDS);
  }
}
