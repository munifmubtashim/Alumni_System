# A form field hidden by a CSS breakpoint needs its errors routed, a reflow decision, its own class and a browser check ^L-REQ-011-2

| Field | Value |
|---|---|
| ID | LESSON-REQ-011-2 |
| Captured | 2026-10-07 |
| REQ | REQ-011 |
| Component | frontend, forms |
| Tags | frontend, forms, responsive, a11y |
| Severity | trap |

## The lesson

Hiding an editable field below a width has four consequences: (1) an error on the hidden field must surface elsewhere (form-level alert with a hint) and a cross-field message must name a field visible at every width; (2) browser zoom triggers the same breakpoint, so zoomed desktop users lose the field (CORR-001: decide this at the spec, not at review); (3) do not reuse a class that carries a breakpoint rule for a new element (the location pin vanished on phones); (4) jsdom applies no CSS Modules, so tests hide the field by hand and only a real browser proves the breakpoint.

## Saw it in

- Start year on My Profile (`features/me/ProfileForm.tsx`, `Section.module.css` `.wideOnly`); CAND-011, CAND-018, CAND-024, CAND-A02 and the UI-001/002 findings.
