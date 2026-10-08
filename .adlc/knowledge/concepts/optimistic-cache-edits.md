# Concept — optimistic updates by editing the query cache

| Field | Value |
|---|---|
| Status | current as of REQ-009 (2026-10-07) |

Writes that must show before the server answers (a new post or comment, an edit, a delete) are done by editing the TanStack Query cache, never a Jotai copy. Decision: [[architecture/adr-09-optimistic-updates-by-cache-edit|ADR-09]]. First used in `features/feed`.

## How the pieces connect

- **Pure edits.** `features/<x>/cacheEdits.ts` holds functions that take the cache value and return a new one (add, replace, remove, bump a count). Each is unit-tested alone.
- **Three steps per mutation.** `onMutate` cancels in-flight reads of the exact key and applies the edit (a creation gets a negative temporary `id` and a stable `clientKey`, used as the React key so the card does not remount when the real id arrives); `onError` applies the inverse edit, but only if the cache still holds what this mutation wrote ([[knowledge/lessons/LESSON-REQ-009-2-optimistic-rollback-undoes-only-its-own-write]]); `onSettled` refetches only when it is the last running write on that key, ignoring paused writes.
- **Exact keys.** Edit and invalidate with `exact` keys; `['feed','posts']` and `['feed','comments',id]` share no prefix on purpose.
- **Pending items are inert.** No menu, thread toggle or Reply while the id is negative.
- **Lost session.** On a 401 SessionBridge has already cleared the cache: skip the rollback when no live token remains ([[knowledge/concepts/session-and-401]]).
- **Errors.** A 4xx message from the API is shown as is; a 5xx or no answer shows a plain "couldn't reach the server" line.

## Tests

`cacheEdits.test.ts` (every edit), `useFeedMutations.test.tsx` (rollback, overlapping writes, 401, paused writes). Traps: [[knowledge/gotchas#^g34|G34]].

Introduced in [[REQ-009]]. Note ([[REQ-016]]): Home's `['feed','latest']` query is safe next to these edits only because they use exact keys; it refetches on mount (`refetchOnMount: 'always'`) instead of relying on them.
