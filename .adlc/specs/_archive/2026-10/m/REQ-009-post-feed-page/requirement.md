---
id: REQ-009
title: Post feed page (/feed, design S4)
status: approved
created: 2026-10-07
---

# REQ-009 — Post feed page

## Goal
A signed-in user opens `/feed` and sees the community posts, writes a post, reads and adds comments, and edits or deletes their own (admins: anyone's). It matches `docs/design/screens/app/S4-*` in light and dark, desktop and phone, including the empty state. Feed is in the header nav, the phone tab bar and a Home quick-link card.

## Acceptance criteria
1. `/feed` (lazy route, ADR-08) lists posts newest first from `GET /api/posts`: author name (links to `/alumni/:id`), relative time, text, comment count. Skeletons while loading, "No posts yet" empty state (S4-EmptyFeed), error state with Retry.
2. Composer at the top creates a post and the post shows at once (optimistic), rolled back with an error if the API refuses. Comment count toggles a thread (`GET /api/posts/:id/comments`) with a reply box; a new comment shows at once (optimistic) and bumps the count.
3. Edit and delete appear only for the owner or an admin, on posts and on comments, matching REQ-003 (owner-or-admin; the API stays the judge, a 403 shows an error).
4. Nav link, bottom tab and Home quick-link card for Feed. Tokens only; tests for the above.
5. Final check: screenshots next to every S4 design (desktop and phone, light and dark, empty), every difference listed and fixed.

## Scope / non-goals
- Not touched: auth, existing endpoints' behaviour, profile/directory pages, My Profile and Admin pages (their nav items stay out until built).
- No pagination UI beyond a "Load more" on limit/offset (API has no total); no images (`media_url`), no likes.

## API gaps (found in recon)
- **No way to edit a comment.** There is only `DELETE /api/comments/:id`. Comment edit needs a new `PUT /api/comments/:id` (owner-or-admin, same rules as posts) in routes, controller, CommentManager, CommentQuery, plus `updated_at` handling.
- `POST /api/posts` returns the bare row (no `author_name`/`author_photo`): the client fills them from the signed-in user. No API change needed.
- `GET /api/posts` has `limit`/`offset` but no `total`: "Load more" ends when a page comes back short. No API change needed.
- Design shows a "Reply" link on comments; the API supports it (`parent_id`, one level deep). Planned: Reply sets the parent, replies indent under it.

## Approach
- `services/postsApi.ts` (list, create, update, delete posts; list, create, delete comments; `updateComment` if the endpoint is added); types from `@alumni/shared`.
- `features/feed/`: `FeedPage`, `Composer`, `PostCard`, `CommentThread`, states, TanStack Query hooks with optimistic `onMutate`/rollback; owner-or-admin check from `['me']` (`useCurrentUser`); reuse `Avatar`, `Menu`, `Skeleton`, `Alert`, `Button`, and the profile's `relativeTime` (move to `config/` or a shared spot, since features may not import each other).
- `app/router.tsx` `FEED_ROUTE` (lazy, HydrateFallback on the route object), `navItems.tsx`, `HomePage` `QUICK_LINKS`, `lazyRoutes` list, README/CLAUDE.md lines.
- Backend (only if the comment-edit endpoint is approved): `PUT /api/comments/:id` + tests.

## Related
- REQ-003 (post/comment ownership rules), REQ-007 (app shell, `NAV_ITEMS`), REQ-008 (profile, `relativeTime`, lazy-route pattern), ADR-02, ADR-08.
