package com.dashboard.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResendVerificationRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email address")
    @Size(max = 254)
    String email) {
}
