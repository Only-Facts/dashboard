package com.dashboard.auth;

import com.dashboard.auth.email.EmailVerificationService;
import com.dashboard.auth.user.User;
import com.dashboard.auth.user.UserRepository;
import com.dashboard.common.ApiErrors;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

  private final UserRepository users;
  private final PasswordEncoder passwords;
  private final EmailVerificationService verification;
  private final String dummyPasswordHash;

  public AuthService(
      UserRepository users,
      PasswordEncoder passwords,
      EmailVerificationService verification) {
    this.users = users;
    this.passwords = passwords;
    this.verification = verification;
    this.dummyPasswordHash = passwords.encode(UUID.randomUUID().toString());
  }

  @Transactional
  public AuthResponse register(RegisterRequest request) {
    String email = normalize(request.email());
    String username = normalize(request.username());
    validatePassword(request.password());
    if (users.existsByEmail(email)) {
      throw ApiErrors.conflict("Email already exists");
    }
    if (users.existsByUsername(username)) {
      throw ApiErrors.conflict("Username already exists");
    }

    User user;
    try {
      user = users.saveAndFlush(new User(email, username, passwords.encode(request.password())));
    } catch (DataIntegrityViolationException exception) {
      throw ApiErrors.conflict("Email or username already exists");
    }
    verification.sendVerificationEmail(user);
    return response(user);
  }

  @Transactional
  public void resendVerification(String email) {
    users.findByEmail(normalize(email))
        .filter(user -> !user.isEmailVerified())
        .ifPresent(verification::sendVerificationEmail);
  }

  @Transactional(readOnly = true)
  public AuthResponse login(LoginRequest request) {
    validatePassword(request.password());
    User user = users.findByEmail(normalize(request.email())).orElse(null);
    boolean matches = passwords.matches(
        request.password(), user == null ? dummyPasswordHash : user.getPasswordHash());
    if (user == null || !matches) {
      throw ApiErrors.unauthorized("Invalid email or password");
    }
    if (!user.isEmailVerified()) {
      throw ApiErrors.forbidden("Email address is not verified");
    }
    return response(user);
  }

  @Transactional(readOnly = true)
  public AuthResponse getCurrentUser(Long userId) {
    return response(users.findById(userId)
        .orElseThrow(() -> ApiErrors.unauthorized("User session is no longer valid")));
  }

  private static String normalize(String value) {
    return value.trim().toLowerCase(Locale.ROOT);
  }

  private static void validatePassword(String password) {
    if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
      throw ApiErrors.badRequest("Password must be at most 72 UTF-8 bytes");
    }
  }

  private static AuthResponse response(User user) {
    return new AuthResponse(user.getId(), user.getEmail(), user.getUsername(), user.isEmailVerified());
  }

  public record AuthResponse(
      Long id,
      String email,
      String username,
      boolean emailVerified) {
  }

  public record LoginRequest(
      @NotBlank(message = "Email is required")
      @Email(message = "Invalid email address")
      @Size(max = 254)
      String email,

      @NotBlank(message = "Password is required")
      @Size(max = 64)
      String password) {
  }

  public record RegisterRequest(
      @NotBlank(message = "Email is required")
      @Email(message = "Invalid email address")
      @Size(max = 254)
      String email,

      @NotBlank(message = "Username is required")
      @Size(min = 3, max = 30)
      @Pattern(
          regexp = "^[a-zA-Z0-9_]+$",
          message = "Username can only contain letters, numbers and underscores")
      String username,

      @NotBlank(message = "Password is required")
      @Size(
          min = 12,
          max = 64,
          message = "Password must contain between 12 and 64 characters")
      String password) {
  }

  public record ResendVerificationRequest(
      @NotBlank(message = "Email is required")
      @Email(message = "Invalid email address")
      @Size(max = 254)
      String email) {
  }

  public record VerifyEmailRequest(
      @NotBlank(message = "Verification token is required")
      @Size(max = 200)
      String token) {
  }

  public static long id(Authentication authentication) {
    return (Long) authentication.getPrincipal();
  }
}
