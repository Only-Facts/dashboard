package com.dashboard.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email address")
    @Size(max = 254)
    String email,

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 30)
    @Pattern(
        regexp = "^[a-zA-Z0-9_]+$",
        message = "Username can only contain letters, numbers and underscores")
    String username,

    @NotBlank(message = "Password is required")
    @Size(
        min = 12,
        max = 64,
        message = "Password must contain between 12 and 64 characters")
    String password) {
}
