# TASK-006 — Feed: Suggested alumni sidebar

| Field | Value |
|---|---|
| REQ | REQ-016 |
| Tier | 3 |
| Status | done |
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

- [x] Wide: aside present with rows; phone: aside absent and `/alumni/suggestions` not requested
- [x] Sidebar error leaves the feed working
- [x] Existing feed tests pass

## Notes

Spec: requirement.md in this folder. Conventions: tokens only, no hex; TanStack Query for server data; layers route -> controller -> Manager -> Query. Rebuild `packages/backend/src/businessLogic` (`tsc`) before running the API (CLAUDE.md). Draft the commit message into commits-draft.md.

Implementation (2026-10-08):
- `.page` is `min(100%, var(--page-max))` centred at every width (was 40rem), so the footer lines up below 48rem too. From 48rem: grid `minmax(0, 1fr) 20rem`, gap space-6, `align-items: start`; the aside is `position: sticky; top: space-5` (the header does not stick).
- Main column left flexible, not capped at 40rem: a cap would leave an empty band between posts and sidebar. At 72rem the post column is about 50rem; at 48rem about 24rem. TASK-008 screenshots should judge both; cap or narrow the sidebar there if it reads badly.
- The landmark is named twice: `<aside aria-label="Suggested alumni">` wraps the card's own `<section aria-labelledby>` region of the same name, so a screen reader may say "Suggested alumni" twice. Kept as the task asked; a ui-review question.
- Tests: the jsdom setup stub makes `(width >= 48rem)` false, so existing tests run the phone layout and send no suggestions request; the new wide tests spy on `matchMedia` for that query only.
- Checked: typecheck, lint, format:check, full `npm test` (1596 passed); `vite build` keeps FeedPage its own chunk.

## Related

- Architecture: [[specs/2026-10/m/REQ-016-nav-home-feed-sidebar/architecture]]
- Lessons checked: [[LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]], [[LESSON-REQ-010-5-nav-and-menu-changes-touch-every-readme-list]], [[LESSON-REQ-009-1-profile-links-need-the-alumni-id]]
