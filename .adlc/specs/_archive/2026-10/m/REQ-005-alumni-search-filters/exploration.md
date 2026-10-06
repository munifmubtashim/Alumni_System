# REQ-005 — Codebase exploration

| Field | Value |
|---|---|
| Generated | 2026-10-06 |
| By | codebase-explorer |
| Repo(s) scanned | alumni-system |

---

## 1. Similar existing implementations

| Path | What it does | Recommended action |
|---|---|---|
| `packages/backend/src/dal/query/PostQuery.ts` `getAllPosts(limit, offset)` | Fetches posts with pagination: `SELECT ... FROM posts JOIN users ... ORDER BY created_at DESC LIMIT $1 OFFSET $2` | Follow — same LIMIT/OFFSET pattern and parameterization |
| `packages/backend/src/businessLogic/src/validation.ts` `requireId`, `optionalText`, `optionalYear` | Validates individual fields and ids, raises `AppError(400, ...)` on type/length/range errors | Reuse — `optionalText` for `q`, `optionalYear` for `graduationYear`, `MAX_DB_ID` for bounds |
| `packages/backend/src/businessLogic/src/validation.ts` `EMAIL_PATTERN` test + `requiredEmail` | Pattern-based validation with a dedicated test | Follow pattern for escaping `%` and `_` in `q` (AC2: matched literally, not as LIKE wildcards) |
| `packages/backend/src/dal/query/PostQuery.ts` `updatePost(id, patch)` | Dynamic SET clause built from an allowlist: `for (const col of PATCH_COLUMNS) { if (hasOwn) sets.push(`${col}=$${params.length}`) }` | Follow — WHERE clause built from a fixed list of filter fragments instead |
| Express 4 `req.query` behavior | Repeated params become arrays: `?q=a&q=b` → `{ q: ['a', 'b'] }` | Check for — AC6 requires rejecting repeated params with 400 |

---

## 2. Blast radius

| Path | Why touched | Risk |
|---|---|---|
| `packages/backend/src/dal/query/AlumniQuery.ts` `getAllAlumni()` | Rewrites to accept 7 parameters and return `{ items: AlumniDTO[], total: number }` instead of `AlumniDTO[]` | **high** — changes method signature and return type |
| `packages/backend/src/businessLogic/src/AlumniManager.ts` `getAllAlumni()` | Adds validation layer: calls `optionalText`, `optionalYear`, `validatePageParams` (new); passes params to query; returns the envelope | **high** — signature and return type change |
| `packages/backend/src/api/controllers/AlumniController.ts` `getAllAlumni()` | Parses `req.query` into params (q, department, university, graduationYear, page, pageSize); passes to manager; responds with `res.json(envelope)` | **med** — adds logic but only to one controller method |
| `packages/backend/src/api/routes/AlumniRoutes.ts` | No code changes; route already protected by `authMiddleware` (line 14) — AC8 checks it still does | **low** — verify, don't modify |
| `packages/backend/src/dal/query/AlumniQuery.test.ts` | Adds test cases for new method signature and each filter combination, wildcard escaping, and paging | **med** — new test file content |
| `packages/backend/src/businessLogic/src/AlumniManager.test.ts` | Adds tests for validation (400 on bad page/pageSize/graduationYear), defaults, combination filters | **med** — new test cases inside existing file |
| `packages/backend/src/api/routes/routes.test.ts` lines ~225-240 | Updates mock for `getAllAlumni` to return `{ items: [], total: 0 }` instead of `[]`; response shape assertions if any | **med** — change mock return and possibly assertions |
| `packages/backend/src/api/routes/routeGuard.test.ts` | No change needed — route already guarded, just verify test still passes | **low** |

---

## 3. Integration points

### Entry point (Express route)
- **Current:** `GET /api/alumni` → `AlumniRoutes.ts` (line 16) → `getAllAlumni` export → `AlumniController.getAllAlumni(req, res)`
- **Change:** Controller reads `req.query` (Express 4 parsing: `{ q?: string, department?: string, ... }`), validates each param via business logic, calls `manager.getAllAlumni(validatedParams)`, sends envelope via `sendError` on any `AppError`
- **Auth:** Route already under `router.use(authMiddleware)` (line 14) — stays protected; no new middleware needed

