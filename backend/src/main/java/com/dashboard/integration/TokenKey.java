package com.dashboard.integration;

import java.util.Base64;

final class TokenKey {

  private static final int KEY_BYTES = 32;

  private TokenKey() {
  }

  static byte[] decode(String encodedKey) {
    if (encodedKey == null || encodedKey.isBlank()) {
      return null;
    }

    try {
      byte[] decoded = Base64.getDecoder().decode(encodedKey);
      requireLength(decoded);
      return decoded;
    } catch (IllegalArgumentException exception) {
      throw invalidKey(exception);
    }
  }

  private static void requireLength(byte[] decoded) {
    if (decoded.length != KEY_BYTES) {
      throw new IllegalArgumentException("Token encryption key has invalid length");
    }
  }

  private static IllegalArgumentException invalidKey(IllegalArgumentException cause) {
    return new IllegalArgumentException(
        "TOKEN_ENCRYPTION_KEY must be valid Base64 for exactly 32 bytes",
        cause);
  }
}
