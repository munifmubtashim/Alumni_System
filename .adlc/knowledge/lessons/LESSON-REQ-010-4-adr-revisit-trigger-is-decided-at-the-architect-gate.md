# When an ADR names a "revisit at X" trigger, the REQ that reaches X records the outcome in that ADR at its architect gate ^L-REQ-010-4

| Field | Value |
|---|---|
| ID | LESSON-REQ-010-4 |
| Captured | 2026-10-07 |
| REQ | REQ-010 |
| Component | vault, adr |
| Tags | vault, adr, process, forms |
| Severity | guideline |

## The lesson

ADR-04 said to revisit the no-form-library rule when a form passes about 8 fields, "likely My Profile"; /me has up to 12 fields and the architecture said "Deviation: none", so the decision was made silently. Check every accepted ADR's revisit lines against the REQ at /architect and write the outcome (even "stay") into the ADR.

## Saw it in

- `.adlc/architecture/adr-04-forms-without-a-library.md` vs REQ-010 `architecture.md` (REFL-001); outcome now recorded in ADR-04
