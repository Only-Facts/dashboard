package com.dashboard.dashboard.github;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class TokenCipher {

  private static final int NONCE_BYTES = 12;
  private static final int TAG_BITS = 128;
  private static final String ALGORITHM = "AES/GCM/NoPadding";

  private final SecureRandom random = new SecureRandom();
  private final byte[] key;

  public TokenCipher(@Value("${app.token-key:}") String encodedKey) {
    this.key = decodeKey(encodedKey);
  }

  private static byte[] decodeKey(String encodedKey) {
    if (encodedKey == null || encodedKey.isBlank()) {
      return null;
    }
    try {
      byte[] decoded = Base64.getDecoder().decode(encodedKey);
      if (decoded.length != 32) {
        throw new IllegalArgumentException("Token encryption key has invalid length");
      }
      return decoded;
    } catch (IllegalArgumentException exception) {
      throw new IllegalArgumentException(
          "TOKEN_ENCRYPTION_KEY must be valid Base64 for exactly 32 bytes", exception);
    }
  }

  public boolean configured() {
    return key != null;
  }

  public String encrypt(String token, long userId) {
    ensureConfigured();
    byte[] nonce = randomNonce();
    byte[] encrypted = crypt(
        Cipher.ENCRYPT_MODE,
        token.getBytes(StandardCharsets.UTF_8),
        nonce,
        "github:" + userId);
    return encode(nonce) + "." + encode(encrypted);
  }

  public String encrypt(String service, String token, long userId) {
    ensureConfigured();
    byte[] nonce = randomNonce();
    byte[] encrypted = crypt(
        Cipher.ENCRYPT_MODE,
        token.getBytes(StandardCharsets.UTF_8),
        nonce,
        service + ":" + userId);
    return encode(nonce) + "." + encode(encrypted);
  }

  public String decrypt(String protectedToken, long userId) {
    ensureConfigured();
    String[] parts = protectedToken.split("\\.", -1);
    if (parts.length != 2) {
      throw cryptoFailure(null);
    }

    try {
      byte[] nonce = Base64.getDecoder().decode(parts[0]);
      byte[] encrypted = Base64.getDecoder().decode(parts[1]);
      validateCiphertext(nonce, encrypted);
      byte[] clear = crypt(Cipher.DECRYPT_MODE, encrypted, nonce, "github:" + userId);
      return new String(clear, StandardCharsets.UTF_8);
    } catch (IllegalArgumentException exception) {
      throw cryptoFailure(exception);
    }
  }

  public String decrypt(String service, String protectedToken, long userId) {
    ensureConfigured();
    String[] parts = protectedToken.split("\\.", -1);
    if (parts.length != 2) {
      throw cryptoFailure(null);
    }

    try {
      byte[] nonce = Base64.getDecoder().decode(parts[0]);
      byte[] encrypted = Base64.getDecoder().decode(parts[1]);
      validateCiphertext(nonce, encrypted);
      byte[] clear = crypt(Cipher.DECRYPT_MODE, encrypted, nonce, service + ":" + userId);
      return new String(clear, StandardCharsets.UTF_8);
    } catch (IllegalArgumentException exception) {
      throw cryptoFailure(exception);
    }
  }

  private byte[] crypt(int mode, byte[] input, byte[] nonce, String aad) {
    try {
      Cipher cipher = Cipher.getInstance(ALGORITHM);
      cipher.init(mode, keySpec(), new GCMParameterSpec(TAG_BITS, nonce));
      cipher.updateAAD(aad.getBytes(StandardCharsets.UTF_8));
      return cipher.doFinal(input);
    } catch (GeneralSecurityException exception) {
      throw cryptoFailure(exception);
    }
  }

  private SecretKeySpec keySpec() {
    return new SecretKeySpec(key, "AES");
  }

  private byte[] randomNonce() {
    byte[] nonce = new byte[NONCE_BYTES];
    random.nextBytes(nonce);
    return nonce;
  }

  private void validateCiphertext(byte[] nonce, byte[] encrypted) {
    if (nonce.length != NONCE_BYTES || encrypted.length <= TAG_BITS / Byte.SIZE) {
      throw cryptoFailure(null);
    }
  }

  private void ensureConfigured() {
    if (key == null) {
      throw new IllegalStateException("Token encryption is not configured");
    }
  }

  private String encode(byte[] value) {
    return Base64.getEncoder().encodeToString(value);
  }

  private IllegalStateException cryptoFailure(Exception cause) {
    return new IllegalStateException("Unable to protect service token", cause);
  }
}
