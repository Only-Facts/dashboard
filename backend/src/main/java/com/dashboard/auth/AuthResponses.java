package com.dashboard.auth;

import com.dashboard.auth.dto.AuthResponse;
import com.dashboard.user.User;

final class AuthResponses {

  private AuthResponses() {
  }

  static AuthResponse from(User user) {
    return new AuthResponse(
        user.getId(),
        user.getEmail(),
        user.getUsername(),
        user.isEmailVerified());
  }
}
