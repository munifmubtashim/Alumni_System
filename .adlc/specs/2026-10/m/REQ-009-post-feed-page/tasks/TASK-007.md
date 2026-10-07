# TASK-007 — Docs

| Field | Value |
|---|---|
| REQ | REQ-009 |
| Tier | 4 |
| Status | done |
| Repo | alumni-system |
| Depends on | TASK-005 |
| Blocks | TASK-008 |

## Goal

Repo docs describe the feed and the new comment-edit endpoint.

## Files to touch

| Path | Action |
|---|---|
| `CLAUDE.md` (root): Frontend subsection, API paragraph | edit |
| `packages/frontend/README.md`, `src/features/README.md`, `src/services/README.md`, `src/config/README.md` | edit |
| `.adlc/context/conventions-api.md`, `conventions-frontend.md` | edit |

## Approach

- Short: feed feature, lazy route list (three now), `PUT /api/comments/:id` rule (owner-or-admin, content only), `relativeTime` now in `config/`, ADR-09 pointer.

## Acceptance

- [x] No stale statement about 'only Directory in nav', 'two lazy pages', or 'no comment edit'

## Notes

Wording style of neighbouring lines.

## Related

- Architecture: [[specs/2026-10/m/REQ-009-post-feed-page/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]], G26, G28, G29, G30
