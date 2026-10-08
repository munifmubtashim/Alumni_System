# REQ-009 — Codebase exploration

Written by: codebase-explorer (tier: fast)

| Field | Value |
|---|---|
| Generated | 2026-10-07 |
| By | codebase-explorer |
| Repo(s) scanned | Alumni_System |

## 1. Similar existing implementations

| Path | What it does | Recommended action |
|---|---|---|
| `packages/frontend/src/features/profile/RecentPosts.tsx` | Shows 5 newest posts from a single user in a read-only list; owns its own loading, error and empty states; uses `usePostsByUser` hook with TanStack Query | follow — feed's post list can reuse the same patterns: skeleton loading, error-with-Retry, empty state, relative times |
| `packages/frontend/src/features/profile/PostCard.tsx` | Renders a single post: caption (optional), relative time ("3 days ago"), comment count; includes `relativeTime()` utility | follow — the feed will need PostCard for feed-wide posts and embed it in a thread component; move `relativeTime` to a shared spot since features can't import each other (ADR-08) |
| `packages/frontend/src/services/alumniApi.ts` | Three functions calling axios: `searchAlumni`, `getAlumniProfile`, `getPostsByUser`; uses `httpClient` (baseURL `/api`) with Bearer token auto-added by interceptor | follow — create `postsApi.ts` mirroring this: `listPosts()`, `createPost()`, `updatePost()`, `deletePost()`, and three for comments: `listComments()`, `createComment()`, `updateComment()`, `deleteComment()` |
| `packages/backend/src/api/routes/PostRoutes.ts` | POST, GET, PUT, DELETE for posts plus GET/POST comments under `/api/posts/:id/comments` | follow — routes exist; controller layer follows established pattern (parse, call manager, `sendError` on catch) |
| `packages/backend/src/businessLogic/src/PostManager.ts` | Manager class with `createNewPost`, `updatePost`, `deletePost`, `getPostsByUserId`, `getAllPosts`; owns business rules (author-or-admin checks, AC14 patch logic, validation) | follow — CommentManager needs an `updateComment` method following the same pattern |
| `packages/backend/src/businessLogic/src/CommentManager.ts` | Has `getCommentsForPost`, `addComment`, `deleteComment`; missing `updateComment` | deviate — add `updateComment(requester, commentId, body)` following ownership and patch logic from `PostManager.updatePost` |
| `packages/frontend/src/features/home/HomePage.tsx` & `navItems.tsx` | Home page shows "Welcome back, <first name>" and quick-link cards from a `QUICK_LINKS` constant; nav items from `NAV_ITEMS` list that only includes existing pages (currently just Directory) | follow — add Feed and Admin entries to `NAV_ITEMS` and `QUICK_LINKS` cards when pages exist (REQ-009 adds Feed, REQ-010+ adds Admin) |
| `packages/frontend/src/app/router.tsx` | Uses lazy routes (ADR-08): `DIRECTORY_ROUTE`, `PROFILE_ROUTE` with dynamic imports and `HydrateFallback`; enforced by `lazyRoutes.test.ts` | follow — add `FEED_ROUTE` with same pattern: dynamic import, `HydrateFallback` on route object, nothing else may import the feature statically |
| `packages/frontend/src/app/AppShell/AppShell.test.tsx`, `MainNav.test.tsx`, `BottomTabs.test.tsx` | Test nav visibility, active links, and auth-gating; both nav and tabs read `NAV_ITEMS` and render NavLinks | follow — tests will auto-pass when Feed is added to `NAV_ITEMS` (no new test assertions needed) |

## 2. Blast radius

