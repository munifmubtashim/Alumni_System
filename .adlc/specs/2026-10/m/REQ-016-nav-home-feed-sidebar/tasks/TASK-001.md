# TASK-001 — Mentorship filter on GET /api/alumni

| Field | Value |
|---|---|
| REQ | REQ-016 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-system |
| Depends on | none |
| Blocks | 002, 007 |

## Goal

`GET /api/alumni?mentorship=true` returns only mentors, with `{ items, total }` unchanged; the frontend service can send it.

## Files to touch (paths under `packages/` unless noted)

- backend/src/businessLogic/src/validation.ts (+ validation.test.ts)
- backend/src/dal/dto/AlumniSearchDTO.ts
- backend/src/dal/query/AlumniQuery.ts (+ test)
- backend/src/businessLogic/src/AlumniManager.test.ts
- backend/src/api/routes/routes.test.ts
- shared/src/types/alumni.types.ts (comment only)
- frontend/src/services/alumniApi.ts (+ test): optional `mentorship?: true`, sent only when set

## Approach

- Extend `parseAlumniSearch` like the other filters: empty = absent, `true` = on, any other value, repeated or nested = 400.
- Add `a.mentorship_available = true` to the condition builder; no value from the request reaches SQL.
- Counts (`total`) use the same WHERE.

## Acceptance

- [ ] Tests: empty, `true`, `false`, junk, repeated -> expected results/400
- [ ] Existing callers' responses unchanged
- [ ] `npm run test:backend`, `typecheck:backend`, frontend typecheck pass

## Notes

Spec: requirement.md in this folder. Conventions: tokens only, no hex; TanStack Query for server data; layers route -> controller -> Manager -> Query. Rebuild `packages/backend/src/businessLogic` (`tsc`) before running the API (CLAUDE.md). Draft the commit message into commits-draft.md.

## Related

- Architecture: [[specs/2026-10/m/REQ-016-nav-home-feed-sidebar/architecture]]
- Lessons checked: [[LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]], [[LESSON-REQ-010-5-nav-and-menu-changes-touch-every-readme-list]], [[LESSON-REQ-009-1-profile-links-need-the-alumni-id]]
