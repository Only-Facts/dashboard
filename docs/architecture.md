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

The backend has three feature areas and two shared support packages:

- `auth`: `AuthController` handles login/logout sessions and HTTP endpoints. `AuthService` owns registration, credential checks and API records. `auth.email` contains email verification and delivery; `auth.user` contains the user entity and repository.
- `dashboard`: `DashboardController` exposes widget CRUD, service connections, health and metadata endpoints. `DashboardService` owns widget and subscription rules. `DashboardRepository` contains their SQL and the per-user mutation lock. `Catalog` contains service definitions and configuration validation. `dashboard.github` and `dashboard.twitch` handle separate OAuth flows and encrypted tokens.
- `widget`: `WidgetDataService` fetches and caches widget data. `ProviderClient` handles HTTP, allowed hosts and response-size limits. `LocationResolver` shares city lookup between weather and air quality. `providers` contains one implementation per external service, including its endpoint calls.
- `config`: Spring Security configuration and the request-limit filter.
- `common`: JSON API errors and shared secure-token operations.

There are 29 production Java files. Controllers call services directly; single-use helpers stay inside their owning classes. The six provider implementations remain separate because each external API has different request and response formats.

Widget configuration is always loaded through an ownership-scoped database query before provider data is fetched. Successful provider responses are cached briefly; dashboard changes evict that user's cached data.

## Frontend modules

The frontend has 33 source files organized around the screens and features they implement:

- `api`: request/response types live beside the auth and dashboard API calls. `http.ts` handles requests, CSRF and HTTP errors together.
- `auth`: authentication context/provider and shared form layout.
- `pages`: login, registration, verification, resend and dashboard screens. Page-specific forms and messages live with their page.
- `dashboard`: navigation, service cards and one `useDashboard` hook for loading, mutations, errors and optimistic reordering.
- `widgets`: the card, editor, draggable grid, shared data formatting and refresh hook. `registry.ts` defines each widget's view, icon and size in one place; `views` groups the 18 views into six service files.

`App.tsx` contains routes, the authentication guard and the not-found screen. Widget cards render their markup directly. Each mounted widget schedules its own refresh, pauses network work while the page is hidden, supports manual refresh, and aborts outstanding work on unmount.

## Dashboard data ownership

Every widget row contains a `user_id`. Reads, updates, deletes and reorder operations always include the authenticated user id. A user therefore receives `404` rather than another user's widget if an arbitrary widget id is supplied.

A per-user row lock is taken for mutations that could otherwise race (create, reorder, connect/disconnect). This keeps widget positions and the 30-widget limit consistent for a single user under concurrent requests.

## Service model

Public services are available by default, but users can explicitly disconnect/reconnect them. GitHub and Twitch are unavailable until their respective OAuth configuration is present, and each remains disconnected for a user until that user completes its OAuth flow.

Disconnecting a service removes its widget instances to prevent stale widgets from retaining access to a service that the user deliberately disconnected.
