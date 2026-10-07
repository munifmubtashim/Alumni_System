# Undo only what the mutation wrote, and let the settle check count itself and ignore paused writes ^L-REQ-009-2

| Field | Value |
|---|---|
| ID | LESSON-REQ-009-2 |
| Captured | 2026-10-07 |
| REQ | REQ-009 |
| Component | feed data layer |
| Tags | frontend, tanstack-query, optimistic, adr-09 |
| Severity | guideline |

## The lesson

In an optimistic mutation, roll back by an inverse edit that first checks the cache still holds what this mutation wrote (never restore a whole snapshot), apply a clamped count's rollback by the delta it really applied, and decide "am I the last write running" with a count that includes the mutation itself during `onSettled` (`=== 1`) and skips paused (offline) mutations.

## Saw it in

- `packages/frontend/src/features/feed/useFeedMutations.ts` — edit rollback, `useDeleteComment` clamp, `running()` helper
- Found in review as CORR-001/003 after the first version used snapshots and `isMutating`; see ADR-09 and `knowledge/concepts/optimistic-cache-edits.md`
