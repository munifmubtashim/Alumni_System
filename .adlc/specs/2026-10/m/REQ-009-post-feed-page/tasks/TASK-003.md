# TASK-003 — Frontend service: postsApi

| Field | Value |
|---|---|
| REQ | REQ-009 |
| Tier | 1 |
| Status | pending |
| Repo | alumni-system |
| Depends on | TASK-001 |
| Blocks | TASK-004 |

## Goal

All post and comment endpoints are callable through one typed service module.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/services/postsApi.ts` | create |
| `packages/frontend/src/services/postsApi.test.ts` | create |
| `packages/frontend/src/services/README.md` | edit |

## Approach

- Mirror `alumniApi.ts`: `listPosts({limit, offset})`, `createPost({caption})`, `updatePost(id,{caption})`, `deletePost(id)`, `listComments(postId)`, `createComment(postId,{content,parent_id?})`, `updateComment(id,{content})`, `deleteComment(id)`.
- Ids go through `encodeURIComponent`-style safe path building as `getAlumniProfile` does. Return `res.data`; no caching or navigation here.
- Types from `@alumni/shared`.

## Acceptance

- [ ] Test per function: method, URL, params/body, error passes through (fake adapter, G26)
- [ ] Service import boundaries lint clean

## Notes

`deletePost`/`deleteComment` answer 200 with a message body; ignore it.

## Related

- Architecture: [[specs/2026-10/m/REQ-009-post-feed-page/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]], G26, G28, G29, G30
