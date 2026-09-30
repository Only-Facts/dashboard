# DASHBOARD project requirements

This checklist maps the supplied DASHBOARD v1.1.3 brief to the implementation. It is not a claim that the final presentation or every deployment environment has been validated.

| Requirement | Implementation / demonstration |
| --- | --- |
| Register and confirm before access | Email verification, login, resend flow; use Mailpit in local Docker deployment |
| Authentication and account isolation | Session authentication, CSRF and widget ownership checks |
| External authorization through OAuth 2.0 | GitHub account linking; configure GitHub OAuth secrets before the demonstration |
| Subscribe to services | Services tab, connect/disconnect; public services enabled by default |
| Configurable widgets | 6 services, 18 types; every type has parameters in the shared backend catalog |
| Independent timers | Each instance sets its refresh interval from 60 seconds to 24 hours |
| Add, configure, move, delete | Add widget dialog, options menu, mouse/touch drag handles, keyboard reordering |
| Multiple differently configured instances | Separate persisted configuration and cached data per widget ID |
| Responsive and accessible interface | Sidebar-free responsive grid, labeled controls, keyboard reorder, status announcements |
| Public `/about.json` on port 8080 | Client IP, Unix time, services, widget identifiers and typed parameters generated from the catalog |
| Docker Compose build/run | Root `docker-compose.yml`; `docker compose build` then `docker compose up` (or legacy `docker-compose`) |
| Stack comparison | `docs/technology-choices.md` |
| Original proof of concept | `poc/` |
| User/developer documentation | Root README, architecture and security documents |

The brief requires **1 + X services** and **3 × X widget types** for X students. The current catalog satisfies both count requirements for groups up to five students. Multiple instances of one type do not increase the type count.

## Before pushing and presenting

- Run `./scripts/verify.sh` with Docker available, then the frontend browser tests described in README.
- Build and start Compose and check `http://localhost:8080/about.json`.
- Register, verify using Mailpit, and add two city widgets with different configurations; show independent updates and saved ordering after reload.
- Add Steam widgets using app ID `440`; edit a second instance to another game.
- Configure and demonstrate GitHub OAuth with your own OAuth app. Public Steam endpoints do not substitute for this OAuth demonstration.
- Keep `.env`, tokens, dependencies, build outputs and local archives out of the delivery. Ignore rules cover these generated files; inspect the actual staged file list before committing.
- Push from the team's actual Git checkout. The provided workspace currently has no `.git` directory or configured remote.

An administration interface and a recorded demonstration are suggestions in the brief, not mandatory widget requirements. No admin interface was added as part of this widget expansion.
