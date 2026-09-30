package com.dashboard.auth;

import static com.dashboard.common.security.AuthenticatedUser.id;

import com.dashboard.auth.dto.AuthResponse;
import com.dashboard.auth.dto.LoginRequest;
import com.dashboard.auth.dto.RegisterRequest;
import com.dashboard.auth.dto.RegisterResponse;
import com.dashboard.auth.dto.ResendVerificationRequest;
import com.dashboard.auth.dto.VerifyEmailRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService auth;
  private final EmailVerificationService verification;
  private final AuthSessionService sessions;

  public AuthController(
      AuthService auth,
      EmailVerificationService verification,
      AuthSessionService sessions) {
    this.auth = auth;
    this.verification = verification;
    this.sessions = sessions;
  }

  @PostMapping("/register")
  public ResponseEntity<RegisterResponse> register(
      @Valid @RequestBody RegisterRequest request) {
    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(auth.register(request));
  }

  @PostMapping("/verify-email")
  public ResponseEntity<Void> verifyEmail(
      @Valid @RequestBody VerifyEmailRequest request) {
    verification.verifyEmail(request.token());
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/resend-verification")
  public ResponseEntity<Void> resendVerification(
      @Valid @RequestBody ResendVerificationRequest request) {
    auth.resendVerification(request.email());
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/csrf")
  public Map<String, String> csrf(CsrfToken token) {
    return Map.of("token", token.getToken());
  }

  @PostMapping("/login")
  public AuthResponse login(
      @Valid @RequestBody LoginRequest request,
      HttpServletRequest httpRequest,
      HttpServletResponse httpResponse) {
    AuthResponse user = auth.login(request);
    sessions.start(user.id(), httpRequest, httpResponse);
    return user;
  }

  @GetMapping("/me")
  public AuthResponse me(Authentication authentication) {
    return auth.getCurrentUser(id(authentication));
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(
      Authentication authentication,
      HttpServletRequest request,
      HttpServletResponse response) {
    sessions.end(authentication, request, response);
    return ResponseEntity.noContent().build();
  }
}
