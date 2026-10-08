# TASK-003 — Frontend service: postsApi

| Field | Value |
|---|---|
| REQ | REQ-009 |
| Tier | 1 |
| Status | done |
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

- [x] Test per function: method, URL, params/body, error passes through (fake adapter, G26)
- [x] Service import boundaries lint clean

## Notes

`deletePost`/`deleteComment` answer 200 with a message body; ignore it.

Implementation (2026-10-07): `postsApi.ts` defines `ListPostsParams` and `PostInput` locally (no post input type exists in `@alumni/shared`; editing shared was out of scope). Tests are table-driven: one case list checks method, URL, body and return per function, and the same list (plus `listPosts`) checks a 403 rejects with the AxiosError. G26 asks not to copy the adapter helpers into another test file; with `src/test/` outside this task's files, the two helpers are repeated here once more. The shared helper stays the open follow-up QUAL-002.

## Related

- Architecture: [[specs/2026-10/m/REQ-009-post-feed-page/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]], G26, G28, G29, G30
