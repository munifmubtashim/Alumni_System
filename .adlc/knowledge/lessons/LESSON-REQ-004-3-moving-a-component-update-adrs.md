# When code moves between layers, grep the ADRs and context pages for its old home in the same change ^L-REQ-004-3

| Field | Value |
|---|---|
| ID | LESSON-REQ-004-3 |
| Captured | 2026-10-06 |
| REQ | REQ-004 |
| Component | vault |
| Tags | adr, docs, architecture |
| Severity | nice-to-know |

## The lesson

Moving a component (e.g. `SessionBridge` from `AppShell` to `RootLayout`) makes accepted ADRs, concept pages and `context/architecture.md` wrong. Grep the vault for the component's name and update or amend those pages in the same REQ. The reverse of [[knowledge/lessons/LESSON-REQ-001-8-adr-changes-update-claude-conventions|L-REQ-001-8]].

## Saw it in

- ADR-03 and the session-and-401 concept still said "mounted in `AppShell`" after REQ-004 (review M2); amended at wrap-up
