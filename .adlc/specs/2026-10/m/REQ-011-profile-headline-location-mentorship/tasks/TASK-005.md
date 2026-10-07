# TASK-005 — Backend queries, route tests and real-DB run

| Field | Value |
|---|---|
| REQ | REQ-011 |
| Tier | 2 |
| Status | pending |
| Repo | alumni-system |
| Depends on | TASK-001, TASK-004 |
| Blocks | TASK-008, TASK-009 |

## Goal

The five fields are stored and read everywhere alumni are, proven by route tests and one real Postgres run (AC1, AC2, AC13).

## Files to touch

| Path | Action |
|---|---|
| `packages/backend/src/dal/query/AlumniQuery.ts` + test | edit |
| `packages/backend/src/dal/query/UserQuery.ts` + test | edit |
| `packages/backend/src/api/routes/routes.test.ts` | edit |

## Approach

- AlumniQuery INSERT/UPDATE gain five columns; UserQuery alumni UPDATE too; `MY_PROFILE_SQL` selects them from `a.` with `COALESCE(a.mentorship_available,false)`.
- Route tests: GET alumni/:id, GET alumni list, GET/PUT /api/me, PUT/POST /api/alumni; 400s; guest 401, other user and admin 403.
- Real run: create a throwaway database, apply the schema from `db/backups` (G15) + 001–003, insert a row, apply 004 twice (`psql -v ON_ERROR_STOP=1`), verify `\d alumni`, the old row got false, then exercise the real queries once (script in the scratchpad). Drop the database after. Record commands and output in the task file.

## Acceptance

- [ ] AC1 verified twice on a real database, log recorded
- [ ] AC2 responses carry the fields; mentorship never null
- [ ] tests and typecheck pass

## Notes

Needs a local Postgres. Create and drop only your own throwaway database; do not touch the dev database. If no Postgres is available, stop and surface it.

## Related

- Architecture: [[specs/2026-10/m/REQ-011-profile-headline-location-mentorship/architecture]]
- Lessons checked: see architecture.md
