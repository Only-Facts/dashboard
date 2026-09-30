package com.dashboard.dashboard.persistence;

import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ServiceConnectionRepository {

  private final JdbcTemplate db;

  public ServiceConnectionRepository(JdbcTemplate db) {
    this.db = db;
  }

  public Optional<Boolean> enabled(long userId, String service) {
    List<Boolean> values = db.query(
        "SELECT enabled FROM service_connections WHERE user_id=? AND service=?",
        (resultSet, row) -> resultSet.getBoolean(1),
        userId,
        service);
    return values.stream().findFirst();
  }

  public void connect(long userId, String service, String encryptedToken) {
    db.update(
        """
        INSERT INTO service_connections(user_id,service,enabled,encrypted_token)
        VALUES (?,?,TRUE,?)
        ON CONFLICT(user_id,service)
        DO UPDATE SET enabled=TRUE,encrypted_token=EXCLUDED.encrypted_token
        """,
        userId,
        service,
        encryptedToken);
  }

  public void disconnect(long userId, String service) {
    db.update(
        """
        INSERT INTO service_connections(user_id,service,enabled)
        VALUES (?,?,FALSE)
        ON CONFLICT(user_id,service)
        DO UPDATE SET enabled=FALSE,encrypted_token=NULL
        """,
        userId,
        service);
  }

  public Optional<String> githubToken(long userId) {
    List<String> tokens = db.query(
        """
        SELECT encrypted_token
        FROM service_connections
        WHERE user_id=? AND service='github' AND enabled=TRUE
        """,
        (resultSet, row) -> resultSet.getString(1),
        userId);

    return tokens.stream()
        .filter(token -> token != null && !token.isBlank())
        .findFirst();
  }
}
