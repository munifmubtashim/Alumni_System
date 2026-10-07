# TASK-006 — Route, nav link, bottom tab, Home card

| Field | Value |
|---|---|
| REQ | REQ-009 |
| Tier | 4 |
| Status | pending |
| Repo | alumni-system |
| Depends on | TASK-005 |
| Blocks | TASK-008 |

## Goal

/feed opens the page lazily and Feed appears in the header nav, tab bar and Home cards.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/app/router.tsx` | edit (`FEED_ROUTE`) |
| `packages/frontend/src/app/lazyRoutes.test.ts` | edit (`LAZY_FEATURES`) |
| `packages/frontend/eslint.config.js` (+ `scripts/enforcement.test.ts` if it lists features) | edit |
| `packages/frontend/src/app/AppShell/navItems.tsx`, `NavIcons.tsx` | edit (chat-bubble icon from S4 phone) |
| `packages/frontend/src/features/home/HomePage.tsx` + `HomePage.test.tsx` | edit |
| `MainNav.test.tsx`, `BottomTabs.test.tsx`, `router.test.tsx` if present | edit |

## Approach

- Copy the `PROFILE_ROUTE` shape exactly. Card text: title 'Catch up on the feed', description 'See what alumni and students are sharing'.
- Run `npm run build` and confirm a separate feed chunk in `dist/assets`.

## Acceptance

- [ ] `lazyRoutes.test.ts` covers feed; `/feed` current state on the nav and tab
- [ ] Build shows the feed chunk; all frontend checks pass

## Notes

Admin and My Profile stay out of the nav until built.

## Related

- Architecture: [[specs/2026-10/m/REQ-009-post-feed-page/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]], G26, G28, G29, G30
