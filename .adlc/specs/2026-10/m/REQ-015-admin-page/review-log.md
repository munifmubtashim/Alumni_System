# REQ-015-admin-page — Review log

Full reviewer narratives. The consolidated verdict lives in `verification.md` —
read that first; come here for the long form behind a finding ID.

## Correctness findings

Written by: correctness-reviewer (tier: balanced)

**Summary:** Checked the 6 backend files (AdminQuery, AdminManager, AdminController/Routes, AlumniQuery sort, validation), plus the frontend guard, router, admin API/mutations/errors, params and delete dialog. 2 findings: 0 critical, 0 major, 2 minor. The delete transaction, cascade/recount scope (two-level threads, matches schema FKs), rollback/release, router-level requireRole, self-delete 403, 404/409 mapping, partial update, and the sort whitelist all hold up. Biggest: the affected-post list is read without a lock, so a concurrent reply can leave a stale comment_count.
- Delete tx: checked, nothing (one finding on the lock window). Sort whitelist: checked, nothing (fixed lookup, oneOf rejects other values). requireRole on router: checked, nothing. RequireAdmin / 403 not a logout: checked, nothing (httpClient only reacts to 401; lazy chunk not loaded for non-admins).
- (1 trivial not listed: ROLLBACK inside catch can itself throw and hide the original error; same pattern as existing queries.)

### CORR-001: Affected-post list is read before the delete, with no lock

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/dal/query/AdminQuery.ts:94-97` |
| Category | concurrency |

**What:** `deleteAlumniAccount` runs the AFFECTED_POSTS_SQL select, then `DELETE FROM users`, under READ COMMITTED with no row lock.
**Why it matters:** If someone replies to the deleted user's comment (or the user comments) between the select and the delete, the cascade removes that comment but its post is not in `postIds`, so `comment_count` stays too high until the next comment on that post. Narrow window, no data loss.
**Recommendation:** Start the transaction with `SELECT id FROM users WHERE id=$1 FOR UPDATE` (blocks the user's own new comments), or recompute from the delete itself, e.g. `DELETE FROM comments ... RETURNING post_id` before deleting the user. Optional; fine to accept and note.

### CORR-002: A deleted user's token keeps working for up to an hour

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `packages/backend/src/api/Middleware/authMIddleware.ts` (interacts with `AdminManager.ts:80-91`) |
| Category | security |

**What:** authMiddleware only verifies the JWT (1h expiry, role inside it); it never checks the user still exists.
**Why it matters:** After an admin deletes an account, that person's open session still passes auth; writes (new post/comment) hit a foreign-key error and answer 500, reads of `/api/me` may 404/500. This also means a demoted or deleted admin keeps admin rights until expiry. The old design allowed it, but delete makes it reachable now.
**Recommendation:** Accept and record it in the vault (gotcha), or have authMiddleware/`GET /api/me` return 401 when the user row is missing so the frontend logs out. Not required for this REQ.

### Correctness — round 2

**Summary:** Checked AdminQuery, AdminManager, UserManager.createAlumniAccount, serverMessage consolidation (5 callers), SearchField, the edit-drawer dirty gate and the query-key roots. 0 new findings. CORR-001 is resolved; CORR-002 was not in this round and stays needs-decision.

- CORR-001 (delete race): resolved. `SELECT ... FOR UPDATE` on the user row (AdminQuery.ts:93) conflicts with the FOR KEY SHARE that a comment or post insert takes on its author, so the author's new writes wait, then fail the FK. A reply by someone else lands on a post the author already commented on, so it is already in the recount list, and the cascade waits for it. A missing user still returns false after ROLLBACK (404 path unchanged).
- createAlumniAccount 409: checked, nothing. The hash, the unique-violation to 409 map and the public-columns return moved intact; AdminManager no longer sees a hash or a pg error code. The transaction in `createAlumniUser` rolls back and releases as before.
- serverMessage: checked, nothing. The shared copy is identical to the five deleted copies (not trimmed, blank gives undefined), so no caller changes behaviour.
- SearchField clear: checked, nothing. The native value setter plus a bubbling `input` event goes through React's onChange for controlled and uncontrolled use; uncontrolled state follows through handleChange.
- M1 dirty gate: checked, nothing. `handleSubmit` also returns early on `nothingToSave`, so Enter cannot bypass the disabled button. Trim-only edits are treated as no change, which matches what the server would store.
- (1 trivial not listed: FOR UPDATE does not remove the existing lock-order deadlock possibility between a comment insert and the cascade; Postgres aborts one side with a 500, and it was possible before this round.)

## Quality findings

Written by: quality-reviewer (tier: balanced)

**Summary:** Read the admin feature (all non-test files), the backend admin stack, the shared types, the router/nav/guard edits and the two new UI primitives; skimmed test names for coverage. 6 findings: 0 major, 5 minor, 1 trivial. Biggest: the same helper functions are copied again (serverMessage now 5 copies, focusIsLost 3), two of them inside one new folder. Test coverage is good; no debug code, no stray TODOs, no commented-out code.
Dispatch questions: none beyond the packet. **Packet-gap:** none (I read source files directly for context; the packet was sufficient).

### QUAL-001: serverMessage() copied again, twice in the same folder

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/admin/adminErrors.ts:30`, `deleteErrors.ts:12` |
| Category | duplication |
| Rule | none documented (convention-gap, see QUAL-005 note) |

