# A nullable DB column is `T | null` in the shared type, not `T?` ^L-BUG-001-1

| Field | Value |
|---|---|
| ID | LESSON-BUG-001-1 |
| Captured | 2026-10-08 |
| REQ | BUG-001 |
| Component | shared, frontend |
| Tags | shared-types, null, postgres, frontend |
| Severity | trap |

## The lesson

pg sends SQL NULL as JSON `null`, which passes a `!== undefined` guard. Type every field that comes from a nullable column as `T | null` (optionally also `?`), so TypeScript rejects an unguarded read. When one such field is widened after a bug, widen its siblings from nullable columns in the same sweep.

## Saw it in

- `packages/shared/src/types/post.types.ts` (`caption?: string` let `PostCard.tsx:154` guard only `undefined`; one null row crashed /feed). `author_photo` is still `string` (follow-up).
