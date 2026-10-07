# TASK-002 — Shared types

| Field | Value |
|---|---|
| REQ | REQ-011 |
| Tier | 0 |
| Status | done |
| Repo | alumni-system |
| Depends on | — |
| Blocks | TASK-004, TASK-006, TASK-007 |

## Goal

`@alumni/shared` types carry the five fields (AC7).

## Files to touch

| Path | Action |
|---|---|
| `packages/shared/src/types/alumni.types.ts` | edit |

## Approach

- `Alumni`: `headline?`, `location?`, `degree?` (string | null), `start_year?` (number | null), `mentorship_available?: boolean` (optional on purpose, see ADV-001). `AlumniListItem` follows.
- `MyProfile`: same, `start_year?: string` like `graduation_year`, `mentorship_available?: boolean` (server always sends a boolean, false when no alumni row; optional in the type so existing test fixtures keep compiling; the client treats missing as false).
- `UpdateMyProfileInput`: `headline?`, `location?`, `degree?`, `start_year?` (strings), `mentorship_available?: boolean`; update the comment block.

## Acceptance

- [x] `npm run typecheck` in frontend and `typecheck:backend` still compile (fix fixtures in other tasks, not here)

## Notes

Other tasks' fixtures that build these types are fixed by the task that owns them.

Done 2026-10-07. Frontend `npm run typecheck` clean. `npm run typecheck:backend` fails only on TS1261 (disk `BaseDTO.ts` vs git `baseDTO.ts`, local checkout quirk in gotchas.md:723, unrelated to this change); the same gotcha's workaround (`npx tsc -p tsconfig.test.json`) hits the same error. Verified with a throwaway tsconfig extending `tsconfig.test.json` with `forceConsistentCasingInFileNames: false`: 0 errors (file deleted afterwards). Backend tests 369/369, frontend 1217/1217. No backend code imports `@alumni/shared`, so the backend check is only a regression guard. Lesson candidate CAND-002 filed.

## Related

- Architecture: [[specs/2026-10/m/REQ-011-profile-headline-location-mentorship/architecture]]
- Lessons checked: see architecture.md
