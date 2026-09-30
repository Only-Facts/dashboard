package com.dashboard.auth;

import com.dashboard.auth.dto.RegisterRequest;
import com.dashboard.auth.dto.RegisterResponse;
import com.dashboard.common.exception.ApiErrors;
import com.dashboard.user.User;
import com.dashboard.user.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RegistrationService {

  private final UserRepository users;
  private final PasswordEncoder passwords;
  private final CredentialNormalizer normalizer;
  private final EmailVerificationService verification;

  public RegistrationService(
      UserRepository users,
      PasswordEncoder passwords,
      CredentialNormalizer normalizer,
      EmailVerificationService verification) {
    this.users = users;
    this.passwords = passwords;
    this.normalizer = normalizer;
    this.verification = verification;
  }

  @Transactional
  public RegisterResponse register(RegisterRequest request) {
    String email = normalizer.email(request.email());
    String username = normalizer.username(request.username());

    normalizer.validatePassword(request.password());
    ensureAvailable(email, username);

    User user = save(new User(
        email,
        username,
        passwords.encode(request.password())));
    verification.sendVerificationEmail(user);

    return new RegisterResponse(
        user.getId(),
        user.getEmail(),
        user.getUsername(),
        user.isEmailVerified());
  }

  @Transactional
  public void resendVerification(String input) {
    users.findByEmail(normalizer.email(input))
        .filter(user -> !user.isEmailVerified())
        .ifPresent(verification::sendVerificationEmail);
  }

  private void ensureAvailable(String email, String username) {
    if (users.existsByEmail(email)) {
      throw ApiErrors.conflict("Email already exists");
    }
    if (users.existsByUsername(username)) {
      throw ApiErrors.conflict("Username already exists");
    }
  }

  private User save(User user) {
    try {
      return users.saveAndFlush(user);
    } catch (DataIntegrityViolationException exception) {
      throw ApiErrors.conflict("Email or username already exists");
    }
  }
}
