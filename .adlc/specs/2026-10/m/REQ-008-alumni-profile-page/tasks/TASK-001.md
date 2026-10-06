# TASK-001 — API functions and a 404 check

| Field | Value |
|---|---|
| REQ | REQ-008 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-system |
| Depends on | — |
| Blocks | TASK-005, TASK-006 |

## Goal

API functions and a 404 check.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/services/alumniApi.ts` | edit |
| `packages/frontend/src/services/alumniApi.test.ts` | edit |
| `packages/frontend/src/services/httpErrors.ts` | create |
| `packages/frontend/src/services/httpErrors.test.ts` | create |

## Approach

- `getAlumniProfile(id: string): Promise<Alumni>` → `GET /alumni/${encodeURIComponent(id)}`.
- `getPostsByUser(userId: number): Promise<Post[]>` → `GET /posts/user/${userId}`.
- `isNotFoundError(err)`: axios error with response status 404, nothing else.
- Types from `@alumni/shared` only. No React, no other layers.

## Acceptance

- [ ] Both functions call the right path and return `res.data`; an id with odd characters is encoded.
- [ ] `isNotFoundError` true for a 404 axios error, false for 500, network error, non-axios errors.
- [ ] Tests, typecheck, lint pass.

## Notes

Follow the existing `searchAlumni` style. Any 401 goes through the shared interceptor; do not handle it here.

## Related

- Architecture: [[specs/2026-10/m/REQ-008-alumni-profile-page/architecture]]
- Lessons checked: L-REQ-006-1/2/3, L-REQ-004-2, L-REQ-001-5