**What:** Identical `serverMessage(data)` is defined in adminErrors.ts and deleteErrors.ts (next to each other), and also in `auth/authErrors.ts:32`, `feed/feedErrors.ts:4`, `me/profileErrors.ts:43`.
**Why it matters:** Five copies; a change to the error body shape needs five edits. The "lazy features can't import each other" rule does not apply here: `services/` is importable by every feature.
**Recommendation:** Add `serverMessage` to `services/httpErrors.ts` (already home of `isNotFoundError`) and import it in all five. At minimum, have deleteErrors.ts import the one from adminErrors.ts.

### QUAL-002: focusIsLost and the toast timer pattern now have three copies

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `features/admin/useAdminToast.tsx:9`, `features/admin/AdminPage.tsx:89` (inline), `features/me/ProfileForm.tsx:50` |
| Category | duplication |

**What:** "Is focus on body or detached" is written three times, and `useAdminToast` re-implements ProfileForm's toast (TOAST_MS, hover/focus pause, flushSync dismiss). The new `useDebouncedCallback.ts` is also a deliberate copy of the directory's (its own comment says "if a third feature needs it, move it").
**Why it matters:** The comments admit the copies; the toast one is about 60 lines and was already a gotcha (G36). A fix to one will miss the others.
**Recommendation:** Move `focusIsLost` and the toast hook to a shared non-feature home (e.g. `src/hooks/` or `components/ui/Toast`) and make ProfileForm use it. Decide at wrapup whether this is a follow-up REQ.

