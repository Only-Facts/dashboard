package com.dashboard.integration.widget;

import com.dashboard.integration.ProviderClient;
import tools.jackson.databind.JsonNode;

final class SteamApi {

  private static final String API = "https://api.steampowered.com/";

  private final ProviderClient client;

  SteamApi(ProviderClient client) {
    this.client = client;
  }

  JsonNode players(String appId) {
    return client.get(
        API + "ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=" + appId)
        .path("response");
  }

  JsonNode news(String appId, int limit) {
    return client.get(
        API + "ISteamNews/GetNewsForApp/v2/?appid=" + appId
            + "&count=" + limit
            + "&maxlength=1&format=json")
        .path("appnews")
        .path("newsitems");
  }

  JsonNode achievements(String appId) {
    return client.get(
        API + "ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=" + appId)
        .path("achievementpercentages")
        .path("achievements");
  }
}
