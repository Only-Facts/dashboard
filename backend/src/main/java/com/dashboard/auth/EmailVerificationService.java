package com.dashboard.auth;

import com.dashboard.user.User;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EmailVerificationService {

  private static final int TOKEN_BYTES = 32;
  private static final int EXPIRATION_MINUTES = 30;

  private final EmailVerificationRepository tokenRepository;
  private final JavaMailSender mailSender;
  private final SecureRandom secureRandom = new SecureRandom();

  private final String frontendUrl;
  private final String mailFrom;

  public EmailVerificationService(
      EmailVerificationRepository tokenRepository,
      JavaMailSender mailSender,
      @Value("${app.frontend-url}") String frontendUrl,
      @Value("${app.mail.from}") String mailFrom) {
    this.tokenRepository = tokenRepository;
    this.mailSender = mailSender;
    this.frontendUrl = frontendUrl;
    this.mailFrom = mailFrom;
  }

  public void sendVerificationEmail(User user) {
    String token = generateToken();

    Instant expiresAt = Instant.now()
        .plus(EXPIRATION_MINUTES, ChronoUnit.MINUTES);

    EmailVerificationToken verificationToken = new EmailVerificationToken(
        user,
        hashToken(token),
        expiresAt);

    tokenRepository.saveAndFlush(verificationToken);

    sendEmail(user.getEmail(), token);
  }

  @Transactional
  public void verifyEmail(String token) {
    EmailVerificationToken verificationToken = tokenRepository.findByTokenHash(hashToken(token))
        .orElseThrow(this::invalidToken);

    validateToken(verificationToken);

    User user = verificationToken.getUser();

    if (user.isEmailVerified()) {
      throw invalidToken();
    }

    user.verifyEmail();
    verificationToken.markAsUsed();
  }

  private void validateToken(
      EmailVerificationToken verificationToken) {
    if (verificationToken.isUsed()
        || verificationToken.isExpired()) {
      throw invalidToken();
    }
  }

  private String generateToken() {
    byte[] bytes = new byte[TOKEN_BYTES];

    secureRandom.nextBytes(bytes);

    return Base64.getUrlEncoder()
        .withoutPadding()
        .encodeToString(bytes);
  }

  private String hashToken(String token) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");

      byte[] hash = digest.digest(
          token.getBytes(StandardCharsets.UTF_8));

      return HexFormat.of().formatHex(hash);
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException(
          "SHA-256 is unavailable",
          exception);
    }
  }

  private void sendEmail(String email, String token) {
    String verificationUrl = frontendUrl
        + "/verify-email?token="
        + token;

    SimpleMailMessage message = new SimpleMailMessage();

    message.setFrom(mailFrom);
    message.setTo(email);
    message.setSubject("Confirm your Dashboard account");

    message.setText(
        "Welcome to Dashboard!\n\n"
            + "Click the following link to confirm your email:\n\n"
            + verificationUrl
            + "\n\nThis link expires in 30 minutes.\n\n"
            + "If you did not create this account, ignore this email.");

    mailSender.send(message);
  }

  private ResponseStatusException invalidToken() {
    return new ResponseStatusException(
        HttpStatus.BAD_REQUEST,
        "Invalid or expired verification token");
  }
}
