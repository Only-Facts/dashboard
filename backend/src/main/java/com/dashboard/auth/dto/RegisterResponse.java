package com.dashboard.auth.dto;

public record RegisterResponse(
    Long id,
    String email,
    String username,
    boolean emailVerified) {
}
