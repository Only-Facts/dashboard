package com.dashboard.integration.widget;

import com.dashboard.common.exception.ApiErrors;
import com.dashboard.dashboard.WidgetStore.Widget;
import com.dashboard.integration.ProviderClient;
import com.dashboard.integration.widget.WidgetData.Item;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class CurrencyWidgetProvider implements WidgetProvider {

  private static final String API = "https://api.frankfurter.dev/v2/rates";

  private record Rate(double value, String date) {
  }

  private final ProviderClient client;

  public CurrencyWidgetProvider(ProviderClient client) {
    this.client = client;
  }

  @Override
  public String service() {
    return "currency";
  }

  @Override
  public WidgetData fetch(long userId, Widget widget) {
    String base = widget.config().get("base");
    String target = widget.config().get("target");
    Rate rate = rate(base, target);
    int amount = amount(widget);

    return new WidgetData(
        "Frankfurter / central banks",
        Instant.now(),
        List.of(
            conversionItem(amount, base, target, rate.value()),
            new Item("Rate date", rate.date() + " · daily reference rate", null)));
  }

  private Rate rate(String base, String target) {
    if (base.equals(target)) {
      return new Rate(1, LocalDate.now(ZoneOffset.UTC).toString());
    }

    var rates = client.get(API + "?base=" + base + "&quotes=" + target);
    if (rates.isEmpty()) {
      throw ApiErrors.badRequest("No exchange rate available");
    }
    return new Rate(rates.get(0).path("rate").asDouble(), rates.get(0).path("date").asText());
  }

  private int amount(Widget widget) {
    if (!widget.type().equals("convert")) {
      return 1;
    }
    return Integer.parseInt(widget.config().get("amount"));
  }

  private Item conversionItem(int amount, String base, String target, double rate) {
    String converted = String.format(Locale.ROOT, "%.4f %s", amount * rate, target);
    return new Item(amount + " " + base, converted, null);
  }
}