### QUAL-003: Magic number 100 for job title and company in the new backend validator

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/businessLogic/src/validation.ts:152-153` |
| Category | convention |
| Rule | conventions.md, Config: "No magic strings or numbers" |

**What:** `validateAdminAlumniFields` writes `100` inline for Job title and Company, while every other limit there is a named constant (`NAME_MAX`, `UNIVERSITY_MAX`...). The same literal already exists at lines 117-118, so this copies it; the frontend names them `JOB_TITLE_MAX` and `COMPANY_MAX`.
**Why it matters:** The client's hand-copied limits point to named server constants (validation.ts header comment of the frontend file); two of them have no name to point to.
**Recommendation:** Add `JOB_TITLE_MAX` and `COMPANY_MAX` constants, use them at 117-118 and 152-153.

### QUAL-004: DeleteAlumniDialog imports a message constant from the drawer

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `features/admin/DeleteAlumniDialog.tsx:8`, `AlumniDrawer.tsx:27` |
| Category | naming / structure |

**What:** `GONE_TEXT` lives in AlumniDrawer.tsx and the delete dialog imports it from there.
**Why it matters:** Two sibling dialogs depend on each other's file for a shared toast text; the drawer file is already 300+ lines.
**Recommendation:** Move `GONE_TEXT` to `rowText.ts` (or a small `messages.ts`) and update the two imports and the tests.

### QUAL-005: New AdminController follows old style, not the "Conventions (redesign)" rules (convention-gap)

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `packages/backend/src/api/controllers/AdminController.ts:9-43` |
| Category | convention-gap |
| Rule | CLAUDE.md "Conventions (redesign) > Backend" |

**What:** CLAUDE.md says controllers are classes, routes bind instance methods, and one error middleware replaces per-method try/catch. Every handler here is an exported function with its own try/catch + `sendError`.
**Why it matters:** It matches the rest of the code (and the Architecture section says the middleware is "a later REQ"), so the code is consistent but the written rule is not true of any controller. A new reader will not know which wins.
**Recommendation:** Do not change this REQ. Ask the user whether to mark the redesign rule "not yet applied" in conventions, so reviewers stop reading it as a violation.

### QUAL-006: Hard-coded id in ForbiddenPage; copied debounce hook has no own test (2 trivials)

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `features/auth/guards.tsx:76-77`; `features/admin/useDebouncedCallback.ts` |
| Category | convention / test-coverage |

**What:** `id="forbidden-title"` is a fixed string, while the admin page uses `useId()` for heading ids. The debounce copy has no test file (the directory's original has 7 cases); AdminPage.test covers the 300 ms write only.
**Why it matters:** Low; a duplicate id is only possible if two ForbiddenPages mount.
**Recommendation:** Use `useId()` in ForbiddenPage; copy the directory's test next to the copy, or resolve QUAL-002 and keep one hook.

**Checked, nothing:** console/debug leftovers, TODO/FIXME, commented-out code, unused imports (typecheck is part of the build), `.env` changes (none needed), commit-message format (in commits-draft.md, `[REQ-015]` tag present), test file naming/location, backend tests for the new sort, validator, routes, Manager and Query (all present, with error paths).

### Quality — round 2

Written by: quality-reviewer (tier: balanced)

**Summary:** Checked the round-1 fixes in source and the round-2 changes (queryKeys, text, serverMessage move, createAlumniAccount, SearchField clear button, validation constants). QUAL-001, QUAL-003, QUAL-004 are resolved: one `serverMessage` in `services/httpErrors.ts` used by all five mappers, `JOB_TITLE_MAX`/`COMPANY_MAX` used at validation.ts:119-120 and 154-155, `GONE_TEXT` in `rowText.ts`. QUAL-002, QUAL-005 stay open (needs-decision); QUAL-006 untouched (trivial). 3 new findings: 0 major, 2 minor, 1 trivial. **Packet-gap:** none.

### QUAL-007: UserManager still has the literals the new constants replace

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/businessLogic/src/UserManager.ts:73,152,155,164,174-177` |
| Category | convention |
| Rule | conventions.md, Config: "No magic strings or numbers" |

**What:** `validateRegistration` and the profile validator still write 100/150 inline for name, university, department, company and job title. validation.ts now has `NAME_MAX`, `UNIVERSITY_MAX`, `DEPARTMENT_MAX`, `COMPANY_MAX`, `JOB_TITLE_MAX` for the same limits. The round-2 table calls this a follow-up.
**Why it matters:** Two sets of limits for the same fields; a change in one place silently splits sign-up from the admin form.
**Recommendation:** Import the constants in UserManager.ts and replace the literals. Small, same files this REQ already touches; do it now or log it as a follow-up with an owner.

### QUAL-008: Type cast hides a mismatch in createAlumniAccount

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/businessLogic/src/UserManager.ts` (`createAlumniAccount`, the `as RegisterUserFields` line) |
| Category | convention |

**What:** `{ ...user, password } as RegisterUserFields` is cast because `university` is optional here and required in the dal type. The comment says pg stores undefined as NULL.
**Why it matters:** A cast turns off the compiler for exactly the field that differs; if dal later reads `university.length`, nothing warns.
**Recommendation:** Make `university` optional in `RegisterUserFields` (the column is nullable), or pass `university: user.university ?? null` and type it `string | null`. Drop the cast.

### QUAL-009 (trivial): New shared modules and the SearchField clear button

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/frontend/src/config/queryKeys.ts`; `components/ui/SearchField/SearchField.module.css` |
| Category | test-coverage |

**What:** `queryKeys.ts` has no test pinning the three root strings, so a rename in it changes both sides together and no test notices a change of the actual cache key. (`text.ts` has `text.test.ts`; SearchField has 4 new cases; checked fine.)
**Why it matters:** Low. The m2 fix is only as good as the delete test that seeds real keys.
**Recommendation:** Optional: confirm the admin delete test imports the roots rather than literals; otherwise leave.

**Checked, nothing:** README/docs for queryKeys, text, serverMessage (updated in config/README.md and services/README.md); no leftover `present` or `serverMessage` copies; test names for the new SearchField, text and httpErrors cases describe behaviour and assert.

### Quality — round 3

Written by: quality-reviewer (tier: balanced)

