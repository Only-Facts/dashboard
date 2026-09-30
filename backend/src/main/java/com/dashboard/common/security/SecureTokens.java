package com.dashboard.common.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import org.springframework.stereotype.Component;

@Component
public class SecureTokens {

  private final SecureRandom random = new SecureRandom();

  public String urlSafe(int bytesCount) {
    byte[] bytes = new byte[bytesCount];
    random.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  public String sha256Hex(String value) {
    return HexFormat.of().formatHex(sha256(value, StandardCharsets.UTF_8));
  }

  public String sha256Base64Url(String value) {
    byte[] hash = sha256(value, StandardCharsets.US_ASCII);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
  }

  public boolean constantTimeEquals(String expected, String actual) {
    return MessageDigest.isEqual(
        expected.getBytes(StandardCharsets.UTF_8),
        actual.getBytes(StandardCharsets.UTF_8));
  }

  private byte[] sha256(String value, java.nio.charset.Charset charset) {
    try {
      return MessageDigest.getInstance("SHA-256").digest(value.getBytes(charset));
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException("SHA-256 is unavailable", exception);
    }
  }
}
