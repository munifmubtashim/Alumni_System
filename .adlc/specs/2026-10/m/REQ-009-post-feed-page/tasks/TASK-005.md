# TASK-005 — Feed UI (S4)

| Field | Value |
|---|---|
| REQ | REQ-009 |
| Tier | 3 |
| Status | pending |
| Repo | alumni-system |
| Depends on | TASK-002, TASK-004 |
| Blocks | TASK-006, TASK-007 |

## Goal

The feed page renders and behaves like S4 using only primitives and tokens.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/features/feed/FeedPage.tsx` + css + test | create |
| `.../Composer.tsx` + css + test | create |
| `.../PostCard.tsx` + css + test | create |
| `.../CommentThread.tsx` + css + test | create |
| `.../FeedStates.tsx` + css + test | create |
| `.../README.md` | create |

## Approach

- Read all five S4 files and `docs/design/design-system/` first; map every design colour/size to a token by role, never copy hex.
- Page column max 640px, title 'Feed', composer, list; empty state per S4-EmptyFeed; skeletons; error + Retry; Load more.
- Author name and avatar link to `/alumni/:user_id` (`<Link>`); `<time dateTime>`; count button toggles ('N comments' / 'Hide comments'; 'No comments' reads as 'Comment' when 0). Comment rows: avatar sm, bold name + text, '<time> · Reply · Edit · Delete' (edit/delete only if `canModify`); replies indented; reply pill input with the current user's avatar.
- Post menu (⋮, `Menu` with label 'Post actions') only if `canModify`; inline edit with Save/Cancel; delete danger item. Pending (negative id) items show no menu.
- Focus and a11y: lint-clean (jsx-a11y), status text outside `aria-busy` (G30), focus returns sensibly after submit/cancel.

## Acceptance

- [ ] Component tests listed in architecture.md Test strategy pass
- [ ] Lint (ESLint + Stylelint), typecheck, format pass; no hex or box-shadow
- [ ] Works at 360px and 200% zoom (manual note in the implement report)

## Notes

Lazy-feature rule: nothing outside `features/feed` may import it statically; tests inside it are fine.

## Related

- Architecture: [[specs/2026-10/m/REQ-009-post-feed-page/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]], G26, G28, G29, G30

## Added after stress-test

- Pending (negative id): no menu, thread toggle disabled, Reply hidden; React key is the stable client key.
- Composer: trims; Post disabled when blank; caps at 2000 chars (constant) with the field's own count shown only near the limit; text rendered with `white-space: pre-wrap` and `overflow-wrap: anywhere`.
- Thread 404: show "This post is no longer available" and refetch the feed.
- Show "· edited" after the time when `updated_at` is more than 1 s after `created_at` (posts and comments).
- Post with comments: ask inline before delete only if open question 1 is answered "recommended".
