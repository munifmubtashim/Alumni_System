# BUG-001-feed-null-caption-crash — Review log

Full reviewer narratives. The verdict lives in `verification.md`.

## Correctness findings

Written by: correctness-reviewer (tier: balanced)

**Summary:** Checked 4 backend paths (create, update, controller, DTO), 3 frontend caption paths (feed card, edit box, optimistic create/update) and 2 other callers (profile card, PostQuery). 0 critical, 0 major, 2 minor, 1 trivial. Null/undefined/blank captions render safely everywhere; create and update rules behave as intended, ownership check still runs first. Biggest: update and create store text differently, and the update rule can be raced past.

Dispatch answers: caption-less optimistic temp post: checked, nothing (Composer blocks blank, `useCreatePost` trims, server now agrees). Merge onto stored row, null vs undefined vs omitted: checked, nothing (`readText` returns undefined only for an absent key; null clears; non-strings 400). Ownership order: checked, nothing (`findOwnedPost` still first). Existing callers: checked, nothing (only `PostController` calls `createNewPost`; `PostDTO` widening is type-only).

### CORR-001: Edit can still empty a post under two concurrent edits

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `packages/backend/src/businessLogic/src/PostManager.ts:~35` |
| Category | concurrency |

**What:** The "caption or media" check merges the patch onto a row read earlier, then runs a separate UPDATE.
**Why it matters:** Post has caption + media. Edit A clears caption, edit B clears media; both validate against the same stale row and both write, leaving an empty post (the shape that crashed the feed before). Needs two writes in the same few milliseconds, so unlikely.
**Recommendation:** Only if it matters: add a `CHECK (coalesce(trim(caption),'') <> '' OR coalesce(trim(media_url),'') <> '')` via a new idempotent migration (existing empty rows would need cleaning first, so likely not worth it), or accept and note it.

### CORR-002: Update stores text untrimmed and blank as '', create trims and stores null

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/businessLogic/src/PostManager.ts:~28` |
| Category | logic |

**What:** `updatePost` puts the patch through as sent (`'  hi  '`, `''` kept), while `createNewPost` trims and turns blank into null. The test "stores text as sent (no trimming)" locks this in.
**Why it matters:** Same field, two storage rules. `media_url: ''` is stored as '' after an edit but null after a create; any later "is media present" check on the SQL side (`IS NULL`) will disagree. The feed UI trims before sending so it is invisible today.
**Recommendation:** In `updatePost`, apply `blankToNull(...)` to values that are strings (null stays null) and update the test; or document the difference in the method comment.

### CORR-003: A media-only post renders as an empty card

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | medium |
| File | `packages/frontend/src/features/feed/PostCard.tsx:157` |
| Category | logic |

**What:** The API now accepts caption-less posts that carry media, but no feed or profile code renders `media_url`. Such a post shows author line and comments only; the profile card shows nothing.
**Why it matters:** No crash; just a blank-looking post if someone posts via the API. The UI composer cannot create one. Not a regression.
**Recommendation:** Either leave it (media is out of scope) or reject media-only posts until media is rendered. Needs a user decision.

Deploy note (not a finding): `@alumni/businesslogic` runs from `dist/`, so the running API needs `tsc` in `packages/backend/src/businessLogic` before the new 400s take effect.

### Correctness — round 2

Written by: correctness-reviewer (tier: balanced)

**Summary:** CORR-002 (update vs create storage) is resolved. CORR-003 (media-only posts) is resolved by refusing them. Checked `readText`, `createNewPost`, `updatePost`, `requireCaption`, the new tests, and the frontend edit/create paths. 0 critical, 0 major, 0 minor, 1 trivial new. CORR-001 (concurrent edits) is unchanged and still minor.

- **CORR-002 resolved:** `readText` (PostManager.ts:~72) trims and turns blank or null into null for both create and update. Absent key gives undefined, `null` gives null, whitespace gives null, non-text gives 400. `updatePost` copies only keys where the result is not undefined, so omitted keys are kept, as before.
- **CORR-003 resolved:** `requireCaption` runs on create and on the merged update row. Media-only create and media-only edit get 400 "A post needs a caption". Tests cover both, including `{caption:'  ', media_url:'https://...'}`.
- **Stored whitespace caption:** merged check uses `typeof string` plus `trim()`, so an old row with `'   '` caption and a media-only edit gets 400. Correct (it renders as empty). Same for old `caption: null` rows: the user must send a caption to edit them, and `EditBox` already requires non-blank text. Delete is unaffected.
- **Ownership first:** `findOwnedPost` is still the first line of `updatePost`; the existing 404-before-body and 403-before-body tests still hold. `createNewPost` has no ownership step.
- **Old caption-less rows in the frontend:** `PostCard` uses `present(post.caption)` and `post.caption ?? ''` for the edit box, so null still renders safely and edit saves a real caption. No frontend change needed.
- **Old media-only rows:** they can exist from the round-1 window; they render as a bare header (no crash) and can only be fixed by adding a caption. Not new.

### CORR-004: Error message wording on the stored-row case can confuse

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/backend/src/businessLogic/src/PostManager.ts:~38` |
| Category | error-handling |

