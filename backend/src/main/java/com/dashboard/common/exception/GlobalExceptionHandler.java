package com.dashboard.common.exception;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mail.MailException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<Map<String, String>> handleStatus(ResponseStatusException exception) {
    String message = exception.getReason() == null ? "Request failed" : exception.getReason();
    return ResponseEntity
        .status(exception.getStatusCode())
        .body(Map.of("error", message));
  }

  @ExceptionHandler(MailException.class)
  public ResponseEntity<Map<String, String>> handleMail() {
    return ResponseEntity
        .status(HttpStatus.SERVICE_UNAVAILABLE)
        .body(Map.of(
            "error",
            "Verification email could not be sent. Please try registering again later."));
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<Map<String, String>> handleMalformedBody() {
    return ResponseEntity
        .badRequest()
        .body(Map.of("error", "Invalid request body"));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Object>> handleValidation(
      MethodArgumentNotValidException exception) {
    return ResponseEntity
        .badRequest()
        .body(Map.of(
            "error", "Validation failed",
            "fields", validationErrors(exception)));
  }

  private Map<String, String> validationErrors(MethodArgumentNotValidException exception) {
    Map<String, String> errors = new LinkedHashMap<>();
    exception.getBindingResult().getFieldErrors().forEach(error -> errors.putIfAbsent(
        error.getField(),
        error.getDefaultMessage()));
    return errors;
  }
}
