package com.dashboard.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "app_users")
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "email", nullable = false, unique = true, length = 255)
  private String email;

  @Column(name = "username", nullable = false, unique = true, length = 100)
  private String username;

  @Column(name = "password_hash", nullable = false, length = 255)
  private String passwordHash;

  @Column(name = "email_verified", nullable = false)
  private boolean emailVerified;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected User() {
  }

  public User(String email, String username, String passwordHash) {
    this.email = email;
    this.username = username;
    this.passwordHash = passwordHash;
  }

  @PrePersist
  protected void onCreate() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }

  public Long getId() {
    return id;
  }

  public String getEmail() {
    return email;
  }

  public String getUsername() {
    return username;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public boolean isEmailVerified() {
    return emailVerified;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void verifyEmail() {
    emailVerified = true;
  }
}
