# TASK-005 — Feed UI (S4)

| Field | Value |
|---|---|
| REQ | REQ-009 |
| Tier | 3 |
| Status | complete |
| Repo | alumni-system |
| Depends on | TASK-002, TASK-004, TASK-009 |
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

- [x] Component tests listed in architecture.md Test strategy pass
- [x] Lint (ESLint + Stylelint), typecheck, format pass; no hex or box-shadow
- [ ] Works at 360px and 200% zoom (manual note in the implement report): not checked in a browser here; see Notes, TASK-008 screenshots it

## Notes

Lazy-feature rule: nothing outside `features/feed` may import it statically; tests inside it are fine.

Done 2026-10-07. typecheck, lint (ESLint + Stylelint), format:check, `npm test` (76 files, 1021 tests) pass; feed tests ran 4 times in a row clean.

- **Extra files (inside features/feed, allowed):** `Byline.tsx` (+css: `AuthorAvatar`, `AuthorName`, `Timestamp`), `EditBox.tsx` (+css), `feedFormat.ts` (+test: labels, edited check, thread grouping, author link, item key), `testKit.ts` (test-only fake API, token, fixtures; one copy for the five component tests instead of five more copies, G26/QUAL-002).
- **Author link:** `profilePath(author_alumni_id)` only when it is a number; else plain text. The avatar link is `tabIndex=-1` + `aria-hidden` (the name is the real link).
- **Delete:** post delete state in `FeedPage` (confirm id, `useDeletePost`, error Alert above the list); after a delete, focus goes to the `h1` (the card is gone). Confirm shows inline in the card, focus lands on Cancel; Cancel returns focus to the menu button. Comment delete is immediate, state in `CommentThread`, focus goes to the reply box.
- **Focus timing:** Base UI's Menu puts focus back on its trigger when it closes, after our `onSelect`. EditBox and the confirm focus one animation frame later, or the menu wins.
- **Reply:** Reply on a reply targets its top-level comment (threads are one level); the placeholder names who you answer ("Reply to Lena…"), Escape or "Cancel reply" drops it. A "Send" ghost button shows only when the box has text (S4 has none; touch users need one).
- **Pending items:** no menu, toggle disabled, no Reply/Edit/Delete; React key `itemKey` = `clientKey ?? id`. A just-created post has no `author_alumni_id` until the refetch (the hook's temp post omits it), so its name is plain text for a moment.
- **Differences from S4 (for TASK-008):** post avatar 32px (xs) vs 36px desktop; comment avatar 24/28px via a scoped override (exact); time and comment meta in ink-secondary, not ink-muted (ink-muted is under 4.5:1 on surface-raised); fields use the Input look (sunken fill, border-strong) not white + subtle border; count toggle stays ink-secondary on phone (S4 phone shows it accent when open); empty-state padding 64px vs 72px; Send / Cancel reply buttons and inline edit and the delete confirm are not in S4; Retry/Post padding is space-2 space-4 (design 9px 18px).
- **360px / 200% zoom:** not checked in a browser in this task. The CSS is built for it (every row has `min-width: 0`, action rows wrap, text uses `overflow-wrap: anywhere`, sizes in rem); TASK-008's screenshots should confirm.

## Related

- Architecture: [[specs/2026-10/m/REQ-009-post-feed-page/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]], G26, G28, G29, G30

## Added after stress-test

- Pending (negative id): no menu, thread toggle disabled, Reply hidden; React key is the stable client key.
- Composer: trims; Post disabled when blank; caps at 2000 chars (constant) with the field's own count shown only near the limit; text rendered with `white-space: pre-wrap` and `overflow-wrap: anywhere`.
- Thread 404: show "This post is no longer available" and refetch the feed.
- Show "· edited" after the time when `updated_at` is more than 1 s after `created_at` (posts and comments).
- Post with comments: ask inline before delete only if open question 1 is answered "recommended".

## Added after the first TASK-005 attempt stopped (decisions)

- **Author link target:** `/alumni/${author_alumni_id}` via `profilePath` from `@/config/directoryReturn`; when `author_alumni_id` is null or missing, name and avatar are plain text. Test `href="/alumni/7"` uses `author_alumni_id: 7` with a different `user_id`. (TASK-009 adds the field; shared `Post`/`Comment` types have it.)
- **Avatar sizes:** the design uses 36px (post) and 28px (comment); existing sizes are lg/md/sm/xs. Use the nearest existing size for posts and a scoped, more specific CSS override for comments (G30), listing each as an S4 difference if it is not pixel-exact.
- **Where state lives:** delete state (confirm, error) for posts lives in `FeedPage` (the card unmounts on removal), delete-comment state in `CommentThread`.
