# An optional field in a shared type must be read null-safely everywhere ^L-REQ-015-4

| Field | Value |
|---|---|
| ID | LESSON-REQ-015-4 |
| Captured | 2026-10-08 |
| REQ | REQ-015 |
| Component | frontend, shared |
| Tags | frontend, shared-types, feed, null |
| Severity | trap |

## The lesson

If `@alumni/shared` marks a field optional (`caption?: string`), every read must survive `undefined` and `null` (`post.caption?.trim()`), and the API must decide whether an empty value is allowed. One unguarded `.trim()` turned a single caption-less post into an error page for every viewer of the feed.

## Saw it in

- `packages/frontend/src/features/feed/PostCard.tsx:155` — found by the REQ-015 UI re-review (UI-003); filed as a follow-up bugfix


## Saw it again

- [[BUG-001]]: fixed the feed crash this lesson came from; the root type is now `caption?: string | null` (see [[knowledge/lessons/LESSON-BUG-001-1-nullable-column-means-null-in-shared-type|L-BUG-001-1]]).
