package com.dashboard.dashboard.persistence;

import com.dashboard.dashboard.WidgetStore.Widget;
import java.sql.ResultSet;
import java.sql.SQLException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

@Component
public class WidgetRowMapper implements RowMapper<Widget> {

  private final WidgetConfigCodec configCodec;

  public WidgetRowMapper(WidgetConfigCodec configCodec) {
    this.configCodec = configCodec;
  }

  @Override
  public Widget mapRow(ResultSet resultSet, int rowNumber) throws SQLException {
    return new Widget(
        resultSet.getLong("id"),
        resultSet.getString("service"),
        resultSet.getString("type"),
        resultSet.getString("title"),
        configCodec.decode(resultSet.getString("config")),
        resultSet.getInt("refresh_seconds"),
        resultSet.getInt("position"));
  }
}
