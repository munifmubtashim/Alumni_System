# BUG-001 Investigation

| Field | Value |
|---|---|
| Status | investigation complete |
| Reported | 2026-10-08 |
| Investigator | codebase-explorer |

## Root cause: type contract vs. database nullability

The shared type `post.types.ts:4` declares `caption?: string` (TypeScript: `string | undefined`), but the database schema stores caption as `text` (nullable). When a row has `caption = NULL`, the JSON response is `null`, which passes the guard `post.caption !== undefined` (since `null !== undefined`), then `.trim()` crashes.

## Code paths for caption reads (frontend → backend → DB)

### Frontend reads of caption

**UNSAFE reads (unguarded or incomplete guards):**
- `packages/frontend/src/features/feed/PostCard.tsx:154–155` — **THE BUG** — guard `post.caption !== undefined && post.caption.trim() !== ''` fails on `null`

**SAFE reads:**
- `packages/frontend/src/features/feed/PostCard.tsx:141` — `initial={post.caption ?? ''}` (nullish coalesce)
- `packages/frontend/src/features/profile/PostCard.tsx:27` — `const caption = present(post.caption)` (helper)
- `packages/frontend/src/config/text.ts` — `present()` uses optional chaining: `value?.trim()` (handles `null`)
- `packages/frontend/src/features/feed/useFeedMutations.ts:181,190,197` — cache edits read caption for storage/comparison only, no display or method calls

### Backend caption rules

**Create (`POST /api/posts`):**
- `PostController.ts:10` → `PostManager.createNewPost(userId, body)` → accepts `body.caption as string | undefined` (no type check or trim)
- `PostQuery.ts:17–28` → SQL `INSERT ... caption` accepts undefined (becomes NULL in DB)
- No validation: captions can be null, empty string, or any text

**Update (`PUT /api/posts/:id`):**
- `PostController.ts:39–48` → `PostManager.updatePost(requester, postId, body)` → checks type only (lines 30–32: must be text or null, or 400)
- `PostQuery.ts:65–81` → SQL `UPDATE posts SET caption=…` (partial update: omitted field keeps old value)
- Example test: `PostManager.test.ts:73–76` shows `{ caption: null }` is accepted and stored

**Database schema:**
- `db/backups/pre_bolt20_20261003_220745.sql` — `caption text,` (no NOT NULL, so nullable)

### API response shape

`packages/shared/src/types/post.types.ts:4` — `caption?: string` (TypeScript treats as `string | undefined`, not `string | null`)

`packages/frontend/src/services/postsApi.ts:24–28` — `listPosts()` types response as `Post[]` per the shared type

## Existing tests

**Frontend:**
- `features/feed/PostCard.test.tsx` — 11 tests, none for null/empty caption
- `features/feed/testKit.ts` — `makePost()` helper always sets `caption: Post ${id}`
- No existing test fails on null caption

**Backend:**
- `businessLogic/src/PostManager.test.ts:73–76` — one test explicitly accepts `{ caption: null }` on update
- `dal/query/PostQuery.test.ts` — not read (QueryDTO tests usually mock the DB)

## Vault knowledge

- **L-REQ-015-4** ("optional in type means null-safe") — already captured; names this exact trap
- **G34** (feed test traps) — lists test setup issues, doesn't cover null caption fixtures
- **Conventions (CLAUDE.md)** — No explicit rule on "if backend can store NULL, shared type must allow it"

## Decisions needed (Phase 2+)

1. **Type contract fix:** Should `caption?: string` change to `caption?: string | null` in shared types?
2. **API contract:** Should `POST /api/posts` refuse a post with neither caption nor media (400)?
3. **Trim on create:** Should `PostManager.createNewPost` trim caption (like `useFeedMutations.ts:132` does on the client)?
