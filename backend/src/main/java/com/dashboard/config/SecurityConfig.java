package com.dashboard.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

@Configuration
public class SecurityConfig {

  private static final int BCRYPT_STRENGTH = 12;

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(BCRYPT_STRENGTH);
  }

  @Bean
  public SecurityContextRepository securityContextRepository() {
    return new HttpSessionSecurityContextRepository();
  }

  @Bean
  public HttpSessionCsrfTokenRepository csrfTokenRepository() {
    HttpSessionCsrfTokenRepository repository = new HttpSessionCsrfTokenRepository();
    repository.setHeaderName("X-CSRF-TOKEN");
    return repository;
  }

  @Bean
  public SecurityFilterChain securityFilterChain(
      HttpSecurity http,
      SecurityContextRepository contexts,
      HttpSessionCsrfTokenRepository csrfTokens,
      RequestLimitFilter requestLimits) throws Exception {
    configureSecurity(http, contexts, csrfTokens, requestLimits);
    return http.build();
  }

  private void configureSecurity(
      HttpSecurity http,
      SecurityContextRepository contexts,
      HttpSessionCsrfTokenRepository csrfTokens,
      RequestLimitFilter requestLimits) throws Exception {
    http
        .addFilterBefore(requestLimits, CsrfFilter.class)
        .headers(headers -> headers
            .contentSecurityPolicy(csp -> csp.policyDirectives(contentSecurityPolicy()))
            .referrerPolicy(referrer -> referrer.policy(
                ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER)))
        .csrf(csrf -> csrf
            .csrfTokenRepository(csrfTokens)
            .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
        .sessionManagement(session -> session
            .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
        .securityContext(context -> context
            .securityContextRepository(contexts))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(HttpMethod.GET, publicGetEndpoints()).permitAll()
            .requestMatchers(HttpMethod.POST, publicPostEndpoints()).permitAll()
            .anyRequest().authenticated())
        .exceptionHandling(exception -> exception
            .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
        .formLogin(AbstractHttpConfigurer::disable)
        .httpBasic(AbstractHttpConfigurer::disable)
        .logout(AbstractHttpConfigurer::disable);
  }

  private String[] publicGetEndpoints() {
    return new String[]{"/api/health", "/api/auth/csrf", "/about.json"};
  }

  private String[] publicPostEndpoints() {
    return new String[]{
        "/api/auth/register",
        "/api/auth/verify-email",
        "/api/auth/resend-verification",
        "/api/auth/login"
    };
  }

  private String contentSecurityPolicy() {
    return "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";
  }
}
