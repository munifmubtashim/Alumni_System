# ADR-03 — Frontend session: token store + Query for the user, global 401 by registered handler ^ADR-03

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-05 |
| Author | munifmubtashim (drafted by Claude) |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | [[REQ-002]], [[architecture/adr-02-server-state-tanstack-query\|ADR-02]] |

## Context

[[REQ-002]] adds login and sign-up, and needs to answer three questions:
1. Where does "who is signed in" live?
2. How does any 401 log the user out?
3. How do guards react when the token changes?

The constraints:
- **The backend.** It issues a bearer JWT (`{ sub, role, exp }`, 1 h, no refresh). Login returns only the token, and `/api/me` returns the profile.
- **ADR-02.** It put the token in `services/authToken.ts` and server data in TanStack Query.
- **The lint.** It forbids `services/` from importing store, features or app.

## Considered options

### Option 1 — Token store + `['me']` Query + 401 handler registered from the app *(recommended)*

The token stays in `authToken.ts`, which gains `subscribe`, expiry decoding, and cross-tab `storage` sync. Guards read it with `useSyncExternalStore`. The user is the `['me']` Query. `httpClient` exposes `setUnauthorizedHandler`. A render-nothing `SessionBridge` in features registers a handler that clears the token and cache, sets a one-shot notice atom and navigates to `/login`.

**Pros:** follows ADR-02 exactly, with no copy of server data in atoms; keeps the lint boundaries; one place handles every 401; logout in another tab is picked up.
**Cons:** a registration step (the handler is unset until the bridge mounts, which is harmless since no authed request can run before then); a small subscribe API to maintain.

### Option 2 — Session in a Jotai atom (token + user), interceptor reads the atom

**Pros:** a single reactive source.
**Cons:** copies server data into an atom, breaking ADR-02. `services/` would have to import `store/`, breaking the lint. Two homes for the token.

### Option 3 — No global handler; each query and page handles its own 401

**Pros:** no cross-layer hook.
**Cons:** every future feature must remember to do it, so expiry handling drifts. The spec requires any 401 to log the user out.

### Option 4 — httpOnly cookie session

**Pros:** the token is out of reach of scripts.
**Cons:** needs backend changes (cookie issue, CSRF handling, CORS credentials), which is out of scope for REQ-002.

## Decision

**Option 1** (accepted at the REQ-002 architecture gate, 2026-10-05). It is the only option that meets the spec's "any 401 logs out" rule within ADR-02 and the lint boundaries, without backend changes. Redirect-back uses only in-app `location.state`, never a URL parameter, so it can't be used as an open redirect.

## Consequences

| Consequence | Type |
|---|---|
| Every authed request's 401 (except login and register) ends the session | rule |
| New features just use `httpClient` and get expiry handling for free | benefit |
| The token stays in localStorage, readable by XSS; moving to cookies is a backend REQ | trade-off / follow-up |
| `SessionBridge` must be mounted once inside the router, above every shell (in `app/RootLayout`, since [[REQ-004]]; it was in `AppShell` until then) | constraint |

> **Amended 2026-10-06 ([[REQ-004]]):** auth pages left `AppShell` for a header-less `AuthShell`, so `SessionBridge` moved up to a path-less `RootLayout` that wraps both shells (see [[architecture/adr-07-root-layout-and-headerless-auth|ADR-07]]). The decision itself is unchanged: one registered 401 handler, mounted once inside the router.

## Open questions

- [ ] Cookie-based sessions (needs backend): a future REQ if the threat model calls for it.

## Related

- ADRs: [[architecture/adr-02-server-state-tanstack-query|ADR-02]] · Lessons: [[knowledge/lessons/LESSON-REQ-001-4]] · Components: [[knowledge/components/frontend]]
