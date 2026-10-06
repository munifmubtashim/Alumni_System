# TASK-001 — AlumniQuery.searchAlumni with parameterized filters and paging

| Field | Value |
|---|---|
| REQ | REQ-005 |
| Tier | 0 |
| Status | done (typecheck blocked by pre-existing baseDTO casing, see Notes) |
| Repo | alumni-system (worktree .worktrees/REQ-005-alumni-search-filters) |
| Depends on | — |
| Blocks | TASK-003 |

## Goal

`AlumniQuery.searchAlumni(filters, { limit, offset })` returns `{ items, total }` using only bound parameters and fixed SQL fragments (spec AC1–AC5, AC7).

## Files to touch

| Path | Action |
|---|---|
| `packages/backend/src/dal/query/AlumniQuery.ts` | edit — add `searchAlumni`, `escapeLike` (module-private or exported for tests), types `AlumniSearchFilters`, `AlumniPage`; remove `getAllAlumni` once TASK-003 no longer calls it (leave it in place for now if TASK-003 hasn't run — TASK-003 deletes it) |
| `packages/backend/src/dal/index.ts` | edit — export the new types |
| `packages/backend/src/dal/query/AlumniQuery.test.ts` | edit — add cases per architecture.md → Test strategy |

## Approach

Exactly as architecture.md → "SQL (dal only)". **No `ESCAPE` clause** (ADV-001). Fragment table, `escapeLike` (\\, %, _ → prefixed with \\), `ORDER BY u.name, a.id`, `LIMIT/OFFSET` as params, a separate `COUNT(*)::int AS total` query with the same WHERE and params, both via `Promise.all`. Keep `LIST_COLUMNS`.

## Acceptance

- [x] Tests: the SQL contains no `ESCAPE`, and `q` containing `%`, `_` and `\` is sent with each of those prefixed by a backslash; no filters; each filter's fragment and param; all four together with correct `$n` numbering; `q` escaping; the count query shares the WHERE and params minus paging; result mapping; a test that sends `q = "x'); DROP TABLE users; --"` and asserts that text appears only in params, never in the SQL string
- [ ] `npm test` and `npm run typecheck` pass in `packages/backend` (run `npm install` at the worktree root first — it has no node_modules)

## Related

- Architecture: [[specs/2026-10/m/REQ-005-alumni-search-filters/architecture]]
- Gotchas: [[knowledge/gotchas#^g13|G13]] (pool mock)

## Notes

- Done 2026-10-06. `searchAlumni(filters, { limit, offset })` and exported `escapeLike` in `AlumniQuery.ts`; types `AlumniSearchFilters`, `AlumniPaging`, `AlumniPage` exported from `dal/index.ts` (`AlumniPaging` added beyond the task's list because TASK-003's manager needs to name the second argument). `getAllAlumni` left in place for TASK-003.
- Params are numbered by a local `next(value)` helper; the count query gets a copy of `params` taken before limit/offset are pushed, so it shares the WHERE and params exactly. `total` falls back to 0 if the count row is missing.
- 13 new tests in `AlumniQuery.test.ts` (16 in the file). `npm test`: 315/315 pass.
- `npm run typecheck` fails with TS1261 in `src/dal` and `tsconfig.test.json`, and it fails at HEAD too (checked by putting the HEAD versions of my two files back). Cause: git tracks `src/dal/dto/baseDTO.ts`, but four DTOs import `./BaseDTO`. The main checkout's disk file is `BaseDTO.ts` (macOS keeps the old casing), so it passes there and fails in any fresh checkout. Fix (out of scope): `git mv baseDTO.ts BaseDTO.ts` (via a temp name on macOS). `src/api` and `src/businessLogic` typecheck clean, and my files add no errors.
- architecture.md's Risks table still says "`escapeLike` + `ESCAPE '\'`". That line is stale. The Stress-test outcome (no ESCAPE clause) wins, and that's what was built.
