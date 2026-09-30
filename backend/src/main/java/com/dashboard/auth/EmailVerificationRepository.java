package com.dashboard.auth;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
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

  @Modifying
  @Query("DELETE FROM EmailVerificationToken token WHERE token.user.id = :userId")
  void deleteAllForUser(@Param("userId") long userId);
}
