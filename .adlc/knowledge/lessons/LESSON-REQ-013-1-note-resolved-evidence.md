# When a REQ deletes the code a lesson or ADR note cites as evidence, add a dated "resolved in REQ-N" note there ^L-REQ-013-1

| Field | Value |
|---|---|
| ID | LESSON-REQ-013-1 |
| Captured | 2026-10-07 |
| REQ | REQ-013 |
| Component | vault |
| Tags | vault, process, docs |
| Severity | guideline |

## The lesson

A lesson or an ADR row that names `file:symbol` as its evidence reads as present tense. When a later REQ deletes that code, grep the vault (`lessons/`, `architecture/`, `gotchas.md`) for the symbol at wrapup and add a dated "removed/resolved in REQ-N" note, keeping the rule if it still holds; otherwise the next reader follows a mechanism that no longer exists.

## Saw it in

- REQ-013 removed `.wideOnly`, `isHidden` and `HIDDEN_FIELD_HINT`; `LESSON-REQ-011-2`, `LESSON-REQ-012-1` and the ADR-04 row still described them (REFL-001/002, CAND-003).
