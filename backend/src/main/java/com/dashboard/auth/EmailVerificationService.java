package com.dashboard.auth;

import com.dashboard.common.exception.ApiErrors;
import com.dashboard.common.security.SecureTokens;
import com.dashboard.user.User;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmailVerificationService {

  private static final int TOKEN_BYTES = 32;
  private static final int EXPIRATION_MINUTES = 30;

  private final EmailVerificationRepository tokens;
  private final SecureTokens secureTokens;
  private final VerificationMailSender mail;

  public EmailVerificationService(
      EmailVerificationRepository tokens,
      SecureTokens secureTokens,
      VerificationMailSender mail) {
    this.tokens = tokens;
    this.secureTokens = secureTokens;
    this.mail = mail;
  }

  @Transactional
  public void sendVerificationEmail(User user) {
    tokens.deleteAllForUser(user.getId());

    String clearToken = secureTokens.urlSafe(TOKEN_BYTES);
    EmailVerificationToken storedToken = new EmailVerificationToken(
        user,
        secureTokens.sha256Hex(clearToken),
        expiresAt());

    tokens.saveAndFlush(storedToken);
    mail.send(user.getEmail(), clearToken);
  }

  @Transactional
  public void verifyEmail(String clearToken) {
    EmailVerificationToken token = findToken(clearToken);
    requireUsable(token);

    User user = token.getUser();
    if (user.isEmailVerified()) {
      throw invalidToken();
    }

    user.verifyEmail();
    token.markAsUsed();
  }

  private EmailVerificationToken findToken(String clearToken) {
    String hash = secureTokens.sha256Hex(clearToken);
    return tokens.findByTokenHash(hash).orElseThrow(this::invalidToken);
  }

  private void requireUsable(EmailVerificationToken token) {
    if (token.isUsed() || token.isExpired()) {
      throw invalidToken();
    }
  }

  private Instant expiresAt() {
    return Instant.now().plus(EXPIRATION_MINUTES, ChronoUnit.MINUTES);
  }

  private RuntimeException invalidToken() {
    return ApiErrors.badRequest("Invalid or expired verification token");
  }
}
