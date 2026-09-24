
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

import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

import org.springframework.security.web.authentication.HttpStatusEntryPoint;

@Configuration
public class SecurityConfig {

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public SecurityContextRepository securityContextRepository() {
    return new HttpSessionSecurityContextRepository();
  }

  @Bean
  public SecurityFilterChain securityFilterChain(
      HttpSecurity http,
      SecurityContextRepository securityContextRepository) throws Exception {

    http
        .csrf(csrf -> csrf
            .ignoringRequestMatchers(
                "/api/auth/register",
                "/api/auth/verify-email")
            .csrfTokenRequestHandler(
                new CsrfTokenRequestAttributeHandler()))
        .sessionManagement(session -> session
            .sessionCreationPolicy(
                SessionCreationPolicy.IF_REQUIRED))
        .securityContext(context -> context
            .securityContextRepository(
                securityContextRepository))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(
                HttpMethod.GET,
                "/api/health",
                "/api/auth/csrf",
                "/about.json")
            .permitAll()

            .requestMatchers(
                HttpMethod.POST,
                "/api/auth/register",
                "/api/auth/verify-email",
                "/api/auth/login")
            .permitAll()

            .anyRequest().authenticated())
        .exceptionHandling(exception -> exception
            .authenticationEntryPoint(
                new HttpStatusEntryPoint(
                    HttpStatus.UNAUTHORIZED)))
        .formLogin(AbstractHttpConfigurer::disable)
        .httpBasic(AbstractHttpConfigurer::disable)
        .logout(AbstractHttpConfigurer::disable);

    return http.build();
  }
}
