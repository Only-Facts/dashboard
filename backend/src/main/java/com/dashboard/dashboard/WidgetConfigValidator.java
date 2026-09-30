package com.dashboard.dashboard;

import com.dashboard.common.exception.ApiErrors;
import java.util.Map;
import java.util.Set;

final class WidgetConfigValidator {

  private static final int MAX_TEXT_LENGTH = 120;
  private static final Set<String> SUPPORTED_CURRENCIES = Set.of(
      "EUR", "USD", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "INR",
      "SEK", "NOK", "DKK", "PLN", "BRL", "NZD", "ZAR", "KRW", "MXN");

  void validate(Catalog.WidgetType definition, Map<String, String> config) {
    requireCompleteConfig(definition, config);
    for (Catalog.Param parameter : definition.params()) {
      validateParameter(parameter, config.get(parameter.name()));
    }
  }

  private void requireCompleteConfig(
      Catalog.WidgetType definition,
      Map<String, String> config) {
    if (config == null || config.size() != definition.params().size()) {
      throw ApiErrors.badRequest("Provide all widget parameters");
    }
  }

  private void validateParameter(Catalog.Param parameter, String value) {
    requireText(parameter, value);

    switch (parameter.name()) {
      case "appid" -> requireInteger(value, 1, Integer.MAX_VALUE);
      case "limit" -> requireInteger(value, 1, 10);
      case "days" -> requireInteger(value, 1, 7);
      case "amount" -> requireInteger(value, 1, 1_000_000);
      case "repository" -> requireRepository(value);
      case "base", "target" -> requireCurrency(value);
      default -> requireSafeText(value);
    }
  }

  private void requireText(Catalog.Param parameter, String value) {
    if (value == null || value.isBlank() || value.length() > MAX_TEXT_LENGTH) {
      throw ApiErrors.badRequest("Invalid " + parameter.label());
    }
  }

  private void requireInteger(String value, int min, int max) {
    final int number;
    try {
      number = Integer.parseInt(value);
    } catch (NumberFormatException exception) {
      throw ApiErrors.badRequest("Expected a whole number");
    }

    if (number < min || number > max) {
      throw ApiErrors.badRequest("Value must be between " + min + " and " + max);
    }
  }

  private void requireRepository(String value) {
    boolean formatIsValid = value.matches("[A-Za-z0-9_-]{1,39}/[A-Za-z0-9_.-]{1,80}");
    if (!formatIsValid || value.contains("..")) {
      throw ApiErrors.badRequest("Use a valid owner/repository name");
    }
  }

  private void requireCurrency(String value) {
    if (!SUPPORTED_CURRENCIES.contains(value)) {
      throw ApiErrors.badRequest("Unsupported currency code");
    }
  }

  private void requireSafeText(String value) {
    if (value.chars().anyMatch(Character::isISOControl)) {
      throw ApiErrors.badRequest("Invalid parameter text");
    }
  }
}
