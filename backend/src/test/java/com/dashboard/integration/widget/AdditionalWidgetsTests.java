package com.dashboard.integration.widget;

import com.dashboard.dashboard.Catalog;
import com.dashboard.dashboard.WidgetStore.Widget;
import com.dashboard.integration.ProviderClient;
import java.util.Map;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AdditionalWidgetsTests {
  private final ObjectMapper json = new ObjectMapper();
  private final ProviderClient client = mock(ProviderClient.class);
  private final LocationResolver locations = mock(LocationResolver.class);
  private final SteamWidgetProvider steam = new SteamWidgetProvider(client);

  private Widget widget(String service, String type, Map<String, String> config) {
    return new Widget(1, service, type, type, config, 300, 0);
  }

  @Test void everyCatalogWidgetHasValidConfiguration() {
    var catalog = new Catalog();
    assertThat(catalog.services()).hasSize(6);
    assertThat(catalog.services().stream().mapToInt(s -> s.widgets().size()).sum()).isEqualTo(18);
    for (var service : catalog.services()) {
      for (var widget : service.widgets()) {
        assertThat(widget.params()).isNotEmpty();
        var defaults = widget.params().stream().collect(Collectors.toMap(Catalog.Param::name, Catalog.Param::defaultValue));
        assertThatCode(() -> catalog.validate(service.name(), widget.name(), defaults)).doesNotThrowAnyException();
      }
    }
    for (String invalid : new String[] {"0", "-1", "2147483648", "440&key=secret", "1.5"}) {
      assertThatThrownBy(() -> catalog.validate("steam", "players", Map.of("appid", invalid)))
          .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
    }
    assertThatThrownBy(() -> catalog.validate("steam", "game_news", Map.of("appid", "440", "limit", "11")))
        .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
  }

  @Test void playerCountsRespectTheConfiguredGameAndDoNotInventZeroOnFailure() {
    when(client.get(contains("appid=440"))).thenReturn(json.readTree("{\"response\":{\"result\":1,\"player_count\":12345}}"));
    when(client.get(contains("appid=570"))).thenReturn(json.readTree("{\"response\":{\"result\":1,\"player_count\":54321}}"));
    assertThat(steam.fetch(1, widget("steam", "players", Map.of("appid", "440"))).items().getFirst().value()).isEqualTo("12345");
    assertThat(steam.fetch(1, widget("steam", "players", Map.of("appid", "570"))).items().getFirst().value()).isEqualTo("54321");
    when(client.get(contains("appid=999"))).thenReturn(json.readTree("{\"response\":{\"result\":42}}"));
    assertThatThrownBy(() -> steam.fetch(1, widget("steam", "players", Map.of("appid", "999"))))
        .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
  }

  @Test void gameNewsLimitsRowsAndRejectsUnsafeLinks() {
    when(client.get(contains("GetNewsForApp"))).thenReturn(json.readTree("""
        {"appnews":{"newsitems":[
          {"title":"Update","date":1704067200,"feedlabel":"News","url":"https://store.steampowered.com/news/app/440"},
          {"title":"Unsafe","date":1704067200,"url":"javascript:alert(1)"},
          {"title":"Extra","date":1704067200}
        ]}}
        """));
    var items = steam.fetch(1, widget("steam", "game_news", Map.of("appid", "440", "limit", "2"))).items();
    assertThat(items).hasSize(2);
    assertThat(items.getFirst().label()).isEqualTo("2024-01-01 · News");
    assertThat(items.getFirst().url()).startsWith("https://");
    assertThat(items.get(1).url()).isNull();
    verify(client).get(contains("count=2"));
  }

  @Test void achievementsAreSortedLimitedAndEmptyGamesAreHandled() {
    when(client.get(contains("GetGlobalAchievement"))).thenReturn(json.readTree("""
        {"achievementpercentages":{"achievements":[
          {"name":"RARE","percent":2.1}, {"name":"COMMON","percent":80.25}, {"name":"MISSING"}
        ]}}
        """));
    var items = steam.fetch(1, widget("steam", "achievements", Map.of("appid", "440", "limit", "1"))).items();
    assertThat(items).hasSize(1);
    assertThat(items.getFirst().label()).isEqualTo("COMMON");
    assertThat(items.getFirst().value()).isEqualTo("80.3% of players");
    when(client.get(anyString())).thenReturn(json.readTree("{\"achievementpercentages\":{\"achievements\":[]}}"));
    assertThat(steam.fetch(1, widget("steam", "achievements", Map.of("appid", "440", "limit", "5"))).items()).isEmpty();
  }

  @Test void precipitationUsesCorrectUnitsAndMissingDataIsExplicit() {
    when(locations.resolve("Paris")).thenReturn(new LocationResolver.Location(48.8, 2.3, "Paris", "France"));
    when(client.get(anyString())).thenReturn(json.readTree("{\"current\":{\"precipitation\":1.2,\"rain\":1.0,\"snowfall\":null}}"));
    var items = new WeatherWidgetProvider(client, locations)
        .fetch(1, widget("weather", "precipitation", Map.of("city", "Paris"))).items();
    assertThat(items).extracting(WidgetData.Item::value).containsExactly("Paris, France", "1.2 mm", "1.0 mm", "Unavailable");
  }

  @Test void sunTimesIncludeTheLocationsTimezoneAndHandlePolarNulls() {
    when(locations.resolve("Paris")).thenReturn(new LocationResolver.Location(48.8, 2.3, "Paris", "France"));
    when(client.get(anyString())).thenReturn(json.readTree("""
        {"timezone":"Europe/Paris","daily":{"sunrise":["2026-09-30T07:48"],"sunset":[null]}}
        """));
    var items = new WeatherWidgetProvider(client, locations)
        .fetch(1, widget("weather", "sun", Map.of("city", "Paris"))).items();
    assertThat(items).extracting(WidgetData.Item::value).containsExactly("Paris, France", "2026-09-30 · 07:48", "Unavailable", "Europe/Paris");
    verify(client).get(contains("timezone=auto"));
  }

  @Test void gasMeasurementsHaveLabelsAndUnits() {
    when(locations.resolve("Paris")).thenReturn(new LocationResolver.Location(48.8, 2.3, "Paris", "France"));
    when(client.get(anyString())).thenReturn(json.readTree("{\"current\":{\"nitrogen_dioxide\":12,\"ozone\":60,\"sulphur_dioxide\":3}}"));
    var items = new AirQualityWidgetProvider(client, locations)
        .fetch(1, widget("air_quality", "gases", Map.of("city", "Paris"))).items();
    assertThat(items).extracting(WidgetData.Item::value).containsExactly("Paris, France", "12 μg/m³", "60 μg/m³", "3 μg/m³");
  }
}
