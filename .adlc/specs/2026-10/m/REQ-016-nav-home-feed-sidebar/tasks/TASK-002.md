# TASK-002 — Suggested alumni endpoint

| Field | Value |
|---|---|
| REQ | REQ-016 |
| Tier | 1 |
| Status | done |
| Repo | alumni-system |
| Depends on | 001 |
| Blocks | 005 |

## Goal

`GET /api/alumni/suggestions` returns up to 5 other people, department-mates first, then same-university, then the rest.

## Files to touch (paths under `packages/` unless noted)

- backend/src/dal/query/AlumniQuery.ts (+ test): `suggestAlumni(userId, limit)`
- backend/src/businessLogic/src/AlumniManager.ts (+ test)
- backend/src/api/controllers/AlumniController.ts
- backend/src/api/routes/AlumniRoutes.ts: register BEFORE `/:id`
- backend/src/api/routes/routes.test.ts and routeGuard.test.ts (401)
- shared/src/types/alumni.types.ts: document the response (`AlumniListItem[]`)
- packages/backend README / .adlc/context/conventions-api.md

## Approach

- One parameterized statement: CTE for the caller's department (alumni, else students) and university; `WHERE a.user_id <> $1`; ORDER BY same-department DESC, same-university DESC, `u.name`, `a.id`; LIMIT constant 5 or a bound param.
- Case-insensitive match via `lower()`; each "same department"/"same university" flag is `COALESCE(<cmp>, false)` so NULL is false and sorts last under DESC (ADV-001). Same columns as `LIST_COLUMNS` (never email).
- Any signed-in role may call it (no requireRole).

## Acceptance

- [x] A candidate with NULL department/university never outranks a real department-mate (test asserts the COALESCE in the SQL and the manager passes the rows through in order); a caller with no department falls back to university, then name order
- [x] 401 without a token; caller never in the result; ordering dept > university > rest with the stable tie-break; cap of 5; empty result is `[]`
- [x] `GET /api/alumni/suggestions` is not parsed as an id
- [x] Backend tests and typecheck pass

## Notes

Spec: requirement.md in this folder. Conventions: tokens only, no hex; TanStack Query for server data; layers route -> controller -> Manager -> Query. Rebuild `packages/backend/src/businessLogic` (`tsc`) before running the API (CLAUDE.md). Draft the commit message into commits-draft.md.

Implementation (2026-10-08):
- `AlumniQuery.suggestAlumni(userId, limit)` runs one statement (`SUGGEST_SQL`): CTE `me` from `users` LEFT JOIN `alumni` and `students` (department = alumni's, else students', blank via `NULLIF` = missing; university from `users`, per migration 001). Main select `LEFT JOIN me ON true` so an unknown caller still gets name order instead of no rows. Both values bound (`$1` user id, `$2` limit).
- `AlumniManager.SUGGESTION_LIMIT = 5`; `suggestAlumni(userId)` passes rows through untouched.
- No backend README exists; the endpoint is documented in `.adlc/context/conventions-api.md` and the shared `SuggestedAlumni` type. Root CLAUDE.md / frontend READMEs are left to TASK-008.
- `typecheck:backend` needs the businessLogic `dist` rebuilt first (api project reads `dist/*.d.ts`); rebuilt with `tsc`.
- Ordering is asserted on SQL text only (tests have no database); a real-DB check of the NULL ranking is worth doing in the TASK-008 runtime pass.

## Related

- Architecture: [[specs/2026-10/m/REQ-016-nav-home-feed-sidebar/architecture]]
- Lessons checked: [[LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]], [[LESSON-REQ-010-5-nav-and-menu-changes-touch-every-readme-list]], [[LESSON-REQ-009-1-profile-links-need-the-alumni-id]]
