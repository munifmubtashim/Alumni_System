# Architecture adversary — REQ-003-backend-route-auth

Written by: architecture-adversary (tier: balanced), dispatched sub-agent.

| Field | Value |
|---|---|
| Generated | 2026-10-05 |
| Trigger | sensitive-surface (auth) + new-adr |
| Verdict | found problems |

**Summary:** Read spec, architecture, 5 tasks, ADR-05, and the route/controller/manager/query code. 13 AC checked, 1 AC contradicts the design (AC4), 8 findings: 0 critical, 1 major, 7 minor. Biggest: `router.use(authMiddleware)` makes removed routes return 401 without a token, but AC4 and the test plan say 404 with or without a token.

Dispatch questions: identity-from-body spots: checked, nothing missed (posts, alumni, comments, me all covered). IDOR on PUT/DELETE users/alumni: checked, nothing (owner/admin checks already in the managers). Admin creation: ADV-005. Token claims: ADV-003. JWT_SECRET missing: ADV-007. vi.mock/alias with `@alumni/api/controllers/UserController`: checked, nothing (the symlink resolves to real source under `packages/backend/src/api`, Vite adds `.ts`, so it is inlined and mockable; TASK-001's early smoke test is the right safety net). Express 4.22 walker: ADV-002. Task ordering/file conflicts: checked, nothing (002 and 003 touch disjoint files; `dist/` is gitignored). AC without a task: none.

## Findings

### ADV-001: Removed routes return 401 without a token, contradicting AC4

| Field | Value |
|---|---|
| Severity | major |
| Confidence | high |
| Lens | contradiction |
| Where | spec AC4 vs `architecture.md` §Approach; `tasks/TASK-004.md` routes.test |

**What:** AC4 and TASK-004 say removed routes give 404 "with and without a token". But `router.use(authMiddleware)` runs before route matching inside the router, so `GET /api/users/email/a@b.c` and `PUT /api/users/1/login` with no token hit the middleware first and get 401. Only with a valid token do they reach Express's 404.
**Why it matters:** The test written to the AC fails, and the implementer will either weaken the middleware placement or silently change the test. The 401 is actually the better behaviour (it does not reveal which paths exist).
**Why this holds up:** I tried to find a router-level exemption or a mount order that avoids it. `UserRoutes`/`AlumniRoutes` have no fallthrough before `use`, and the paths do not match `/:id` (two segments), so no other layer answers first.
**Recommendation:** Change AC4 to "404 with a valid token, 401 without", and change the TASK-004 table the same way. Also say in AC2 that "all routes under /api/users…" includes unmatched paths.

### ADV-002: Guard test cannot see non-route handlers

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | testability |
| Where | `architecture.md` §Guard test; `tasks/TASK-004.md` routeGuard |

**What:** The walker lists only layers with `layer.route` and recurses into `layer.name === 'router'`. A later `app.use('/api/files', express.static(...))`, `app.use('/api/x', someHandler)` or a mounted sub-app has neither, so it is never probed, and AC12 ("fails if any route can be reached without a token") passes.
**Why it matters:** The stated goal is that nothing unprotected can ship silently.
**Why this holds up:** Probing behaviour (401 check) is good for real routes, but I found no step that checks the other layers.
**Recommendation:** In the walker, collect top-level non-route, non-router layers and assert their names are in a short allowlist (`query`, `expressInit`, `corsMiddleware`, `jsonParser`). Anything else fails with "unrecognised middleware, add it to the guard". Also tighten the count floor: the real total after removals is 23, not ≥22.

### ADV-003: Admin gate trusts the role claim for up to an hour

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | omission |
| Where | `architecture.md` §Approach (requireRole); spec non-goals |

**What:** `requireRole` and the post/comment owner-or-admin checks use `role` from the JWT (`UserController.signToken`, 1h life). A demoted admin, or an admin deleted via `DELETE /api/users/:id` (cascade removes their rows), keeps admin power on `GET/POST /users`, `DELETE /users`, and post/comment deletion until the token expires. A deleted user's token also still passes `authMiddleware`.
**Why it matters:** Revocation is a stated non-goal, but this REQ is what makes the role claim the single gate on user creation, so the consequence should be written down.
**Why this holds up:** The 1-hour cap limits it, and there is no demote route today, so the demote case is DB-only. Not a bug in the plan, an unstated trade-off.
**Recommendation:** Accept and record it in the ADR/conventions ("role is trusted from the token for up to 1h"). If not accepted, have `requireRole("admin")` re-read the role from `users` (one cheap query).

### ADV-004: `POST /api/alumni` lets any role create an alumni profile

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | omission |
| Where | spec route table; `tasks/TASK-003.md` createAlumni |

**What:** Spec says "any signed-in user, for themselves". A student (or admin) can POST and appear in the alumni directory. `updateMe` also switches behaviour when `has_alumni_profile` is true (`student = !alumni && ...`), so a student's student-field edits stop applying. Body fields still go in unvalidated (`validateAlumniFields` exists but is not used here).
**Why it matters:** Role-based trust in a directory of alumni; the spec itself says register already creates the row and this route is "rarely needed".
**Why this holds up:** `alumni.user_id` is UNIQUE, so one row per user, which limits spam but not the role mix-up.
**Recommendation:** Restrict to `requireRole("alumni")` or remove the route (AC4 style); at minimum run `validateAlumniFields` in the manager. State the choice in the spec.

### ADV-005: `POST /api/users` stays unvalidated even though it is the only admin-creation path

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | omission |
| Where | `tasks/TASK-003.md`/`TASK-004.md` (no change to `UserController.createUser`) |

**What:** `createUser` passes `role` straight from the body, no allowlist, no email or password check. An admin typo like `"Admin"` (migration 003 had to lowercase roles once already) makes an account that fails every `requireRole("admin")` and `=== "admin"` check. A missing password gives a bcrypt error that returns 400 with the raw message.
**Why it matters:** The route table now calls this "the only way to create an admin", so its input rules matter.
**Why this holds up:** Admin-only access limits who can misuse it, but not honest mistakes.
**Recommendation:** Add a manager-side check: role in `{admin, alumni, student}`, `requiredEmail`, `validateNewPassword` (all exist in `validation.ts`), and a test.

### ADV-006: AC7/AC8 tests partly prove nothing

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | testability |
| Where | `tasks/TASK-002.md` unit tests; `tasks/TASK-004.md` no-password check; `architecture.md` §Tests |

**What:** (a) "admin edit does not change author" is tested by asserting the manager does not pass a different `user_id` to a fake `PostQuery`. The guarantee is really the SQL in `PostQuery.updatePost`, which has no test. (b) The HTTP "no `password` key" check runs on fakes that the test itself writes, so it cannot fail. Only the `UserQuery.test.ts` SQL-string check is real, and a regex on `*`/`password` is easy to dodge (`SELECT u.*`, a template constant).
**Why it matters:** AC8 is the headline security fix and could regress with all tests green.
**Why this holds up:** The `UserQuery` test does cover the three named methods, so the risk is partial, not total.
**Recommendation:** Add a `PostQuery.test.ts` asserting the UPDATE SQL has no `user_id` assignment. Drop the HTTP password assertion or mark it as a smoke check. In `UserQuery.test.ts`, assert the exact column list equals `PUBLIC_USER_COLUMNS` instead of grepping for `password`.

### ADV-007: Missing `JWT_SECRET` fails closed but looks like a session expiry

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | failure-mode |
| Where | `UserController.ts:7` (not in blast radius docs) |

**What:** `JWT_SECRET` is read once at module load, and only works because `dal/config/db.ts` happens to run `dotenv.config` first (ESM evaluates imports before `app.ts` runs its own `dotenv.config`). If it is missing, `jwt.verify` throws, so every authed route returns 401 (not a forgery). Login then 500s. The frontend (ADR-03) treats a 401 on a tokened request as an expired session, so users are bounced to login with no server-side clue.
**Why it matters:** This REQ puts nearly every route behind that check, so one bad env var now breaks the whole app quietly.
**Why this holds up:** It cannot be exploited to bypass auth (jsonwebtoken rejects an undefined/empty secret), so impact is availability and debuggability only.
**Recommendation:** In `server.ts`, exit with a clear message if `JWT_SECRET` is empty. Add one line to TASK-001 notes that the test secret comes from `test.env`.

### ADV-008: `updatePost`/`createNewPost` rules are guessed

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | omission |
| Where | `tasks/TASK-002.md` Approach and Notes |

**What:** The task adds a new rule (create needs caption or media, 400 otherwise) that the spec never asked for, with made-up max lengths (5000/2048); the `posts` table columns are plain `text`, so there is no limit to match. It says nothing about `updatePost` with both fields missing, which today writes NULL over both.
**Why it matters:** The implementer will guess; it is a behaviour change outside the spec's goal.
**Why this holds up:** The frontend has no posting UI yet, so no live caller breaks.
**Recommendation:** Either drop the new validation from this REQ, or state it in the spec as an AC and define update semantics (reject an update with neither field).

## Coverage

- **Lenses run:** omission, failure-mode, hidden-coupling, rollback, contradiction, testability
- **Lenses skipped:** ux-consistency (no UI surface), cross-repo (single repo). Rollback: routes/code only, no schema change, revertible by git; nothing found.
- **Acceptance-criteria coverage:** AC1 checked, AC2 checked (see ADV-001), AC3 checked, AC4 checked (ADV-001), AC5 checked, AC6 checked (ADV-004), AC7 checked (ADV-006), AC8 checked (ADV-006), AC9 checked, AC10 checked, AC11 checked, AC12 checked (ADV-002), AC13 checked (TASK-005).
