package com.dashboard.dashboard.persistence;

import com.dashboard.dashboard.WidgetStore.Input;
import com.dashboard.dashboard.WidgetStore.Widget;
import java.util.List;
import java.util.Optional;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class WidgetRepository {

  private static final String INSERT_SQL = """
      INSERT INTO widgets(user_id,service,type,title,config,refresh_seconds,position)
      VALUES (?,?,?,?,?,?,(
        SELECT COALESCE(MAX(position),-1)+1 FROM widgets WHERE user_id=?
      ))
      RETURNING id
      """;

  private final JdbcTemplate db;
  private final WidgetConfigCodec configCodec;
  private final WidgetRowMapper rowMapper;

  public WidgetRepository(
      JdbcTemplate db,
      WidgetConfigCodec configCodec,
      WidgetRowMapper rowMapper) {
    this.db = db;
    this.configCodec = configCodec;
    this.rowMapper = rowMapper;
  }

  public List<Widget> list(long userId) {
    return db.query(
        "SELECT * FROM widgets WHERE user_id=? ORDER BY position,id",
        rowMapper,
        userId);
  }

  public Optional<Widget> find(long userId, long widgetId) {
    try {
      return Optional.ofNullable(db.queryForObject(
          "SELECT * FROM widgets WHERE user_id=? AND id=?",
          rowMapper,
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
        configCodec.encode(input.config()),
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
        configCodec.encode(input.config()),
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

  private long requireId(Long widgetId) {
    if (widgetId == null) {
      throw new IllegalStateException("Database did not return the new widget id");
    }
    return widgetId;
  }
}
