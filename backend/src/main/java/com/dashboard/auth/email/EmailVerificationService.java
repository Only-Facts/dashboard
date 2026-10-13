package com.dashboard.auth.email;

import com.dashboard.auth.user.User;
import com.dashboard.common.ApiErrors;
import com.dashboard.common.SecureTokens;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmailVerificationService {

  private static final int TOKEN_BYTES = 32;
  private static final int EXPIRATION_MINUTES = 30;

  private final EmailVerificationRepository tokens;
  private final SecureTokens secureTokens;
  private final JavaMailSender mailSender;
  private final String frontendUrl;
  private final String mailFrom;

  public EmailVerificationService(
      EmailVerificationRepository tokens,
      SecureTokens secureTokens,
      JavaMailSender mailSender,
      @Value("${app.frontend-url}") String frontendUrl,
      @Value("${app.mail.from}") String mailFrom) {
    this.tokens = tokens;
    this.secureTokens = secureTokens;
    this.mailSender = mailSender;
    this.frontendUrl = frontendUrl;
    this.mailFrom = mailFrom;
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
    send(user.getEmail(), clearToken);
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

  private void send(String email, String token) {
    SimpleMailMessage message = new SimpleMailMessage();
    message.setFrom(mailFrom);
    message.setTo(email);
    message.setSubject("Confirm your Dashboard account");
    message.setText(body(verificationUrl(token)));
    mailSender.send(message);
  }

  private String verificationUrl(String token) {
    String separator = frontendUrl.endsWith("/") ? "" : "/";
    return frontendUrl + separator + "verify-email?token=" + token;
  }

  private String body(String verificationUrl) {
    return """
        Welcome to Dashboard!

        Open this link, then confirm the verification in your browser:

        %s

        This link expires in 30 minutes.

        If you did not create this account, ignore this email.
        """.formatted(verificationUrl);
  }
}