**What:** A PUT that sends only `media_url` to an old caption-less post answers "A post needs a caption", though the client sent no caption field.
**Why it matters:** Only direct API callers see it; the UI always sends a caption. Message is still accurate.
**Recommendation:** Leave it. No change needed.

Deploy note unchanged: rebuild `@alumni/businesslogic` (`tsc` in `packages/backend/src/businessLogic`) before the running API serves the new 400 text.

## Reflection findings

Written by: reflector (tier: balanced)

**Summary:** Checked 57 lessons (0 superseded skipped), gotchas G31/G34/G35 plus the rest by file overlap, 9 ADRs (ADR-09 touched), 5 concepts, and 4 user-facing docs. 4 findings: 0 critical, 0 major, 3 minor, 1 trivial. Biggest: the API now accepts media-only posts, but no screen shows `media_url`, so such a post renders as a bare header. The fix follows L-REQ-015-4 (shared type made `| null`, `present()` reused, API decides emptiness). G31 and G34 are respected; ADR-09 is not affected (the composer already blocks blank posts, so the new 400 only shows on direct API calls). docs likely affected: `POST /api/posts` (conventions-api.md line 9).

### REFL-001: Media-only posts are now allowed but the feed cannot show them

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/businessLogic/src/PostManager.ts` (requireContent), `packages/frontend/src/features/feed/PostCard.tsx:157` |
| Category | concept-drift |
| Vault reference | [[knowledge/lessons/LESSON-REQ-015-4-optional-in-type-means-null-safe]] |

**What:** The new rule "caption or media" lets `{ media_url: "x" }` through, but no frontend file reads `media_url` (grep: only the shared type). Such a post shows an author line and a comment toggle with no body.
**Why it matters:** The empty-looking card is the same shape of problem the bug was about, just not a crash. Only direct API calls can create one today (the composer sends caption only).
**Recommendation:** Either state in conventions-api.md that media-only posts are accepted but not yet rendered (so a later media REQ knows), or require a caption until media display exists. The user decides.

### REFL-002: conventions-api.md and a code comment do not state the new post rules

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/context/conventions-api.md:9` |
| Category | vault-stale |
| Vault reference | conventions-api.md "Posts and comments (REQ-009)" |

**What:** That bullet describes `GET /api/posts` and `PUT /api/comments/:id` but nothing about `POST`/`PUT /api/posts` body rules. Nothing in the swept docs is now wrong (CLAUDE.md, packages/frontend/README.md and features/feed/README.md only say the composer trims and disables Post while blank, still true), but the rules are new and unwritten.
**Recommendation:** At /wrapup add one sentence: caption and media_url must be text or null (400 otherwise); create trims and stores blank as null; create and edit answer 400 "A post needs a caption or media" if neither is left. Also note in PostManager.ts or the vault that update does not trim, so `caption: "  "` over a post with media is stored as spaces (hidden by `present()`).

### REFL-003: Create trims, update does not (inconsistent storage)

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/businessLogic/src/PostManager.ts` (updatePost vs createNewPost) |
| Category | concept-drift |
| Vault reference | conventions-api.md Posts section; G31 (unaffected) |

**What:** Create runs `blankToNull(trim)`; update stores text as sent but checks emptiness with `hasText`. So a PUT of `{caption: "  "}` on a post with media succeeds and stores spaces, where create would store null. The investigation already noted this as a possible follow-up.
**Recommendation:** Track as a follow-up (or run the update patch through `blankToNull` too, keeping the existing "stores text as sent" test in mind). Also, the check reads then writes with no lock; two concurrent edits could together empty a post. Low risk, same class as G31's note about read-back; no action needed beyond awareness.

### REFL-004: `author_photo` has the same optional-but-nullable gap

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/shared/src/types/post.types.ts:11`, `comment.types.ts:11` |
| Category | repeated-mistake |
| Vault reference | [[knowledge/lessons/LESSON-REQ-015-4-optional-in-type-means-null-safe]] |

**What:** L-REQ-015-4 says nullable columns must be read null-safely. `author_photo` comes from `users.photo_url` (nullable) and is typed `string` only. Today it is safe because `Avatar` and `AuthorAvatar` accept `null`, so nothing crashes.
**Recommendation:** Widen both to `string | null` so TypeScript flags a future unguarded read. Not needed for this fix.
