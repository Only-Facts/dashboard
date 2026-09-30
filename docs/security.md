# Security model

Security is designed around a same-origin web application. The React frontend is served by Nginx on port 8080 and the backend is reachable through that reverse proxy, not published directly by Docker Compose.

## Authentication and sessions

- Passwords are hashed with BCrypt at strength 12; plaintext passwords are never stored.
- Login failures use the same public message for unknown email addresses and wrong passwords. A dummy BCrypt comparison is performed for unknown accounts to reduce obvious timing differences.
- Accounts cannot sign in until email verification succeeds.
- Email verification tokens contain 256 bits of randomness, are stored only as SHA-256 hashes, expire after 30 minutes and are single-use.
- Requesting a replacement verification link returns the same response whether the account is missing, verified or pending.
- Authentication uses an HttpOnly session cookie with `SameSite=Lax`. Production deployments must set `COOKIE_SECURE=true` behind HTTPS.
- The session id is changed at the authentication boundary to limit session-fixation attacks.
- Logout invalidates the server session.

## CSRF, XSS and browser policy

- All state-changing REST endpoints require Spring Security CSRF validation.
- The frontend obtains a CSRF token from `/api/auth/csrf` and sends it in `X-CSRF-TOKEN`.
- React renders provider/user strings as text; the UI does not use `dangerouslySetInnerHTML`.
- Nginx sends a restrictive Content Security Policy, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, a no-referrer policy and a restrictive Permissions Policy.
- The reverse proxy is same-origin, so there is no permissive CORS configuration.
- Query strings are not written to the Nginx access log, preventing verification tokens and OAuth authorization codes from being stored there.

## OAuth and third-party credentials

- GitHub authorization uses OAuth state and a short-lived, session-bound attempt.
- PKCE (`S256`) binds the authorization code to the flow that initiated it.
- OAuth attempts are single-use and expire after ten minutes.
- The GitHub access token is validated before storage.
- Access tokens are encrypted with AES-256-GCM using a random nonce and user-specific additional authenticated data.
- `TOKEN_ENCRYPTION_KEY` is supplied through the environment and must never be committed.
- Disconnecting GitHub clears the stored encrypted token and deletes GitHub widgets.

## External API / SSRF controls

The generic provider client does not accept arbitrary hosts. It permits HTTPS requests only to the explicit provider host allow-list used by this project. It also:

- rejects credentials embedded in a URL and non-default ports;
- refuses redirects so an allowed host cannot silently redirect a credential-bearing request elsewhere;
- uses connect and request timeouts;
- rejects provider responses larger than 2 MB while they are being streamed;
- never forwards the GitHub bearer token to non-GitHub requests.

Widget parameters are separately validated before a provider URL is built. Repository names, numeric limits and currency codes are constrained, while free-text search/city values are URL-encoded.

## Authorization and database integrity

- Every widget query is scoped by authenticated `user_id`.
- Widget configuration is validated server-side; frontend checks are only a usability layer.
- The widget limit and ordering mutations are protected with a per-user database row lock.
- Foreign keys cascade user deletion to verification tokens, connections and widgets.
- Flyway controls schema changes; Hibernate is configured with `ddl-auto=validate`.

## Abuse and information exposure

- Requests larger than 16 KB are rejected before normal API processing.
- Authentication endpoints have tighter per-IP request limits than the rest of the API.
- Spring error responses do not include stack traces or exception messages by default.
- SMTP failures return a generic public message rather than SMTP internals.
- Provider failures are mapped to controlled gateway errors.

The built-in limiter is deliberately documented as a **single-process safety net**. If the backend is scaled to multiple replicas, enforce a shared limit at the ingress/reverse proxy or with a shared rate-limit store.

## Container and secret handling

- Frontend and backend application containers drop Linux capabilities, set `no-new-privileges`, and run with read-only root filesystems plus a temporary `/tmp`.
- The backend image runs as a non-root `dashboard` user; the Nginx image is the unprivileged variant.
- PostgreSQL is not exposed beyond loopback in local Compose.
- `.env` and generated build directories are excluded from Git.

## Production checklist

Before public deployment:

1. Terminate TLS at a trusted reverse proxy and redirect HTTP to HTTPS.
2. Set `COOKIE_SECURE=true`.
3. Use a secrets manager for the database password, SMTP credentials, GitHub client secret and token-encryption key.
4. Use a production SMTP provider rather than Mailpit.
5. Put a shared rate limiter / WAF in front of the application if running multiple backend replicas.
6. Back up PostgreSQL and test restoration.
7. Monitor failed authentication/provider requests without logging passwords, verification tokens, OAuth codes or bearer tokens.
8. Rotate GitHub and encryption secrets through a documented incident procedure. Rotating the AES key invalidates existing encrypted GitHub connections unless a key-version migration is implemented.
