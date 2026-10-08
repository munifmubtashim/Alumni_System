# TASK-006 — Feed: Suggested alumni sidebar

| Field | Value |
|---|---|
| REQ | REQ-016 |
| Tier | 3 |
| Status | pending |
| Repo | alumni-system |
| Depends on | 004, 005 |
| Blocks | 008 |

## Goal

At 48rem and up the Feed shows a right sidebar with 3-5 suggestions; below 48rem nothing is rendered or requested.

## Files to touch (paths under `packages/` unless noted)

- frontend/src/features/feed/FeedPage.tsx, FeedPage.module.css, FeedPage.test.tsx
- frontend/src/features/feed/README.md

## Approach

- Wrap in a grid at 48rem+: main column (min-width 0) and a sticky 20rem aside; render `<aside aria-label="Suggested alumni">` only when `useWideScreen()`.
- Import `SuggestedAlumni` from `@/features/people` (never from another lazy feature).
- Composer, comments, optimistic writes untouched.

## Acceptance

- [ ] Wide: aside present with rows; phone: aside absent and `/alumni/suggestions` not requested
- [ ] Sidebar error leaves the feed working
- [ ] Existing feed tests pass

## Notes

Spec: requirement.md in this folder. Conventions: tokens only, no hex; TanStack Query for server data; layers route -> controller -> Manager -> Query. Rebuild `packages/backend/src/businessLogic` (`tsc`) before running the API (CLAUDE.md). Draft the commit message into commits-draft.md.

## Related

- Architecture: [[specs/2026-10/m/REQ-016-nav-home-feed-sidebar/architecture]]
- Lessons checked: [[LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]], [[LESSON-REQ-010-5-nav-and-menu-changes-touch-every-readme-list]], [[LESSON-REQ-009-1-profile-links-need-the-alumni-id]]
