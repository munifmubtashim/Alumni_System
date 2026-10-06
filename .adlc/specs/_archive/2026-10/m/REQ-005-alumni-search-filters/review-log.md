# REQ-005-alumni-search-filters — Review log

Full reviewer narratives. The verdict lives in `verification.md`.

## Correctness findings

Written by: correctness-reviewer (tier: balanced)

**Summary:** Checked searchAlumni SQL (4 filters, param numbering, count/items parity, LIMIT/OFFSET), LIKE escaping, parseAlumniSearch (10+ odd inputs), graduation_year typing, 400-never-queries, auth order. 1 finding (minor), 0 critical/major. SQL injection: none, every value is a bound parameter. Biggest: a NUL byte (`%00`) in q/department/university passes validation and makes Postgres throw, so the caller gets a 500.
Dispatch answers: LIKE escape correct (`\` is the default LIKE escape no matter the standard_conforming_strings setting, because the pattern is a bound param, not a SQL literal; escapeLike covers %, _ and \). Count params are copied before LIMIT/OFFSET, WHERE text shared, so numbering and parity hold. Offset max is 999900, in int range. Express 4 qs arrays/objects, '', whitespace, '1e2', full-width digits (JS `\d` is ASCII-only), leading zeros ('01' gives 1; '0020' year rejected), huge digit strings (Number gives a big value or Infinity, then range check): checked, all give 400 or the default. graduation_year: the number is sent as text '2020' and Postgres infers the param type from the column, so varchar or integer both work (checked, nothing; the base alumni CREATE TABLE is not in db/, so the column type is unconfirmed and tests mock the pool). The 400 path throws in the Manager before the Query is called (unit test covers it). authMiddleware is still `router.use` first in AlumniRoutes.ts.

### CORR-001: NUL byte in a text filter gives a 500

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/businessLogic/src/validation.ts:6-12` (used at :141-146) |
| Category | input-validation |

**What:** `optionalText` does not reject `\u0000`. `GET /api/alumni?q=%00` (same for department, university) reaches Postgres, which refuses text with a NUL byte (error 22021).
**Why it matters:** The spec says bad input is a 400; this one is a 500 "Something went wrong". No data leak, but it is a signed-in-only, easy-to-trigger error and noise in logs. Cannot run it here (tests mock the pool); a real `psql` or integration call would confirm.
**Recommendation:** In `parseAlumniSearch` (or `optionalText`, which also helps the write paths), throw `AppError(400, "<field> contains invalid characters")` when the value includes `\u0000`. Add a case to `validation.test.ts`.

### Round 2 re-review

- CORR-001 resolved: `optionalText` (validation.ts) now rejects any `\u0000` with a 400 before trimming. Every text validator (including `requiredText`, `optionalYear`, `optionalWebUrl`, `requiredEmail`) and all search params go through it. Tests cover q/department/university/graduationYear and the profile validators. Passwords use `validateNewPassword` (not `optionalText`, and are bcrypt-hashed, never stored as text), so there is no side effect on them.
- No new correctness issues. Checked: `createAlumni` maps an empty or missing year to `undefined` (because `optionalYear` returns undefined for empty), so no NaN; otherwise `Number("2020")` of a validated 4-digit string. `updateAlumni` now takes `AlumniEditableFields` (year still string, pg coerces to INTEGER; empty becomes undefined, so it binds NULL as before). `/api/me` profile paths still use string-typed `AlumniEditableFields` and are unchanged. `parseAlumniSearch` year now reuses `optionalYear` with the same bounds and `Number()` conversion.
- Note (not a bug, informational): `AlumniDTO.graduation_year` is `number | null` while `AlumniEditableFields.graduation_year` stays `string`. The types are inconsistent but harmless at runtime.

## Quality findings

Written by: quality-reviewer (tier: balanced)

Summary: checked 16 changed source/test files against conventions.md (naming, constants, AppError/sendError, test quality, duplication, dead code, shared/dal type consistency). 5 findings: 0 major, 3 minor, 2 trivial. Biggest: the graduation-year check is copied from `optionalYear` instead of reused. Partial mocks (L-REQ-003-1): checked, nothing (importOriginal used in both mocks). SQL-shape assertions: checked, thorough. Controller/sendError use: checked, nothing. Dead code: checked, nothing (TestManager line removed, no leftovers).

### QUAL-001: graduationYear check duplicates optionalYear and repeats year bounds

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/businessLogic/src/validation.ts:147-153` |
| Category | duplication |
| Rule | conventions.md Config: "No magic strings or numbers" |

**What:** `parseAlumniSearch` re-implements the 4-digit / 1900 / now+10 rule that `optionalYear` already has at `validation.ts:20-27`. The 1900 and `+ 10` literals now live in two places.
**Why it matters:** A change to the allowed range (e.g. a new max year) must be made twice; the 400 message text can drift.
**Recommendation:** After `singleQueryValue`, call `optionalYear(value, "graduationYear")` and set `filters.graduationYear = Number(year)` when defined. Same message ("graduationYear is not valid"), existing tests stay green. Or extract `MIN_GRADUATION_YEAR` / `MAX_YEARS_AHEAD` constants used by both.
**References:** [[knowledge/lessons/LESSON-REQ-003-3-migrate-every-handler-in-a-touched-file]] (touch the shared helper rather than fork it)

### QUAL-002: text length limits 100/100/150 repeated as bare numbers

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/businessLogic/src/validation.ts:141-145` |
| Category | convention |
| Rule | conventions.md Config: "No magic strings or numbers" |

**What:** `q`, `department`, `university` limits are literals again; `validateAlumniFields` (department 100) and `validateUserBasics` (university 150) hold the same numbers.
**Why it matters:** If the column limit for department or university changes, the search filter silently accepts or rejects different values than the profile form. Also `optionalText` is given `(value, field, max)` with the field name lowercase ("q") while other messages use "Department"; messages are inconsistent for the same field.
**Recommendation:** Add `MAX_DEPARTMENT_LENGTH = 100`, `MAX_UNIVERSITY_LENGTH = 150`, `MAX_SEARCH_LENGTH = 100` constants beside the other validators and use them in both places.

### QUAL-003: dal result type says items may carry email; shared type says never

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/dal/query/AlumniQuery.ts:23` |
| Category | naming |
| Rule | CLAUDE.md Shared types: keep shared types and dal DTOs in sync |

**What:** `AlumniPage.items` is `AlumniDTO[]`, whose `email?` field is optional; the shared `AlumniListItem` is `Omit<Alumni, "email">`. The dal type allows a field the API promises never to send, and `AlumniDTO` also types `created_at` as a required `Date` for rows that are not built via the constructor (pre-existing).
**Why it matters:** The "no email in lists" guarantee is held only by the `LIST_COLUMNS` string and one regex test, not by the type. Naming is also split: dal `AlumniPage` / `AlumniPaging` vs shared `AlumniListResponse` for the same `{ items, total }` shape.
**Recommendation:** Type items as `Omit<AlumniDTO, "email">[]` (or a named `AlumniListRow`), and note in the `AlumniPage` comment that it maps to shared `AlumniListResponse`.

### QUAL-004: query test picks calls by position, not by SQL

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/backend/src/dal/query/AlumniQuery.test.ts:50-55` |
| Category | test-coverage |
| Rule | none (see CAND-005) |

**What:** `call(n)` uses `mock.calls.at(n - 2)` (items = `at(-2)`, count = `at(-1)`), relying on `Promise.all` start order, while the mock answers by SQL text. The `n - 2` arithmetic is hard to read.
**Why it matters:** Reordering the two queries in `searchAlumni` would make the tests read the wrong SQL and fail confusingly, or pass if both asserts happen to hold.
**Recommendation:** Find the call with `calls.find(([sql]) => /COUNT\(\*\)/.test(String(sql)))` for count and its negation for items.

### QUAL-005: unrelated `./BaseDTO` to `./baseDTO` import edits in four DTOs

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/backend/src/dal/dto/AlumniDTO.ts:1` (also Comment, Post, User) |
| Category | convention |
| Rule | CLAUDE.md Workflow: spec first (not in blast radius) |

**What:** Four DTO imports were lowercased to match the git-tracked `baseDTO.ts` (see CAND-001). Right fix for fresh clones, but outside this REQ's spec and tasks.
**Why it matters:** Hides a repo-wide casing fix inside a feature diff; reviewers of the search code must skip it, and a later git-level rename of the file back to `BaseDTO.ts` would break these imports again.
**Recommendation:** Keep it, but record it in the commit draft as a separate commit ("fix(dal): import baseDTO with its tracked casing"), or rename the file in git instead and revert these four edits.

## Architecture findings

Written by: architecture-reviewer (tier: balanced)

**Summary:** Checked 28 files against the layering rules, ADR-05 and conventions.md. 0 critical, 0 major, 3 minor, 0 trivial. Layering is clean (validation in `validation.ts`, SQL only in `AlumniQuery`, controller passes `req.query` through). Biggest: the "reuse for the next paged list" promise points at an alumni-specific function (ARCH-001).
Dispatch answers: dal type import, checked, nothing (type-only, same as the existing `AlumniEditableFields` import at `validation.ts:1`; see ARCH-002 for placement). New list convention, convention is enough, no ADR (see ARCH-001). Shared vs dal drift, ARCH-003. baseDTO import fix, checked, nothing (file on disk is `baseDTO.ts`; no `"./BaseDTO"` import remains, so it now works on case-sensitive file systems). Doc merge risk with REQ-004, checked, nothing (its hunks are in the frontend lines; this REQ's are in the backend `api/` bullet and the API/Pagination lines).

### ARCH-001: Paging convention says "reuse parseAlumniSearch", but only the alumni part is exported for reuse

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/businessLogic/src/validation.ts:1194-1225`, `.adlc/context/conventions.md` (Pagination) |
| Category | pattern |
| Rule broken | conventions.md API conventions, Pagination (REQ-005) |

**What:** `parseAlumniSearch` mixes alumni filters with generic paging; the generic part (`pagingNumber`, `singleQueryValue`) is private, and `AlumniPaging`/`AlumniPage` in `AlumniQuery.ts:1602-1610` are alumni-named. The convention tells the next list to "reuse it".
**Why it matters:** The second paged list (posts feed, users) will copy the block or bend `AlumniSearch`. Convention text and code disagree.
**Recommendation:** Do not add an ADR; the convention is enough. Either reword the convention to "copy the shape" now, or when the second list lands export `parsePaging(query)` and make dal `Paging`/`Page<T>` generic. Not needed in this REQ.
**References:** conventions.md Pagination; [[architecture/adr-05-backend-tests-vitest-supertest|ADR-05]] (no rule on this; convention only).

### ARCH-002: Search filter types live in `AlumniQuery.ts`, not next to the other field types in `dto/`

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/dal/query/AlumniQuery.ts:1595`, `packages/backend/src/dal/index.ts:1385` |
| Category | pattern |
| Rule broken | Established pattern: shared input types in `dal/dto/RegisterDTO.ts` (`AlumniEditableFields`, `UserBasicsFields`) |

**What:** `AlumniSearchFilters` is exported from a Query file; the other types businessLogic imports from dal come from `dto/`.
**Why it matters:** `dal/index.ts` now has two homes for types that businessLogic depends on; the next Query will pick either. The dependency direction itself is fine (business logic to dal, type-only).
**Recommendation:** Move the three types to a `dto/` file (e.g. `dto/AlumniSearchDTO.ts`) and re-export from `index.ts` as now. Optional; leave if you prefer the types beside the SQL that uses them.
**References:** `dal/dto/RegisterDTO.ts`; CLAUDE.md dal bullet ("`dto/*` shape passed into Query methods").

### ARCH-003: `AlumniListItem` hides email only in the type; the guarantee lives in `LIST_COLUMNS`

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/shared/src/types/alumni.types.ts:1744`, `AlumniQuery.ts:1590` |
| Category | contract |
| Rule broken | CLAUDE.md "Shared types": keep dal and shared in sync manually |

**What:** Shared `AlumniListResponse` and dal `AlumniPage` (items typed `AlumniDTO[]`, which has optional `email`) are two hand-kept copies of one shape; nothing ties "no email" in the type to the SQL column list.
**Why it matters:** Someone adding `u.email` to `LIST_COLUMNS` breaks the privacy contract without a type error. The query test at `AlumniQuery.test.ts:1472` does catch it, so this is covered; only the type surface can drift.
**Recommendation:** No code change needed now. Keep the `not.toMatch(/email|password/)` test as the guard, and note in the next shared-type change that it is the only guard.
**References:** CLAUDE.md "Shared types"; conventions.md API conventions (list items never include `email`).

### Round 2 re-review

- **ARCH-001: resolved.** conventions.md Pagination now says `parseAlumniSearch` is alumni-specific, names the private helpers, and says to export or extract `parsePaging` when the second list arrives. Text matches code.
- **ARCH-002: resolved.** The types moved to `dal/dto/AlumniSearchDTO.ts` (type-only import of `AlumniDTO`, no cycle); `dal/index.ts` re-exports them with `export type`; the old `AlumniPage` export from `AlumniQuery` is gone and no other `AlumniPage` reference remains.
- **ARCH-003: resolved.** `AlumniListRow = Omit<AlumniDTO, "email">` now ties the type to the privacy rule, and a comment points to `AlumniListResponse` in shared. The SQL test is still the guard for the column list.
- **Shared type change (graduation_year to `number | null`): checked, nothing.** No frontend code reads `Alumni.graduation_year` (the only frontend hits are the register form's own `expected_graduation_year` string). It matches the INTEGER column and dal.
- **ARCH-004 (new, minor, optional): string-typed graduation_year remains in `RegisterDTO.ts` (lines 12, 51, 73: `AlumniProfileFields`, `AlumniEditableFields`, `MyProfileRow`) and `UserManager.ts:43` (`UpdateMyProfileInput`).** These carry validated input strings that `AlumniManager` converts with `Number()`, and `MyProfileRow` reads from the DB, so the same string-vs-INTEGER mismatch exists there. Not worth fixing in this REQ; log it as a follow-up (type `MyProfileRow.graduation_year` as `number | null`, then convert at the Manager boundary). Note the `AlumniDTO` constructor takes `number` while `AlumniDTO.graduation_year` allows `null`, harmless.

Round 2 result: 0 critical, 0 major, 1 minor (ARCH-004, follow-up), 0 trivial.

## Reflection findings

Written by: reflector (tier: balanced)

**Summary:** Checked 21 lessons (0 superseded), 16 gotchas, 5 accepted ADRs, backend and frontend component pages, and the user-facing docs the dispatch named. 4 findings: 0 critical, 0 major, 3 minor, 1 trivial. Code respects ADR-05, L-REQ-003-1..5, G13, G14 and G15. Biggest: the vault wrongly says `graduation_year` is `VARCHAR(10)`; the code is right (the live column is `integer`), but the shared type and DTO still say `string`.
**Dispatch answers:** G14 (404 for bad ids vs 400 for bad paging): checked, nothing; `requireId` is not used on this route, and conventions.md → Pagination documents the 400s. G15 / graduation_year type: see REFL-001. Docs sweep (CLAUDE.md, conventions.md, shared types): checked, nothing; all three already describe `{ items, total }` and the new params. `components/backend.md`: see REFL-002. Docs likely affected: none beyond REFL-002.

### REFL-001: Vault and types disagree about graduation_year (integer in the DB)

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/dal/query/AlumniQuery.ts` (`a.graduation_year = $n`); `packages/shared/src/types/alumni.types.ts:7`; `dal/dto/AlumniDTO.ts:6` |
| Category | vault-stale |
| Vault reference | [[knowledge/gotchas#^g15|G15]]; exploration.md section 5 |

**What:** The exploration report says `graduation_year VARCHAR(10)`. The base schema in `db/backups/pre_bolt20_20261003_220745.sql` says `integer` (migration 003 only renames the column). The new filter binds a number (`graduationYear: 2020`), which is correct for `integer`.
**Why it matters:** G15 warns that schema facts live only in backups. A later REQ that trusts the VARCHAR claim (or the `string` type on `Alumni`/`AlumniDTO`) will bind strings or compare against string items; the API actually returns numbers in `items[].graduation_year`.
**Recommendation:** Add a line to G15 (or a new gotcha): `alumni.graduation_year` is `integer` while shared `Alumni` and `AlumniDTO` type it `string`; the new filter relies on the integer. Decide at wrapup whether to fix the types (separate REQ). Not a code change here. The mocked tests cannot catch a type mismatch; see CAND-004.

### REFL-002: backend component page does not mention the search query pattern

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/knowledge/components/backend.md:15` |
| Category | missing-vault-page (component drift) |
| Vault reference | [[knowledge/components/backend]] |

**What:** The `dal/` line says "all SQL; user reads select PUBLIC_USER_COLUMNS". It says nothing about `AlumniQuery.searchAlumni` (constant fragments, one params array, a second count query sharing the WHERE, `escapeLike`) or `parseAlumniSearch` in businessLogic. conventions.md → Pagination covers the HTTP side only.
**Why it matters:** The next paged list (posts, comments) will re-derive this builder and may re-hit the ESCAPE trap.
**Recommendation:** At `/wrapup` step 3, add two lines to `backend.md` and link the ESCAPE gotcha (CAND-001). Needs-decision, not a fix round.

### REFL-003: graduationYear range check re-derived instead of reused

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/businessLogic/src/validation.ts:1213-1220` |
| Category | re-derivation |
| Vault reference | [[knowledge/gotchas#^g14|G14]] (shared validators in `validation.ts`) |

**What:** `parseAlumniSearch` repeats the `^\d{4}$`, 1900, now+10 test that `optionalYear` (line 1087) already holds. The exploration report said to reuse `optionalYear`. The only difference is the 400 message (`graduationYear is not valid`) and returning a number.
**Why it matters:** Two copies of the year rule drift (the `now + 10` bound changed once for students already: `requiredExpectedYear`).
**Recommendation:** Call `optionalYear(value, "graduationYear")` and `Number()` the result, or pull the range into one `isValidYear` helper. The tests in validation.test.ts already pin the bounds, so the change is safe.

### REFL-004: DTO import casing now matches git (positive, no action)

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/backend/src/dal/dto/AlumniDTO.ts:1` (and Comment, Post, User DTOs) |
| Category | concept-drift |
| Vault reference | candidate CAND-001 in lesson-candidates.md |

**What:** The diff changes four imports to `./baseDTO` to match the tracked filename; this unrelated edit rides in a search REQ. Correct for fresh clones (TS1261). It does leave `BaseDTO.ts` on disk in the main checkout out of step with git on case-insensitive macOS.
**Why it matters:** Mention in the PR body so the reviewer is not surprised; the cleaner fix is a git-level rename to `BaseDTO.ts`.
**Recommendation:** Keep, and note it in `pr-draft.md`. Promote the gotcha (CAND-001).

## UI/UX findings

_(no UI surface: the frontend does not call GET /api/alumni (checked: services/ has only authApi). ui-reviewer not dispatched.)_

### Round 2 re-review

- REFL-001 (-> m7): resolved. `Alumni.graduation_year` and `AlumniDTO.graduation_year` are now `number | null`, matching the INTEGER column; `createAlumni` passes `Number()`.
- REFL-003 (-> m2): resolved. `parseAlumniSearch` calls `optionalYear` (validation.ts:155); the year rule has one copy.
- REFL-002, REFL-004: wrap-up, unchanged.
- NEW REFL-005 (minor, concept-drift): the shared types now disagree on one field. `Alumni.graduation_year` is `number | null` (alumni.types.ts:6), but `MyProfile`/edit payload (alumni.types.ts:49, 73) and `RegisterInput` (user.types.ts:31) keep `graduation_year?: string`. The API sends a number and accepts text. Add a one-line comment on those string fields ("request/edit text; response is a number") or record it as a gotcha. No frontend code consumes the field yet, so nothing breaks today.
- Pagination wording in conventions.md matches code (`DEFAULT_PAGE_SIZE`, `MAX_PAGE_SIZE`, `MAX_PAGE`, private `singleQueryValue`/`pagingNumber`, shared max constants). No drift. CLAUDE.md and the backend component page need no change.
- No lesson repeat found in the round-2 diff. CAND lessons stay for wrap-up.
