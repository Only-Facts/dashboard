package com.dashboard.user;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class UserLockRepository {

  private final JdbcTemplate db;

  public UserLockRepository(JdbcTemplate db) {
    this.db = db;
  }

  public void lock(long userId) {
    db.queryForObject(
        "SELECT id FROM app_users WHERE id=? FOR UPDATE",
        Long.class,
        userId);
  }
}