### Validation layer
- **Reuse:** `optionalText(value, fieldName, maxLen)`, `optionalYear(value, fieldName)`, `MAX_DB_ID` from `packages/backend/src/businessLogic/src/validation.ts`
- **New helpers in validation.ts:** 
  - `validatePageParams(page, pageSize)` — ensures page ≥ 1, pageSize 1–100 (AC5–AC6), or throws `AppError(400, ...)`
  - Optional: `escapeWildcards(text)` to escape `%` and `_` in `q` so they match literally (AC2)

### SQL patterns
- **Fixed filter fragments approach (like `PostQuery.updatePost`):** Build WHERE clause from predetermined conditions only
  - Example: `const whereFragments = []; const params = [];` then for each filter: `if (q) { whereFragments.push(...); params.push(...) }`
  - JOIN `users` for `name` (already done); search `name`, `current_company`, `job_title` (AC2)
  - Case-insensitive: use `LOWER(...)` or `ILIKE` (Postgres supports both; check schema for collation)
  - Full-match filters: exact (case-insensitive) for `department`, `university` (joined from `users`); exact for `graduation_year` (AC3)
- **Paging:** `LIMIT $X OFFSET $Y` (not id-based cursor; AC5)
- **Total count:** Separate `SELECT COUNT(*)` **before** applying LIMIT (same WHERE, different SELECT)

### Error handling
- `AppError(400, message)` for validation errors — caught by controller's `sendError`, responds 400 `{ message }`
- 401 unchanged: middleware rejects missing/bad token before the controller runs

### Response envelope
- Current: `res.json(alumni)` sends the array directly
- New: `res.json({ items, total })` — AC1 requires both fields

