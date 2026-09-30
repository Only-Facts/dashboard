package com.dashboard.auth;

import com.dashboard.common.exception.ApiErrors;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class CredentialNormalizer {

  private static final int BCRYPT_INPUT_LIMIT_BYTES = 72;

  public String email(String value) {
    return value.trim().toLowerCase(Locale.ROOT);
  }

  public String username(String value) {
    return value.trim().toLowerCase(Locale.ROOT);
  }

  public void validatePassword(String password) {
    int bytes = password.getBytes(StandardCharsets.UTF_8).length;
    if (bytes > BCRYPT_INPUT_LIMIT_BYTES) {
      throw ApiErrors.badRequest(
          "Password must be at most 72 UTF-8 bytes");
    }
  }
}
