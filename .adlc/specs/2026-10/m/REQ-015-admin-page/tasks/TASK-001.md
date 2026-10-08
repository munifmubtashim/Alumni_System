# TASK-001 — Backend: optional sort/order on GET /api/alumni

| Field | Value |
|---|---|
| REQ | REQ-015 |
| Tier | 0 |
| Status | done |
| Repo | alumni-system |
| Depends on | — |
| Blocks | TASK-004 |

## Goal

GET /api/alumni accepts optional `sort` (name | graduationYear) and `order` (asc | desc), validated like the REQ-005 params, and orders server-side with a unique tie-break; absent sort keeps the exact current order.

## Files to touch

| Path | Action |
|---|---|
| `packages/backend/src/businessLogic/src/validation.ts` | edit |
| `packages/backend/src/businessLogic/src/validation.test.ts` | edit |
| `packages/backend/src/businessLogic/src/AlumniManager.ts` | edit |
| `packages/backend/src/businessLogic/src/AlumniManager.test.ts` | edit |
| `packages/backend/src/dal/query/AlumniQuery.ts` | edit |
| `packages/backend/src/dal/query/AlumniQuery.test.ts` | edit |
| `packages/backend/src/api/routes/AlumniRoutes.test.ts (or existing alumni route test)` | edit |
| `packages/backend/src/dal/dto/AlumniSearchDTO.ts` | edit (sort/order on the search filters type) (ADV-005) |
| `packages/shared/src/types/alumni.types.ts` | edit (AlumniSort, SortOrder) |

## Approach

- Extend `parseAlumniSearch` to return `sort` and `order` using the private `singleQueryValue` helper (repeated/nested → 400, empty → absent). Unknown value → 400 "Invalid sort" / "Invalid order". `order` without `sort` applies to name.
- In `AlumniQuery.searchAlumni`, map (sort, order) through a fixed object of SQL fragments: name → `u.name DIR, a.id DIR`; graduationYear → `a.graduation_year DIR NULLS LAST, u.name, a.id`. No caller text is ever interpolated. Absent sort → `ORDER BY u.name, a.id` exactly as today.
- Rebuild `@alumni/businesslogic` (`tsc` in that package) at the end so `dist/` is current (G32).

## Acceptance

- [x] Tests for valid, invalid, repeated, nested and empty sort/order values pass
- [x] Query tests pin each ORDER BY branch and the unchanged default
- [x] The directory (no sort param) behaves exactly as before; existing tests unchanged and green
- [x] `npm run test:backend` and `npm run typecheck:backend` pass

## Notes

The `total` count query must not change. Keep `%`/`_` escaping untouched (G21).

**Implementation (2026-10-08):**
- `sort`/`order` live on `AlumniSearchFilters` (ADV-005), plus `AlumniSort`/`SortOrder` types in the DTO, exported from `dal/index.ts` (one export line; needed so businessLogic can import them). Shared mirrors them in `alumni.types.ts`.
- The parser normalizes: if either param is given, the filters get both (`sort` defaults to `name`, `order` to `asc`); if neither, neither key appears, so `searchAlumni({}, …)` calls and the old default are unchanged. Values are trimmed, then matched exactly (case-sensitive: `Name`, `ASC` are 400).
- `AlumniQuery` uses a `Record<AlumniSort, Record<SortOrder, string>>` of fixed ORDER BY texts; `filters.order` with no `sort` (not produced by the parser, but possible for a direct caller) keeps the default.
- Route tests went into the existing `api/routes/routes.test.ts` (there is no `AlumniRoutes.test.ts`).
- Changed one existing test: "ignores unknown keys" used `sort: 'name'` as its unknown key; it now uses `orderBy: 'u.email'`.
- Ran `tsc` in businessLogic (G32). TASK-002 was editing `validation.ts` at the same time, so the dist may contain its in-progress code; rebuild after TASK-002 finishes.
- Results: `npm run test:backend` 507/507 passed; `npm run typecheck:backend` clean.

**Real-DB check 2026-10-08 (review m10):** ran against the dev database through the running API on :3000, signed in as the seed admin (`admin@alumni.test`), 9 alumni rows, 3 with no graduation year. `sort=graduationYear&order=asc` and `order=desc`, `pageSize=5`, pages 1 and 2: the 3 NULL years come last in both directions (tie-broken by id, 7, 15, 16), no id appears on both pages, and pages 1+2 equal the first 10 of a `pageSize=100` call. `sort=name&order=desc`: Sophia, Smoke, Sabrina, Rakib, Munif / Maliha, Imran, Farhana, Arif; no overlap. All answers 200.

## Related

- Architecture: [[specs/2026-10/m/REQ-015-admin-page/architecture]]
- Lessons checked: L-REQ-005-1, L-REQ-005-2, G21, G31, G32
