package com.dashboard;

import com.dashboard.auth.EmailVerificationService;
import com.dashboard.dashboard.Catalog;
import com.dashboard.integration.ProviderClient;
import com.dashboard.integration.GithubConnection;
import com.dashboard.integration.TokenCipher;
import com.dashboard.user.User;
import com.dashboard.user.UserRepository;
import org.junit.jupiter.api.*;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.List;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "app.github.client-id=test-client", "app.github.client-secret=test-secret",
    "app.token-key=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=", "spring.datasource.password=unused" })
@AutoConfigureMockMvc
@Testcontainers
class DemoApplicationTests {
  @Container @ServiceConnection
  static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16-alpine");
  @Autowired MockMvc mvc;
  @Autowired ObjectMapper json;
  @Autowired UserRepository users;
  @Autowired PasswordEncoder passwords;
  @Autowired JdbcTemplate db;
  @Autowired Catalog catalog;
  @Autowired GithubConnection github;
  @Autowired TokenCipher cipher;
  @MockitoBean JavaMailSender mail;
  @MockitoBean ProviderClient provider;
  private long firstId;
  private MockHttpSession first, second;
  private static final String PASSWORD = "a-long-test-password";

  @BeforeEach
  void accounts() throws Exception {
    db.execute("TRUNCATE widgets,service_connections,email_verification_tokens,app_users RESTART IDENTITY CASCADE");
    firstId = account("first@example.com", "first");
    account("second@example.com", "second");
    first = login("first@example.com"); second = login("second@example.com");
  }
  long account(String email, String username) {
    User user = new User(email, username, passwords.encode(PASSWORD)); user.verifyEmail(); return users.saveAndFlush(user).getId();
  }
  MockHttpSession login(String email) throws Exception {
    var result = mvc.perform(post("/api/auth/login").with(csrf()).with(req -> {req.setRemoteAddr(email); return req;})
        .contentType("application/json").content(json.writeValueAsString(Map.of("email", email, "password", PASSWORD))))
        .andExpect(status().isOk()).andReturn();
    return (MockHttpSession) result.getRequest().getSession();
  }
  String widget(String city) {
    return json.writeValueAsString(Map.of("service", "weather", "type", "temperature", "title", "Weather " + city,
        "config", Map.of("city", city), "refreshSeconds", 60));
  }
  long create(MockHttpSession session, String body) throws Exception {
    var result = mvc.perform(post("/api/widgets").session(session).with(csrf()).contentType("application/json").content(body))
        .andExpect(status().isCreated()).andReturn();
    return json.readTree(result.getResponse().getContentAsString()).path("id").asLong();
  }
  @Test void catalogAndAuthenticationBoundary() throws Exception {
    mvc.perform(get("/about.json")).andExpect(status().isOk()).andExpect(jsonPath("$.server.services.length()").value(5))
        .andExpect(jsonPath("$.client.host").isString()).andExpect(jsonPath("$.server.current_time").isNumber());
    assertThat(catalog.services().stream().mapToInt(s -> s.widgets().size()).sum()).isEqualTo(12);
    mvc.perform(get("/api/widgets")).andExpect(status().isUnauthorized());
    mvc.perform(post("/api/widgets").session(first).contentType("application/json").content(widget("Paris"))).andExpect(status().isForbidden());
    mvc.perform(post("/api/auth/register").contentType("application/json").content("{}")).andExpect(status().isForbidden());
  }
  @Test void ownershipCrudOrderingAndPersistence() throws Exception {
    long a = create(first, widget("Paris")), b = create(first, widget("Bordeaux"));
    mvc.perform(get("/api/widgets").session(login("first@example.com"))).andExpect(jsonPath("$.length()").value(2));
    mvc.perform(get("/api/widgets").session(second)).andExpect(jsonPath("$.length()").value(0));
    mvc.perform(get("/api/widgets/" + a + "/data").session(second)).andExpect(status().isNotFound());
    mvc.perform(put("/api/widgets/" + a).session(second).with(csrf()).contentType("application/json").content(widget("London"))).andExpect(status().isNotFound());
    mvc.perform(delete("/api/widgets/" + a).session(second).with(csrf())).andExpect(status().isNotFound());
    mvc.perform(put("/api/widgets/" + a).session(first).with(csrf()).contentType("application/json").content(widget("London"))).andExpect(status().isOk()).andExpect(jsonPath("$.config.city").value("London"));
    mvc.perform(put("/api/widgets/order").session(first).with(csrf()).contentType("application/json").content(json.writeValueAsString(Map.of("ids", List.of(b, a))))).andExpect(status().isNoContent());
    mvc.perform(get("/api/widgets").session(first)).andExpect(jsonPath("$[0].id").value(b));
    mvc.perform(put("/api/widgets/order").session(first).with(csrf()).contentType("application/json").content(json.writeValueAsString(Map.of("ids", List.of(a, a))))).andExpect(status().isBadRequest());
    mvc.perform(delete("/api/widgets/" + a).session(first).with(csrf())).andExpect(status().isNoContent());
  }
  @Test void validatesConfigurationAndSubscription() throws Exception {
    create(first, widget("Paris"));
    mvc.perform(post("/api/widgets").session(first).with(csrf()).contentType("application/json").content(widget("Paris").replace(":60", ":1"))).andExpect(status().isBadRequest());
    mvc.perform(post("/api/widgets").session(first).with(csrf()).contentType("application/json").content(widget("Paris").replace("temperature", "unknown"))).andExpect(status().isBadRequest());
    mvc.perform(delete("/api/services/weather").session(first).with(csrf())).andExpect(status().isNoContent());
    mvc.perform(get("/api/widgets").session(first)).andExpect(jsonPath("$.length()").value(0));
    mvc.perform(post("/api/widgets").session(first).with(csrf()).contentType("application/json").content(widget("Paris"))).andExpect(status().isBadRequest());
    mvc.perform(post("/api/services/weather/connect").session(first).with(csrf())).andExpect(status().isOk());
    create(first, widget("Paris"));
    assertThatThrownBy(() -> catalog.validate("github", "commits", Map.of("repository", "a/../secrets", "limit", "5"))).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
  }
  @Test void registrationRequiresSingleUseEmailVerification() throws Exception {
    String registration = json.writeValueAsString(Map.of("email", "new@example.com", "username", "newuser", "password", PASSWORD));
    mvc.perform(post("/api/auth/register").with(csrf()).contentType("application/json").content(registration)).andExpect(status().isCreated());
    var message = ArgumentCaptor.forClass(SimpleMailMessage.class); verify(mail).send(message.capture());
    String token = message.getValue().getText().split("token=")[1].split("\\s")[0];
    assertThat(db.queryForObject("SELECT token_hash FROM email_verification_tokens", String.class)).isNotEqualTo(token).hasSize(64);
    String credentials = json.writeValueAsString(Map.of("email", "new@example.com", "password", PASSWORD));
    mvc.perform(post("/api/auth/login").with(csrf()).contentType("application/json").content(credentials)).andExpect(status().isForbidden());
    mvc.perform(post("/api/auth/verify-email").with(csrf()).contentType("application/json").content(json.writeValueAsString(Map.of("token", token)))).andExpect(status().isNoContent());
    mvc.perform(post("/api/auth/verify-email").with(csrf()).contentType("application/json").content(json.writeValueAsString(Map.of("token", token)))).andExpect(status().isBadRequest());
    login("new@example.com");
  }
  @Test void emailFailureRollsBackRegistrationAndExpiredTokenFails() throws Exception {
    doThrow(new org.springframework.mail.MailSendException("private SMTP details")).when(mail).send(any(SimpleMailMessage.class));
    mvc.perform(post("/api/auth/register").with(csrf()).contentType("application/json").content(json.writeValueAsString(Map.of("email", "fail@example.com", "username", "failuser", "password", PASSWORD))))
        .andExpect(status().isServiceUnavailable()).andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("private SMTP"))));
    assertThat(users.findByEmail("fail@example.com")).isEmpty();
  }
  @Test void sessionRotatesAndLogoutInvalidates() throws Exception {
    MockHttpSession anonymous = new MockHttpSession(); String oldId = anonymous.getId();
    var result = mvc.perform(post("/api/auth/login").session(anonymous).with(csrf()).contentType("application/json")
        .content(json.writeValueAsString(Map.of("email", "first@example.com", "password", PASSWORD)))).andExpect(status().isOk()).andReturn();
    assertThat(result.getRequest().getSession().getId()).isNotEqualTo(oldId);
    mvc.perform(post("/api/auth/logout").session(anonymous).with(csrf())).andExpect(status().isNoContent());
    assertThat(anonymous.isInvalid()).isTrue();
    mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
  }
  @Test void oauthStatePkceSingleUseAndEncryption() {
    String url = github.begin(firstId, first);
    assertThat(url).contains("code_challenge_method=S256").doesNotContain("test-secret");
    assertThatThrownBy(() -> github.complete(firstId, first, "wrong", "code")).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
    url = github.begin(firstId, first);
    String state = java.util.Arrays.stream(url.split("[?&]")).filter(part -> part.startsWith("state=")).findFirst().orElseThrow().substring(6);
    when(provider.post(eq("https://github.com/login/oauth/access_token"), anyString())).thenReturn(json.readTree("{\"access_token\":\"private-test-token\"}"));
    when(provider.get("https://api.github.com/user", "private-test-token")).thenReturn(json.readTree("{\"id\":123}"));
    github.complete(firstId, first, state, "code");
    String encrypted = db.queryForObject("SELECT encrypted_token FROM service_connections WHERE user_id=?", String.class, firstId);
    assertThat(encrypted).doesNotContain("private-test-token");
    assertThat(cipher.decrypt(encrypted, firstId)).isEqualTo("private-test-token");
    assertThatThrownBy(() -> cipher.decrypt(encrypted, firstId + 1)).isInstanceOf(IllegalStateException.class);
    final String consumed = state;
    assertThatThrownBy(() -> github.complete(firstId, first, consumed, "code")).isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
  }
  @Test void widgetDataIsCachedAndConfigurationSpecific() throws Exception {
    when(provider.get(startsWith("https://geocoding-api.open-meteo.com"))).thenReturn(json.readTree("{\"results\":[{\"latitude\":48.8,\"longitude\":2.3,\"name\":\"Paris\",\"country\":\"France\"}]}"));
    when(provider.get(startsWith("https://api.open-meteo.com"))).thenReturn(json.readTree("{\"current\":{\"temperature_2m\":21,\"apparent_temperature\":20}}"));
    long id = create(first, widget("Paris"));
    mvc.perform(get("/api/widgets/" + id + "/data").session(first)).andExpect(status().isOk()).andExpect(jsonPath("$.items[1].value").value("21 °C"));
    mvc.perform(get("/api/widgets/" + id + "/data").session(first)).andExpect(status().isOk());
    verify(provider, times(1)).get(startsWith("https://api.open-meteo.com"));
  }
}
