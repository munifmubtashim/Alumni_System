# Component — backend (`packages/backend`)

| Field | Value |
|---|---|
| Path | `packages/backend` (`src/api`, `src/businessLogic`, `src/dal`) |
| Owner | munifmubtashim |
| Status | current as of REQ-005 (2026-10-06) |

Express 4 + Postgres API in three npm workspaces that form one pipeline: routes → controllers (`@alumni/api`) → `*Manager` (`@alumni/businesslogic`, consumed from its compiled `dist/`) → `*Query` (`@alumni/dal`, raw parameterized `pg`). Since [[REQ-003]], every route except login, register and health needs a token, and the backend has its own test suite.

## Structure

- `src/api/` — `app.ts` mounts routers under `/api/*`; `server.ts` refuses to start without `JWT_SECRET`. `routes/*Routes.ts`: each non-auth router starts with `router.use(authMiddleware)`; `requireRole("admin")` on `GET`/`POST /api/users` and `DELETE /api/users/:id`, `requireRole("alumni")` on `POST /api/alumni`. `controllers/*Controller.ts` are function exports. Every catch calls `controllers/sendError.ts` (`MeController` still has its own copy). `Middleware/authMIddleware.ts` (mixed-case filename) and `roleMiddleware.ts` (401 when no user, 403 for a wrong role).
- `src/businessLogic/src/` — one `*Manager` per domain. Ownership lives here: `PostManager`/`CommentManager` are owner-or-admin; `updateOwnUser`/`updateOwnAlumni` are owner-only. `UserManager` owns hashing and the login check (`verifyLogin`). `validation.ts` (`requireId` → 404 for bad ids, [[knowledge/gotchas#^g14|G14]]) and `errors.ts` (`AppError`, `isUniqueViolation`, `isForeignKeyViolation`). Rebuild with `tsc` before trusting the running API.
- `src/dal/` — `config/db.ts` (one `pg.Pool`; connection check at import time), `query/*Query.ts` (all SQL; user reads select `PUBLIC_USER_COLUMNS`, never the password, except `findUserByEmail` for login), `dto/`.
- Tests ([[architecture/adr-05-backend-tests-vitest-supertest|ADR-05]]): `vitest.config.ts` (aliases `@alumni/businesslogic` to source), `src/test/setup.ts` (pool mock, [[knowledge/gotchas#^g13|G13]]), `src/test/expectAppError.ts`, `src/api/test/{authHelpers,routeList}.ts`, `routes/routeGuard.test.ts` (fails on any unprotected route). `npm test` and `npm run typecheck` (includes tests via `tsconfig.test.json`) inside `packages/backend`; `test:backend` / `typecheck:backend` from the root.

- **Lists (REQ-005):** `GET /api/alumni` takes `q`, `department`, `university`, `graduationYear`, `page`, `pageSize` and answers `{ items, total }`. `parseAlumniSearch` (validation.ts) checks single values and limits → `AppError(400)`; `AlumniQuery.searchAlumni` builds its WHERE from fixed fragments with bound params, escapes LIKE input with `escapeLike` ([[knowledge/gotchas#^g21|G21]]), orders by name then id, and counts with a separate query ([[knowledge/lessons/LESSON-REQ-005-1-paged-list-endpoints|L-REQ-005-1]]). Search types live in `dal/dto/AlumniSearchDTO.ts`.

## Decisions and rules

- Status codes: 401 = token problem only (the frontend logs out on it — [[architecture/adr-03-frontend-session-and-401-handling|ADR-03]]); 403 = not allowed; 404 = missing or malformed id; 409 = conflict (duplicate profile, user still has posts).
- Error bodies are always `{ message }`; unexpected errors give a generic 500 ([[knowledge/lessons/LESSON-REQ-003-3-migrate-every-handler-in-a-touched-file|L-REQ-003-3]]).
- Protect at the router, prove with the route walker ([[knowledge/lessons/LESSON-REQ-003-2-protect-at-router-prove-with-walker|L-REQ-003-2]]).
- Tests mock one boundary per level, partially ([[knowledge/lessons/LESSON-REQ-003-1-partial-mocks-of-workspace-packages|L-REQ-003-1]], [[knowledge/lessons/LESSON-REQ-003-4-source-alias-needs-typecheck|L-REQ-003-4]]).
- Not yet: controllers as classes + one Express error middleware (redesign convention); token revocation (role is trusted from the JWT for up to 1 hour).

## Gotchas

[[knowledge/gotchas#^g02|G02]] vitest hoisting · [[knowledge/gotchas#^g13|G13]] pool mock path · [[knowledge/gotchas#^g14|G14]] requireId → 404 · [[knowledge/gotchas#^g15|G15]] schema only in backups · [[knowledge/gotchas#^g16|G16]] packet excludes · [[knowledge/gotchas#^g21|G21]] LIKE escaping · [[knowledge/gotchas#^g22|G22]] BaseDTO file name · [[knowledge/gotchas#^g23|G23]] NUL → 400 · [[knowledge/gotchas#^g24|G24]] TestManager sweep

## Touched by

- [[REQ-003]] — auth on every non-public route, post ownership, partial post update, shared sendError, first backend test suite (ADR-05)
- [[REQ-005]] — search, filters and paging for `GET /api/alumni`; NUL check in `optionalText`; `graduation_year` typed as a number on list types
- [[REQ-009]] — `PUT /api/comments/:id` (owner or admin, content only, one CTE), `author_alumni_id` on posts and comments (scalar subquery), `GET /api/posts` ordered by `created_at DESC, id DESC`
