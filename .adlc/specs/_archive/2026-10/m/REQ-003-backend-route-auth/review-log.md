# REQ-003-backend-route-auth — Review log

Full reviewer narratives. The consolidated verdict lives in `verification.md` —
read that first; come here for the long form behind a finding ID.

## Correctness findings

Written by: correctness-reviewer (tier: balanced)

**Summary:** Checked 47 files: every route's auth order, role gates, ownership checks, identity-from-token, SQL parameters, the guard test walker and JWT startup. 0 critical, 0 major, 3 minor. Auth coverage is sound: every router calls `router.use(authMiddleware)` first, `/api/health` and `/api/auth` are the only open paths, and no password column leaves the DAL. Biggest: the user controllers still turn a missing or malformed id into 200/empty or a leaked Postgres message. Dispatch questions: none given. Packet-gap: none.

### CORR-001: GET/DELETE /api/users/:id mishandle missing and malformed ids

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/api/controllers/UserController.ts:~105-125` (`findUserById`, `deleteUser`) |
| Category | error-handling |

**What:** Both handlers pass `Number(req.params.id)` straight to Postgres with no `requireId` check, and neither maps "no row" to 404.
**Why it matters:** `GET /api/users/999` answers 200 with an empty body (spec says 404 for a missing target). `DELETE /api/users/999` answers 200 "deleted". `/api/users/abc` sends `NaN` to pg, and the pg text ("invalid input syntax for type integer") is returned to the client as a 404/400 `error` string.
**Recommendation:** In `UserManager.findUserById` and `deleteUser` call `requireId(id, "User")`, throw `AppError(404)` when no row, and make the two controllers use the `AppError` mapping already used by `updateUser`.

### CORR-002: Remaining read handlers return raw error text and turn DB failures into 404

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `AlumniController.ts:~21-36` (`getAllAlumni`, `findAlumniById`), `UserController.ts` (`getAllUsers`, `findUserById`) |
| Category | security |

**What:** These catch blocks send `(error as Error).message` for any failure; `findAlumniById` and `findUserById` use status 404 for all of them.
**Why it matters:** A dropped DB connection or SQL error leaks internal text to any signed-in user, and the client sees "not found" for an outage. Shares a root cause with QUAL-001.
**Recommendation:** Same fix as CORR-001: route these through `AppError`, and answer 500 `{ message: "Something went wrong" }` for unknown errors.

### CORR-003: PUT /api/posts/:id replaces whole post and does not check field types

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/businessLogic/src/PostManager.ts:~28-37`, `PostManager.ts:createNewPost` |
| Category | input-validation |

**What:** `caption` and `media_url` are cast with `as string | undefined`, so an omitted field becomes SQL NULL on update, and a JSON object or array is passed to pg as-is.
**Why it matters:** A `PUT` with only `{ caption }` silently erases `media_url`; a non-string `caption` is stored as JSON text. Spec treats content rules as a non-goal, so this matches old behaviour, but the new owner check makes it easier to hit through a normal edit.
**Recommendation:** Use `optionalText`/`optionalWebUrl` from `validation.ts` (no new required fields), and keep the old value when a field is omitted. Or record it as accepted in the REQ.

### Round 2 re-review

Written by: correctness-reviewer (tier: balanced)

- CORR-001 (m1): **resolved.** `UserManager.findUserById`/`deleteUser` and `AlumniManager.findAlumniById` now run `requireId` and throw 404 for malformed or unknown ids; `UserQuery.deleteUser` returns `rowCount > 0`, so a missing id is 404, not a silent 200.
- CORR-002 (m2): **resolved.** All four controllers use `sendError`; the four read handlers no longer return `error.message` or turn DB failures into 404. Route tests assert 500 `{ message: "Something went wrong" }`.
- CORR-003 (m4): **still open, as decided** (follow-up REQ). Nothing in this diff touches `PostManager.updatePost` semantics.

Checked, nothing wrong: `sendError` uses `instanceof AppError` on the one class exported from `@alumni/businesslogic`, so statuses from managers are not swallowed; plain-object throws become 500 by design. `/auth/login` still uses its own handler in `AuthRoutes.ts` (not routed through `sendError`). Hashing moved into `register`/`createUser`: validation still runs first in the controller, hash happens once, plaintext never reaches the query, rounds unchanged (10); response shapes of register/createUser unchanged. `isUniqueViolation` now null-safe. Response shapes: 404/500 bodies are now `{ message }` instead of `{ error }` on the four GET/DELETE handlers (intended, tested).

