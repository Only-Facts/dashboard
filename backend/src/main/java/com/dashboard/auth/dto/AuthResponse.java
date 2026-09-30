package com.dashboard.auth.dto;

public record AuthResponse(
    Long id,
    String email,
    String username,
    boolean emailVerified) {
}
