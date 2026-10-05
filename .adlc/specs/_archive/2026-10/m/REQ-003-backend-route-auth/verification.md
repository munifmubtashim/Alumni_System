# REQ-003-backend-route-auth — Verification

| Field | Value |
|---|---|
| Generated | 2026-10-05 |
| Work path | /Users/munifmubtashim/Alumni_System |
| Isolation | branch |
| Branch | feat/REQ-003-backend-route-auth |
| Files changed | 47 (incl. 13 vault files in the REQ folder) |
| Commits | 1 (e15fe2d5) |
| Base | redesign |

Full reviewer narratives: `review-log.md` — not loaded by later phases; open on demand.

## Summary

- **Round 5:** AC14 (partial post update) done and confirmed. Open: 0 critical · 1 major (M1 vault) · 2 minor (m10, m11 vault) · 2 trivial (t2 vault, t6 polish). Backend 260 tests + typecheck; frontend 403.
- **Round 4:** m15, t5 resolved; docs match code. Open: 0 critical · 1 major (M1 G02, vault) · 3 minor (m4 follow-up REQ; m10, m11 vault) · 1 trivial (t2 wording, vault). All open items are wrap-up or follow-up. Backend 244 tests + typecheck; frontend 403.
- **Round 3:** 5 fixes confirmed resolved. New: m15 (login leaks raw error text + docs mismatch), t5 (test style, redundant root bcrypt). Open now: 0 critical · 1 major (vault) · 4 minor (m4 follow-up, m10, m11 vault; m15) · 3 trivial. Backend 242 tests + typecheck; frontend 403.
- **Round 2:** 9 fixes confirmed resolved. New: 3 minor (m12–m14), 2 trivial (t3, t4). Open now: 0 critical · 1 major (vault) · 6 minor · 4 trivial. Tests: backend 234 pass + `typecheck`; frontend 403 pass.
- **Round 1 counts:** 0 critical · 1 major · 10 minor · 2 trivial (after merging 20 reviewer findings). No ADR conflicts; no repeated lesson mistakes. 401 stays token-only (ADR-03, L-REQ-002-1).
- **Pattern:** the auth change itself held up under all four reviewers. Most findings sit in *untouched* handlers of edited controllers: `{error}` vs `{message}` bodies, raw DB text, everything-is-404. The root cause is the deferred shared error middleware. m1–m3 are one cleanup.
- **Needs your call (5):** M1 G02 out of date (vault) · m4 partial post update erases media (spec non-goal) · m10 index/component page · m11 stale diagram · t2 "owner-or-admin" wording. The vault items are wrap-up work.
- **UI:** ui-reviewer not dispatched. No screen consumes a changed route (frontend calls only `/auth/login`, `/auth/register`, `/me`; all unchanged).
- **Packet:** 163KB (over the 120KB target, under the 250KB ceiling). The first build was 496KB: `**/package-lock.json` in `review.packet.exclude` doesn't match the root lockfile without git's `:(glob)` magic. Rebuilt with glob excludes.

## Findings at a glance

