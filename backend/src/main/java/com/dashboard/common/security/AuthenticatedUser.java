package com.dashboard.common.security;

import org.springframework.security.core.Authentication;

public final class AuthenticatedUser {

  private AuthenticatedUser() {
  }

  public static long id(Authentication authentication) {
    return (Long) authentication.getPrincipal();
  }
}
