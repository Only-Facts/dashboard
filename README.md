# Orbit Dashboard

Orbit is a full-stack personal dashboard built for the Epitech **DASHBOARD** project. Users create and verify an account, connect services, add multiple configurable widget instances, move/edit/delete them, and let each widget refresh on its own timer.

The public application is served on **http://localhost:8080**. The same server exposes the required **`GET /about.json`** endpoint.

## Implemented features

- Account registration with email confirmation before login.
- Resend flow for expired verification links.
- Session-based authentication with CSRF protection and session-id rotation.
- Service subscription / disconnection.
- GitHub OAuth 2.0 connection with state, PKCE and encrypted token storage.
- Configurable widget instances with independent refresh intervals.
- Widget create, update, delete and saved drag-and-drop reordering (mouse, touch and keyboard).
- Multiple instances of the same widget type with distinct configurations.
- Responsive, keyboard-friendly React interface with clear loading/error states.
- React Icons throughout and 18 dedicated widget views with data-driven charts and layouts.
- External API timeout, host allow-list and response-size protection.
- Docker Compose deployment with PostgreSQL and Mailpit for local email testing.

## Services and widgets

| Service | Connection | Widgets |
| --- | --- | --- |
| Weather | Available by default | Current temperature, daily forecast, wind & humidity, precipitation, sunrise & sunset |
| GitHub | OAuth 2.0 | Repository statistics, recent commits, open issues |
| Exchange rates | Available by default | Exchange rate, currency conversion |
| Hacker News | Available by default | Popular stories, latest stories |
| Air quality | Available by default | European AQI, particulate pollution, pollution gases |
| Steam | Public data, available by default | Current players, game news, global achievement rates |

That is **6 services and 18 configurable widget types**. Every widget has at least one configuration parameter and a per-instance refresh interval.

### Widget presentations

Each of the 18 types has its own renderer: temperature and feels-like readings, forecast range bars, a humidity ring with wind speed, precipitation comparisons, a daylight arc, repository count bars, a commit timeline, issue tickets, currency conversion ladders and receipts, ranked and editorial news feeds, an AQI gauge, particle columns, gas concentration bars, Steam player activity, dated game dispatches, and achievement completion bars.