**Summary:** Checked the two round-3 fixes in source (UserManager.ts, RegisterDTO.ts) plus callers and tests. QUAL-007 and QUAL-008 are resolved. 0 new findings. **Packet-gap:** none.

- QUAL-007 resolved: no bare 100/150 left in UserManager.ts; all five limits use the validation.ts constants (values match: 100/150/100/100/100). `EMAIL_TAKEN_MESSAGE` is used at all three 409 sites. Dropping `export` from `BCRYPT_ROUNDS` is safe: no other file in api/businessLogic/dal references it, and AdminManager delegates hashing to UserManager.
- QUAL-008 resolved: `university?` in `RegisterUserFields` and `NewAlumniAccount`, cast gone. The UserQuery inserts pass `user.university` as a pg parameter, so undefined becomes NULL as the comment says. Tests call `createAlumniAccount` without university (UserManager.test.ts:67).
- New for my lens: checked, nothing. Tests still assert the literal email-taken text (UserManager.test.ts:85, AdminManager.test.ts:123), which pins the constant's value; that is fine.


## Architecture findings

Written by: architecture-reviewer (tier: balanced), dispatched sub-agent.

**Summary:** Checked 5 backend layers (route, controller, Manager, Query, DTO/validation), the shared types, the lazy-route and import-boundary rules, and the nav/guard wiring (about 114 files via the packet). 0 critical, 0 major, 3 minor, 2 trivial. Layering holds: routes -> controller -> AdminManager -> Query; no SQL outside dal; the admin router gates once with `router.use(authMiddleware, requireRole("admin"))`; the sort ORDER BY is a fixed lookup. Biggest: the vault API docs do not yet describe `/api/admin/*` or the new `sort`/`order` params.
Dispatch questions: layering - checked, nothing; ADR-08 lazy rule - checked, nothing (ADMIN_ROUTE is the only import of `features/admin`, `LAZY_FEATURES` updated); cross-feature cache keys - ARCH-003.

