# TASK-005 — Docs: route auth and backend tests

| Field | Value |
|---|---|
| REQ | REQ-003 |
| Tier | 2 |
| Status | pending |
| Repo | alumni-system |
| Depends on | TASK-002, TASK-003 |
| Blocks | — |

## Goal

`CLAUDE.md` and `.adlc/context/conventions.md` describe the new auth rules and the backend test setup (spec AC13).

## Files to touch

| Path | Action |
|---|---|
| `CLAUDE.md` | edit — "Commands": add `npm run test:backend` / `npm test` in `packages/backend`; drop "The backend … have no test … scripts yet" (keep lint/format absent); Architecture → `api/`: replace "Not all routes currently apply authMiddleware…" with: each non-auth router starts with `router.use(authMiddleware)`, admin routes add `requireRole("admin")`, 401 = token problem / 403 = not allowed / 404 = missing, ownership checks live in Managers, and the guard test fails on any unprotected route |
| `.adlc/context/conventions.md` | edit — API conventions → **Auth** filled in (bearer JWT, public list, 401/403/404 rule, ownership in Managers, guard test); Testing → add a Backend subsection (Vitest + supertest, `packages/backend/vitest.config.ts`, three mock levels per ADR-05, `businesslogic` alias to source, no DB) |

## Approach

- Keep the existing tone and density; edit in place rather than adding new sections where one exists.
- Link ADR-05 from conventions.md (`[[architecture/adr-05-backend-tests-vitest-supertest|ADR-05]]`).

## Acceptance

- [ ] No sentence in `CLAUDE.md` still says routes may lack auth or that the backend has no tests
- [ ] conventions.md's API Auth line and backend Testing subsection match what TASK-001/004 built

## Notes

- Lesson L-REQ-001-8: an accepted ADR changes CLAUDE.md and conventions.md in the same REQ.

## Related

- Architecture: [[specs/2026-10/m/REQ-003-backend-route-auth/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-001-8-adr-changes-update-claude-conventions|L-REQ-001-8]]
