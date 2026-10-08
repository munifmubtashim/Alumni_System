# features/feed/

**Purpose:** the post feed at `/feed` (REQ-009, design `docs/design/screens/app/S4-*`): read posts, write one, read and add comments and replies, and edit or delete your own (admins: anyone's).

**What is here:**

- `FeedPage`: `h1` Feed (focus target after a delete), `Composer`, then the posts with Load more, or one state from `FeedStates`. Owns post-delete state: a post with comments asks inline first ("Delete this post and its N comments?", Delete / Cancel); one without goes at once. A refused delete puts the post back and shows the API message.
- `Composer`: new post (optimistic, trimmed, Post disabled while blank, capped at `POST_MAX_LENGTH` with the characters left shown only near the cap). The avatar shows from 48rem only (S4 phone has none).
- `PostCard`: author avatar and name, linked to `profilePath(author_alumni_id)` only when the author has an alumni profile (never the user id), time with "· edited", text (`pre-wrap`), the "Post actions" menu (Edit post, Delete post) for the author or an admin, inline edit, the count toggle ("N comments" / "Hide comments", "Comment" at 0) and its `CommentThread`. A pending post (negative id) has no menu and a disabled toggle.
- `CommentThread`: comments oldest first, replies indented (one level), "<time> · Reply · Edit · Delete", the reply pill. Owns the comment write hooks (a deleted row unmounts before a rollback). A 404 shows "This post is no longer available" and invalidates the feed.
- `FeedStates`: `FeedSkeleton` (status line outside `aria-busy`, G30), `EmptyFeed` (S4-EmptyFeed), `FeedLoadError`, `LoadMore`.
- `Byline` (`AuthorAvatar`, `AuthorName`, `Timestamp`), `EditBox` (inline edit, Save / Cancel, Escape cancels).
- Data (TASK-004): `usePosts`, `useComments`, `useFeedMutations` (ADR-09 optimistic writes), `cacheEdits`, `permissions` (`canModify`), `feedErrors`, `constants`.
- Pure helpers: `feedFormat.ts` (labels, "edited", thread grouping, author link).
- `testKit.ts`: test-only helpers (fake API at the axios adapter, a live token, fixtures). Only `*.test.tsx` here import it.

**May import:** `@/components/ui/**`, `@/config/**`, `@/services/**`, `@/features/auth` (current user, error texts), and types from `@alumni/shared`. Not `@/app/**`. Not `@/features/directory/**`, `@/features/profile/**`, `@/features/me/**`, `@/features/about/**` or `@/features/admin/**` (lazy features meet only through `config/`).

**Imported by:** only the lazy route's dynamic `import()` in `app/router.tsx` (ADR-08, added in TASK-006). There is no `index.ts`; nothing else may import this folder statically.