### ARCH-001: API docs in the vault miss `/api/admin/*` and the `sort`/`order` params

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/context/conventions-api.md:15` |
| Category | contract |
| Rule broken | conventions-api.md Auth section lists every `requireRole` gate; Pagination section documents `GET /api/alumni` params |

**What:** `CLAUDE.md` was updated, but `conventions-api.md` still lists only the old admin gates and has no entry for the admin router, its four routes, or the new optional `sort` (name, graduationYear) and `order` (asc, desc) params on `GET /api/alumni`. The vault is not in the diff.
**Why it matters:** `GET /api/alumni` is a shared contract for every signed-in user; the next reader of the vault will not know it sorts, or that `/api/admin` is a whole admin-only namespace.
**Recommendation:** Add both to `conventions-api.md` at wrapup (Auth line: "`/api/admin/*` is admin-only by router; ownership rules: admin cannot delete self"; Pagination: sort/order, 400 on bad word, order alone sorts by name).
**References:** [[context/conventions-api]]

### ARCH-002: AdminManager reaches into UserManager and re-implements account creation

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/businessLogic/src/AdminManager.ts:5` |
| Category | separation |
| Rule broken | Manager-per-domain pattern (CLAUDE.md, Backend section) |

**What:** `AdminManager` imports `BCRYPT_ROUNDS` from `UserManager.js` (newly exported just for this) and builds its own hash + `createAlumniUser` + 409-on-duplicate-email flow, the same flow `UserManager.register` already owns.
**Why it matters:** Password hashing rules now live in two Managers; changing rounds or the duplicate-email message means two edits, and a constant in a Manager file becomes a shared dependency.
**Recommendation:** Move `BCRYPT_ROUNDS` into `validation.ts` or a small `security.ts` in businessLogic, or give `UserManager` a `hashPassword` helper that both call. Not urgent; the duplication is small.
**References:** [[context/architecture]] (businessLogic owns hashing in `UserManager`)

### ARCH-003: Admin mutations hard-code other features' query keys

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `packages/frontend/src/features/admin/mutations.ts:12` |
| Category | pattern |
| Rule broken | ADR-08 (lazy features never import each other); L-REQ-010-1 |

**What:** `['alumni']`, `['posts']`, `['feed']` are string literals with a "keep in step" comment. Nothing tests them, so a rename in directory, profile or feed would silently leave their caches stale after an admin edit or delete.
**Why it matters:** The coupling is real but unguarded; it fails quietly (stale names, not errors).
**Recommendation:** Either put the shared roots in a leaf `config/queryRoots.ts` that all features import, or add one test that reads each feature's key factory and asserts these roots. Choose per the existing lesson; either removes the silent drift.
**References:** [[architecture/adr-08]], L-REQ-010-1

### ARCH-004 (trivial): `ForbiddenPage` exported but used only inside `guards.tsx`
`packages/frontend/src/features/auth/index.ts:1` exports it; nothing outside imports it. Drop from the barrel, or keep if a second guard is planned.

### ARCH-005 (trivial): `AlumniSort`/`SortOrder` declared in both dal and shared
`packages/backend/src/dal/dto/AlumniSearchDTO.ts:5` and `packages/shared/src/types/alumni.types.ts:33`. A "keep in sync" comment covers it; matches the known parallel-type-surface rule in CLAUDE.md, so no action beyond the comment.

(Controller style, per-method try/catch with `sendError`, matches the sibling controllers, so it is not listed; the "classes plus error middleware" redesign convention is still unmet repo-wide.)

### Architecture — round 2

Written by: architecture-reviewer (tier: balanced), dispatched sub-agent.

**Summary:** Checked the 4 round-1 items, the new `config/queryKeys.ts` and `config/text.ts` (imports: none, so the config leaf rule holds), `services/httpErrors.ts` `serverMessage` (imports only axios, no React or features), and `UserManager.createAlumniAccount`. 0 critical, 0 major, 0 minor, 1 trivial.
Round 1: ARCH-002 resolved (hash, create and 409 now live in `UserManager.createAlumniAccount`, `BCRYPT_ROUNDS` is private again, `AdminManager` holds a `UserManager` and no longer touches bcrypt or `UserQuery`). ARCH-003 resolved (directory, profile and feed build keys from the roots; no key literals remain in code, only in comments and READMEs). ARCH-001 stays needs-decision for /wrapup (the vault file is still not in the diff). ARCH-004 and ARCH-005 unchanged.
Dispatch questions: config leaf and services boundaries - checked, nothing; `createAlumniAccount` layering - checked, nothing (Manager calls Query, returns the public columns only).

### ARCH-006 (trivial): the taken-email 409 text is now written three times in UserManager

`UserManager.ts:86`, `:102`, `:204` each throw the same `AppError(409, "An account with this email already exists")` in the same file. Pull it into one private constant or helper next time the file is touched. No behaviour risk. Rule: one owner for account-creation rules (round-1 ARCH-002).

**Packet-gap:** none.


## Reflection findings

Written by: reflector (tier: balanced), dispatched sub-agent.

**Summary:** Checked 55 lessons (0 superseded), 42 gotchas, 9 ADRs and the touched concept/component pages against the diff. 5 findings: 0 critical, 0 major, 5 minor (3 repeated-mistake, 1 re-derivation, 1 vault-stale bundle for /wrapup). Biggest: the vault still describes five lazy pages and no admin API, and G15's "cascade unconfirmed" is now confirmed. The delete SQL, router-level role gate, 403-not-logout, validators split, full-replace boolean and the six-list lazy checklist all respect their lessons. 12 candidates queued (CAND-025+).
Dispatch questions: ADR conflicts - checked, nothing (ADR-01/02/03/05/06/08/09 respected; ADR-04 outcome not written, see REFL-005). Diagram drift - checked, nothing. Docs likely affected: none beyond what the diff already edits.

### REFL-001: Invalidation test uses made-up keys and no observers

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/admin/DeleteAlumniDialog.test.tsx` (the "deletes, refetches, marks the other features stale" case) |
| Category | repeated-mistake |
| Vault reference | [[knowledge/lessons/LESSON-REQ-010-1-invalidate-other-features-cache-with-real-keys]] |

**What:** The test seeds `['alumni','detail',2]` and `['feed','list']`, which no feature uses (real: `['alumni','profile',id]`, `['feed','posts']`), with `setQueryData` and no observers.
**Why it matters:** The lesson says to seed real queries with observers; a test that writes its own literals passes even if the feed's key root changes. Same blind spot as ARCH-003.
**Recommendation:** Seed the real shapes (`['alumni','search',…]`, `['posts','user',id]`, `['feed','posts']`) and assert a refetch. `features/me/useUpdateProfile.test.tsx:84` already uses the real feed keys; copy it.

### REFL-002: Lazy-feature lists were edited by hand a sixth time

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `packages/frontend/eslint.config.js:77`, `src/app/lazyRoutes.test.ts:~55`, `scripts/enforcement.test.ts:~251` |
| Category | repeated-mistake |
| Vault reference | [[knowledge/lessons/LESSON-REQ-014-1-derive-lazy-feature-lists-from-one-source]] |

**What:** Admin was added to three hand lists plus READMEs. All were done this time, but the test L-REQ-014-1 asked for (fail when a `features/` folder loaded by `import()` in `router.tsx` is missing from `LAZY_FEATURES`) still does not exist.
**Why it matters:** The lesson predicted a miss on every new lazy page; this REQ was lucky because the implementer grepped. Cost of the fix is one test.
**Recommendation:** Build the derived test as a follow-up (or a small task now); until then keep the grep step in the wrapup checklist.

### REFL-003: New ORDER BY not run against real Postgres

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/dal/query/AlumniQuery.ts:12-18` |
| Category | repeated-mistake |
| Vault reference | [[knowledge/lessons/LESSON-REQ-005-2-mocked-sql-tests-need-one-real-run]] |

**What:** TASK-002 records a real-DB run of create, edit and delete, but TASK-001 and `visual-check.md` record none for `GET /api/alumni?sort=graduationYear&order=desc` (`NULLS LAST` clause).
**Why it matters:** Query tests mock `pool.query`, so only SQL text is compared. The SQL looks valid, but the lesson's rule is "each new statement once".
**Recommendation:** Call the endpoint once per sort/order pair on the dev DB and note it in TASK-001 or the verification log.

### REFL-004: `present()` and the error-plus-Retry block copied a third time

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `features/admin/rowText.ts:13`, `features/admin/AdminStates.tsx:32` (also `directory/AlumniCard.tsx:14`, `profile/format.ts:4`) |
| Category | re-derivation |
| Vault reference | [[knowledge/lessons/LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]] |

**What:** `present()` now exists in three lazy features; admin's `LoadError` is the third page with the same alert-plus-Retry block. The lesson said to pick a home before the third copy. QUAL-001/002 cover `serverMessage`, `focusIsLost` and the toast; this is the other half of the same lesson.
**Recommendation:** Move `present` to `config/` (pure, per its README) and decide whether the Retry block becomes a `components/ui` primitive. Or write the decision into the lesson ("accepted, follow-up REQ-N").

### REFL-005: Vault pages /wrapup must update (needs-decision, not a code fix)

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | see list |
| Category | vault-stale |
| Vault reference | [[knowledge/gotchas#^g15]], [[architecture/adr-04-forms-without-a-library]], [[architecture/adr-08-route-code-splitting-and-url-list-state]] |

**What:** (1) G15 says FK cascade is `needs verification`; REQ-015 verified all six on the live dev DB and the delete now depends on it: set to confirmed, note the 23503 fallback. (2) ADR-04 needs a REQ-015 row (L-REQ-010-4): 8-field flat form, stays controlled; field rules now copied a fourth time (backend, auth, me, admin), nearer its "move rules into shared" trigger. (3) ADR-08 line 50 and `components/frontend.md:49` say About is the "fifth" lazy page; `route-layout.md` needs the Admin route and `RequireAdmin`. (4) `conventions-api.md:10` says user delete is a 409 with no mention of the new cascading `/api/admin/alumni/:id` delete; also state that the admin PUT is a partial update by column group, unlike the full-replace routes in L-REQ-011-3 (ARCH-001 covers the sort/admin entries). (5) `components/backend.md` and `design-tokens.md` need `AdminManager`/`AdminQuery` and `error-soft`/`scrim`. (6) The deleted-user token window (CORR-002/ADV-003) deserves a gotcha.
**Recommendation:** Do these in /wrapup step 3.

### Reflection — round 2

Written by: reflector (tier: balanced), dispatched sub-agent.

**Summary:** Round-1 findings: REFL-001, 002, 003 and 004 are resolved (004 partly, see R2-001); REFL-005 stays needs-decision with the list extended below. Checked the round-2 diff against the 55 lessons, 42 gotchas and 9 ADRs again. 2 new findings, both trivial or minor. No ADR conflicts; `config/` stays a leaf and `services/` imports nothing from features. No new lesson candidates (the query-key home is already queued in lesson-candidates.md, the router-derived list is CAND-036).

**Round-1 status:** REFL-001 resolved: the delete test now seeds the real key shapes (`['alumni','profile','2']`, `['feed','comments',7]`) and asserts `isInvalidated`; the keys come from `config/queryKeys.ts`, which the directory, profile, feed and admin all build from. REFL-002 resolved: `lazyRoutes.test.ts` and `enforcement.test.ts` compare their lists with the lazy `import()` calls in `router.tsx`, and the effective ESLint rule is read with `calculateConfigForFile`. REFL-003 resolved: real-DB sort run recorded in TASK-001 (NULLS LAST, no overlap across pages). REFL-004: `present` now lives once in `config/text.ts` and `serverMessage` once in `services/httpErrors.ts`, no copies left.

### R2-001: Retry error block is still copied (REFL-004 remainder)

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | medium |
| File | `features/admin/AdminStates.tsx:32`, `features/directory/DirectoryStates.tsx:102` |
| Category | re-derivation |
| Vault reference | [[knowledge/lessons/LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]] |

**What:** The alert-plus-Retry `LoadError` is still one copy per lazy feature (directory, admin, and the other pages). Only `present` and `serverMessage` were given a home.
**Recommendation:** Accept it and note "follow-up" in the lesson, or promote it to a `components/ui` primitive in a later REQ. Not a fix round.

### R2-002: Test seeds are literals and have no observers

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `features/admin/DeleteAlumniDialog.test.tsx:170-176`, `features/feed/constants.ts:37` |
| Category | repeated-mistake |
| Vault reference | [[knowledge/lessons/LESSON-REQ-010-1-invalidate-other-features-cache-with-real-keys]] |

**What:** The test still seeds with `setQueryData` and no mounted observer, so it proves the keys are marked stale but not that a mounted page refetches. Its key literals do not use the new roots, and `FEED_MUTATION_KEY = ['feed']` is still a literal beside `FEED_QUERY_ROOT`.
**Why it matters:** Renaming a root still fails the test (good); a changed shape under the same root would not. Low risk.
**Recommendation:** Optional: build the seeds from the root constants and use `FEED_QUERY_ROOT` in `FEED_MUTATION_KEY`.

### REFL-005 extension (needs-decision at /wrapup, adds to the list)

- Repo `CLAUDE.md` Architecture lists the `config/` files (brand, directoryReturn, feedPath, mePath, aboutPath, relativeTime) and the `services/` `httpErrors.ts` export (`isNotFoundError` only). Add `adminPath.ts`, `queryKeys.ts`, `text.ts` and `serverMessage`; the folder READMEs are already updated.
- `UserManager.createAlumniAccount` now owns hash + create + 409; `components/backend.md` should say so (and that `BCRYPT_ROUNDS` is private). `validateRegistration` still has job-title/company literals (m6 follow-up): note it in conventions-api or a gotcha.
- The lazy-feature checklist (L-REQ-009-4 / L-REQ-014-1) now has a derived test; update L-REQ-014-1 to say the test exists, and trim the "six lists" wording to the lists that remain hand-written (router, README lists).
- `businessLogic/dist` is untracked and is not rebuilt by tests; `UserManager` and `AdminManager` changed, so rebuild before running the API (existing CLAUDE.md note, a reminder for the merge checklist).

## UI/UX findings

Written by: ui-reviewer (tier: balanced)

**Summary:** Drove the running app (headless Brave, real API) through 4 roles/states, drawer (add/edit), discard, delete dialog, sort/search/URL, 360/390/720/820/1440 widths. Every UI AC checked except below. 2 findings (0 critical / 1 major / 1 minor). Biggest: Edit drawer "Save changes" is live on an untouched form and sends a PUT. Checked, nothing: console errors (none; only the expected 409), double-submit (2 clicks = 1 request), focus trap/return, Escape/backdrop/X discard rules, horizontal overflow (none at 360 or 720), 403 page sends no admin request, non-admin sees no Admin link/tab/menu item, guest goes to /login with `from=/admin`. Not driven: stats-failure Retry, table-error Retry, page 2 (only 9 alumni, so Next stays disabled) and the 404 on edit; these rest on the unit tests. A throwaway alumnus was created and removed through the UI/API; nothing is left in the DB.

### UI-001: Edit drawer "Save changes" is enabled on an untouched form

| Field | Value |
|---|---|
| Severity | major (rubric: submit enabled when pristine); low real impact |
| Effort | small |
| Route / flow | `/admin` - Edit alumni drawer |
| Lens | interaction-state |
| Evidence | `ui-evidence/edit-drawer.png`; network: open Edit, click Save changes with no edits gives `PUT /api/admin/alumni/<id>`, then list and stats refetch, toast "Changes saved" |

**What:** Save is enabled and active the moment the drawer opens, so a no-op save hits the API and tells the admin something was saved. Add mode is fine (empty required fields error on submit, per ADR-04).
**Why it matters:** Misleading toast and a pointless write. Account settings avoids this with a save bar that shows only when dirty.
**Recommendation:** In `AlumniDrawer.tsx`, in edit mode disable Save (real `disabled`) until the form values differ from the loaded row and validate; or, if enabled-on-open is intended (the AC does not require disabled), close without a request and skip the toast when nothing changed.

### UI-002: Search clear (x) icon is blue, off-palette

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | `/admin` - Search alumni with text typed |
| Lens | design-match |
| Evidence | `ui-evidence/search-empty.png` (blue x at the right of the search box) |

**What:** The clear button shows a saturated blue x while everything else is warm neutral and brand-brown.
**Why it matters:** Looks like the browser's native search-cancel control; breaks the token-only rule. Also check the same field in the directory for consistency.
**Recommendation:** Style or replace the clear control in `SearchField` with an `ink-secondary` token icon (or hide `::-webkit-search-cancel-button` and render your own).

(0 trivials not listed.) Other evidence: `ui-evidence/drawer-dup-email.png` (taken-email error on Email, focus on Email), `drawer-discard.png` (inline "Discard this new alumni?" with Keep editing focused), `p360light.png` (phone cards, tab bar with Admin current), `access-student.png` (403 page in shell).

**UI review tier:** headless (Brave over CDP, Claude in Chrome not connected) - /admin as guest, student, alumni and admin; add, edit, delete flows and dialogs; sort, search, URL state; 5 widths; ~19 screenshots (6 copied to `ui-evidence/`); 0 critical / 1 major / 1 minor. Dev servers were already running and were left running; my browser instances were closed.

### UI — round 2

Written by: ui-reviewer (tier: balanced)

**Summary:** Both round-1 findings are fixed. UI-001: Edit "Save changes" is a real `disabled` button on an untouched form, enables on a real change, disables again when the original is typed back (a trailing space also counts as unchanged), and a real change saves (1 PUT, toast, drawer closes, DB updated, reopened form is pristine). UI-002: no native blue x; one neutral token-colored x (40px) with "Clear search text" appears only with text, clears the box and keeps focus; checked on /admin and /directory, light and dark, 390 and 1440 (12 combinations, no overflow). Regression: directory search, filter popover, profile, "Back to directory" restore, feed, admin delete (directory, feed and stats refreshed without reload) all fine, console clean. 1 new out-of-scope finding (0 critical / 1 major / 0 minor). Throwaway alumnus and its post were deleted; DB is back to 9 alumni, 10 posts.

### UI-003: Feed white-screens on a post whose caption is null (pre-existing, not from round 2)

| Field | Value |
|---|---|
| Severity | major (out of REQ-015 scope; surfaced by a regression walk) |
| Effort | small |
| Route / flow | `/feed` after `POST /api/posts` with no `caption` |
| Lens | render |
| Evidence | console: `TypeError: Cannot read properties of null (reading 'trim')` at `PostCard`; `packages/frontend/src/features/feed/PostCard.tsx:155` (`post.caption.trim()`) |

**What:** I created a post with the wrong field name, so the API stored it with a null caption (201, no 400). The next load of `/feed` hit the error boundary for every viewer. The shared type says `caption?: string`, so the code and the type disagree.
**Why it matters:** One caption-less post (API or a future media-only post) breaks the whole feed. Not caused by this REQ's diff; log it for follow-up, not as a blocker.
**Recommendation:** In `PostCard.tsx:155` use `post.caption?.trim()` (or `(post.caption ?? '')`), and decide in `PostManager.create` whether a post needs a caption or media_url.

**UI review tier (round 2):** headless (Brave over CDP; Claude in Chrome not connected) - edit-drawer dirty/pristine/revert/save, SearchField on /admin and /directory x light/dark x 390/1440, directory filter + search + profile + back-restore, feed, admin delete with cross-feature refresh; ~30 shots taken, 7 copied to `ui-evidence/` with a `round2-` prefix; 0 critical / 1 major (out of scope) / 0 minor. Dev servers left running; my browser closed.
