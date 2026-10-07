# Architecture adversary — REQ-009-post-feed-page

Written by: architecture-adversary (tier: balanced), dispatched sub-agent.

| Field | Value |
|---|---|
| Generated | 2026-10-07 |
| Trigger | new-adr, large-blast-radius, sensitive-surface, ui-surface |
| Verdict | found problems |

## Summary

Read the spec (5 ACs), architecture, ADR-09, 8 tasks, and the backend code the PUT mirrors. 9 findings: 0 critical, 5 major, 4 minor. Biggest: ADR-09's snapshot-and-restore rollback is unsafe when two mutations overlap, and the `['posts']` cache key is a prefix of every comment-thread key. Dispatch answers: PUT auth order checked, nothing wrong with owner-before-validation (matches `PostManager.updatePost`); admin edit of others' comments is ADV-008; every AC has a task (checked, nothing); exploration's `updated_at` claim is wrong as you said (`CommentDTO.ts:10`), no migration needed.

## Findings

### ADV-001: Snapshot rollback destroys other pending mutations

| Field | Value |
|---|---|
| Severity | major |
| Confidence | high |
| Lens | failure-mode |
| Where | ADR-09 Decision; `architecture.md` §Frontend data; TASK-004 |

**What:** `onMutate` snapshots the whole cache and `onError` restores it; `onSettled` always invalidates.
**Break scenario:** User posts A (slow), then posts B. B's snapshot already contains A's temp row. A fails and restores the pre-A snapshot, so B's pending row vanishes. B then succeeds and its "replace temp id" finds nothing. Reverse order: B fails and restores a snapshot that resurrects A's failed row. Also: A's `onSettled` invalidate refetches while B is still in flight; the server answer does not contain B, so B's row flickers away. Same if "Load more" finishes between snapshot and failure: restore drops the extra page.
**Why it holds up:** TanStack serialises nothing across mutations. Refutation tried: mutations are fast. Not on a slow phone, and rollback is only tested "after one failure".
**Recommendation:** Roll back by applying the inverse edit (remove the temp id, un-bump the count) to the current cache, not by restoring a snapshot. Invalidate only when `queryClient.isMutating(...)` is 1. Add a hook test with two overlapping mutations, one failing. Put this in ADR-09 before it is accepted.

### ADV-002: `['posts']` is a prefix of `['posts', id, 'comments']`

| Field | Value |
|---|---|
| Severity | major |
| Confidence | high |
| Lens | hidden-coupling |
| Where | `architecture.md` §Frontend data (keys); TASK-004 |

**What:** Infinite-query data (`{pages, pageParams}`) and comment arrays live under keys that share the `['posts']` prefix.
**Break scenario:** An implementer writes `setQueriesData(['posts'], editFn)` or `cancelQueries(['posts'])`. The edit function runs on every comment array and corrupts or throws. `invalidateQueries(['posts'])` after a post create also refetches every open thread.
**Why it holds up:** Refutation: use exact `setQueryData`. The plan never says so, and ADR-09 says "cancel in-flight reads of the key".
**Recommendation:** Rename comment keys to `['comments', postId]` (or use `['posts','list']` for the feed). State that cache edits use exact keys only. Add it to the TASK-004 acceptance.

### ADV-003: Pending (negative id) items are interactive

| Field | Value |
|---|---|
| Severity | major |
| Confidence | high |
| Lens | omission |
| Where | TASK-005 Approach ("Pending items show no menu"); `architecture.md` §Frontend data |

**What:** Only the menu is hidden. The comments toggle, Reply, and reply box on a pending post or comment are not covered.
**Break scenario:** User posts, taps "Comment" at once: `GET /api/posts/-3/comments` returns 400 (`requireId`). Or replies to a pending comment: `parent_id: -5` returns 400/404 and the reply rolls back. When the real id arrives, a card keyed by id remounts and loses the open thread, the draft, and focus.
**Why it holds up:** Nothing in the plan prevents these; `useComments(postId, enabled)` has no pending check.
**Recommendation:** Disable toggle/Reply while `id < 0`. Key cards by a stable client key kept across temp-to-real replacement. Add a test: open a thread right after create.

### ADV-004: Offset paging on an unstable sort

| Field | Value |
|---|---|
| Severity | major |
| Confidence | high |
| Lens | failure-mode |
| Where | `PostQuery.ts:24-31` (`ORDER BY posts.created_at DESC` only); `architecture.md` §Risks |

