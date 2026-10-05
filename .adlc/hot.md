# Hot Log

Append-only chronological log of significant events. One line per entry. Newest at the top.

**Committed and shared.** Only ever add entries — never rewrite or reorder old ones. Git is configured (`merge=union` via `.adlc/.gitattributes`) so that when two branches both add entries, it keeps both instead of raising a conflict — the team keeps one shared history with no merge pain. Only ever *append*; never rewrite or reorder existing lines (that defeats the union merge).

Grep-friendly format: `## [YYYY-MM-DD] kind | description` with optional metadata after.

```
## [2026-05-13] req-merged | REQ-042 added Firestore composite indexes for query path
## [2026-05-13] lesson | L-REQ-012-1 — declare composite indexes before deploy
## [2026-05-12] adr-accepted | ADR-003 chose direct SignalR client over BFF translation
## [2026-05-12] gotcha | G05 noted — Login.aspx URL-substring branching
```

## Entries

<!-- Newest entries below this line, newest first. Each entry is a level-2 heading. -->

## [2026-10-05] implement-gate-cleared | REQ-001-frontend-foundation
## [2026-10-04] adr-accepted | ADR-01 UI layer (Base UI + CSS Modules on tokens), ADR-02 TanStack Query + Jotai
## [2026-10-04] architect-gate-cleared | REQ-001-frontend-foundation
## [2026-10-04] work-path-set | REQ-001-frontend-foundation | branch at /Users/munifmubtashim/Alumni_System
## [2026-10-04] spec-gate-cleared | REQ-001-frontend-foundation

## [2026-10-04] init | Vault initialized
## [2026-10-04] init-import | README.md → context/project-overview.md
## [2026-10-04] init-import | README.md → context/architecture.md
## [2026-10-04] init-import | tsconfig.json → context/conventions.md
## [2026-10-04] init-import | packages/frontend/eslint.config.js → context/conventions.md
