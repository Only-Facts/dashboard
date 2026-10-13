package com.dashboard.dashboard;

import com.dashboard.dashboard.DashboardService.Input;
import com.dashboard.dashboard.DashboardService.Widget;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@Repository
public class DashboardRepository {

  private static final String INSERT_SQL = """
      INSERT INTO widgets(user_id,service,type,title,config,refresh_seconds,position)
      VALUES (?,?,?,?,?,?,(
        SELECT COALESCE(MAX(position),-1)+1 FROM widgets WHERE user_id=?
      ))
      RETURNING id
      """;

  private static final TypeReference<Map<String, String>> CONFIG_TYPE = new TypeReference<>() {};

  private final JdbcTemplate db;
  private final ObjectMapper json;

  public DashboardRepository(JdbcTemplate db, ObjectMapper json) {
    this.db = db;
    this.json = json;
  }

  public List<Widget> list(long userId) {
    return db.query(
        "SELECT * FROM widgets WHERE user_id=? ORDER BY position,id",
        this::mapRow,
        userId);
  }

  public Optional<Widget> find(long userId, long widgetId) {
    try {
      return Optional.ofNullable(db.queryForObject(
          "SELECT * FROM widgets WHERE user_id=? AND id=?",
          this::mapRow,
          userId,
          widgetId));
    } catch (EmptyResultDataAccessException exception) {
      return Optional.empty();
    }
  }

  public boolean exists(long userId, long widgetId) {
    Boolean exists = db.queryForObject(
        "SELECT EXISTS(SELECT 1 FROM widgets WHERE user_id=? AND id=?)",
        Boolean.class,
        userId,
        widgetId);
    return Boolean.TRUE.equals(exists);
  }

  public int count(long userId) {
    Integer count = db.queryForObject(
        "SELECT COUNT(*) FROM widgets WHERE user_id=?",
        Integer.class,
        userId);
    return count == null ? 0 : count;
  }

  public long insert(long userId, Input input) {
    Long widgetId = db.queryForObject(
        INSERT_SQL,
        Long.class,
        userId,
        input.service(),
        input.type(),
        input.title().trim(),
        json.writeValueAsString(Map.copyOf(input.config())),
        input.refreshSeconds(),
        userId);
    return requireId(widgetId);
  }

  public void update(long userId, long widgetId, Input input) {
    db.update(
        """
        UPDATE widgets
        SET service=?,type=?,title=?,config=?,refresh_seconds=?
        WHERE id=? AND user_id=?
        """,
        input.service(),
        input.type(),
        input.title().trim(),
        json.writeValueAsString(Map.copyOf(input.config())),
        input.refreshSeconds(),
        widgetId,
        userId);
  }

  public boolean delete(long userId, long widgetId) {
    return db.update(
        "DELETE FROM widgets WHERE id=? AND user_id=?",
        widgetId,
        userId) > 0;
  }

  public void deleteByService(long userId, String service) {
    db.update(
        "DELETE FROM widgets WHERE user_id=? AND service=?",
        userId,
        service);
  }

  public void updatePositions(long userId, List<Long> ids) {
    for (int position = 0; position < ids.size(); position++) {
      db.update(
          "UPDATE widgets SET position=? WHERE id=? AND user_id=?",
          position,
          ids.get(position),
          userId);
    }
  }

  private Widget mapRow(ResultSet row, int rowNumber) throws SQLException {
    return new Widget(
        row.getLong("id"),
        row.getString("service"),
        row.getString("type"),
        row.getString("title"),
        Map.copyOf(json.readValue(row.getString("config"), CONFIG_TYPE)),
        row.getInt("refresh_seconds"),
        row.getInt("position"));
  }

  private long requireId(Long widgetId) {
    if (widgetId == null) {
      throw new IllegalStateException("Database did not return the new widget id");
    }
    return widgetId;
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
    return serviceToken(userId, "github");
  }

  public Optional<String> twitchToken(long userId) {
    return serviceToken(userId, "twitch");
  }

  public List<Long> twitchUsers() {
    return db.queryForList("SELECT user_id FROM service_connections WHERE service='twitch' AND enabled=TRUE AND encrypted_token IS NOT NULL", Long.class);
  }

  public boolean replaceTwitchToken(long userId, String previous, String replacement) {
    return db.update("UPDATE service_connections SET encrypted_token=? WHERE user_id=? AND service='twitch' AND enabled=TRUE AND encrypted_token=?",
        replacement, userId, previous) == 1;
  }

  public void invalidateTwitchToken(long userId, String previous) {
    db.update("UPDATE service_connections SET enabled=FALSE, encrypted_token=NULL WHERE user_id=? AND service='twitch' AND encrypted_token=?", userId, previous);
  }

  public Optional<String> serviceToken(long userId, String service) {
    List<String> tokens = db.query(
        """
        SELECT encrypted_token
        FROM service_connections
        WHERE user_id=? AND service=? AND enabled=TRUE
        """,
        (resultSet, row) -> resultSet.getString(1),
        userId, service);

    return tokens.stream()
        .filter(token -> token != null && !token.isBlank())
        .findFirst();
  }

  public boolean replaceServiceToken(long userId, String service, String previous, String replacement) {
    return db.update("UPDATE service_connections SET encrypted_token=? WHERE user_id=? AND service=? AND enabled=TRUE AND encrypted_token=?",
        replacement, userId, service, previous) == 1;
  }

  public void invalidateServiceToken(long userId, String service, String previous) {
    db.update("UPDATE service_connections SET enabled=FALSE,encrypted_token=NULL WHERE user_id=? AND service=? AND encrypted_token=?", userId, service, previous);
  }

  public void lock(long userId) {
    db.queryForObject(
        "SELECT id FROM app_users WHERE id=? FOR UPDATE",
        Long.class,
        userId);
  }
}
