package com.dashboard.auth;

import static com.dashboard.auth.AuthService.id;

import com.dashboard.auth.AuthService.AuthResponse;
import com.dashboard.auth.AuthService.LoginRequest;
import com.dashboard.auth.AuthService.RegisterRequest;
import com.dashboard.auth.AuthService.ResendVerificationRequest;
import com.dashboard.auth.AuthService.VerifyEmailRequest;
import com.dashboard.auth.email.EmailVerificationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
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
  private final SecurityContextRepository contexts;
  private final HttpSessionCsrfTokenRepository csrfTokens;
  private final SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();

  public AuthController(
      AuthService auth,
      EmailVerificationService verification,
      SecurityContextRepository contexts,
      HttpSessionCsrfTokenRepository csrfTokens) {
    this.auth = auth;
    this.verification = verification;
    this.contexts = contexts;
    this.csrfTokens = csrfTokens;
  }

  @PostMapping("/register")
  public ResponseEntity<AuthResponse> register(
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
    startSession(user.id(), httpRequest, httpResponse);
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
    logoutHandler.logout(request, response, authentication);
    return ResponseEntity.noContent().build();
  }

  private void startSession(
      long userId,
      HttpServletRequest request,
      HttpServletResponse response) {
    rotateExistingSession(request);
    SecurityContext context = authenticatedContext(userId);
    SecurityContextHolder.setContext(context);

    csrfTokens.saveToken(null, request, response);
    contexts.saveContext(context, request, response);
  }

  private void rotateExistingSession(HttpServletRequest request) {
    if (request.getSession(false) != null) {
      request.changeSessionId();
    }
  }

  private SecurityContext authenticatedContext(long userId) {
    Authentication authentication = UsernamePasswordAuthenticationToken.authenticated(
        userId,
        null,
        List.of(new SimpleGrantedAuthority("ROLE_USER")));
    SecurityContext context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(authentication);
    return context;
  }
}
