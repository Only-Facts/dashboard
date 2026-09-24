package com.dashboard.common.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.MethodArgumentNotValidException;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Object>> handleValidation(
      MethodArgumentNotValidException exception) {

    Map<String, String> errors = new LinkedHashMap<>();

    exception.getBindingResult()
        .getFieldErrors()
        .forEach(error -> errors.putIfAbsent(
            error.getField(),
            error.getDefaultMessage()));

    Map<String, Object> response = Map.of(
        "error", "Validation failed",
        "fields", errors);

    return ResponseEntity
        .status(HttpStatus.BAD_REQUEST)
        .body(response);
  }
}
