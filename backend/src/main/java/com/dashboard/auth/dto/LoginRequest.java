package com.dashboard.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email address")
    @Size(max = 254)
    String email,

    @NotBlank(message = "Password is required")
    @Size(max = 64)
    String password) {
}
