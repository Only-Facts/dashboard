package com.dashboard.widget;

import com.dashboard.common.ApiErrors;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.Flow;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
public class ProviderClient {

  private static final int MAX_RESPONSE_BYTES = 2_000_000;
  private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);
  private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(10);
  private static final String USER_AGENT = "PersonalDashboard/1.0";

  private final HttpClient client;
  private final ObjectMapper json;

  public ProviderClient(ObjectMapper json) {
    this.json = json;
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

  public JsonNode get(String url, String token, String clientId) {
    return send(request(url, token, null, clientId));
  }

  public JsonNode post(String url, String body) {
    return send(request(url, null, body));
  }

  public JsonNode postBasic(String url, String body, String clientId, String clientSecret) {
    var builder = baseRequest(validate(url));
    String credentials = java.util.Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes(StandardCharsets.UTF_8));
    builder.header("Authorization", "Basic " + credentials);
    addBody(builder, body);
    return send(builder.build());
  }

  private HttpRequest request(String url, String token, String body) {
    return request(url, token, body, null);
  }

  private HttpRequest request(String url, String token, String body, String clientId) {
    URI uri = validate(url);
    HttpRequest.Builder builder = baseRequest(uri);
    addAuthorization(builder, token);
    if (clientId != null && !clientId.isBlank()) {
      builder.header("Client-Id", clientId);
    }
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

  public static class ProviderException extends org.springframework.web.server.ResponseStatusException {
    private final int providerStatus;

    public ProviderException(int status, String message) {
      super(HttpStatus.BAD_GATEWAY, message);
      this.providerStatus = status;
    }

    public int providerStatus() { return providerStatus; }
  }

  private void requireSuccess(int status) {
    if (status >= 200 && status < 300) {
      return;
    }
    if (status == HttpStatus.UNAUTHORIZED.value()) {
      throw new ProviderException(status, "Service authorization expired. Reconnect the service.");
    }
    throw new ProviderException(status, "Provider unavailable or configuration not found. Try again later.");
  }

  private RuntimeException providerError(String message) {
    return ApiErrors.badGateway(message);
  }

  private static final Set<String> ALLOWED_HOSTS = Set.of(
      "api.github.com",
      "github.com",
      "geocoding-api.open-meteo.com",
      "api.open-meteo.com",
      "air-quality-api.open-meteo.com",
      "api.frankfurter.dev",
      "hn.algolia.com",
      "api.steampowered.com",
      "store.steampowered.com",
      "api.spotify.com",
      "accounts.spotify.com",
      "api.twitch.tv",
      "id.twitch.tv");

  private URI validate(String url) {
    URI uri = URI.create(url);
    if (!isAllowed(uri)) {
      throw new IllegalArgumentException("Unsupported provider URL");
    }
    return uri;
  }

  private boolean isAllowed(URI uri) {
    return "https".equals(uri.getScheme())
        && ALLOWED_HOSTS.contains(uri.getHost())
        && uri.getUserInfo() == null
        && uri.getPort() == -1;
  }

  public static String value(String input) {
    return URLEncoder.encode(input, StandardCharsets.UTF_8);
  }

  public static String form(Map<String, String> values) {
    return values.entrySet().stream()
        .map(entry -> value(entry.getKey()) + "=" + value(entry.getValue()))
        .collect(Collectors.joining("&"));
  }

  private static final class LimitedBodySubscriber implements HttpResponse.BodySubscriber<byte[]> {
    private final int limit;
    private final ByteArrayOutputStream bytes = new ByteArrayOutputStream();
    private final CompletableFuture<byte[]> result = new CompletableFuture<>();
    private Flow.Subscription subscription;
  
    LimitedBodySubscriber(int limit) {
      this.limit = limit;
    }
  
    @Override
    public CompletionStage<byte[]> getBody() {
      return result;
    }
  
    @Override
    public void onSubscribe(Flow.Subscription subscription) {
      this.subscription = subscription;
      subscription.request(1);
    }
  
    @Override
    public void onNext(List<ByteBuffer> buffers) {
      for (ByteBuffer buffer : buffers) {
        if (!append(buffer)) {
          return;
        }
      }
      subscription.request(1);
    }
  
    @Override
    public void onError(Throwable error) {
      result.completeExceptionally(error);
    }
  
    @Override
    public void onComplete() {
      result.complete(bytes.toByteArray());
    }
  
    private boolean append(ByteBuffer buffer) {
      if (buffer.remaining() > limit - bytes.size()) {
        rejectLargeResponse();
        return false;
      }
  
      byte[] chunk = new byte[buffer.remaining()];
      buffer.get(chunk);
      bytes.writeBytes(chunk);
      return true;
    }
  
    private void rejectLargeResponse() {
      subscription.cancel();
      result.completeExceptionally(new IOException("Provider response too large"));
    }
  }
}
