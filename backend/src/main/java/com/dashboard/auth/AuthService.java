
package com.dashboard.auth;

import com.dashboard.auth.dto.AuthResponse;
import com.dashboard.auth.dto.LoginRequest;
import com.dashboard.auth.dto.RegisterRequest;
import com.dashboard.auth.dto.RegisterResponse;

import com.dashboard.user.User;
import com.dashboard.user.UserRepository;

import java.util.Locale;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final EmailVerificationService emailVerificationService;

  public AuthService(
      UserRepository userRepository,
      PasswordEncoder passwordEncoder,
      EmailVerificationService emailVerificationService) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.emailVerificationService = emailVerificationService;
  }

  @Transactional
  public RegisterResponse register(RegisterRequest request) {
    String email = request.email()
        .trim()
        .toLowerCase(Locale.ROOT);

    String username = request.username()
        .trim()
        .toLowerCase(Locale.ROOT);

    validateRegistration(email, username);

    User user = new User(
        email,
        username,
        passwordEncoder.encode(request.password()));

    User savedUser = saveUser(user);

    emailVerificationService.sendVerificationEmail(savedUser);

    return new RegisterResponse(
        savedUser.getId(),
        savedUser.getEmail(),
        savedUser.getUsername(),
        savedUser.isEmailVerified());
  }

  @Transactional(readOnly = true)
  public AuthResponse login(LoginRequest request) {
    String email = request.email()
        .trim()
        .toLowerCase(Locale.ROOT);

    User user = userRepository.findByEmail(email)
        .orElseThrow(this::invalidCredentials);

    boolean passwordMatches = passwordEncoder.matches(
        request.password(),
        user.getPasswordHash());

    if (!passwordMatches) {
      throw invalidCredentials();
    }

    if (!user.isEmailVerified()) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "Email address is not verified");
    }

    return toAuthResponse(user);
  }

  @Transactional(readOnly = true)
  public AuthResponse getCurrentUser(Long userId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.UNAUTHORIZED,
            "User session is no longer valid"));

    return toAuthResponse(user);
  }

  private AuthResponse toAuthResponse(User user) {
    return new AuthResponse(
        user.getId(),
        user.getEmail(),
        user.getUsername(),
        user.isEmailVerified());
  }

  private User saveUser(User user) {
    try {
      return userRepository.saveAndFlush(user);
    } catch (DataIntegrityViolationException exception) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Email or username already exists");
    }
  }

  private void validateRegistration(
      String email,
      String username) {
    if (userRepository.existsByEmail(email)) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Email already exists");
    }

    if (userRepository.existsByUsername(username)) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Username already exists");
    }
  }

  private ResponseStatusException invalidCredentials() {
    return new ResponseStatusException(
        HttpStatus.UNAUTHORIZED,
        "Invalid email or password");
  }

}
