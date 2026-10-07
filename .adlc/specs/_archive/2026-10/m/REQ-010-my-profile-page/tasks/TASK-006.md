# TASK-006 — Page-level tests

| Field | Value |
|---|---|
| REQ | REQ-010 |
| Tier | 2 |
| Status | done |
| Repo | alumni-system |
| Depends on | TASK-004, TASK-005 |
| Blocks | TASK-007 |

## Goal

The behaviors in the spec's acceptance criteria are covered by tests that fail when they break.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/features/me/MePage.test.tsx` | create |
| `packages/frontend/src/features/me/ProfileForm.test.tsx` | create |
| `packages/frontend/src/features/me/useLeaveGuard.test.tsx` | create |
| `packages/frontend/src/features/me/{SaveBar,LeavePrompt}.test.tsx` | create if not covered above |

## Approach

- Use the repo's existing axios-adapter test helpers and router-in-test setup (G11, G26, G29, G34); no fake timers left running.
- Also cover ADV-001..004 and 008: 401 logout while dirty, password-only save, partial failure without remount, leave blocked during an in-flight save.
- Cover every item in the architecture's Test strategy 'Page' bullet, including the cache refresh (a seeded `['alumni','profile',id]` query refetches after save) and the photo_url round-trip.

## Acceptance

- [x] Each architecture 'Page' bullet has at least one test
- [x] Tests fail if the dirty rule, photo_url, or leave guard is removed (spot-check by mutation)
- [x] Full frontend suite, typecheck, lint pass

## Notes

Do not weaken a test to pass; report a real bug back.

**Implementation (2026-10-07, task-implementer).**

- Audit: ProfileForm, SaveBar, useLeaveGuard and useUpdateProfile tests already covered most of the 'Page' bullet. Missing: loading/error/Retry, tab title, cache refresh seen on /alumni/:id, photo_url on repeat saves and absent when there is none, exact field set per role (student, admin), form-level 4xx message, 401 logout through the real SessionBridge, no prompt and no beforeunload after save. All added in `MePage.test.tsx` (12 tests).
- **Finding (not fixed, outside blast radius):** through the real route, `RequireAuth` (`features/auth/guards.tsx`) waits on the same ['me'] query, so a first visit shows the guard's "Loading…" line and "Couldn't load your account" + Retry, never MePage's skeleton or `LOAD_ERROR_TEXT`. MePage's views are reachable only without the guard. The spec AC ("loading skeleton, error with Retry") is met only by the guard's plainer versions. Options for the orchestrator: accept (guard states are fine), or let `/me` skip the guard's wait (a guards.tsx change). MePage.test pins both: the real route's behaviour, and MePage's own views mounted without the guard.
- **Flake = real bug, fixed.** In the save-in-flight case, `applyResult`'s flushSync commit showed the toast while `blocker.state` was still 'blocked'; the effect's `blocker.reset()` goes through RouterProvider's `startTransition`, so at least one painted frame showed "Leave without saving?" beside "Profile updated successfully". Fix in `ProfileForm.tsx`: the prompt renders only when `blocker.state === 'blocked' && guarding` (the effect still resets the blocker). The test now records with a MutationObserver whether both texts were ever in the DOM together: old code fails 3/3, fixed code passes. Plain timing runs did not reproduce it (6 full runs on the old code passed).
- Mutation checks (each reverted, diff-verified): dirty always true, 8 tests fail; dirty ignores password, 4 fail; photo_url not sent, 5 fail; leave guard off, 3 fail; no invalidation after save, 2 fail (incl. the /alumni/:id one).
- Gates: `npm test` 5x green after the final edit (86 files, 1210 tests), typecheck, lint, format:check clean.
- Not covered by tests: ADV-001 (bar vs tab bar at 390px), left to TASK-007 screenshots as TASK-004 noted.

## Related

- Architecture: [[specs/2026-10/m/REQ-010-my-profile-page/architecture]]
- Lessons checked: [[LESSON-REQ-006-3-client-copies-of-api-limits]], [[LESSON-REQ-002-3-must-succeed-steps-inside-mutationfn]], [[LESSON-REQ-009-4-adding-a-lazy-feature-touches-six-lists]], [[LESSON-REQ-007-1-sticky-bottom-bar-needs-scroll-padding]], [[LESSON-REQ-004-2-check-design-colours-against-token-pairs]]