**What:** No tie-breaker, so ties give an undefined order between pages. Dedupe by id hides duplicates but cannot recover skipped rows. "Offset = loaded items" is also undefined after dedupe or an optimistic delete (offset drops, overlap) and create (offset counts the temp row, skips one real post).
**Break scenario:** Seed or bulk-imported posts share a timestamp. Page 2 starts at 20 and misses or repeats posts that tie at the boundary. Or: delete one post from a loaded page, then Load more: the offset is 19, and with "Load more only while the last page was full" the button can vanish after an optimistic delete.
**Why it holds up:** Refutation: real users rarely tie. Seeds and one-transaction inserts do, and the sort is a one-line fix.
**Recommendation:** Add `, posts.id DESC` to the query (new file in blast radius and TASK-001 or a new task; behaviour for callers unchanged). Compute next offset and "full page" from raw server page lengths, not the edited cache. Say so in TASK-004.

### ADV-005: Delete is one click, cascades, and 404 is mishandled

| Field | Value |
|---|---|
| Severity | major |
| Confidence | medium |
| Lens | ux-consistency |
| Where | `architecture.md` §UI and Open question 1; TASK-005 |

**What:** "Delete post" is a danger item beside Edit, no confirm; deleting a post also removes all its comments for good (the rollback only helps if the API refuses). Admin moderation makes a mis-click costlier. And a 404 on delete (someone already deleted it) would roll the row back, show it, then the refetch removes it, with the error text on a vanished card.
**Why it holds up:** Refutation: S4 shows no confirm. It is still an irreversible flow with no undo, and the architecture itself raises it as open. Decide it, don't default it.
**Recommendation:** Recommend a confirm step for posts (reuse the S6-DeleteConfirm look) and at least for any post with comments; treat delete-404 as success, no rollback. Add to TASK-004/005 acceptance.

### ADV-006: PUT comment can answer 200 with no body

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | failure-mode |
| Where | TASK-001 Approach (`UPDATE`, then separate `select`) |

**What:** Two statements, no `RETURNING`/transaction. **Break:** comment is deleted between the manager's `findCommentById` and the update; the select returns undefined, the controller sends 200 with an empty body, and the client's "replace with server row" crashes on `undefined`. **Why it holds up:** Narrow window but the controller has no guard, and tests mock the query. **Recommendation:** Single `UPDATE ... RETURNING id` then the author-join select, and throw `AppError(404)` when no row. Add a manager test where the query returns undefined. Also replace the hedged "if one exists" SQL test with a real one.

### ADV-007: Plans for odd data and states are missing

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | omission |
| Where | `architecture.md` §UI; TASK-004 `constants.ts`; TASK-005 |

**What:** (a) `POST/PUT /api/posts` accept blank and unlimited-length captions (`PostManager.ts` has no rules), and only the comment limit (2000) is mirrored; the Composer and post edit need a client rule (non-blank, a cap) and tests. (b) Long text and long unbroken strings: no `overflow-wrap`, no `white-space: pre-wrap` for newlines, no 360px check beyond a manual note. (c) Deleted post while a thread is open: comment create returns 404 "Post not found"; the error sits on a card the refetch removes, so the user sees nothing. (d) `['me']` still loading or failed: `canModify` and the optimistic author fields have no stated fallback; the composer should stay disabled. **Why it holds up:** none of these appear in any task acceptance. **Recommendation:** add one acceptance line each to TASK-004/005; show 404-on-comment as a page-level notice.

### ADV-008: Admin editing another user's comment is impersonation

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | omission |
| Where | spec AC3; `architecture.md` §Permissions, TASK-001 |

**What:** Owner-or-admin for edit matches REQ-003 and the posts code, so the order of checks is fine. But an admin edit rewrites words under the author's name, with no trace (`updated_at` is set, never shown). **Why it holds up:** it is spec-mandated, so I only ask that it be a stated decision. **Recommendation:** Keep it, record it as accepted in the architecture, and show an "edited" mark from `updated_at > created_at` (or limit admins to delete). User call at the gate.

### ADV-009: 401 mid-mutation resurrects cleared cache

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | failure-mode |
| Where | ADR-09 Consequences ("rollback runs but the user is on /login") |

**What:** `SessionBridge` calls `queryClient.clear()` on the token change (`SessionBridge.tsx:113`); `onError` then calls `setQueryData` with the snapshot, so the old feed and temp rows are back in the cache. **Break:** session expires during a post, the next user logs in on the same tab and sees the previous feed within `staleTime`, with an orphan temp row. **Why it holds up:** feed data is not private, but the temp rows and stale view are wrong. **Recommendation:** in `onError`, skip the restore when the token is gone (or when the query no longer exists, use `getQueryData` guard); test it.

## Coverage

- **Lenses run:** omission, failure-mode, hidden-coupling, rollback (no schema change, so reversible; skipped further), contradiction/testability (T5 "works at 200% zoom" is a manual note only, minor, not listed), ux-consistency.
- **Lenses skipped:** cross-repo (single repo).
- **Acceptance-criteria coverage:** AC-1 checked (TASK-004/005; paging ADV-004), AC-2 checked (ADV-001/002/003), AC-3 checked (ADV-006/008), AC-4 checked (TASK-006/007), AC-5 checked (TASK-008). Every AC has at least one task; no planned-as-zero.
