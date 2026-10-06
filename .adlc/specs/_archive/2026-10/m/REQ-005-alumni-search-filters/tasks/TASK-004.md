# TASK-004 — Docs: list endpoint convention

| Field | Value |
|---|---|
| REQ | REQ-005 |
| Tier | 2 |
| Status | complete |
| Repo | alumni-system (worktree) |
| Depends on | TASK-003 |

## Goal

The docs say how list endpoints page and what they return, and describe `GET /api/alumni`'s parameters.

## Files to touch

| Path | Action |
|---|---|
| `.adlc/context/conventions.md` | edit — API conventions → **Pagination** (`page`/`pageSize`, default 20, max 100, `{ items, total }`, 400 on bad input); Response format mentions list envelopes |
| `CLAUDE.md` | edit — one line under the backend API notes: `GET /api/alumni` takes `q`, `department`, `university`, `graduationYear`, `page`, `pageSize` → `{ items, total }` |

## Acceptance

- [ ] Both docs match the implemented parameters and limits

## Related

- Architecture: [[specs/2026-10/m/REQ-005-alumni-search-filters/architecture]]
