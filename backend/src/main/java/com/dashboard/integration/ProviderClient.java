package com.dashboard.integration;

import com.dashboard.common.exception.ApiErrors;
import com.dashboard.integration.http.ProviderUrlPolicy;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** HTTP client restricted to explicitly allowed external providers. */
@Component
public class ProviderClient {

  private static final int MAX_RESPONSE_BYTES = 2_000_000;
  private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);
  private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(10);
  private static final String USER_AGENT = "PersonalDashboard/1.0";

  private final HttpClient client;
  private final ObjectMapper json;
  private final ProviderUrlPolicy urls;

  public ProviderClient(ObjectMapper json, ProviderUrlPolicy urls) {
    this.json = json;
    this.urls = urls;
    this.client = HttpClient.newBuilder()
        .connectTimeout(CONNECT_TIMEOUT)
        .followRedirects(HttpClient.Redirect.NEVER)
        .build();
  }

  public JsonNode get(String url) {
    return get(url, null);
  }

  public JsonNode get(String url, String token) {
    return send(request(url, token, null));
  }

  public JsonNode post(String url, String body) {
    return send(request(url, null, body));
  }

  private HttpRequest request(String url, String token, String body) {
    URI uri = urls.validate(url);
    HttpRequest.Builder builder = baseRequest(uri);
    addAuthorization(builder, token);
    addBody(builder, body);
    return builder.build();
  }

  private HttpRequest.Builder baseRequest(URI uri) {
    return HttpRequest.newBuilder(uri)
        .timeout(REQUEST_TIMEOUT)
        .header("Accept", "application/json")
        .header("User-Agent", USER_AGENT);
  }

  private void addAuthorization(HttpRequest.Builder builder, String token) {
    if (token != null) {
      builder.header("Authorization", "Bearer " + token);
    }
  }

  private void addBody(HttpRequest.Builder builder, String body) {
    if (body == null) {
      return;
    }
    builder.header("Content-Type", "application/x-www-form-urlencoded");
    builder.POST(HttpRequest.BodyPublishers.ofString(body));
  }

  private JsonNode send(HttpRequest request) {
    try {
      HttpResponse<byte[]> response = client.send(
          request,
          info -> new LimitedBodySubscriber(MAX_RESPONSE_BYTES));
      requireSuccess(response.statusCode());
      return json.readTree(response.body());
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw providerError("Provider request interrupted");
    } catch (IOException | JacksonException exception) {
      throw providerError("Provider did not return a usable response. Try again later.");
    }
  }

  private void requireSuccess(int status) {
    if (status >= 200 && status < 300) {
      return;
    }
    if (status == HttpStatus.UNAUTHORIZED.value()) {
      throw providerError("Service authorization expired. Reconnect the service.");
    }
    throw providerError("Provider unavailable or configuration not found. Try again later.");
  }

  private RuntimeException providerError(String message) {
    return ApiErrors.badGateway(message);
  }
}
