
package com.dashboard.auth;

import com.dashboard.auth.dto.RegisterRequest;
import com.dashboard.auth.dto.RegisterResponse;
import com.dashboard.auth.dto.VerifyEmailRequest;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;
  private final EmailVerificationService emailVerificationService;

  public AuthController(
      AuthService authService,
      EmailVerificationService emailVerificationService) {
    this.authService = authService;
    this.emailVerificationService = emailVerificationService;
  }

  @PostMapping("/register")
  public ResponseEntity<RegisterResponse> register(
      @Valid @RequestBody RegisterRequest request) {
    RegisterResponse response = authService.register(
        request);

    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(response);
  }

  @PostMapping("/verify-email")
  public ResponseEntity<Void> verifyEmail(
      @Valid @RequestBody VerifyEmailRequest request) {
    emailVerificationService.verifyEmail(request.token());

    return ResponseEntity.noContent().build();
  }
}