Charts use returned measurements. The Steam player chart collects up to 24 distinct provider updates while the widget is mounted; it starts after a second sample, resets when the widget configuration changes, and is not persisted across reloads. Currency comparison bars show conversions at the current reference rate, not historical prices. Missing values remain explicit. CSS draws the charts; [React Icons](https://react-icons.github.io/react-icons/) supplies the icon components.

### Add and arrange widgets

1. Sign in and choose **Add widget** on the dashboard.
2. Select a service and widget type, configure its parameters, and set its refresh interval (60–86,400 seconds).
3. Save the widget. Add another instance with different settings to compare cities, games or currencies.
4. Drag the dotted handle to another card to reorder. Keyboard users can focus the handle and use arrow keys, Home or End.
5. Open a card's **•••** menu to refresh, edit, move or delete it. Services can be managed from the top navigation.

New widget parameters:

| Widget | Configuration | Display |
| --- | --- | --- |
| Precipitation | City | Current precipitation and rain in mm; snowfall in cm |
| Sunrise & sunset | City | Today's sunrise/sunset with the location's timezone |
| Pollution gases | City | Nitrogen dioxide, ozone and sulphur dioxide in μg/m³ |
| Steam current players | App ID | Players currently online for that game |
| Steam game news | App ID, item limit (1–10) | Dated game updates with links |
| Steam achievement rates | App ID, item limit (1–10) | Most commonly unlocked achievements and global percentages |

For Steam, use the numeric ID from a game's store URL: `440` for Team Fortress 2, `570` for Dota 2, or `620` for Portal 2. These widgets display public game data, not personal Steam account data. Some games have no news or achievements; empty results are shown explicitly. Achievement names use the game's API identifiers. Provider outages are shown as errors, retaining the last successful data when available.

Provider references: [Steam game news](https://partner.steamgames.com/doc/webapi/ISteamNews), [Steam statistics](https://partner.steamgames.com/doc/webapi/ISteamUserStats), [Open-Meteo weather](https://open-meteo.com/en/docs), [Open-Meteo air quality](https://open-meteo.com/en/docs/air-quality-api).

See [the project requirements checklist](docs/project-requirements.md) for submission preparation.

## Quick start with Docker Compose

### 1. Configure secrets

```bash
cp .env.example .env
```

Edit `.env` and replace the example database password with a strong value:

```bash
openssl rand -hex 24
```

Put that generated value in `DB_PASSWORD`.

### 2. Build and start the complete stack

```bash
docker compose up --build
```

Open:

- Application: http://localhost:8080
- Mailpit inbox: http://localhost:8025
- Required metadata: http://localhost:8080/about.json

PostgreSQL is intentionally **not exposed on a host port** in the normal Docker stack. The backend reaches it over the private Compose network at `db:5432`. This avoids conflicts with PostgreSQL or older dashboard containers already using ports such as `5432` or `5433`.

Register an account, open Mailpit, follow the verification link, then sign in.

### 3. Stop

```bash
docker compose down
```

To also delete the project's local database volume:

```bash
docker compose down -v
```

## Optional GitHub OAuth setup

GitHub widgets are shown as unavailable until all GitHub secrets are configured.

1. Create a GitHub OAuth App.
2. Set its homepage URL to `http://localhost:8080` for local development.
3. Set its callback URL to `http://localhost:8080/api/services/github/callback`.
4. Generate the token-encryption key:

```bash
openssl rand -base64 32
```

5. Fill these values in `.env`:

```env
TOKEN_ENCRYPTION_KEY=<base64-encoded-32-byte-key>
GITHUB_CLIENT_ID=<client-id>
GITHUB_CLIENT_SECRET=<client-secret>
GITHUB_CALLBACK_URL=http://localhost:8080/api/services/github/callback
```

6. Restart the stack:

```bash
docker compose up -d --build
```

The GitHub access token is encrypted using AES-256-GCM before it is written to PostgreSQL. The encryption key itself must stay outside the repository.

## Local development

For host-side Spring Boot development, use the dedicated development override instead of exposing the database from the normal stack.

```bash
cp .env.example .env
# Set a real DB_PASSWORD in .env
./scripts/dev-deps-up.sh
./scripts/run-backend-dev.sh
```

Defaults:

- PostgreSQL: `127.0.0.1:5434`
- Mailpit SMTP: `127.0.0.1:1026`
- Mailpit UI: `http://127.0.0.1:8025`

These host ports are configurable in `.env` with `DB_HOST_PORT`, `MAIL_SMTP_HOST_PORT`, and `MAIL_UI_PORT`. The backend launcher sources `.env` itself, so the password used by Spring Boot always matches the password supplied to the development PostgreSQL container.

For frontend development:

```bash
cd frontend
npm ci
npm run dev
```

Vite listens on `http://localhost:5173` and proxies `/api` and `/about.json` to the backend.

If a database volume was previously initialized with a different password, reset only this project's development data once with:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

Then start the development dependencies again.

## Build and tests

Run the complete verification helper from the repository root:

```bash
./scripts/verify.sh
```

Or run each layer separately.

Frontend:

```bash
cd frontend
npm ci
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

Backend integration tests use PostgreSQL Testcontainers:

```bash
cd backend
./gradlew test
```

A working Docker runtime is therefore required for the backend test suite.

## Project structure

```text
.
├── backend/
│   ├── src/main/java/com/dashboard/
│   │   ├── about/          # /about.json metadata endpoint
│   │   ├── auth/           # focused registration, login, verification and session services
│   │   ├── common/         # shared API errors and security primitives
│   │   ├── config/         # Spring Security and request limiting
│   │   ├── dashboard/      # widget use-cases, catalog and validation
│   │   │   └── persistence/ # JDBC repositories, row mapping and config codec
│   │   ├── integration/    # hardened provider HTTP/OAuth/token handling
│   │   │   ├── http/       # outbound URL allow-list policy
│   │   │   ├── oauth/      # GitHub OAuth transport and PKCE/state session
│   │   │   └── widget/     # one provider module per external data service
│   │   ├── service/        # subscription lifecycle and GitHub callback API
│   │   └── user/           # user persistence and per-user mutation lock
│   └── src/main/resources/db/migration/
├── frontend/
│   └── src/
│       ├── api/            # typed HTTP boundary
│       ├── auth/           # authentication context
│       ├── components/     # reusable dashboard/auth UI
│       ├── hooks/          # widget timer and data refresh logic
│       └── pages/          # route-level screens
├── poc/                    # original configurable real-API proof of concept
├── docs/
│   ├── architecture.md
│   ├── security.md
│   └── technology-choices.md
└── docker-compose.yml
```

## Required `/about.json`

`GET http://localhost:8080/about.json` returns:

- `client.host`: caller IP address;
- `server.current_time`: current Unix timestamp;
- `server.services[]`: all supported services;
- each service's widget identifiers and configurable parameters with `string` or `integer` types.

The endpoint intentionally includes extra human-readable labels/descriptions used by the frontend; the required fields remain present.

## Security notes

Important controls include BCrypt password hashing, one-time hashed email tokens, HttpOnly/SameSite session cookies, CSRF protection, login/request rate limiting, strict same-origin architecture, security headers, OAuth state + PKCE, AES-GCM service-token encryption, ownership checks on every widget operation, provider host allow-listing, request/response size limits and non-root/read-only application containers.

For the detailed threat model and production checklist, see [`docs/security.md`](docs/security.md).

## Design and technology documentation

- [`docs/technology-choices.md`](docs/technology-choices.md) compares at least three frontend, backend and database options using consistent criteria for each layer.
- [`docs/architecture.md`](docs/architecture.md) explains the main modules and data flow.
- [`poc/README.md`](poc/README.md) explains how to run the real-data proof of concept.
