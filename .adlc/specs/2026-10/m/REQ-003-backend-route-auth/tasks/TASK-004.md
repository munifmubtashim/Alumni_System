# TASK-004 — Auth on every router + HTTP and guard tests

| Field | Value |
|---|---|
| REQ | REQ-003 |
| Tier | 2 |
| Status | done |
| Repo | alumni-system |
| Depends on | TASK-002, TASK-003 |
| Blocks | — |

## Goal

Every route except login, register and health rejects requests without a valid token. Admin routes reject non-admins. Tests prove the spec's whole route table, and a guard test fails if an unprotected route is ever added.

## Files to touch

| Path | Action |
|---|---|
| `packages/backend/src/api/routes/UserRoutes.ts` | edit — `router.use(authMiddleware)` first; `requireRole("admin")` on `GET /` and `POST /` (keep it on `DELETE /:id`); drop per-route `authMiddleware` |
| `packages/backend/src/api/routes/AlumniRoutes.ts` | edit — `router.use(authMiddleware)`; drop per-route ones; `requireRole("alumni")` on `POST /` |
| `packages/backend/src/api/routes/PostRoutes.ts` | edit — `router.use(authMiddleware)`; drop per-route one |
| `packages/backend/src/api/routes/CommentRoutes.ts` | edit — `router.use(authMiddleware)`; drop per-route one |
| `packages/backend/src/api/server.ts` | edit — before `app.listen`, if `process.env.JWT_SECRET` is empty, `console.error` a clear message and `process.exit(1)` |
| `packages/backend/src/api/Middleware/roleMiddleware.ts` | edit — `if (!req.user) return 401 {message: "Not signed in"}` before the role check |
| `packages/backend/src/api/routes/routes.test.ts` | create |
| `packages/backend/src/api/routes/routeGuard.test.ts` | create |

## Approach

- Import `authMiddleware` the same way in every route file (pick the existing extensionless form). Don't rename `authMIddleware.ts`; that's out of scope.
- `routes.test.ts` (supertest, `vi.mock("@alumni/businesslogic")` with the real `AppError` re-exported via `vi.importActual`). Drive it from a table that mirrors the spec's route table. For each route: no token → 401; expired token → 401; bad signature → 401. For admin-only routes: student → 403, admin → 2xx. For owner routes: the manager fake throws `AppError(403)` / `AppError(404)` → the same status comes back. Also cover:
  - `POST /api/alumni`: student → 403, admin → 403, alumni → 201 (manager fake), manager `AppError(409)` → 409
  - removed routes → 404 with a valid token, 401 without one (spec AC4)
  - `POST /api/posts` and `POST /api/alumni` with `user_id: 999` in the body → the manager receives the token's `sub`
  - `GET /api/users` and `GET /api/users/:id` responses have no `password` key, with fakes returning what the query now returns
  - `requireRole` on a request with no `req.user` → 401, tested directly on the middleware
  - login and register still reachable without a token
- `routeGuard.test.ts`: recursively walk `app._router.stack`. A mounted router layer has `layer.handle.stack`, and its mount path comes from `layer.regexp`. Mount paths in `app.ts` are static strings, so parsing `layer.regexp.source` for the `/api/xxx` prefix is acceptable; or keep a tiny map from router object to mount path, built by reading `app.ts`'s order. Build `METHOD /full/path`. Assert the count is ≥ 23 and includes `DELETE /api/comments/:id`. Also assert every top-level layer is a known middleware (`query`, `expressInit`, `corsMiddleware`, `jsonParser`), a route, or a mounted router; anything else fails. Then for each route not on the allowlist (`POST /api/auth/login`, `POST /api/auth/register`, `GET /api/health`), with `:param` → `1` and no token, assert 401.

## Acceptance

- [ ] `npm test` in `packages/backend` passes, covering spec AC1–AC9 and AC11–AC12
- [ ] Temporarily removing `router.use(authMiddleware)` from any one router makes `routeGuard.test.ts` fail (check it by hand, then restore; mention in the task notes that you did)
- [ ] `npx tsc --noEmit -p packages/backend/src/api` succeeds
- [ ] Frontend `npm test` still passes (nothing there should change)

## Notes

- 401 is only for token problems (ADR-03): the frontend logs out on 401. Every "not allowed" must be 403.
- `/api/me` is already protected; include it in the table so the guard and route tests cover it.

### Implementation notes (2026-10-05)

- **Hand-check done.** Deleted `router.use(authMiddleware)` from `CommentRoutes.ts`, ran `routeGuard.test.ts`: `DELETE /api/comments/:id → 401 without a token` failed (got 500 from the real controller reading `req.user.sub`). Restored the line; 22/22 guard tests pass.
- Guard walker finds exactly 23 routes (2 auth, health, 5 users, 4 alumni, 7 posts, 1 comments, 3 me) and probes the 20 non-public ones. Mount paths come from parsing Express 4's `layer.regexp.source`; an unparsable (non-static) mount throws rather than guessing.
- Guard test does not mock managers: auth rejects before any manager runs, and a leak would hit the real manager with the fake pool and return non-401, which still fails.
- `routes.test.ts` mock: a factory with `importOriginal` that keeps the real `AppError` and swaps each manager class for a fake whose async methods are `vi.fn()` and whose `validate*` methods are the real (pure) ones, so `POST /api/users` (AC8b, 400 on bad role) and register run real validation. Login test signs in through a fake `findUserByEmail` returning a bcrypt hash (cost 4).
- `requireRole("alumni")` on `POST /api/alumni` runs after `authMiddleware`; admin gets 403 too (gate decision).
- `UserRoutes.ts` imported `authMIddleware.js`; switched to the extensionless form used by the other routers.
- `server.ts`: checked by hand. `JWT_SECRET= npx tsx server.ts` prints the error and exits 1. The check sits after `dotenv.config`, so a secret from `.env` counts.
- Results: backend `npm test` 8 files / 208 tests; frontend 27 files / 403 tests; `tsc --noEmit -p packages/backend/src/api` clean.
- Follow-up (not done): the spec's "any signed-in user" GETs are asserted 2xx for a student only, not every role; admin-only/owner/alumni rules are covered for all roles that matter.

## Related

- Architecture: [[specs/2026-10/m/REQ-003-backend-route-auth/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-002-1-401-only-if-token-matches|L-REQ-002-1]]