### CORR-004: Id edge cases still fall to 500 (new, minor)

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/businessLogic/src/validation.ts:100`, `UserController.ts` `deleteUser` |
| Category | input-validation |

**What:** `requireId` accepts any positive integer, so `/api/users/99999999999` reaches Postgres as an out-of-range INTEGER and now returns a generic 500 (before: 404/400 with raw text). Likewise `DELETE /api/users/:id` for a user that other tables still reference would hit a foreign-key error (23503) and now returns 500.

**Why it matters:** Wrong status for a bad client input; the base `users`/`posts` schema is not in `db/migrations`, so whether posts/comments cascade on user delete is unconfirmed. Confirm with `\d posts` in psql.

**Recommendation:** Add `id > 2147483647` to the 404 test in `requireId`; in `UserManager.deleteUser` map `code === "23503"` to `AppError(409, "User still has content")` if the FK has no cascade.

### Round 3 re-review

Written by: correctness-reviewer (tier: balanced)

- **CORR-004: resolved.** `validation.ts:101-105` rejects ids above `MAX_DB_ID` (2147483647) with 404; `UserManager.deleteUser` maps pg 23503 to 409 and rethrows everything else (generic 500 via `sendError`). Boundaries: 0, -1, NaN ("12abc"), "" (Number("")=0) rejected; 2147483647 accepted; 2147483648 rejected.
- **/auth/login unchanged: checked, nothing.** `AuthRoutes.ts` is untouched. `verifyLogin` does the same two steps as the old code (lookup, then `bcrypt.compare`). An unknown email still skips bcrypt, so timing and enumeration are the same as before. A missing password with a known email still throws inside bcrypt, so it is still 500 as before. Statuses and bodies are the same (`{token}` on success, 401 `{message:"Invalid"}`). The hash is stripped before `signToken`, and the response never contained the user anyway.
- **No new findings.** Only a trivial remainder: `requireId` still accepts `"1e3"`, `"0x10"`, `" 5 "` and `"1.0"` because it uses `Number()`. They resolve to a real id, so they are harmless, not reported.

### Round 5 re-review

Written by: correctness-reviewer (tier: balanced)

- **CORR-003: resolved.** `PostManager.updatePost` builds the patch only from own keys present (omitted keeps, null clears, non-string/non-null 400, empty 400); `findOwnedPost` (404/403) runs first, so non-owners never see validation errors. Body `[]` or `{}` gives 400.
- **SQL safety: clean.** `PostQuery.updatePost` takes column names only from the fixed `POST_PATCH_COLUMNS` allowlist; every value is a `$n` parameter. Numbering: one field gives `caption=$1 ... id=$2`, two give `$1,$2 ... id=$3`; id is always last and `$${params.length}` matches. `user_id` is never in the allowlist, so admin edits keep the author. Extra body keys are ignored.
- **NEW CORR-005 (trivial): post deleted between check and update gives 200 with an empty body.** `rows[0]` is undefined, so `res.json(undefined)` sends no JSON. It is a rare race, harmless. A 404 is cheap: in `PostManager.updatePost`, `const updated = await ...; if (!updated) throw new AppError(404, "Post not found")`. Worth the one line, not a blocker.
- No other new issues. No new lesson candidates.

## Quality findings

Written by: quality-reviewer (tier: balanced)

**Summary:** Reviewed 47 files (packet diff; conventions.md; api/dal tsconfigs). 0 critical, 0 major, 5 minor, 1 trivial. Biggest: error-response shape is still mixed inside the same controller files, and there is no documented rule for it. Dispatch questions: none given. Packet-gap: none.

### QUAL-001: Mixed error body shape ({message} vs {error}) in the same controllers

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/api/controllers/AlumniController.ts:35,45`, `UserController.ts:98,106,115,123` |
| Category | convention |
| Rule | conventions.md "API conventions → Response format" (still an empty template); CLAUDE.md "One shared error middleware" |

**What:** Touched handlers (`createAlumni`, `createUser`, `updateUser`, Post*) answer `{ message }`, but untouched siblings in the same file (`getAllAlumni`, `findAlumniById`, `findUserById`, `deleteUser`) still answer `{ error }`. `findUserById`/`findAlumniById` map every failure (including DB errors) to 404; `deleteUser` maps everything to 400.
**Why it matters:** The client needs two parsers. A DB outage on `GET /users/:id` looks like "not found".
**Recommendation:** Write the response format into conventions.md (convention-gap) and move the four leftovers onto `AppError`/`{message}` in the same pass, or log it for the error-middleware REQ.

### QUAL-002: Error-to-HTTP mapping copied into every controller

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `PostController.ts:6-11` (helper), `AlumniController.ts:12-17`, `UserController.ts:32-37,62-67,85-90` (inline copies) |
| Category | duplication |

**What:** `sendError` exists only in PostController; the same `instanceof AppError` / 500 block is pasted five more times.
**Why it matters:** One more status or log rule means editing six places. Non-goals defer the shared middleware, but the helper is free now.
**Recommendation:** Move `sendError` to `api/controllers/sendError.ts` and use it in all three controllers, until the middleware REQ replaces it.

