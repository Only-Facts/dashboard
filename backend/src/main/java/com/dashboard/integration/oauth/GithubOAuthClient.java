package com.dashboard.integration.oauth;

import com.dashboard.common.exception.ApiErrors;
import com.dashboard.common.security.SecureTokens;
import com.dashboard.integration.ProviderClient;
import com.dashboard.integration.UrlEncoding;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class GithubOAuthClient {

  private static final String AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
  private static final String TOKEN_URL = "https://github.com/login/oauth/access_token";
  private static final String USER_URL = "https://api.github.com/user";

  private final String clientId;
  private final String clientSecret;
  private final String callbackUrl;
  private final ProviderClient client;
  private final SecureTokens tokens;

  public GithubOAuthClient(
      @Value("${app.github.client-id:}") String clientId,
      @Value("${app.github.client-secret:}") String clientSecret,
      @Value("${app.github.callback}") String callbackUrl,
      ProviderClient client,
      SecureTokens tokens) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.callbackUrl = callbackUrl;
    this.client = client;
    this.tokens = tokens;
  }

  public boolean configured() {
    return !clientId.isBlank() && !clientSecret.isBlank();
  }

  public String authorizationUrl(String state, String verifier) {
    return AUTHORIZE_URL + "?" + UrlEncoding.form(Map.of(
        "client_id", clientId,
        "redirect_uri", callbackUrl,
        "scope", "read:user",
        "state", state,
        "code_challenge", tokens.sha256Base64Url(verifier),
        "code_challenge_method", "S256"));
  }

  public String exchange(String code, String verifier) {
    var response = client.post(TOKEN_URL, UrlEncoding.form(Map.of(
        "client_id", clientId,
        "client_secret", clientSecret,
        "redirect_uri", callbackUrl,
        "code", code,
        "code_verifier", verifier)));

    String token = response.path("access_token").asText("");
    if (token.isBlank()) {
      throw ApiErrors.badRequest(
          "GitHub authorization was declined. Please connect again.");
    }
    return token;
  }

  public void verify(String token) {
    client.get(USER_URL, token);
  }
}
