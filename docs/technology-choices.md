# Technology choices

The project brief allows the team to choose its stack but requires a professional comparison of at least three options for the frontend, backend and database layers. The choices below use the same criteria within each layer: suitability for the dashboard, maintainability, ecosystem/integration support, security/tooling, and delivery cost for this repository.

## Frontend

| Criterion | React + TypeScript | Vue + TypeScript | Angular |
| --- | --- | --- | --- |
| Dashboard suitability | Excellent component model for independent widgets and timers | Excellent component model with concise templates | Excellent for large structured applications |
| Maintainability | Strong typing, small reusable components, large hiring/ecosystem base | Strong typing and approachable single-file components | Very structured but more framework ceremony |
| Ecosystem | Very large ecosystem; Vite and React Router integrate cleanly | Large ecosystem; first-class Vite support | Large ecosystem with an integrated toolchain |
| Security/tooling | React escapes rendered text by default; mature lint/type tooling | Similar safe rendering defaults and tooling | Strong framework defaults and integrated tooling |
| Delivery cost here | **Low**: the repository already uses React/TypeScript | Medium: requires rewriting the existing UI | High: requires a larger rewrite and more boilerplate |

**Choice: React + TypeScript + Vite.** The dashboard is naturally component-oriented: each widget, service card and authentication view can be isolated. The existing codebase already uses this stack, so keeping it reduces project risk while TypeScript keeps the API boundary explicit. Tailwind is used mainly as utility classes so the project does not need a large custom CSS layer.

## Backend

| Criterion | Spring Boot (Java) | NestJS (Node/TypeScript) | Django (Python) |
| --- | --- | --- | --- |
| Dashboard/API suitability | Excellent REST, validation, transactions and scheduled/integration support | Excellent modular REST/API framework | Excellent rapid CRUD and admin support |
| Maintainability | Strong package/module boundaries and compile-time types | Strong module/dependency-injection model | Clear conventions, dynamic typing unless supplemented |
| Ecosystem/integrations | Mature Security, JPA, JDBC, mail, Flyway, HTTP tooling | Mature web/OAuth ecosystem | Mature auth/ORM ecosystem |
| Security/tooling | Spring Security provides robust session/CSRF/header primitives | Good security libraries but more choices are assembled manually | Strong secure defaults for common web patterns |
| Delivery cost here | **Low**: repository already uses Spring Boot and Java 21 | Medium/high rewrite | Medium/high rewrite |

**Choice: Spring Boot + Java 21.** It matches the existing implementation and is especially useful for the security-sensitive parts of this project: session authentication, CSRF, validation, database transactions, email confirmation and ownership enforcement. Provider integrations are separated behind small service modules to avoid a monolithic controller.

## Database

| Criterion | PostgreSQL | MySQL | MongoDB |
| --- | --- | --- | --- |
| Data model fit | Excellent for users, tokens, connections and ordered widget ownership | Also strong relational fit | Flexible documents, but relationships require more application logic |
| Transactions/integrity | Strong ACID transactions, constraints, row locking | Strong ACID/InnoDB support | Transactions available, but relational invariants are less natural |
| Query/maintenance | Powerful SQL and indexing; Flyway works well | Mature SQL and indexing | Flexible schema, different migration discipline |
| Security/tooling | Mature roles, drivers, backups and operational tooling | Mature roles, drivers and operational tooling | Mature tooling, but less natural for this relational schema |
| Delivery cost here | **Low**: schema and tests already target PostgreSQL | Medium migration effort | High redesign effort |

**Choice: PostgreSQL 16.** The core entities are relational and ownership-sensitive. Foreign keys, unique constraints, transactions and row locks make it straightforward to guarantee that widget ordering and service changes remain consistent. Flyway owns schema evolution so production startup does not depend on Hibernate creating tables implicitly.

## Supporting choices

- **Flyway**: deterministic, versioned schema migrations.
- **BCrypt**: established password hashing supported directly by Spring Security.
- **Caffeine**: short-lived in-process cache for provider data, reducing unnecessary external API traffic.
- **Nginx**: serves the built SPA and provides a single same-origin reverse proxy for the backend.
- **Docker Compose**: standardizes the required build/run workflow across frontend, backend, PostgreSQL and local SMTP testing.
