package com.dashboard.widget.providers;

import com.dashboard.common.ApiErrors;
import com.dashboard.dashboard.DashboardService.Widget;
import com.dashboard.dashboard.github.GithubConnection;
import com.dashboard.widget.ProviderClient;
import com.dashboard.widget.WidgetData.Item;
import com.dashboard.widget.WidgetData;
import com.dashboard.widget.WidgetProvider;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

@Component
public class GithubWidgetProvider implements WidgetProvider {

  private static final String API = "https://api.github.com/repos/";

  private final ProviderClient client;
  private final GithubConnection github;

  public GithubWidgetProvider(ProviderClient client, GithubConnection github) {
    this.client = client;
    this.github = github;
  }

  @Override
  public String service() {
    return "github";
  }

  @Override
  public WidgetData fetch(long userId, Widget widget) {
    String repositoryUrl = API + widget.config().get("repository");
    String token = github.token(userId);
    List<Item> items = switch (widget.type()) {
      case "repository" -> repository(repositoryUrl, token);
      case "commits", "issues" -> rows(widget, repositoryUrl, token);
      default -> throw ApiErrors.badRequest("Unknown GitHub widget");
    };
    return new WidgetData("GitHub", Instant.now(), items);
  }

  private List<Item> repository(String url, String token) {
    JsonNode repository = client.get(url, token);
    return List.of(
        WidgetData.metric("Stars", repository, "stargazers_count", ""),
        WidgetData.metric("Forks", repository, "forks_count", ""),
        WidgetData.metric(
            "Open issues and pull requests",
            repository,
            "open_issues_count",
            ""));
  }

  private List<Item> rows(Widget widget, String repositoryUrl, String token) {
    JsonNode rows = client.get(rowsUrl(widget, repositoryUrl), token);
    List<Item> items = new ArrayList<>();
    for (JsonNode row : rows) {
      items.add(rowItem(widget.type(), row));
    }
    return items;
  }

  private String rowsUrl(Widget widget, String repositoryUrl) {
    String suffix = widget.type().equals("issues") ? "&state=open" : "";
    return repositoryUrl
        + "/" + widget.type()
        + "?per_page=" + widget.config().get("limit")
        + suffix;
  }

  private Item rowItem(String type, JsonNode row) {
    if (type.equals("commits")) {
      return new Item(
          row.path("commit").path("author").path("name").asText(),
          row.path("commit").path("message").asText(),
          WidgetData.githubUrl(row.path("html_url").asText()));
    }
    return new Item(
        "#" + row.path("number").asText(),
        row.path("title").asText(),
        WidgetData.githubUrl(row.path("html_url").asText()));
  }
}
