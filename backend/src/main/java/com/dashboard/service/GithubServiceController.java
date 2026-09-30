package com.dashboard.service;

import static com.dashboard.common.security.AuthenticatedUser.id;

import com.dashboard.integration.GithubConnection;
import com.dashboard.integration.WidgetDataService;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/services/github")
public class GithubServiceController {

  private final GithubConnection github;
  private final WidgetDataService data;
  private final String frontendUrl;

  public GithubServiceController(
      GithubConnection github,
      WidgetDataService data,
      @Value("${app.frontend-url}") String frontendUrl) {
    this.github = github;
    this.data = data;
    this.frontendUrl = stripTrailingSlash(frontendUrl);
  }

  @GetMapping("/callback")
  public ResponseEntity<Void> callback(
      Authentication authentication,
      HttpServletRequest request,
      @RequestParam(required = false) String state,
      @RequestParam(required = false) String code) {
    long userId = id(authentication);
    String status = complete(userId, request, state, code);
    data.evictUser(userId);
    return redirect(status);
  }

  private String complete(
      long userId,
      HttpServletRequest request,
      String state,
      String code) {
    try {
      github.complete(userId, request.getSession(), state, code);
      return "connected";
    } catch (ResponseStatusException exception) {
      return "failed";
    }
  }

  private ResponseEntity<Void> redirect(String status) {
    return ResponseEntity
        .status(HttpStatus.SEE_OTHER)
        .location(URI.create(frontendUrl + "?github=" + status))
        .build();
  }

  private static String stripTrailingSlash(String value) {
    return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
  }
}
