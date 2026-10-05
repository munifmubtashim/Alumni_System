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

## CAND-013 [review-qual]
**Claim:** Add `exclude: **/*.test.ts` to every sub-package tsconfig the moment a test runner lands, not just the one that emits dist.
**Saw it in:** `packages/backend/src/api/tsconfig.json:7`
**Context:** Only businessLogic's tsconfig was updated in REQ-003; api and dal still include tests.

## CAND-014 [review-qual]
**Claim:** Write the API error-body shape into conventions.md; otherwise half-migrated controllers mix `{message}` and `{error}`.
**Saw it in:** `packages/backend/src/api/controllers/AlumniController.ts:35`
**Context:** Touched handlers use `{message}`, untouched siblings in the same file use `{error}`.

## CAND-015 [review-qual]
**Claim:** Extract a shared `sendError(res, err)` helper before copying an AppError catch block into a second controller.
**Saw it in:** `packages/backend/src/api/controllers/PostController.ts:6`
**Context:** One controller got a helper; five other controller sites inline the same block.

## CAND-016 [review-qual]
**Claim:** A route-guard test that derives routes from the app makes a hand-written per-route list redundant; keep hand lists only for role cases.
**Saw it in:** `packages/backend/src/api/routes/routes.test.ts:1156`
**Context:** `PROTECTED` repeats what `routeGuard.test.ts` enumerates.

## CAND-013 [review-arch]
**Claim:** Hash passwords in one layer only (the Manager), never split between controller and manager.
**Saw it in:** `packages/backend/src/api/controllers/UserController.ts:35`
**Context:** register/createUser hash in the controller, changeMyPassword hashes in UserManager.

## CAND-014 [review-arch]
**Claim:** When tests alias a compiled workspace package to source, add a typecheck/build step so signature changes across the boundary are still caught.
**Saw it in:** `packages/backend/vitest.config.ts:8`
**Context:** Vitest does not type-check and the alias hides a stale `dist/`.

## CAND-015 [review-arch]
**Claim:** Deferring a shared error middleware still needs one shared helper, or each REQ adds another copy of the AppError mapping.
**Saw it in:** `packages/backend/src/api/controllers/PostController.ts:6`
**Context:** Three controllers now map AppError three different ways, with two body shapes (`error` vs `message`).

(reflector, review-reflect: cap of 12 already reached by implement-task; 4 more not listed: G02 rewrite for root-hoisted vitest; share `isUniqueViolation` across Managers; one `sendError` for all controllers before the error-middleware REQ; ownership rule wording "owner-or-admin" differs per entity)

## CAND-020 [review-corr]
**Claim:** When locking down a router, also route every handler's "not found" and bad-id path through AppError; auth work leaves old catch blocks that leak pg text.
**Saw it in:** `packages/backend/src/api/controllers/UserController.ts` (`findUserById`, `deleteUser`)
**Context:** Handlers untouched by the auth change still return 200/empty for a missing row and raw pg messages for NaN ids.

## CAND-021 [review-corr]
**Claim:** Cast request-body fields only after a validator; `as string | undefined` lets non-strings and omitted fields reach SQL as JSON or NULL.
**Saw it in:** `packages/backend/src/businessLogic/src/PostManager.ts` (`updatePost`)
**Context:** Full-replace UPDATE wipes any field the client omits.

## CAND-022 [review-arch]
**Claim:** When a package starts importing a third-party library, declare it in that package's own package.json, not only the repo root.
**Saw it in:** `packages/backend/src/businessLogic/src/UserManager.ts:1`
**Context:** bcrypt moved into businessLogic but is declared only in root package.json; hoisting hides it.

## CAND-022 [review-reflect]
**Claim:** Vitest strips types without checking them; give any package tested through a source alias a `typecheck` script that includes tests and uses the same alias.
**Saw it in:** `packages/backend/tsconfig.test.json`, `packages/backend/package.json` (`typecheck`)
**Context:** Round 2 added it after round 1 changed manager signatures with a green suite and no type check.
