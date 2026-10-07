# REQ-013-casing-fix-start-year-all-widths — Verification (task, round 1)

| Field | Value |
|---|---|
| Generated | 2026-10-07 |
| Branch | feat/REQ-013-casing-fix-start-year-all-widths (base `redesign`) |
| Files changed | 22 (+71/−169), uncommitted until the gate clears; the BaseDTO rename is staged |
| Packet | 78KB |

Narratives: `review-log.md`.

## Summary

Reviewed by: correctness (balanced) · reflector (balanced) · ui (balanced, static-only). **0 critical · 0 major · 1 minor (vault) · 4 trivial; all applied or handled.** After the review: 474 backend and 1298 frontend tests pass; `typecheck:backend` exits 0 (first time on this checkout); frontend typecheck, lint, format clean.

## Findings at a glance

| ID | Severity | Finding | Where | Disposition |
|----|----------|---------|-------|-------------|
| REFL-001 | minor (vault-stale) | LESSON-REQ-011-2 and the ADR-04 row still described the removed `.wideOnly` routing | vault | fixed at wrapup (dated updates) |
| REFL-002 | trivial (vault-stale) | LESSON-REQ-012-1 said `HIDDEN_FIELD_HINT` "will be stale" | vault | fixed (resolved note) |
| COR-001 / UI-001 / REFL-003 | trivial | test line asserting the removed `.wideOnly` class can never fail | ProfileForm.test.tsx | fixed (removed) |
| COR-002 | trivial | comment listed phone field order without Department | EducationSection.tsx | fixed |
| process | note | rename is staged, the import edits are not: commit them together | git | one commit (below) |

## Acceptance criteria check

- [✓] AC1 `npm run typecheck:backend` exits 0; tracked name, disk name and four imports all `BaseDTO.ts`; no lowercase reference left outside history
- [✓] AC2 Start year rendered and visible at every width (no `.wideOnly`, no `display: none` rule); phones stack University, Degree, Department, Start year, Graduation year; desktop two columns unchanged
- [✓] AC3 hidden-field machinery removed; year-order error is the plain backend message on Graduation year; tests updated; docs, G22/G32, concept page corrected
- [⚠] Not seen in a browser: the real 360px phone layout and 200% zoom (jsdom has no CSS Modules). Manual checklist at the end of `review-log.md`.
