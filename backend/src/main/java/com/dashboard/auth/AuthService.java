
package com.dashboard.auth;

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
}
