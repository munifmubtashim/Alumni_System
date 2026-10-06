# TASK-002 — parseAlumniSearch validator

| Field | Value |
|---|---|
| REQ | REQ-005 |
| Tier | 0 |
| Status | done (typecheck blocked by a pre-existing casing error, see Notes) |
| Repo | alumni-system (worktree) |
| Depends on | — |
| Blocks | TASK-003 |

## Goal

A pure `parseAlumniSearch(query)` in `validation.ts` that returns `{ filters, page, pageSize }` or throws `AppError(400)` (spec AC2, AC3, AC5, AC6).

## Files to touch

| Path | Action |
|---|---|
| `packages/backend/src/businessLogic/src/validation.ts` | edit — add `parseAlumniSearch` (+ named limit constants) |
| `packages/backend/src/businessLogic/src/validation.test.ts` | create if missing, else edit — cases per architecture.md → Test strategy |

## Approach

As architecture.md → "Validation". Reuse `optionalText` where it fits; non-string values (arrays, objects) → `AppError(400, "<param> must be a single value")`. Empty or whitespace-only `page`/`pageSize` count as absent, so the default applies (ADV-002). Constants: `MAX_PAGE_SIZE = 100`, `DEFAULT_PAGE_SIZE = 20`, `MAX_PAGE = 10000`. `graduationYear` uses the same bounds as `optionalYear` (1900 … this year + 10) but returns a number. Import the filters type from `@alumni/dal` if TASK-001 has exported it; otherwise declare a structurally identical local type and note it for TASK-003.

## Acceptance

- [x] Tests cover every rule in the architecture, including `?page=` and `?pageSize=%20` → defaults, `page=10001` → 400, `?page=1.5`, `page=0`, `pageSize=101`, arrays and objects, `field` ignored, empty `q`
- [ ] `npm test` and `npm run typecheck` pass (npm test: 315 passed; typecheck: only the pre-existing TS1261 below) in `packages/backend`

## Related

- Architecture: [[specs/2026-10/m/REQ-005-alumni-search-filters/architecture]]

## Notes

- `parseAlumniSearch(query)` plus `DEFAULT_PAGE_SIZE`, `MAX_PAGE_SIZE`, `MAX_PAGE` and an `AlumniSearch` interface (`{ filters, page, pageSize }`) are exported from `validation.ts`. They are **not** re-exported from `businessLogic/src/index.ts`; TASK-003's `AlumniManager` imports them from `./validation.js` like the other validators.
- `AlumniSearchFilters` is imported from `@alumni/dal` (TASK-001 had exported it by the time this finished), so no local copy exists. TASK-003 need not reconcile types.
- A small `singleQueryValue` helper rejects non-strings with "<param> must be a single value" before `optionalText` runs, because `optionalText` would say "must be text" for an array. `null` is not special-cased: qs never produces it, and it is rejected as not a single value.
- Paging error text: "page must be a whole number from 1 to 10000" / "pageSize ... 1 to 100". graduationYear error: "graduationYear is not valid". Length errors reuse `optionalText`'s "<param> must be at most N characters" with the raw param name (`q`, `department`, `university`).
- `npm run typecheck` fails in this worktree on `src/dal/dto/*DTO.ts(1)`: TS1261, `./BaseDTO` vs on-disk `baseDTO.ts`. Pre-existing and worktree-only: git tracks `baseDTO.ts`, the main checkout has `BaseDTO.ts` on disk and `core.ignorecase=true` hides it. Not in this task's scope. The api and businessLogic tsc steps pass, and `tsconfig.test.json` shows no other errors. Fix (separate change): `git mv` the file to `BaseDTO.ts`, or change the four imports to `./baseDTO`.
