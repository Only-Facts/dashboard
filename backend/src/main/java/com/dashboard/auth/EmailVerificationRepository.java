package com.dashboard.auth;

import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmailVerificationRepository
    extends JpaRepository<EmailVerificationToken, Long> {

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("""
      SELECT token
      FROM EmailVerificationToken token
      WHERE token.tokenHash = :tokenHash
      """)
  Optional<EmailVerificationToken> findByTokenHash(
      @Param("tokenHash") String tokenHash);
}
