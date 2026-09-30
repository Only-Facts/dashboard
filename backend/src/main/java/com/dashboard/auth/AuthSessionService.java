package com.dashboard.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
import org.springframework.stereotype.Service;

@Service
public class AuthSessionService {

  private final SecurityContextRepository contexts;
  private final HttpSessionCsrfTokenRepository csrfTokens;
  private final SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();

  public AuthSessionService(
      SecurityContextRepository contexts,
      HttpSessionCsrfTokenRepository csrfTokens) {
    this.contexts = contexts;
    this.csrfTokens = csrfTokens;
  }

  public void start(
      long userId,
      HttpServletRequest request,
      HttpServletResponse response) {
    rotateExistingSession(request);
    SecurityContext context = authenticatedContext(userId);
    SecurityContextHolder.setContext(context);

    csrfTokens.saveToken(null, request, response);
    contexts.saveContext(context, request, response);
  }

  public void end(
      Authentication authentication,
      HttpServletRequest request,
      HttpServletResponse response) {
    logoutHandler.logout(request, response, authentication);
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
