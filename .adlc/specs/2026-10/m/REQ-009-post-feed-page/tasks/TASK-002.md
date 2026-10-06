# TASK-002 — Shared helpers: relativeTime to config, FEED_PATH, danger menu item

| Field | Value |
|---|---|
| REQ | REQ-009 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-system |
| Depends on | — |
| Blocks | TASK-005, TASK-006 |

## Goal

Things the feed and its nav need from shared layers exist before the feature is built.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/config/relativeTime.ts` + `.test.ts` | move from `features/profile/` |
| `packages/frontend/src/features/profile/RecentPosts.tsx`, `PostCard.tsx` | import from `@/config/relativeTime` |
| `packages/frontend/src/config/feedPath.ts` | create (`FEED_PATH = '/feed'`) |
| `packages/frontend/src/config/README.md` | edit |
| `packages/frontend/src/components/ui/Menu/Menu.tsx`, `Menu.module.css`, `Menu.test.tsx` | edit: `MenuItem tone?: 'default' | 'danger'` (danger uses `--error`) |

## Approach

- Use `git mv` semantics: move the file and its test unchanged, fix imports. Grep for any other importer.
- `tone` defaults to `default`; danger colour is a token only.

## Acceptance

- [ ] Frontend tests, typecheck, lint pass; no behaviour change on the profile page
- [ ] Menu test: danger item renders and still selects

## Notes

Do not add feed code here.

## Related

- Architecture: [[specs/2026-10/m/REQ-009-post-feed-page/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]], G26, G28, G29, G30