| ID | Severity | Finding (one line) | Where | Effort | Fix |
|----|----------|--------------------|-------|--------|-----|
| M1 | major | Gotcha G02 is out of date: vitest/vite now install only at the root | .adlc/knowledge/gotchas.md ^g02 | small | your call (vault) |
| m1 | minor | `GET`/`DELETE /api/users/:id`: missing user → 200 (spec rule: 404); non-numeric id → raw pg error | UserController.ts, UserManager.ts | small | resolved, round 2 |
| m2 | minor | Untouched handlers return raw `error.message` as `{error}`; DB outage shows as 404 | User/AlumniController.ts | small | resolved, round 2 |
| m3 | minor | AppError→HTTP mapping pasted in 3 controllers (6 copies); make one shared `sendError` | api/controllers/* | small | resolved, round 2 |
| m4 | minor | `updatePost` with only a caption erases `media_url`; values cast, not checked | PostManager.ts | small | resolved, round 5 (AC14) |
| m5 | minor | api/dal tsconfigs still compile `*.test.ts`; no backend `typecheck` script (Vitest doesn't type-check) | api/dal tsconfig, backend package.json | small | resolved, round 2 |
| m6 | minor | Test gaps: `findAlumniByUserId` query, owner-only `updateOwnUser`/`updateOwnAlumni`, any-user routes only assert 2xx | tests | small | resolved, round 2 |
| m7 | minor | `routes.test.ts` hand-keeps a `PROTECTED` list the guard already derives; two `expectAppError` helpers | routes.test.ts | small | resolved, round 2 |
| m8 | minor | Password hashing split: controller (register, createUser) vs manager (changeMyPassword) | UserController.ts, UserManager.ts | small | resolved, round 2 |
| m9 | minor | `code === "23505"` re-typed in AlumniManager; UserManager already has `isUniqueViolation` | AlumniManager.ts:31 | trivial | resolved, round 2 |
| m10 | minor | `components/backend.md` still a stub; `index.md` lacks ADR-05 + backend rows | .adlc vault | small | your call (wrap-up) |
| m11 | minor | REQ diagram shows only the admin role gate; `POST /api/alumni` alumni gate missing | architecture.md | trivial | your call (wrap-up) |
| t1 | trivial | Leftovers: blank lines, `getAllAlumnil` typo, inconsistent `db` mock import paths | edited files | trivial | resolved, round 2 |
| m12 | minor | `UserManager` imports bcrypt, but `businessLogic/package.json` doesn't declare `bcrypt`/`@types/bcrypt` (works only via root hoisting); `login()` still hashes-compares in the controller | businessLogic/package.json, UserController.ts | small | resolved, round 3 |
| m13 | minor | `requireId` accepts ids > 2^31−1 → pg error → 500 instead of 404; `DELETE /users/:id` may hit a foreign-key error (23503) → 500 (posts/comments schema not in repo) | validation.ts:100, UserManager.deleteUser | small | resolved, round 3 |
| m14 | minor | Docs describe pre-fix code: CLAUDE.md:70 "own try/catch per controller"; Commands lacks `typecheck`/`typecheck:backend`; conventions.md omits `routeList.ts`, `expectAppError.ts`, `sendError` | CLAUDE.md, conventions.md | small | resolved, round 3 |
| t3 | trivial | `AlumniManager.test.ts` mixes `rejects.toMatchObject` and `expectAppError`; `expectAppError.ts` imports AppError by relative path, not `@alumni/businesslogic` | test helpers | trivial | resolved, round 3 |
| t4 | trivial | `typecheck` checks businessLogic source, never `dist/`; docs should say the rebuild warning still applies | CLAUDE.md | trivial | resolved, round 3 |
| m15 | minor | `/auth/login` catch sends `err.message` for any error without a status (pg/bcrypt text to an unauthenticated caller); conventions.md says login returns `{ token, user }` but it returns `{ token }` and omits MAX_DB_ID→404, delete→409, MeController's own sendError | AuthRoutes.ts:13, conventions.md:35 | trivial | resolved, round 4 |
| t5 | trivial | `UserManager.test.ts` still mixes `rejects.toMatchObject` with `expectAppError`; no test at the max id 2147483647; root package.json still declares bcrypt (now redundant) | tests, package.json | trivial | resolved, round 4 |
| t6 | trivial | AC14 polish: post deleted between ownership check and update → 200 empty body (one-line 404); patch loop duplicated in manager + dal (reuse `PostPatch`, `optionalNullableText`); no empty-patch guard in the dal; small test gaps | PostManager.ts, PostQuery.ts | trivial | your call (round 5, correctness + quality) |
| t2 | trivial | Docs say ownership is "owner-or-admin"; users/alumni are owner-only | CLAUDE.md, conventions.md | trivial | your call (wording) |

Round 5 (2026-10-06): m4 pulled in as AC14 at the review gate; fixed and confirmed by correctness + quality (SQL parameterized, allowlisted columns, user_id never set). New: t6 (trivial polish).

Round 4 (2026-10-06): m15, t5 confirmed resolved by the past-mistakes check; final docs-vs-code pass found 0 new mismatches.

Round 3 (2026-10-06): m12, m13, m14, t3, t4 confirmed resolved; new m15 (minor) and t5 (trivial).

Round 2 (2026-10-06): all 9 fixed findings confirmed resolved by their reviewers; 5 new (3 minor, 2 trivial). ARCH-006 (duplicate alias in two configs) noted, no action.

Reviewed by: correctness (balanced) · quality (balanced) · architecture (balanced) · reflector (balanced). All four reports carry a `Written by` line.

## Consolidated by severity

### Major (1)

#### .adlc/knowledge/gotchas.md ^g02 — G02 describes the old lockfile
- **Source:** reflector (REFL-001), checked by orchestrator: `package-lock.json` has only `node_modules/vitest`; no `packages/frontend/node_modules/vitest`.
- **What:** G02 says root `@types/node@20` forces vite/vitest under the frontend. Since backend added vitest they hoist to the root. The "@vitest/mocker without vite" failure is still real (TASK-001 hit it).
- **Recommendation:** rewrite G02 at /wrapup to describe the root layout and keep the regenerate-lock-entries fix. **Needs decision** (vault).

### Minor (10)

#### UserController.ts / UserManager.ts — m1 user lookups skip the shared id/404 rules
- **Source:** correctness (CORR-001)
- **Recommendation:** `UserManager.findUserById`/`deleteUser` use `requireId(id, "User")` and throw `AppError(404, "User not found")` on no row; controllers map via the shared helper (m3).

#### User/AlumniController.ts — m2 raw error text and blanket 404s · m3 duplicated mapping
- **Source:** correctness (CORR-002), quality (QUAL-001, QUAL-002), architecture (ARCH-002), reflector (REFL-003)
- **Recommendation:** one `sendError(res, error)` in `api/controllers/sendError.ts` (AppError → status + `{message}`, else 500 `{message: "Something went wrong"}`). Use it in every handler of Post/User/Alumni/Comment controllers. Deliberately not the error middleware (non-goal); it makes that later swap one step.

#### PostManager.ts — m4 partial update erases media · needs decision
- **Source:** correctness (CORR-003). Pre-existing behaviour; spec non-goal "post content rules". Fixing means `COALESCE`-style partial update plus type checks.

#### tsconfigs / package.json — m5 type-check coverage
- **Source:** quality (QUAL-003), architecture (ARCH-003)
- **Recommendation:** exclude `**/*.test.ts` and `**/test/**` in the api and dal tsconfigs (as businessLogic does); add `typecheck` to `packages/backend/package.json` that runs `tsc --noEmit` for all three packages, plus a typecheck config that includes tests so test files are checked too.

#### tests — m6 coverage gaps · m7 duplicated route list
- **Source:** quality (QUAL-004, QUAL-005), architecture (ARCH-004)
- **Recommendation:** add `AlumniQuery.test.ts` (`findAlumniByUserId`), owner-only tests for `updateOwnUser`/`updateOwnAlumni`, and assert the manager got the token's `sub` on any-user routes. Derive `routes.test.ts`'s no-token loop from the guard's walker (shared helper) and merge the two `expectAppError`.

#### UserController.ts — m8 hashing layer · AlumniManager.ts — m9 unique-violation helper
- **Source:** architecture (ARCH-001), reflector (REFL-002)
- **Recommendation:** move bcrypt hashing into `UserManager` (`register`, `createUser`), as `changeMyPassword` already does. Export `isUniqueViolation` from `businessLogic/src/errors.ts` and use it in both managers.

#### vault — m10 index/component · m11 diagram · needs decision (wrap-up)
- **Source:** reflector (REFL-004, REFL-005). /wrapup step 3 fills `components/backend.md`, adds `index.md` rows, and fixes the diagram.

### Trivial (2)
- t1 (quality QUAL-006): leftovers. Fix with m3.
- t2 (reflector REFL-006): ownership wording per entity. Wrap-up.

## Acceptance criteria check

- [✓] AC1 — login/register/health public; routes.test + guard allowlist
- [✓] AC2 — every other route 401 with no/bad/expired token; guard walks 23 routes
- [✓] AC3 — admin routes 403 for student/alumni, 2xx for admin
- [✓] AC4 — removed routes 404 signed in, 401 as guest; methods deleted (grep clean)
- [✓] AC5 — post author from token; body `user_id` ignored
- [✓] AC6 — alumni profile from token, validated, alumni-only (403 others), 409 on duplicate
- [✓] AC7 — post edit/delete owner-or-admin, 403 others, 404 missing, author kept (PostQuery SQL test)
- [✓] AC8 — no `password` in any response; user queries select exactly PUBLIC_USER_COLUMNS
- [✓] AC8b — `POST /api/users` validates name/email/password/role
- [✓] AC9 — `requireRole` without user → 401
- [✓] AC10 — `npm test` in packages/backend, no Postgres (208 pass)
- [✓] AC11 — tests cover AC1–AC9
- [✓] AC12 — guard test fails when a router loses auth (hand-checked in TASK-004)
- [✓] AC13 — CLAUDE.md + conventions.md updated (wording nit t2)
- [✓] AC14 — partial post update: omitted keeps, null clears, non-string 400, empty 400; 404/403 first (round 5)
- [✓] Spec status-code rule "target doesn't exist → 404" now holds for `GET`/`DELETE /api/users/:id` too (m1, fixed round 2)
