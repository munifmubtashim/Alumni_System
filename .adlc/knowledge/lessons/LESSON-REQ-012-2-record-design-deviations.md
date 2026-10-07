# Record a deliberate departure from a design screen on a vault page when it is made, so later design-compare reviews cite it instead of re-flagging it ^L-REQ-012-2

| Field | Value |
|---|---|
| ID | LESSON-REQ-012-2 |
| Captured | 2026-10-07 |
| REQ | REQ-012 |
| Component | frontend, docs |
| Tags | design, vault, process |
| Severity | guideline |

## The lesson

When code intentionally differs from `docs/design/` (here: no My Profile link in the header nav, an "Account" phone tab), add one line on a concept or component page in the same change, not only in READMEs. `docs/design/` keeps showing the old design, so a README alone is not found by the next reviewer.

## Saw it in

- REQ-012: the deviation lived only in `src/app/README.md` and CLAUDE.md until the reflector flagged it (CAND-004, REFL-002); recorded in `concepts/route-layout.md` at wrapup.
