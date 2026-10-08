# ADR-05 — Backend tests: Vitest + supertest, mocked at one boundary per level ^ADR-05

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-05 |
| Author | munifmubtashim (drafted by Claude) |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | [[REQ-003]] · [[knowledge/lessons/LESSON-REQ-001-3-vitest5-node-tests-in-scripts\|L-REQ-001-3]] |

## Context

The backend (`packages/backend/src/{api,businessLogic,dal}`) has no test runner. REQ-003 needs tests that prove auth on every route, and they must run without a live Postgres. Three things shape the choice:

- All backend packages are ESM TypeScript (`moduleResolution: bundler`).
- `@alumni/businesslogic` resolves to a compiled `dist/`, which goes stale whenever its source changes.
- `dal/config/db.ts` creates a `pg.Pool` and fires an async connection check at import time.

The frontend already uses Vitest 5.

## Considered options

### Option 1 — Vitest + supertest, one config at `packages/backend`

One Vitest project covers all three sub-packages, with co-located `*.test.ts`. `@alumni/businesslogic` is aliased to its source. supertest drives the real Express `app` in-process.

**Pros:** same runner and habits as the frontend; native ESM + TS with no build step; `vi.mock` works on aliased workspace modules; supertest needs no open port.
**Cons:** two new dev dependencies (`supertest`, `@types/supertest`) plus `vitest` in a second workspace; route enumeration for the guard test uses Express 4 internals.

### Option 2 — Node's built-in test runner (`node --test`) + supertest

**Pros:** no test-runner dependency.
**Cons:** module mocking in ESM is experimental and awkward; a second test style in the repo.

### Option 3 — Integration tests against a real Postgres (Docker)

**Pros:** exercises the SQL for real.
**Cons:** needs Docker or a DB on every machine, and there's no migration runner to build the schema from. The spec requires running without Postgres.

## Decision

**We chose Option 1.** Each test level mocks exactly one boundary:

| Level | Mocks | Proves |
|---|---|---|
| HTTP (supertest on `app`) | `@alumni/businesslogic` managers (real `AppError` kept) | middleware, roles, status codes, which identity reaches the manager |
| Manager unit | `@alumni/dal` query classes | business rules (ownership, validation) |
| Query unit | `dal/config/db` pool (recording `query`) | the SQL shape (e.g. no `password` column) |

`dal/config/db` is also mocked in a global setup file, so no test ever opens a database connection.

## Consequences

- `npm test` in `packages/backend` (and `npm run test:backend` at the root) runs the backend suite in a few seconds, with no DB.
- New routes get an automatic check: the guard test enumerates the Express app and fails on any non-allowlisted route that answers without a token.
- An Express 5 upgrade will break the route walker loudly. It asserts a minimum route count, so it can't pass empty.
- Tests trust the role inside the JWT, as the middleware does: a demoted or deleted admin keeps admin rights until the token expires (≤ 1 hour). Token revocation was a REQ-003 non-goal; revisit with refresh tokens.
- Real-SQL integration testing is still missing. Revisit when a migration runner exists.

## Related

- [[REQ-003]]
- [[architecture/adr-03-frontend-session-and-401-handling|ADR-03]] — why 401 vs 403 matters to the client
