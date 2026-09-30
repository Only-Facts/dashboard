package com.dashboard.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class ApiErrors {

  private ApiErrors() {
  }

  public static ResponseStatusException badRequest(String message) {
    return error(HttpStatus.BAD_REQUEST, message);
  }

  public static ResponseStatusException unauthorized(String message) {
    return error(HttpStatus.UNAUTHORIZED, message);
  }

  public static ResponseStatusException forbidden(String message) {
    return error(HttpStatus.FORBIDDEN, message);
  }

  public static ResponseStatusException notFound(String message) {
    return error(HttpStatus.NOT_FOUND, message);
  }

  public static ResponseStatusException conflict(String message) {
    return error(HttpStatus.CONFLICT, message);
  }

  public static ResponseStatusException badGateway(String message) {
    return error(HttpStatus.BAD_GATEWAY, message);
  }

  private static ResponseStatusException error(HttpStatus status, String message) {
    return new ResponseStatusException(status, message);
  }
}
