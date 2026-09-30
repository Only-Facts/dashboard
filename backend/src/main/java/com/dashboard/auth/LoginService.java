package com.dashboard.auth;

import com.dashboard.auth.dto.AuthResponse;
import com.dashboard.auth.dto.LoginRequest;
import com.dashboard.common.exception.ApiErrors;
import com.dashboard.user.User;
import com.dashboard.user.UserRepository;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LoginService {

  private final UserRepository users;
  private final PasswordEncoder passwords;
  private final CredentialNormalizer normalizer;
  private final String dummyPasswordHash;

  public LoginService(
      UserRepository users,
      PasswordEncoder passwords,
      CredentialNormalizer normalizer) {
    this.users = users;
    this.passwords = passwords;
    this.normalizer = normalizer;
    this.dummyPasswordHash = passwords.encode(UUID.randomUUID().toString());
  }

  @Transactional(readOnly = true)
  public AuthResponse authenticate(LoginRequest request) {
    normalizer.validatePassword(request.password());
    User user = users.findByEmail(normalizer.email(request.email())).orElse(null);
    if (user == null) {
      performDummyPasswordCheck(request.password());
      throw invalidCredentials();
    }

    if (!passwords.matches(request.password(), user.getPasswordHash())) {
      throw invalidCredentials();
    }
    requireVerifiedEmail(user);
    return AuthResponses.from(user);
  }

  @Transactional(readOnly = true)
  public AuthResponse currentUser(long userId) {
    User user = users.findById(userId)
        .orElseThrow(() -> ApiErrors.unauthorized("User session is no longer valid"));
    return AuthResponses.from(user);
  }

  private void performDummyPasswordCheck(String password) {
    passwords.matches(password, dummyPasswordHash);
  }

  private void requireVerifiedEmail(User user) {
    if (!user.isEmailVerified()) {
      throw ApiErrors.forbidden("Email address is not verified");
    }
  }

  private RuntimeException invalidCredentials() {
    return ApiErrors.unauthorized("Invalid email or password");
  }
}
