## CAND-001 [implement-task]
**Claim:** After adding vitest to a second workspace, run that workspace's tests before trusting `npm ls`; if `@vitest/mocker` sits at the root without `vite`, delete the vite/vitest/@vitest lock entries and reinstall.
**Saw it in:** `package-lock.json` (`node_modules/@vitest/mocker`)
**Context:** G02 recurred on `npm install -D vitest --workspace=packages/backend`; frontend tests still passed, only the backend run failed. Consider widening G02's "Where" to any workspace install.

## CAND-002 [implement-task]
**Claim:** Mock the pg pool by the resolved source path (`vi.mock('../dal/config/db.ts')` from the setup file); it covers both `../config/db` and `../config/db.js` importers.
**Saw it in:** `packages/backend/src/test/setup.ts:6`, `packages/backend/src/dal/query/AlumniQuery.ts:1`
**Context:** AlumniQuery imports without `.js`, the other queries with it; one mock caught both.

## CAND-003 [implement-task]
**Claim:** A silent backend test run proves the pool mock applied: `db.ts` logs on connection success and on failure, so any DB log line means a real Pool was built.
**Saw it in:** `packages/backend/src/dal/config/db.ts:21`
**Context:** Useful check for the "no connection-error log" acceptance without stopping Postgres.


## CAND-004 [implement-task]
**Claim:** Exclude `*.test.ts` from the businessLogic tsconfig; `tsc` there emits co-located tests into `dist/`.
**Saw it in:** `packages/backend/src/businessLogic/tsconfig.json:8` (`include: ["src/**/*"]`)
**Context:** Building after adding `PostManager.test.ts` produced `dist/PostManager.test.js`; dist is git-ignored, so it is noise, not breakage.

## CAND-005 [implement-task]
**Claim:** `requireId` answers 404 for a malformed id, not 400; write tests and specs to match.
**Saw it in:** `packages/backend/src/businessLogic/src/validation.ts` (`requireId`)
**Context:** TASK-002 asked for "bad id → 400" while also mandating `requireId`; the two disagree.

## CAND-006 [implement-task]
**Claim:** To fake one dal Query class, spread `importOriginal()` and swap the class; keep real DTOs.
**Saw it in:** `packages/backend/src/businessLogic/src/PostManager.test.ts:14`
**Context:** Safe because setup.ts mocks the pool. With `restoreMocks`, reset `vi.hoisted` fns in `beforeEach` yourself.

## CAND-007 [implement-task]
**Claim:** `tsc` in businessLogic compiles `*.test.ts` into `dist/`; exclude tests in its tsconfig before tests multiply.
**Saw it in:** `packages/backend/src/businessLogic/tsconfig.json:7` (`include: ["src/**/*"]`)
**Context:** After TASK-002/003, `dist/` holds `*.test.js` that import vitest. Harmless today (dist is git-ignored), but it ships test code in the build.

## CAND-008 [implement-task]
**Claim:** To fake a dal query class but keep its DTOs real, use a `vi.mock('@alumni/dal', importOriginal)` factory, not automock.
**Saw it in:** `packages/backend/src/businessLogic/src/AlumniManager.test.ts:5`
**Context:** Automock also mocks DTO classes like `AlumniDTO`, whose constructor sets the fields, so the row a manager builds comes out empty.

## CAND-009 [implement-task]
**Claim:** The alumni table has `UNIQUE (user_id)`, so a "one profile per user" pre-check also needs a 23505 → 409 catch for races.
**Saw it in:** `packages/backend/src/businessLogic/src/AlumniManager.ts:31`
**Context:** The constraint shows only in `db/backups/*.sql` (alumni_profile_user_id_key), not in `db/migrations/`, so it is easy to miss.

## CAND-010 [implement-task]
**Claim:** Put `router.use(authMiddleware)` at the top of each router instead of per route, and keep `routeGuard.test.ts` green.
**Saw it in:** `packages/backend/src/api/routes/routeGuard.test.ts:1`
**Context:** Removing one `router.use` line made the guard fail with a 500, not a silent pass; a per-route miss is caught the same way.

## CAND-011 [implement-task]
**Claim:** When faking managers in HTTP tests, keep the pure `validate*` methods real; a blanket automock makes validating controllers 500.
**Saw it in:** `packages/backend/src/api/routes/routes.test.ts:19`
**Context:** `createUser` and `register` call `validate*` synchronously before the manager; an automocked validator returns undefined and the controller throws.

## CAND-012 [implement-task]
**Claim:** A new top-level `app.use(...)` in `app.ts` must be added to the guard's known-middleware list on purpose, or the guard test fails.
**Saw it in:** `packages/backend/src/api/routes/routeGuard.test.ts:13`
**Context:** The walker can't probe non-route middleware, so it refuses unknown ones rather than letting them through unchecked.
