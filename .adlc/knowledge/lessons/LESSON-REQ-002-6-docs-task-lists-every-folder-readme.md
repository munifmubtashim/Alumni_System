# A REQ's docs task must list every folder README, component page and catalog row the code touched ^L-REQ-002-6

| Field | Value |
|---|---|
| ID | LESSON-REQ-002-6 |
| Captured | 2026-10-05 |
| REQ | REQ-002 |
| Component | frontend |
| Tags | docs, vault, process |
| Severity | guideline |

## The lesson

When a REQ adds files to a layer (`services/`, `store/`, `app/`, a new feature), the docs task's file list names that layer's README, the vault component page and any ADR catalog row — not only the headline docs.

## Saw it in

- `packages/frontend/src/services/README.md`, `store/README.md`, `app/README.md` — stale after REQ-002 until wrap-up
- `.adlc/knowledge/components/frontend.md`, `.adlc/decisions.md` — REFL-001/002
- Flagged by four reviewers and two implementers independently (CAND-T7-2, CAND-022, CAND-Q-004, CAND-007)
