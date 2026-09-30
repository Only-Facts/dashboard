package com.dashboard.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
public class VerificationMailSender {

  private final JavaMailSender mailSender;
  private final String frontendUrl;
  private final String mailFrom;

  public VerificationMailSender(
      JavaMailSender mailSender,
      @Value("${app.frontend-url}") String frontendUrl,
      @Value("${app.mail.from}") String mailFrom) {
    this.mailSender = mailSender;
    this.frontendUrl = frontendUrl;
    this.mailFrom = mailFrom;
  }

  public void send(String email, String token) {
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