### QUAL-003: api and dal tsconfigs do not exclude test files

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/api/tsconfig.json`, `src/dal/tsconfig.json` (include `./**/*`) |
| Category | convention |

**What:** Only `businessLogic/tsconfig.json` got `"**/*.test.ts"` in `exclude`. `api` and `dal` still include `*.test.ts`, `api/test/authHelpers.ts` and would emit them to `dist/` on `tsc`.
**Why it matters:** The three sibling configs now disagree, and a `tsc` in api/dal type-checks or emits tests that need vitest types.
**Recommendation:** Add the same exclude to both, or note in conventions.md why they differ.

### QUAL-004: Test gaps on new/changed behavior

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `dal/query/AlumniQuery.ts:30` (`findAlumniByUserId`), `routes/routes.test.ts:1307-1341` |
| Category | test-coverage |

**What:** (a) `findAlumniByUserId` has no Query test, though 409 logic depends on it; ADR-05 promises a SQL-shape test per Query. (b) The "any signed-in user" block asserts only 2xx, so a route that ignored the token's id would still pass (only posts and alumni create check identity). (c) `AlumniManager.getAllAlumni` and `updateOwnAlumni` (ownership, 403/404) have no manager unit test; PostManager has the full set.
**Why it matters:** Ownership for alumni/users rests only on the mocked-manager route test, which proves nothing about the rule.
**Recommendation:** Add `AlumniQuery.test.ts` for `findAlumniByUserId`, and ownership cases (403, 404, bad id) for `updateOwnAlumni` and `updateOwnUser`.

### QUAL-005: Two near-identical route lists and two helpers named expectAppError

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `routes/routes.test.ts:1156-1177` vs `routes/routeGuard.test.ts:1024`; `PostManager.test.ts:1732` vs `UserManager.test.ts:2027` |
| Category | duplication |

**What:** `PROTECTED` hand-lists the routes that `routeGuard.test` already derives from the app. `expectAppError` is written twice (async and sync) with different bodies.
**Why it matters:** Adding a route means editing the hand list too; the "no token → 401" case is run twice per route. Same-named helpers with different semantics invite misuse.
**Recommendation:** Keep `PROTECTED` only for the per-route role and expiry cases and drop the overlap, or export the walker. Move `expectAppError` into one shared test helper, or use `expect(...).rejects.toMatchObject({status})` as AlumniManager.test does.

### QUAL-006: Debug and dead leftovers (trivial)

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `UserController.ts:97-100` (stray blank lines), `businessLogic/TestManager.ts` (commented-out code), `AlumniManager.ts:52` / `AlumniQuery.ts:62` (`getAllAlumnil` typo), `PostQuery.test.ts:2` vs `UserQuery.test.ts:2` (`../config/db` vs `db.js`) |
| Category | dead-code |

**What:** Pre-existing in untouched lines, listed because this REQ edited those files and deleted two lines from TestManager. `server.ts` uses `console.log/error`; the logging convention is an empty template, so not enforced.
**Recommendation:** Fix the `getAllAlumnil` name while the file is open; leave the rest unless wanted. (1 more trivial not listed.)


### Round 2 re-review

Written by: quality-reviewer (tier: balanced). Packet-gap: none. Round 2 result: 6 of 6 resolved, 2 new trivials, 0 new minor or higher.

- **QUAL-001: resolved.** All four leftover handlers now call `sendError` (`AlumniController.ts:25,31`, `UserController.ts:64,74`); `routes.test.ts` "error bodies" block pins `{ message }` for 404 and for a DB failure (generic 500). The conventions.md "Response format" text is still an empty template; that is the decided wrap-up item (m10/m11), not code.
- **QUAL-002: resolved.** One `api/controllers/sendError.ts`, used by all four controllers, with its own test (AppError, plain Error, look-alike object). No inline copies left.
- **QUAL-003: resolved.** api and dal tsconfigs both exclude `**/*.test.ts` and `**/test/**`; `tsconfig.test.json` plus `typecheck` / `typecheck:backend` scripts type-check the tests that the build configs skip.
- **QUAL-004: resolved.** `AlumniQuery.test.ts` added; `AlumniManager.test.ts` covers findAlumniById and updateOwnAlumni (owner, other user, admin, 404, bad id, bad field); `routes.test.ts` IDENTITY table asserts the token's id reaches the manager on five routes.
- **QUAL-005: resolved.** `PROTECTED` is derived from `api/test/routeList.ts`; the duplicate no-token case is dropped with a comment pointing at routeGuard.test; one shared `src/test/expectAppError.ts`.
- **QUAL-006: resolved.** No `getAllAlumnil` left in `src`; blank lines gone; `PostQuery.test.ts:2` now matches the others. The commented-out code in `TestManager.ts` stays (pre-existing, scratch file; was marked optional).

### QUAL-007: Two assertion styles for AppError in AlumniManager.test (trivial)

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `businessLogic/src/AlumniManager.test.ts:1005,1012,1020` vs `:1081-1103` |
| Category | convention |

**What:** The older createAlumni tests use `rejects.toMatchObject({ status })`; the new updateOwnAlumni tests use `expectAppError`. The old style also passes for any object with a `status`, not only a real AppError.
**Recommendation:** Switch the three older cases to `expectAppError` when the file is next touched. Not worth its own pass.

### QUAL-008: Shared test helper reaches into another package by relative path (trivial)

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/backend/src/test/expectAppError.ts:2` |
| Category | convention |
| Rule | CLAUDE.md "never by relative path across package boundaries" |

**What:** The helper imports `AppError` from `../businessLogic/src/errors`, while `routes.test.ts` gets the same class through `@alumni/businesslogic`. Both resolve to one file under Vitest today, so it works. If `vitest.config.ts` aliasing ever changes, `instanceof` could split across two copies.
**Recommendation:** Import from `@alumni/businesslogic` (already aliased to source for tests and in `tsconfig.test.json`).

Follow-up (one line, no finding): `MeController`'s own `sendError` copy should switch to the shared one when that file is next edited.

### Round 3 re-review

Written by: quality-reviewer (tier: balanced). Packet-gap: none (read `src/test/expectAppError.ts` and `UserManager.ts` directly; the helper was not in the diff). Round 3 result: 2 of 2 resolved, 0 new minor or higher, 1 new trivial.

- **QUAL-007: resolved.** `AlumniManager.test.ts:42,49,~56` now use `expectAppError`; no `rejects.toMatchObject({ status })` left in that file.
- **QUAL-008: resolved.** `src/test/expectAppError.ts:2` imports `AppError` from `@alumni/businesslogic`; no relative cross-package import remains.
- New tests checked, fine: `verifyLogin` (right password with no hash returned, wrong password, unknown email), `requireId` bounds (`2147483648`, `99999999999` in the malformed-id table), `deleteUser` 409 (status and message) plus pass-through of other errors, and the `routes.test.ts` login pair (200 token, `verifyLogin` null gives 401 `{ message: 'Invalid' }`). Docs (CLAUDE.md, conventions.md) match the code.

### QUAL-009: UserManager.test.ts still mixes assertion styles (trivial, new)

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `businessLogic/src/UserManager.test.ts:56,~90,~95` vs `:105` |
| Category | convention |

**What:** Older cases use `rejects.toMatchObject({ status })`; the new FK case uses `expectAppError`. Same split QUAL-007 fixed in AlumniManager. Also the id upper bound is tested only just above (`2147483648`); the accepted maximum `2147483647` has no case.
**Recommendation:** Switch when the file is next touched; optionally add `'2147483647'` as a valid-id case.

### Round 5 re-review

Written by: quality-reviewer (tier: balanced). Packet-gap: none. Round 5 result: AC14 implemented and covered; 0 minor or higher, 4 trivial.

- **QUAL-010 (trivial):** `PostManager.updatePost` and `PostQuery.updatePost` each hand-roll `hasOwnProperty.call` over the same two column names, and the manager has the error label inline (`key === "caption" ? "Caption" : "Media URL"`). A `PostPatch` type exists in the dal but the manager redeclares the shape inline; import or reuse it. The "must be text or null" check has no helper in `validation.ts`; an `optionalNullableText` there would match the existing helpers.
- **QUAL-011 (trivial):** `PostQuery.updatePost` has no guard for an empty patch (would emit `SET updated_at=NOW()`). Safe today because the manager rejects it, but one dal test for that case would document it.
- **QUAL-012 (trivial):** Test gaps. No case for `null` on both fields together or for `undefined` explicit value (`{caption: undefined}` passes `hasOwnProperty`, then is rejected as non-string 400 - fine, but untested). The 404 and 403 order tests use `{caption: 5}` only for 404; fine. `PostQuery.test.ts` imports `'../config/db.js'` while `PostManager.test.ts` imports without `.js`; harmless mix.
- Good: reuses `expectAppError` and checks `error.message` for "Nothing to update"; the SQL test asserts parameters, not just text, and covers the injection and `user_id` allowlist case.

## Architecture findings

Written by: architecture-reviewer (tier: balanced), dispatched sub-agent.

**Summary:** Checked 47 changed files (routes, 5 controllers, 4 managers, 3 query classes, tests, config, docs) against ADR-05, the layering rules and the REQ architecture. Findings: 0 critical, 0 major, 3 minor, 1 trivial. Layering and the "auth once per router" pattern are sound. The biggest issue is that password hashing is split between controllers and managers, and that will spread. Dispatch questions: none given.

### ARCH-001: Password hashing lives in controllers for create paths, in the manager for change-password

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/api/controllers/UserController.ts:35,45` (vs `businessLogic/src/UserManager.ts:308`) |
| Category | separation |
| Rule broken | Layering rule in CLAUDE.md: Managers hold business rules, controllers parse req/res |

**What:** `register` and `createUser` call `bcrypt.hash` in the controller and pass `passwordHash` down. `changeMyPassword` hashes inside the manager. Two rules for one concern.
**Why it matters:** The next password path (reset, admin set-password) will copy whichever it sees first. Controllers also keep a bcrypt and jwt dependency that the layering says they should not need.
**Recommendation:** Pick one home. Either move hashing into `UserManager.register`/`createUser` (take the plain password), or document "controller hashes" and move it out of `changeMyPassword`. REQ-003 touched `createUser`, so this is the cheap moment.
**References:** `.adlc/context/architecture.md` layering; CLAUDE.md "Backend: strict layered pipeline".

### ARCH-002: New AppError-to-HTTP mapping is copied into every controller

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `PostController.ts:6-11`, `AlumniController.ts:16-20`, `UserController.ts:50-55,80-84` |
| Category | pattern |
| Rule broken | CLAUDE.md Conventions (redesign): "One shared error middleware; no per-method try/catch for HTTP mapping" |

**What:** This REQ adds a local `sendError` in PostController and inline `instanceof AppError` blocks in Alumni and User controllers. Untouched handlers in the same files still answer `{ error: ... }` with 400/404/500, while new ones answer `{ message: ... }`.
**Why it matters:** One API now has two error body shapes, and a 404 from `findUserById` hides real DB errors. The spec lists the shared middleware as a non-goal, so this is a known debt, but the copies raise the cost of the follow-up REQ.
**Recommendation:** Keep deferring, but put one exported `sendAppError(res, error)` in `api/` (or start the error middleware) so the follow-up is one swap. Record the `{error}` vs `{message}` split as known drift.
**References:** CLAUDE.md "Conventions (redesign) > Backend"; REQ-003 non-goals.

### ARCH-003: Tests pass against source but nothing checks the compiled `dist/` or types

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/vitest.config.ts:8-12`, `packages/backend/package.json:6-9` |
| Category | test-arch |
| Rule broken | ADR-05 consequences (accepted trade-off), CLAUDE.md "Rebuilding businessLogic/dal" |

**What:** The alias runs tests on `businessLogic` source, and Vitest does not type-check. The controllers now call managers with new signatures (`createAlumni(userId, body)`, `updatePost(requester, id, body)`). A stale `dist/` or a type mismatch gives a green suite and a broken running API.
**Why it matters:** This REQ changed manager signatures across the package boundary, the exact case the dist rule warns about. Docs say so, but nothing enforces it.
**Recommendation:** Add a backend `typecheck` script (`tsc --noEmit` for api, plus `tsc` for businessLogic) and mention it in the Backend test section. Also `api/` and `dal/` tsconfigs still include `**/*.test.ts` (businessLogic's now excludes them), so a build would emit test files into `dist`; exclude them the same way.
**References:** [[architecture/adr-05-backend-tests-vitest-supertest]], tsconfig diff at `businessLogic/tsconfig.json:9`.

### ARCH-004: Two hand-kept route lists plus a magic route count

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `api/routes/routeGuard.test.ts:1069`, `api/routes/routes.test.ts:1156` |
| Category | test-arch |
| Rule broken | ADR-05 "new routes get an automatic check" |

**What:** `routes.test.ts` keeps its own `PROTECTED` list while `routeGuard.test.ts` walks the app; the guard also hard-codes `>= 23`. A new route must be added to the first by hand and bumps the second. The guard proves "401 without token" only; a missing `requireRole` on a new admin route is not caught.
**Recommendation:** Derive `PROTECTED` from the walker (export it from a test helper) and note in the conventions that role gates are checked only by the hand-listed `ADMIN_ONLY` table.
**References:** ADR-05.

**Packet-gap:** none (read `app.ts` and the api/dal tsconfigs, which are off-diff collaborators).


### Round 2 re-review

Round-1 status:
- ARCH-001 (hashing split): resolved for register/createUser. `UserManager.ts:72,145` now hash; controller calls `register(input)` / `createUser(input)`. Residue: `UserController.ts` still imports bcrypt for `login()` (compare), so the controller keeps a bcrypt dependency (see ARCH-005).
- ARCH-002 (copied error mapping): resolved. One `api/controllers/sendError.ts`, used by all four controllers; the `{error}` bodies are gone and `routes.test.ts` asserts `{ message }`. Swap point for the error-middleware REQ is now one file.
- ARCH-003 (no typecheck, tests in build): resolved. `typecheck` script in `packages/backend/package.json`, `typecheck:backend` at the root, and api/dal tsconfigs exclude `**/*.test.ts` and `**/test/**`.
- ARCH-004 (hand-kept route lists): resolved. `api/test/routeList.ts` walks the app; `routes.test.ts` PROTECTED is derived from it. The `>=23` and `>=20` floors remain as sanity checks, which is acceptable.

### ARCH-005: bcrypt used in businessLogic but declared only at the repo root

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/businessLogic/package.json:6-14` (imports at `UserManager.ts:1`) |
| Category | layering |
| Rule broken | CLAUDE.md "Backend: strict layered pipeline": each sub-package is its own workspace and imports via declared names |

**What:** `UserManager` now imports `bcrypt`, but `@alumni/businesslogic` does not list `bcrypt` or `@types/bcrypt`; both sit only in the root `package.json`. It works through npm hoisting.
**Why it matters:** The package that owns the dependency does not declare it, so a filtered install (`npm ci -w`, a Docker build of one workspace) can fail, and `tsc` for businessLogic depends on the root's `@types`.
**Recommendation:** Add `"bcrypt": "^6.0.0"` to `dependencies` and `"@types/bcrypt": "^6.0.0"` to `devDependencies` of businessLogic. Then drop `bcrypt` from the controller by moving `login()`'s compare into `UserManager` (e.g. `authenticate(email, password)`), so hashing and comparing live in one layer. JWT signing can stay in the API layer.
**References:** CLAUDE.md "Backend: strict layered pipeline"; ARCH-001.

### ARCH-006: Path alias for `@alumni/businesslogic` is now written twice (trivial)

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/backend/tsconfig.test.json:9-11`, `packages/backend/vitest.config.ts:8-13` |
| Category | test-arch |
| Rule broken | ADR-05 (one test setup) |

**What:** The alias points to the same source file in both files; the comment says "mirrors", and both are correct today. Nothing enforces that they stay equal.
**Recommendation:** Leave as is; the typecheck script fails loudly if they drift to a missing path. Shared helpers (`src/test/expectAppError.ts`, `api/test/routeList.ts`) are placed sensibly; the only oddity is `expectAppError.ts` importing `../businessLogic/src/errors` by relative path across a workspace boundary, which is test-only and excluded from builds, so acceptable. `sendError.ts` placement in `api/controllers/` is correct (HTTP concern, imports only the public `AppError`).

### Round 3 re-review

- ARCH-005: resolved. `businessLogic/package.json` now declares `bcrypt ^6.0.0` and `@types/bcrypt ^6.0.0`; `UserManager.verifyLogin` (`UserManager.ts:~89`) owns the compare; `UserController.ts` has no bcrypt import (grep: only `UserManager.ts` and its test import it).
- No new architecture issue. `verifyLogin` sits in the right layer; returning `Omit<UserDTO,"password">` keeps the hash out of the controller. `MAX_DB_ID` in `validation.ts` next to `requireId` (its only user) is the right home. `BCRYPT_ROUNDS` replaces the magic 10.
- ARCH-007 (trivial, optional): `bcrypt` and `@types/bcrypt` are still in the root `package.json` (lines 16, 22), now duplicates of the businessLogic declaration. Nothing else needs them; drop them at wrap-up if convenient.

**Packet-gap:** the packet cut off before `UserManager.ts` (diff page 1 ended in routes.test.ts); read the diff via git. 

## Reflection findings

Written by: reflector (tier: balanced), dispatched sub-agent.

**Summary:** Checked 16 lessons (0 superseded), 12 gotchas, 5 accepted ADRs, 2 concepts, 2 component pages, and the two Mermaid diagrams in architecture.md. 6 findings: 0 critical, 1 major, 4 minor, 1 trivial. Biggest: gotcha G02 is now wrong (vite/vitest sit in the root `node_modules`, not under `packages/frontend`), so the vault must be corrected at wrapup. No ADR conflicts and no repeated lesson mistakes: 401 is token-only everywhere (ADR-03 / L-REQ-002-1), and ADR-05 matches the code. Docs likely affected: removed routes `GET /api/users/email/:email`, `PUT /api/users/:id/login|logout`, `GET /api/alumni/email/:email`.
**Dispatch questions:** vault references in exploration.md: checked, nothing missed. Re-derived knowledge: REFL-002, REFL-003. **Packet-gap:** none.

### REFL-001: Gotcha G02 no longer matches the lockfile

| Field | Value |
|---|---|
| Severity | major |
| Effort | small |
| File | `package-lock.json` (`node_modules/vitest`, `node_modules/vite`, `node_modules/@vitest/mocker`) |
| Category | vault-stale |
| Vault reference | [[knowledge/gotchas#^g02\|G02]] |

**What:** G02 says vite/vitest install under `packages/frontend/node_modules` because root `@types/node@20` forces it. After adding vitest to `packages/backend`, the lock has them at the root and no `packages/frontend/node_modules/vite*` entries.
**Why it matters:** The next person who hits a vitest install problem follows a "delete the entries under packages/frontend" recipe that points at nothing. CAND-001 already shows G02 recurring.
**Recommendation:** At wrapup, rewrite G02's What/Where/Don't for the current layout (root-hoisted, two workspaces use vitest) and keep the "don't hand-edit the lock; delete the vite/vitest/@vitest entries and reinstall" advice. User decides: revise or supersede.

### REFL-002: Duplicate-email check (23505) written twice

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/businessLogic/src/AlumniManager.ts:31` |
| Category | re-derivation |
| Vault reference | [[knowledge/components/backend]] (no concept page covers it) |

**What:** `UserManager.ts:33` defines `isUniqueViolation`; `AlumniManager` re-types the same `code === "23505"` cast inline.
**Why it matters:** A third Manager will copy it again; the Postgres code lives in three places.
**Recommendation:** Move `isUniqueViolation` into `validation.ts` or `errors.ts` and import it in both Managers. Or note the pattern in the backend component page.

### REFL-003: AppError-to-HTTP mapping copied into five controllers

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `PostController.ts:7`, `UserController.ts` (3 copies), `AlumniController.ts` (2 copies), `CommentController.ts:7` |
| Category | re-derivation |
| Vault reference | CLAUDE.md "Conventions (redesign) / Backend" (one shared error middleware) |

**What:** `PostController` copies `CommentController`'s `sendError`; User and Alumni controllers inline the same `instanceof AppError` block. The shared error middleware is a stated non-goal, and architecture.md records the deviation on purpose.
**Why it matters:** Not a bug. The cost is that the later middleware REQ must edit every copy, and the 400-vs-500 behavior already differs: `deleteUser` and `getAllAlumni` still send raw `error.message`.
**Recommendation:** Keep as is for this REQ. At wrapup, record the follow-up (shared `sendError` or the middleware REQ) on the backend component page.

### REFL-004: Backend component page is a stub; index.md lacks ADR-05 and the backend row

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/knowledge/components/backend.md`, `.adlc/index.md:29` |
| Category | missing-vault-page |
| Vault reference | [[knowledge/lessons/LESSON-REQ-002-6-docs-task-lists-every-folder-readme\|L-REQ-002-6]] |

**What:** `backend.md` says "stub, /wrapup fills it in". `index.md` ADR table stops at ADR-04 and has no backend component row. `decisions.md` was updated.
**Why it matters:** This is the exact drift L-REQ-002-6 warns about, though wrapup normally closes it.
**Recommendation:** At wrapup, fill `backend.md` (layers, auth wiring, test levels, guard test, `dist/` stale-build rule), add the ADR-05 row and the backend component row to `index.md`, and consider a `backend-route-auth` concept page. Needs-decision, not a fix round.

### REFL-005: architecture.md flowchart shows only an admin gate

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | REQ-003 `architecture.md` (request-flow Mermaid) |
| Category | diagram-stale |
| Vault reference | [[architecture/adr-05-backend-tests-vitest-supertest]] |

**What:** The diagram's role node reads "admin-only route?". `AlumniRoutes.ts` also gates `POST /api/alumni` with `requireRole("alumni")`, a gate added at the architect gate. The blast-radius row for AlumniRoutes omits it too.
**Recommendation:** Relabel the node "role-gated route?" and add "requireRole(alumni)" to the AlumniRoutes row. Needs-decision at wrapup.

### REFL-006: "Owner-or-admin" is stated more broadly than the code does it

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `.adlc/context/conventions.md` (Auth bullet "Ownership checks"), `CLAUDE.md` backend bullet; `health.test.ts:7` |
| Category | concept-drift |
| Vault reference | `.adlc/context/conventions.md` Testing / Backend |

**What:** Docs say ownership checks are owner-or-admin. Only `PostManager` and `CommentManager` do that. `updateOwnUser` and `updateOwnAlumni` are owner-only (no admin bypass), matching the spec table. Also, `health.test.ts` uses a bare `vi.mock('@alumni/businesslogic')`, which the conventions say replaces `AppError` too. It is harmless there because only `getAllPosts` is called.
**Recommendation:** Reword to "owner-or-admin for posts and comments; owner-only for user and alumni profiles". Optionally switch `health.test.ts` to the `importOriginal` form.

### Round 2 re-review

Written by: reflector (tier: balanced), dispatched sub-agent. Checked the round-2 diff against 16 lessons, 12 gotchas, 5 ADRs. 0 new critical or major; 1 new minor (doc drift), 1 new trivial. No ADR conflict: ADR-03 (401 is token-only) and ADR-05 still hold, and `sendError` never returns 401. **Packet-gap:** none.

| Round-1 item | Status |
|---|---|
| REFL-002 (23505 check twice) | resolved: `isUniqueViolation` in `errors.ts`, used 4 times across both Managers |
| REFL-003 (AppError mapping copied) | resolved: one `controllers/sendError.ts`, all four controllers use it; raw `error.message` leaks gone |
| REFL-001 (G02 stale) | still open (deferred to wrapup); diff does not touch the lockfile |
| REFL-004 (backend.md stub, index.md rows) | still open (deferred); now also name `sendError`, `routeList.ts`, `expectAppError.ts`, `typecheck` on the page |
| REFL-005 (flowchart admin-only) | still open (deferred); unchanged by the fix |
| REFL-006 (owner-or-admin wording) | still open (deferred); new owner-only tests in `AlumniManager.test.ts` now document the real rule, so the wording fix is more clearly right |

### REFL-007: Docs describe the code as before round 2

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `CLAUDE.md:70` and `:45`, `.adlc/context/conventions.md` Backend section (~line 61-75) |
| Category | vault-stale |
| Vault reference | [[knowledge/lessons/LESSON-REQ-002-6-docs-task-lists-every-folder-readme\|L-REQ-002-6]] |

**What:** Four things changed that the docs do not say: (1) CLAUDE.md:70 says each controller has its own try/catch with no shared error handling; they now all call one `sendError`, and error bodies are always `{ message }`. (2) CLAUDE.md "Commands" lists `test:backend` but not `typecheck:backend` (root) or `typecheck` (in `packages/backend`; it type-checks tests too, since Vitest does not). (3) conventions.md Backend testing does not mention `api/test/routeList.ts` (routes are read from the app, so a new route is covered with no list edit) or `src/test/expectAppError.ts`. (4) The password-hash rule moved into `UserManager`, so "controllers keep bcrypt" is no longer true for create paths (login still compares in the controller).
**Recommendation:** At wrapup, add those four lines to CLAUDE.md and conventions.md, and put the `{ message }` response format into conventions.md "API conventions" (QUAL-001 noted it as an empty template). Needs-decision, not a fix round.

### REFL-008: CLAUDE.md dist/ rule and the new typecheck (trivial)

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/backend/package.json` (`typecheck`), CLAUDE.md "Rebuilding businessLogic/dal" |
| Category | concept-drift |
| Vault reference | [[architecture/adr-05-backend-tests-vitest-supertest]] |

**What:** `tsconfig.test.json` maps `@alumni/businesslogic` to source, same as Vitest, so `typecheck` still never checks the compiled `dist/`. The `api` project check uses `dist/` types. The rebuild warning therefore stays needed.
**Recommendation:** When documenting `typecheck` (REFL-007), say it does not replace rebuilding `businessLogic`. (0 other trivials.)

### Round 3 re-review

Written by: reflector (tier: balanced), dispatched sub-agent. Read the round-3 packet, then checked CLAUDE.md and conventions.md against current source. 0 critical/major; 1 new minor, 1 new trivial. No lesson repeat, no ADR conflict (ADR-03 holds: 409 and 404 only, no new 401). **Packet-gap:** none.

- REFL-007: resolved. CLAUDE.md:46,52,71,72 and conventions.md (response format, helpers, type-check) now match `sendError.ts`, `package.json` typecheck scripts and `UserManager.verifyLogin`/bcrypt (UserManager.ts:89-92; UserController no longer imports bcrypt).
- REFL-008: resolved. CLAUDE.md:52 and conventions.md say typecheck and Vitest both resolve to source, so neither proves `dist/` is current.
- REFL-001, 004, 005, 006: still deferred to /wrapup. REFL-006 is now visible in a doc: conventions.md "Ownership checks live in Managers (owner-or-admin)" is false for `AlumniManager` (owner-only, AlumniManager.ts:45).

### REFL-009: Response-format line is wrong for login and for login's error path

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/context/conventions.md` (API conventions, Response format); `routes/authRoutes.ts:7-15`, `UserController.ts:8-13` |
| Category | vault-stale |
| Vault reference | [[context/conventions]] (API conventions) |

**What:** The doc says login sends `{ token, user }` and error bodies are "never raw error text". Code: `login` returns `{ token }` only; `authRoutes.ts:13` sends `err.message` for any error without a status (a pg or bcrypt failure would leak its text, status 500).
**Recommendation:** At wrapup, change the doc to "login sends `{ token }`; register sends `{ token, user }`" and either note login as the known exception (next to the existing "login keeps its own handling" in CLAUDE.md:71) or route it through `sendError` in the error-middleware REQ. Also add to conventions.md that `MeController` has its own `sendError` copy (CLAUDE.md:71 says it; conventions does not) and that ids above `MAX_DB_ID` give 404 and deleting a user with posts gives 409 (validation.ts:101-105, UserManager.ts:115).

### Round 4 re-review

Written by: reflector (tier: balanced), dispatched sub-agent. **Packet-gap:** none.

- REFL-009: resolved. `UserController.ts:10-12` login returns `{ token }` and throws `AppError(401,"Invalid")`; `AuthRoutes.ts:14` uses `sendError` (non-AppError gives 500 generic, `sendError.ts:10`); register sends 201 `{ token, user }` (`UserController.ts:24`). conventions.md and CLAUDE.md now say the same, including the `MeController` copy (`MeController.ts:13`), `MAX_DB_ID`/`requireId` 404 (`validation.ts:101-105`) and delete 409 (`UserManager.ts:115`).
- Final doc pass: auth public list, `router.use(authMiddleware)` in all five routers, `requireRole` placements, typecheck scripts (`package.json`, `tsconfig.test.json` paths and noEmit), `routeList.ts` and `expectAppError.ts` exports all match the code. No new mismatches. Only the already-deferred REFL-006 remains (the "owner-or-admin in Managers" wording is false for `AlumniManager`). 0 new findings.

## UI/UX findings

_(no UI surface in this change — ui-reviewer not dispatched. Coupling check run: the frontend calls only /auth/login, /auth/register and /me; none of their routes, controllers, middleware or queries changed.)_
