
package com.dashboard.auth;

import com.dashboard.auth.dto.AuthResponse;
import com.dashboard.auth.dto.LoginRequest;
import com.dashboard.auth.dto.RegisterRequest;
import com.dashboard.auth.dto.RegisterResponse;
import com.dashboard.auth.dto.VerifyEmailRequest;

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

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthService authService;
  private final EmailVerificationService emailVerificationService;
  private final SecurityContextRepository securityContextRepository;

  public AuthController(
      AuthService authService,
      EmailVerificationService emailVerificationService,
      SecurityContextRepository securityContextRepository) {
    this.authService = authService;
    this.emailVerificationService = emailVerificationService;
    this.securityContextRepository = securityContextRepository;
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

  @GetMapping("/csrf")
  public Map<String, String> csrf(CsrfToken csrfToken) {
    return Map.of(
        "token",
        csrfToken.getToken());
  }

  @PostMapping("/login")
  public AuthResponse login(
      @Valid @RequestBody LoginRequest request,
      HttpServletRequest httpRequest,
      HttpServletResponse httpResponse) {
    AuthResponse user = authService.login(request);

    Authentication authentication = UsernamePasswordAuthenticationToken.authenticated(
        user.id(),
        null,
        List.of(
            new SimpleGrantedAuthority("ROLE_USER")));

    SecurityContext context = SecurityContextHolder.createEmptyContext();

    context.setAuthentication(authentication);

    SecurityContextHolder.setContext(context);

    if (httpRequest.getSession(false) != null) {
      httpRequest.changeSessionId();
    }

    securityContextRepository.saveContext(
        context,
        httpRequest,
        httpResponse);

    return user;
  }

  @GetMapping("/me")
  public AuthResponse me(Authentication authentication) {
    Long userId = (Long) authentication.getPrincipal();

    return authService.getCurrentUser(userId);
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(
      Authentication authentication,
      HttpServletRequest request,
      HttpServletResponse response) {
    SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();

    logoutHandler.logout(
        request,
        response,
        authentication);

    return ResponseEntity.noContent().build();
  }
}
