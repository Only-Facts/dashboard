package com.dashboard.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RequestLimitFilter extends OncePerRequestFilter {

  private static final long MAX_BODY_BYTES = 16_384;

  private final ApiRateLimiter limiter;
  private final RequestLimitPolicy policy = new RequestLimitPolicy();

  public RequestLimitFilter(ApiRateLimiter limiter) {
    this.limiter = limiter;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain chain) throws ServletException, IOException {
    if (bodyTooLarge(request)) {
      reject(response, HttpStatus.PAYLOAD_TOO_LARGE, "Request body is too large.");
      return;
    }
    if (!isApiRequest(request)) {
      chain.doFilter(request, response);
      return;
    }
    if (!withinRateLimit(request)) {
      response.setHeader("Retry-After", "60");
      reject(response, HttpStatus.TOO_MANY_REQUESTS, "Too many requests. Please wait a minute.");
      return;
    }
    chain.doFilter(request, response);
  }

  private boolean bodyTooLarge(HttpServletRequest request) {
    return request.getContentLengthLong() > MAX_BODY_BYTES;
  }

  private boolean isApiRequest(HttpServletRequest request) {
    return request.getRequestURI().startsWith("/api/");
  }

  private boolean withinRateLimit(HttpServletRequest request) {
    String path = request.getRequestURI();
    String method = request.getMethod();
    String bucket = policy.bucket(path, method);
    String key = request.getRemoteAddr() + ":" + bucket;
    return limiter.allow(key, policy.limit(path, method));
  }

  private void reject(
      HttpServletResponse response,
      HttpStatus status,
      String message) throws IOException {
    response.setStatus(status.value());
    response.setContentType("application/json");
    response.setCharacterEncoding("UTF-8");
    response.getWriter().write("{\"error\":\"" + message + "\"}");
  }
}
