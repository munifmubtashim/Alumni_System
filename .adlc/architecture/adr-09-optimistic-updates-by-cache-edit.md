# ADR-09 — Optimistic updates by editing the TanStack Query cache ^ADR-09

| Field | Value |
|---|---|
| Status | accepted |
| Decided | 2026-10-07 |
| Author | munifmubtashim (drafted by Claude) |
| Supersedes | (none) |
| Superseded by | (none) |
| Based on | [[specs/2026-10/m/REQ-009-post-feed-page/requirement]] · [[architecture/adr-02-server-state-tanstack-query\|ADR-02]] |

## Context

The feed (REQ-009) must show a new post or comment at once and undo it if the API refuses. ADR-02 puts server data in TanStack Query but says nothing about writes that should appear before the server answers. Later pages (My Profile, Admin) will want the same, so the pattern should be set once.

## Considered options

### Option 1 — Edit the query cache in `onMutate`, roll back in `onError`, refetch in `onSettled`
Cancel in-flight reads of the exact key, write the expected result (a temporary negative id for creates), undo with the *inverse edit* on error (never a whole-cache snapshot, so overlapping mutations do not wipe or resurrect each other's rows), and invalidate on settle only when no other mutation on that key is still running (the count of running, not paused, mutations on that key is 1), so a refetch cannot hide a pending row.
**Pros:** one source of truth (the cache); no new library; the same code path serves loading and optimistic states; works with `useInfiniteQuery`.
**Cons:** every mutation needs a small pure cache-edit function, tested on its own.

### Option 2 — Show the pending variable next to the list (`useMutation().variables`)
**Pros:** no cache surgery. **Cons:** only the component that fired the mutation sees it; edits and deletes cannot be shown; lists remount and lose it.

### Option 3 — Mirror the list in a Jotai atom
**Pros:** simple to read. **Cons:** breaks ADR-02 (server data in an atom) and creates two copies that drift.

## Decision

**We chose Option 1.** Cache edits live in pure functions in `features/<x>/cacheEdits.ts` (input cache in, new cache out, never mutating), each unit-tested; hooks wire them into `onMutate` / `onError` / `onSettled`. Cache edits target exact keys (`setQueryData`, `exact: true`), never prefix matches. A pending create carries a negative temporary id plus a stable client key (used as the React key so the card does not remount when the real id arrives) and offers no menu, no thread toggle and no Reply until the server id arrives. On a 401 the rollback is skipped when no live token remains (SessionBridge has already cleared the cache, ADR-03). Mutations are still not retried (ADR-02).

## Consequences

- New write features follow the same three-step shape and the same test style (edit function, then hook behaviour on failure).
- A 401 during a mutation is handled by SessionBridge as before (ADR-03). The rollback is skipped once no live token remains, so the next user never sees the old feed or pending rows.
- Fixes a gap in ADR-02: optimistic writes are allowed, but only by this route.
