# BUG-001 — /feed crashes for every viewer when a post has no caption

| Field | Value |
|---|---|
| Status | fixed |
| Severity | major |
| Repo | alumni-system |
| Touched repos | alumni-system |
| Reported | 2026-10-08 |
| Reporter | munifmubtashim (found by the REQ-015 UI re-review, UI-003) |
| Related REQ | REQ-015 (follow-up n1), REQ-009 (feed) |

## Symptom

If any post in the feed has a null caption, `/feed` shows the route error page instead of the feed, for every signed-in user. One bad row takes the whole page down.

## Reproduction

1. Run the API and Vite (`npm run dev`), sign in as any seed user.
2. Create a post with no caption, e.g. `POST /api/posts` with body `{ "media_url": "x" }` or `{}` (the API answers 201), or `UPDATE posts SET caption = NULL WHERE id = <id>` in the dev DB.
3. Open `/feed`.

**Expected:** the feed renders; the caption-less post shows without a text paragraph (or the API refuses an empty post with a 400).

**Actual:** the route error page; console shows `TypeError: Cannot read properties of null (reading 'trim')` at `packages/frontend/src/features/feed/PostCard.tsx:155`.

## Environment

| Field | Value |
|---|---|
| Branch / commit | redesign @ cee4f3ae |
| OS / browser / runtime | any browser; seen in headless Brave (Chromium) |
| Reproduction rate | always (whenever a null-caption post is on the loaded page) |

## Investigation log

Append-only. Each entry dated.

### 2026-10-08 — initial triage

`PostCard.tsx:154-155` guards with `post.caption !== undefined && post.caption.trim() !== ''`. The DB returns SQL `NULL` as JSON `null`, which passes `!== undefined`, so `.trim()` throws during render. The shared type says `caption?: string` (never null), so TypeScript allowed the incomplete guard. Root cause and the API side to be confirmed in Phase 2.

### 2026-10-08 — root cause

- **Crash:** `packages/frontend/src/features/feed/PostCard.tsx:154-155` guards with `post.caption !== undefined`. `posts.caption` is a nullable `text` column, so the API sends JSON `null`, which passes that check, and `.trim()` throws during render. The route error boundary then replaces the whole feed.
- **Why TypeScript allowed it:** `packages/shared/src/types/post.types.ts:4` declares `caption?: string` (never `null`), so the guard looked complete.
- **How the row gets in:** `PostManager.createNewPost` (`businessLogic/src/PostManager.ts:16-18`) casts `body.caption` without validating it, so `POST /api/posts` with no caption (or a non-string) is stored and answers 201. `updatePost` already accepts `{ caption: null }` (by design, test `PostManager.test.ts:73-76`), so a post can also become caption-less through an edit.
- **Other reads are safe:** feed `PostCard.tsx:141` (edit initial value, `??`), profile `features/profile/PostCard.tsx:27` (`present()`), optimistic cache edits (store, don't read).

### 2026-10-08 — fix verified

- Regression tests: feed `PostCard.test.tsx` (caption null / missing / '' / '   ') and `FeedPage.test.tsx` (one null-caption post among normal ones). With the old guard restored by hand, both failed with `TypeError: Cannot read properties of null (reading 'trim')`; with the fix they pass. File restored byte-for-byte (`cmp`).
- Original repro: `POST /api/posts {}` on the running API → 400 "A post needs a caption or media". A null-caption row inserted directly in the dev DB → `/feed` rendered all 11 posts in headless Brave, no error page; row deleted afterwards (0 null captions left).
- Suites: backend 621, frontend 1555; typecheck, lint, format clean.
- Note: create trims caption/media; update still stores text as sent (unchanged behaviour). Possible follow-up.

## Fix approach

- **Frontend:** in the feed `PostCard`, render the caption through the shared `present()` helper (`config/text.ts`, already null-safe and used by the profile card). No paragraph for null, missing, empty or whitespace-only captions. Change the shared type to `caption?: string | null`, so TypeScript flags any future unguarded read.
- **Backend:** `createNewPost` validates `caption` and `media_url` the way `updatePost` already does (text or null, trimmed, blank → null). It refuses a post with neither caption nor media: 400 "A post needs a caption or media". `updatePost` refuses an edit that would leave the post with neither, with the same 400. This closes the hole the UI re-review fell into.
- **Decision at the review gate (round 1):** until media is shown anywhere, every post needs a caption. Create and update both answer 400 "A post needs a caption" (media-only posts are refused), and update trims like create (blank → null). Old caption-less rows stay, so the null-safe feed rendering stays.
- **Regression tests:** a feed `PostCard` test rendering `caption: null`, `undefined`, `''` and `'   '` (null fails before the fix). A feed page test where one null-caption post sits among normal posts and the feed still renders. `PostManager` tests for the create validation and the 400. Routes test: `POST /api/posts` with `{}` → 400.

## Acceptance

- [x] A post with a null, missing, empty or whitespace-only caption renders in the feed without a text paragraph; the rest of the feed renders
- [x] Regression test that fails before the fix (null caption crashes PostCard) and passes after
- [x] Other caption reads checked: profile "Recent posts" PostCard, feed edit form initial value, optimistic create
- [x] Decide and test whether `POST /api/posts` / `PUT /api/posts/:id` should refuse a post with neither caption nor media (400)

## Lessons / gotchas captured

- [[knowledge/lessons/LESSON-BUG-001-1-nullable-column-means-null-in-shared-type|L-BUG-001-1]], [[knowledge/lessons/LESSON-BUG-001-2-create-and-update-share-one-validator|L-BUG-001-2]], [[knowledge/gotchas#^g48|G48]], [[knowledge/gotchas#^g49|G49]] — see [[knowledge/lessons/LESSON-REQ-015-4-optional-in-type-means-null-safe|L-REQ-015-4]].

## Related

- Gotchas: [[knowledge/gotchas#^g34|G34]] (feed test traps)
- Lessons: [[knowledge/lessons/LESSON-REQ-015-4-optional-in-type-means-null-safe|L-REQ-015-4]]
- Concepts: [[concepts/optimistic-cache-edits]]
- Components: [[knowledge/components/frontend]]
