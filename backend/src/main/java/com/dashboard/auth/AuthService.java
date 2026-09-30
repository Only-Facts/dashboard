package com.dashboard.auth;

import com.dashboard.auth.dto.AuthResponse;
import com.dashboard.auth.dto.LoginRequest;
import com.dashboard.auth.dto.RegisterRequest;
import com.dashboard.auth.dto.RegisterResponse;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

  private final RegistrationService registration;
  private final LoginService login;

  public AuthService(RegistrationService registration, LoginService login) {
    this.registration = registration;
    this.login = login;
  }

  public RegisterResponse register(RegisterRequest request) {
    return registration.register(request);
  }

  public void resendVerification(String email) {
    registration.resendVerification(email);
  }

  public AuthResponse login(LoginRequest request) {
    return login.authenticate(request);
  }

  public AuthResponse getCurrentUser(Long userId) {
    return login.currentUser(userId);
  }
}
