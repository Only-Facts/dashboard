package com.dashboard.dashboard;

import com.dashboard.common.exception.ApiErrors;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class Catalog {

  public record Param(String name, String type, String label, String defaultValue) {
  }

  public record WidgetType(String name, String description, List<Param> params) {
  }

  public record Service(String name, String label, boolean oauth, List<WidgetType> widgets) {
  }

  private static final List<Service> SERVICES = CatalogDefinitions.services();

  private final WidgetConfigValidator validator = new WidgetConfigValidator();

  public List<Service> services() {
    return SERVICES;
  }

  public Service service(String name) {
    return SERVICES.stream()
        .filter(service -> service.name().equals(name))
        .findFirst()
        .orElseThrow(() -> ApiErrors.badRequest("Unknown service"));
  }

  public WidgetType type(String serviceName, String widgetName) {
    return service(serviceName).widgets().stream()
        .filter(widget -> widget.name().equals(widgetName))
        .findFirst()
        .orElseThrow(() -> ApiErrors.badRequest("Unknown widget type"));
  }

  public void validate(String serviceName, String widgetName, Map<String, String> config) {
    validator.validate(type(serviceName, widgetName), config);
  }

}
