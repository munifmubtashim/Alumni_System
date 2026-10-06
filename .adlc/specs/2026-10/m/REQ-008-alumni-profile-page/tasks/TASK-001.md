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

Implementation (2026-10-07): `getPostsByUser` uses `${String(userId)}` because the type-aware lint rule `restrict-template-expressions` rejects a bare number. The encoding test sends `1/../users?x=1#y z` and checks the URL is `/alumni/1%2F..%2Fusers%3Fx%3D1%23y%20z`. `isNotFoundError` relies on `axios.isAxiosError` (checks the `isAxiosError` flag), so a plain object or Error carrying `response.status: 404` is false; the test covers that. `services/README.md` was not in this task's file list, so it still lists only `searchAlumni` for `alumniApi.ts` and does not mention `httpErrors.ts`; the docs task should add both.

## Related

- Architecture: [[specs/2026-10/m/REQ-008-alumni-profile-page/architecture]]
- Lessons checked: L-REQ-006-1/2/3, L-REQ-004-2, L-REQ-001-5
