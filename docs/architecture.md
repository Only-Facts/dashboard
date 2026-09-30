# Architecture

## Request flow

```text
Browser
  │
  │ http://localhost:8080
  ▼
Nginx (frontend container)
  ├── static React application
  └── /api/* and /about.json ──► Spring Boot backend
                                      │
                                      ├── PostgreSQL
                                      ├── SMTP / Mailpit
                                      └── allow-listed HTTPS providers
```

Nginx gives the browser a single origin. This avoids broad CORS rules and lets the application use an HttpOnly session cookie with CSRF protection.

## Backend modules

The backend is split by responsibility instead of putting controller, validation, persistence and provider logic in the same classes.

- `about`: exposes the project-required `/about.json` metadata.
- `auth`: thin auth facade plus focused registration, login, verification-mail and session services.
- `common.security`: small shared security primitives such as authenticated-user extraction and secure token generation/hashing.
- `config`: Spring Security wiring, request-size checks and a separate in-memory API rate limiter.
- `dashboard`: widget use-cases and catalog API. Catalog definitions and widget-configuration validation are isolated from orchestration.
- `dashboard.persistence`: JDBC-only repositories, JSON config serialization and row mapping.
- `service`: service subscription lifecycle and separate GitHub callback/controller responsibilities.
- `integration`: outbound provider access, URL encoding and encrypted third-party token handling.
- `integration.http`: the external-host allow-list policy used by the provider HTTP client.
- `integration.oauth`: GitHub OAuth transport and short-lived state/PKCE session handling.
- `integration.widget`: one provider per external service plus small API helpers where a provider has several endpoints (for example Weather and Steam).
- `user`: user entity/repository plus the small row-lock repository used to serialize per-user mutations.

Controllers do not contain persistence or provider business logic. `WidgetDataService` resolves a provider by service identifier and caches successful responses for a short period. Widget configuration is always loaded through an ownership-scoped database query before provider data is fetched.

## Frontend modules

- `api`: typed functions for the same-origin REST API and centralized error handling/CSRF requests.
- `auth`: React context for current-user state.
- `pages`: route-level login, registration, verification, resend and dashboard screens.
- `components`: auth shell, dashboard navigation, service cards, widget editor and widget cards.
- `hooks/useWidgetData`: the timer mechanism. Each mounted widget schedules its own refresh using its configured `refreshSeconds` value, pauses useful network work while the page is hidden, supports manual refresh, and aborts outstanding work on unmount.

## Dashboard data ownership

Every widget row contains a `user_id`. Reads, updates, deletes and reorder operations always include the authenticated user id. A user therefore receives `404` rather than another user's widget if an arbitrary widget id is supplied.

A per-user row lock is taken for mutations that could otherwise race (create, reorder, connect/disconnect). This keeps widget positions and the 30-widget limit consistent for a single user under concurrent requests.

## Service model

Public services are available by default, but users can explicitly disconnect/reconnect them. GitHub is unavailable until the server has OAuth configuration, and it remains disconnected for a user until that user completes the OAuth flow.

Disconnecting a service removes its widget instances to prevent stale widgets from retaining access to a service that the user deliberately disconnected.
