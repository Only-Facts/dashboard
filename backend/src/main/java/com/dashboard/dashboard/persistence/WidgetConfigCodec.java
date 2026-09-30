package com.dashboard.dashboard.persistence;

import java.util.Map;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@Component
public class WidgetConfigCodec {

  private static final TypeReference<Map<String, String>> CONFIG_TYPE = new TypeReference<>() {
  };

  private final ObjectMapper json;

  public WidgetConfigCodec(ObjectMapper json) {
    this.json = json;
  }

  public String encode(Map<String, String> config) {
    return json.writeValueAsString(Map.copyOf(config));
  }

  public Map<String, String> decode(String value) {
    return Map.copyOf(json.readValue(value, CONFIG_TYPE));
  }
}