### Shared type shape
- `/packages/shared/alumni.types.ts` — architect to verify type surface (spec assumes list rows have same fields as today's array; new response is `{ items: AlumniDTO[], total: number }`)
- **Status:** `STATUS: needs verification` in spec (AC1 says "each item has the same fields as today's list rows") — should be confirmed at architect gate

---

## 4. Test coverage

| Test file | Scenarios covered | Gaps for new code |
|---|---|---|
| `packages/backend/src/dal/query/AlumniQuery.test.ts` | Currently: `findAlumniByUserId` only (lines 9–34) | **Needs:** `getAllAlumni` with each filter individually (q, department, university, graduationYear), combinations, wildcard escaping (`%`, `_`), paging (LIMIT/OFFSET correctness, page past end), COUNT vs items query, SQL shape assertions (no `password` in JOIN; parameter ordering) |
| `packages/backend/src/businessLogic/src/AlumniManager.test.ts` | Currently: `createAlumni`, `findAlumniById`, `updateOwnAlumni` (lines 18–143) | **Needs:** `getAllAlumni` validates page/pageSize (non-numeric, ≤0, >100 → 400), defaults page=1/pageSize=20, trims and ignores empty `q`, case-insensitive matches, rejects `graduationYear` if not 4-digit, rejects values over length limits, rejects repeated params; returns envelope `{ items, total }` from query |
| `packages/backend/src/api/routes/routes.test.ts` lines ~225–240 | Currently: mocks `getAllAlumni().mockResolvedValue([] as never)` (line 239); tests "any signed-in user may call" (line 222) and response is 2xx (line 251–255) | **Needs:** mock updated to `{ items: [], total: 0 }` (return type change); optionally test response shape includes `items` and `total` fields; 400 on bad query params (if tested at route level); query params passed to manager |
| `packages/backend/src/api/routes/routeGuard.test.ts` | Current: scans Express app for protected routes; asserts 401 without token (lines 31–35) | No change — guard test will auto-check GET /api/alumni still requires auth (already does) |

### Test structure notes
- **Query tests:** Mock `pool.query` (already mocked globally in `src/test/setup.ts`, [[knowledge/gotchas#^g13|G13]]); capture and assert on SQL text + params via `vi.mocked(pool.query).mock.calls[n]`
- **Manager tests:** Mock `@alumni/dal` (via `vi.mock('@alumni/dal', ...)`); keep real `AlumniDTO`; assert manager calls query with validated params
- **Route tests:** Mock `@alumni/businesslogic` (keep real `AppError`); assert on response status, body shape, and which manager method was called with which args

---

## 5. Schema and database facts

- **Alumni table columns** (from migrations 001 and 003):
  - `id SERIAL PRIMARY KEY`
  - `user_id INTEGER NOT NULL UNIQUE REFERENCES users(id)`
  - `department VARCHAR(100)` — optional; case-insensitive match (AC3)
  - `graduation_year VARCHAR(10)` — optional; stored as string (AC3: exact 4-digit year match)
  - `current_company VARCHAR(100)` — optional; searchable by `q` (AC2)
  - `job_title VARCHAR(100)` — optional; searchable by `q` (AC2)
  - Other columns: `experience`, `bio`, `linkedin_url`, `created_at`, `updated_at`

- **Users table columns** (joined for reads):
  - `name VARCHAR(100)` — searchable by `q` (AC2)
  - `university VARCHAR(150)` — filterable by exact case-insensitive match (AC3)
  - `photo_url` (optional)

- **Current SQL pattern (AlumniQuery.getAllAlumni):**
  ```sql
  SELECT a.*, u.name, u.photo_url, u.university 
  FROM alumni a 
  JOIN users u ON a.user_id = u.id 
  ORDER BY u.name
  ```
  Used columns: `LIST_COLUMNS` (line 5) — reuse this select list for filtered queries

- **Case-insensitive search:** Postgres default collation is `C` or `en_US.UTF-8`; use `LOWER(...)` or `ILIKE` operator (AC2: literal `%`, `_` matching → escape them in LIKE, or use `ILIKE` with escaped string)

- **No indexes yet:** AC25 explicitly says "No new database columns or indexes" — constraint is no migration in this REQ

---

## 6. Documentation that will go stale

- **`conventions.md` § API conventions:**
  - Line 38: "Pagination: _(cursor vs offset, page size limits)_" — once REQ-005 lands, should document offset-based paging, defaults, and max page size
  - Current response format docs (line 35): "success bodies are the resource or list itself" — updating to show `{ items, total }` envelope for paginated list endpoints

- **`context/project-overview.md` or architecture docs:** If any section describes `GET /api/alumni` response shape, it needs updating from array to `{ items, total }`

- **Backend component page** (`knowledge/components/backend.md`): Currently says "query/*Query.ts hold the raw parameterized SQL" — consider noting the dynamic WHERE pattern once the code is written

---

## 7. Vault references

Key references that apply:

- **[[knowledge/gotchas#^g14|G14]]** — `requireId` answers 404 (not 400) for malformed id. Not directly used in this REQ (no `:id` in the query params), but the validation pattern it sets (404 vs 400) shapes how we handle id validation elsewhere.

- **[[knowledge/gotchas#^g15|G15]]** — Base schema constraints live only in backups, not migrations. The `alumni` table has a `UNIQUE (user_id)` constraint and `users` has a role, but we don't insert/delete in this REQ, so no 23505/23503 handling needed here.

- **[[knowledge/gotchas#^g13|G13]]** — Backend tests mock the pg pool by resolved source path; the one mock at `src/test/setup.ts` covers all query files. When writing `AlumniQuery` tests, assert on `pool.query` calls directly.

- **[[architecture/adr-05-backend-tests-vitest-supertest|ADR-05]]** — Backend test strategy: HTTP tests mock Managers (keep real `AppError`), Manager tests mock Queries, Query tests mock the pool and assert SQL + params. This REQ touches all three levels.

- **[[knowledge/lessons/LESSON-REQ-003-1-partial-mocks-of-workspace-packages|L-REQ-003-1]]** — Partial mocks of workspace packages: `vi.mock` with `importOriginal` to keep some classes real while faking others.

- **[[knowledge/lessons/LESSON-REQ-003-2-protect-at-router-prove-with-walker|L-REQ-003-2]]** — Auth protection lives at the router level (`router.use(authMiddleware)`), not per route. The route guard test proves it.

- **[[knowledge/lessons/LESSON-REQ-003-3-migrate-every-handler-in-a-touched-file|L-REQ-003-3]]** — When editing a file with multiple handlers, migrate every one (error handling, response shape). Here: `getAllAlumni` is the only handler being changed in `AlumniController`, but check if its error path (sendError) is consistent with the rest of the file.

---

## 8. Open questions

None identified in the spec; all requirements are explicit. Two points for the architect to verify at the design gate:

1. **Shared type shape** — confirm the frontend has or will create a type for `{ items: AlumniDTO[], total: number }` response (spec says current response is an array; changing to an envelope is backward-incompatible).

2. **Wildcard escaping in `q`** — SQL approach: `ESCAPE '\'` in the LIKE clause, or `REPLACE(q, '%', '\%') REPLACE(q, '_', '\_')`? Or use raw `ILIKE` and trust Postgres to handle the escaping? (Current code has no `LIKE` patterns to reference.)

