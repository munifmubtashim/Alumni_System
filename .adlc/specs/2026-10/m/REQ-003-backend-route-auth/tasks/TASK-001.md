# TASK-001 — Backend test harness

| Field | Value |
|---|---|
| REQ | REQ-003 |
| Tier | 0 |
| Status | done |
| Repo | alumni-system |
| Depends on | — |
| Blocks | TASK-002, TASK-003 |

## Goal

`npm test` in `packages/backend` runs a Vitest suite with no Postgres, and one HTTP smoke test passes against the real Express app.

## Files to touch

| Path | Action |
|---|---|
| `packages/backend/package.json` | edit — devDependencies `vitest` (same major as frontend, ^5), `supertest`, `@types/supertest`; scripts `test` (`vitest run`), `test:watch` |
| `package.json` (root) | edit — script `test:backend` → `npm test --workspace=packages/backend` |
| `packages/backend/vitest.config.ts` | create |
| `packages/backend/src/test/setup.ts` | create — global `vi.mock` of the dal pool module |
| `packages/backend/src/api/test/authHelpers.ts` | create — `tokenFor({sub, role})`, `expiredToken()`, `badSignatureToken()` |
| `packages/backend/src/api/health.test.ts` | create |
| `package-lock.json` | edit (via npm install) |

## Approach

- `vitest.config.ts`: `environment: 'node'`, `include: ['src/**/*.test.ts']`, `setupFiles: ['src/test/setup.ts']`, `restoreMocks: true`, `test.env` with `JWT_SECRET` and dummy `DB_*`. `resolve.alias`: `@alumni/businesslogic` → `src/businessLogic/src/index.ts` (absolute path). Leave `@alumni/dal` and `@alumni/api` to workspace resolution unless a mock fails to apply, then alias them too and note why.
- `setup.ts`: mock the module `dal/config/db` (match the specifier the query files actually import, `../config/db.js`, by mocking its resolved absolute path) to a default export `{ query: vi.fn(), connect: vi.fn() }`, so no test opens a connection or logs a connection error.
- Smoke test: `GET /api/health` → 200 `{status:'OK'}` via supertest on `app` imported from `src/api/app.ts`. Add a second test that `vi.mock('@alumni/businesslogic')` applies (e.g. a mocked `PostManager.prototype.getAllPosts` is called for `GET /api/posts` with a valid token from `authHelpers`; at this point the route is public, so assert only that the mock was hit). This proves the mocking path before the other tasks rely on it.
- Install with `npm install -D vitest@^5 supertest @types/supertest --workspace=packages/backend`. New dev dependencies are approved at the architect gate (ADR-05).

## Acceptance

- [ ] `cd packages/backend && npm test` passes with Postgres stopped and no connection-error log
- [ ] `npm run test:backend` at the root runs the same suite
- [ ] A mocked manager is proven to replace the real one in an HTTP test
- [ ] `npm ls vitest` shows no conflicting duplicate that breaks the frontend's `npm test` (run it to confirm)

## Notes

- Vitest 5 has no `environmentMatchGlobs` (L-REQ-001-3). The backend config is node-only, so this doesn't matter here, but don't add jsdom.
- `app.ts` calls `dotenv.config({ path: '../../.env' })` relative to cwd. dotenv does not override variables already set, so `test.env` wins.
- `UserController` reads `JWT_SECRET` at module load, so it must be in `test.env`, not set inside a test.

- **Implementation (2026-10-05).** Installed vitest 5.0.3, supertest 7.3.1, @types/supertest 7.2.1. The first install hit G02: `@vitest/mocker` was hoisted to the root with no `vite` beside it, so the backend run failed with "Cannot find package 'vite'" (the frontend still passed). Fix per G02: deleted the 9 vite/vitest/@vitest lock entries, removed those folders, `npm install`. Now one copy each of vitest, vite and @vitest/mocker lives at the root; frontend 27 files / 403 tests and backend 1 file / 2 tests pass.
- Only `@alumni/businesslogic` is aliased. `@alumni/dal` and `@alumni/api` (used by `authMIddleware.ts` as `@alumni/api/controllers/UserController`) resolve through workspace symlinks to real source paths, so Vite inlines them and mocks apply; no extra alias needed.
- The smoke test uses a plain automock `vi.mock('@alumni/businesslogic')`, which also automocks `AppError`. TASK-004 needs a real `AppError`: use a factory with `importOriginal` and keep `AppError` from the actual module.
- `authHelpers.ts` also exports `bearer(token)` (one-line convenience, not in the task file). `tsc --noEmit` in `src/api` passes with the new test files included.

## Related

- Architecture: [[specs/2026-10/m/REQ-003-backend-route-auth/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-001-3-vitest5-node-tests-in-scripts|L-REQ-001-3]], [[knowledge/lessons/LESSON-REQ-001-2-check-duplicate-react-after-major-bump|L-REQ-001-2]]