| Path | Why touched | Risk |
|---|---|---|
| `packages/frontend/src/features/feed/FeedPage.tsx` (new) | Entry point for lazy route; queries posts, renders composer and post list with optimistic mutations | low — new file, no existing code depends on it |
| `packages/frontend/src/features/feed/Composer.tsx` (new) | Creates a new post; uses `useMutation` with optimistic onMutate | low — new file |
| `packages/frontend/src/features/feed/PostThread.tsx` (new) or modify `PostCard.tsx` | Shows a post with toggleable comment list and reply box; handles comment mutations | low — new if in feed, or extend PostCard; if PostCard is modified the profile's RecentPosts will also render the new UI (acceptable, test it) |
| `packages/frontend/src/config/relativeTime.ts` (move from profile) | Utility function used by both profile and feed; currently at `packages/frontend/src/features/profile/relativeTime.ts` | medium — moving a file breaks relative imports in profile (one file imports it); the profile feature has no index.ts so only RecentPosts imports it; only change needed is RecentPosts' import path (`@/config/relativeTime` instead of `./relativeTime`) |
| `packages/frontend/src/services/postsApi.ts` (new) | API functions for posts and comments CRUD; called by feed/profile features and tests | low — new file, mirrors alumniApi structure |
| `packages/frontend/src/app/router.tsx` | Add `FEED_ROUTE` (lazy) to routes array; add it to `lazyRoutes.test.ts` | medium — adds to protected routes and lazy route checks; must follow exact pattern or tests fail |
| `packages/frontend/src/app/AppShell/navItems.tsx` | Add feed nav item when implemented | low — one constant array entry; existing tests auto-pass |
| `packages/frontend/src/features/home/HomePage.tsx` | Add feed card to `QUICK_LINKS` array | low — new array entry |
| `packages/frontend/README.md` (update) | Document feed feature folder and import rules | low — documentation only |
| `packages/backend/src/api/routes/CommentRoutes.ts` | Add `PUT /api/comments/:id` route (if comment-edit endpoint approved) | high — new route; requires new controller, manager method and query method; touches data model |
| `packages/backend/src/api/controllers/CommentController.ts` | Add `updateComment` handler mapping to manager (if PUT route approved) | high — new handler with ownership checks and sendError pattern |
| `packages/backend/src/businessLogic/src/CommentManager.ts` | Add `updateComment` method (owner-or-admin, AC14 partial patch logic) | high — modifies business logic; must handle ownership like PostManager.updatePost; touches controller above it |
| `packages/backend/src/dal/query/CommentQuery.ts` | Add `updateComment` SQL query; mirror PostQuery.updatePost pattern | high — new SQL; must be parameterized and handle `updated_at` column |
| `db/migrations/00X_add_comment_updated_at.sql` (new, if comment-edit approved) | Add `updated_at TIMESTAMP DEFAULT NOW()` column to comments table; idempotent (use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`) | high — schema change; must be applied before API can reference the column; migrations are hand-applied with `psql -f` |
| `packages/backend/src/dal/dto/CommentDTO.ts` | May need `updated_at` field added if it's not already there (verify) | medium — DTO reflects schema; if column is added, DTO must match or queries fail |
| `packages/frontend/src/components/ui/Avatar/Avatar.tsx`, `Menu.tsx`, `Button.tsx`, `Input.tsx`, `Skeleton.tsx`, `Alert.tsx`, `Card.tsx` (existing) | Used by feed composer, post card, thread, states | low — no changes, only consumption; props are already typed from `@alumni/shared` |
| `packages/frontend/src/features/auth/useCurrentUser.ts` | Feed composer needs `['me']` query to check `role` and `id` for owner-or-admin; `MyProfile` already includes role and id fields | low — read-only use, no changes needed |
| `packages/backend/src/api/routes/routes.test.ts` | Tests all routes for auth, including new PUT /api/comments/:id if added | low — test infrastructure auto-discovers routes; may need one additional route added to `PROTECTED` array if new endpoint exists |
| `packages/backend/src/businessLogic/src/PostManager.test.ts`, `CommentManager.test.ts` (new) | Test post/comment CRUD; if CommentManager gains updateComment, tests must cover it (similar to PostManager.updatePost tests) | medium — new test coverage gap for updateComment if endpoint is added |

## 3. Integration points

### Frontend

- **Entry point:** `/feed` lazy route in `app/router.tsx`, gated by `RequireAuth` (via AppShell)
- **State:** 
  - Posts list: TanStack Query `useQuery` with `queryKey: ['posts']` (similar to `['alumni', 'profile', id]` pattern)
  - Post composer: `useMutation` for create with optimistic `onMutate` / rollback
  - Comment thread toggle and reply box: mutations with optimistic updates and comment-count bumping
  - Current user (owner-or-admin check): `useCurrentUser()` hook returns `['me']` query result (has `user_id`, `role`, `name`)
- **Primitives:** Avatar, Menu, Button, Input, Skeleton, Alert, Card already exist and are tested; no new dependencies
- **Services:** Will call `postsApi.ts` functions (GET /api/posts, POST, PUT, DELETE and comments endpoints)
- **Shared types:** `Post` and `Comment` from `@alumni/shared` typed in API responses; frontend mirrors backend DTO shapes
- **Navigation:** Feed added to `NAV_ITEMS` (both MainNav desktop and BottomTabs mobile) and `QUICK_LINKS` home card
- **Lazy-route enforcement:** ESLint rule bans static imports of `features/feed` from outside its folder; `app/lazyRoutes.test.ts` will test that `import('@/features/feed/FeedPage')` is the only import of feed code from `app/` and nowhere else in `src/` imports it statically

### Backend

- **Routes:** `POST /api/posts`, `GET /api/posts`, `PUT /api/posts/:id`, `DELETE /api/posts/:id` already wired; `GET /api/posts/:id/comments`, `POST /api/posts/:id/comments` exist; **missing:** `PUT /api/comments/:id`
- **Auth:** All post/comment routes require `authMiddleware` (token in Authorization header); ownership checks in Manager layer (owner or admin)
- **Status codes:** 201 create, 200 read/update, 204 expected for delete (check current pattern), 401 token, 403 forbidden (non-owner), 404 missing
- **Managers:** `PostManager` fully implemented; `CommentManager` missing `updateComment` method
- **Queries:** `PostQuery` handles CRUD; `CommentQuery` handles get/create/delete but no update
- **DTOs:** `PostDTO`, `CommentDTO` are plain classes; if schema adds `updated_at` to comments, `CommentDTO` must reflect it
- **Schema:** posts table has `id`, `user_id`, `caption`, `media_url`, `comment_count`, `created_at`, `updated_at`; comments table has `id`, `user_id`, `post_id`, `parent_id`, `content`, `created_at` — **missing:** `updated_at` column (needed for comment edit endpoint if approved)

### Shared types

- `Post` interface: `id`, `user_id`, `caption?`, `media_url?`, `comment_count?`, `created_at?`, `updated_at?`, `author_name?`, `author_photo?` ✓ (matches backend DTO)
- `Comment` interface: `id`, `user_id`, `post_id`, `parent_id?`, `content`, `created_at?`, `updated_at?`, `author_name?`, `author_photo?` ✓ (matches backend DTO except `updated_at` not yet in schema)
- `MyProfile`: includes `user_id`, `role` (✓ needed for feed's owner-or-admin check)

## 4. Test coverage

| Test file | Scenarios covered | Gaps for new code |
|---|---|---|
| `packages/frontend/src/app/lazyRoutes.test.ts` | No static imports of directory/profile outside their folder; route tree has lazy and HydrateFallback; router has dynamic import | Must add `FEED_ROUTE` to `LAZY_FEATURES` list; test that no other file imports feed statically |
| `packages/frontend/src/app/AppShell/AppShell.test.tsx` | Header, theme toggle, account menu, signed-in/guest shells | Existing nav tests will pass when Feed is added to `NAV_ITEMS` (no new assertions needed) |
| `packages/frontend/src/services/alumniApi.test.ts` | GET and error handling with fake axios adapter; retries, locale dates | Create matching tests for `postsApi.ts`: listPosts, createPost, updatePost, deletePost (4 GET/POST/PUT/DELETE + error cases) |
| `packages/backend/src/api/routes/routes.test.ts` | Every non-public route needs valid token; expired/bad token → 401 | If PUT /api/comments/:id is added, it auto-discovers via `guardedRoutes(app)` and is tested for auth |
| `packages/backend/src/businessLogic/src/PostManager.test.ts` | Create (author set, user_id ignored), update (ownership, AC14 patches, validation), delete (ownership), getters | If `CommentManager.updateComment` is added, create similar tests: ownership gating, patch logic, validation of content field, non-owner/non-admin → 403 |
| `packages/backend/src/dal/query/PostQuery.test.ts` | SQL injection (parameterization), RETURNING, updates with only sent keys | If `CommentQuery.updateComment` is added, test: SQL syntax, only-sent-columns logic (if adopted), updated_at set to NOW() |
| `packages/frontend/src/features/profile/ProfileHeader.test.tsx`, `RecentPosts.test.tsx`, etc. | Profile page and its sections (no feed-specific tests in profile folder) | Moving `relativeTime.ts` to config: update import in RecentPosts, add test in config if one is created |

### Coverage gaps for REQ-009

1. **Feed page components** (new): no tests yet for FeedPage, Composer, PostThread states, optimistic mutations, comment threading
2. **Comment edit endpoint** (if approved): no tests in CommentManager/CommentQuery/CommentController for update; no PUT route test
3. **relativeTime function move**: RecentPosts test imports it from profile; moving it requires updating the import but the function test stays (already at `features/profile/relativeTime.test.ts`)
4. **Feed in nav**: AppShell tests will auto-pass when Feed is in `NAV_ITEMS`, but the feed feature's own test coverage (FeedPage, Composer, PostThread) is all new code

## Dependency sketch

```
Frontend dependency chain for feed page:

app/router.tsx
  └─ lazy: features/feed/FeedPage.tsx
       ├─ Composer (new)
       │  └─ services/postsApi.createPost
       ├─ PostThread (new, shows post + comments)
       │  ├─ services/postsApi.listComments, updateComment, deleteComment
       │  └─ components/ui: Avatar, Menu, Button, Input, Skeleton, Alert
       └─ FeedStates (new, loading/error/empty)
            └─ Alert, Skeleton

app/AppShell/navItems.tsx ← Feed added
app/AppShell/MainNav.tsx ← reads NAV_ITEMS
app/AppShell/BottomTabs.tsx ← reads NAV_ITEMS
features/home/HomePage.tsx ← Feed card added to QUICK_LINKS

config/relativeTime.ts (moved from profile)
  └─ used by: features/profile/RecentPosts.tsx (import updated)
  └─ used by: features/feed/PostCard.tsx (new)
```

Backend dependency chain for comment edit (if added):

```
app/router.tsx → CommentRoutes.ts
                    └─ PUT /api/comments/:id
                        └─ CommentController.updateComment
                            └─ CommentManager.updateComment (new)
                                └─ CommentQuery.updateComment (new, SQL + updated_at)
                                    └─ posts.comment_count stays the same (no change to count on edit)

db/migrations/00X_add_comment_updated_at.sql (new, if needed)
    └─ ALTER TABLE comments ADD COLUMN updated_at TIMESTAMP DEFAULT NOW()
        └─ dal/dto/CommentDTO.ts (field added if not present)
```

## Vault references

- [[knowledge/gotchas#^g30|G30]] — role status lines inside aria-busy containers break screen readers; RecentPosts.tsx already uses the correct pattern (aria-busy on skeleton only, status outside)
- [[knowledge/gotchas#^g29|G29]] — test traps for profile page; some apply to feed too (locale in Intl formatters, fake timers with shouldAdvanceTime, error state retry backoff)
- [[knowledge/gotchas#^g28|G28]] — type-aware lint traps: bare numbers in template URLs, skipToken, async state reads, line-height values; feed will hit these too
- [[architecture/adr-08-route-code-splitting-and-url-list-state|ADR-08]] — lazy routes must have no static imports outside their folder; `app/lazyRoutes.test.ts` enforces it
- [[architecture/adr-02-server-state-tanstack-query|ADR-02]] — server state goes through TanStack Query; feed uses it for posts and comments list
- [[architecture/adr-03-frontend-session-and-401-handling|ADR-03]] — 401 handling is global via SessionBridge; feed doesn't add new auth logic
- [[architecture/adr-01-ui-layer-headless-css-modules|ADR-01]] — primitives only use design tokens; feed reuses existing ones
- [[knowledge/lessons/LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home|L-REQ-008-6]] — `relativeTime` duplication between profile and feed must use a shared home; moving to `config/` solves it (both features can import `@/config` per import-boundary rules)

## Open questions

- **Comment edit scope:** REQ-009 spec notes "There is only `DELETE /api/comments/:id`. Comment edit needs a new `PUT /api/comments/:id`" — this is flagged as an API gap. Is the PUT endpoint approved as part of REQ-009 architect gate, or is it a future REQ? (Affects: routes/controller/manager/query/migration/test scope.)
- **Comment edit columns:** If PUT is approved, which fields may a user edit? Spec does not say. Assume `content` only (no user_id, post_id, parent_id changes)? Or caption + media_url logic (AC14 patches)? Spec should clarify before architect approves.
- **Reply UI:** Spec mentions "Design shows a 'Reply' link on comments; the API supports it (`parent_id`, one level deep). Planned: Reply sets the parent, replies indent under it." Is reply UI in scope for REQ-009 or a follow-up? Affects: PostThread component complexity and design mock-ups to check.
- **Comment-count update on edit:** If comment text is edited, does comment_count change? (Assume no — count is the number of comments, not changed by edits.) Query should NOT need a separate transaction for edit like create/delete do.
- **Design tokens for S4:** Tokens file checked; all colors (surface, ink, accent, etc.) are defined. Do the S4 screenshots match the tokens, or are there hardcoded hex values in the designs that need to map to token names? (ACC3: check designs.)

## Summary

The post-feed page (REQ-009) builds on established patterns: lazy routing like the profile page, TanStack Query for server state, optimistic mutations for writes, and reuse of primitives (Avatar, Menu, Button, etc.). The main blast-radius items are the new feed feature folder, a shared `relativeTime` utility (moved from profile), a new `postsApi` service mirroring `alumniApi`, and navigation updates. The optional `PUT /api/comments/:id` endpoint (comment edit) adds backend scope: a new manager method, query update, controller handler, and a schema migration for `comments.updated_at`. Tests for the new code are all gaps (FeedPage, Composer, PostThread components and services). The feature must follow the lazy-route ESLint ban and avoid static imports from outside its folder.
