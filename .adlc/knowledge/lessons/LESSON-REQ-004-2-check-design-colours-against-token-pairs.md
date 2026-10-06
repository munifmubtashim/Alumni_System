# Check a design's colour choice against the real token pair before using it ^L-REQ-004-2

| Field | Value |
|---|---|
| ID | LESSON-REQ-004-2 |
| Captured | 2026-10-06 |
| REQ | REQ-004 |
| Component | frontend |
| Tags | frontend, design-tokens, accessibility, contrast |
| Severity | guideline |

## The lesson

When a design uses a muted colour for text or an icon, map it to a token and check that token on the actual background it sits on (often the Input's `surface-sunken`, not the page) before shipping. Add the pair to `contrast.test.ts` at the right floor (4.5:1 text, 3:1 controls).

## Saw it in

- `PasswordInput.module.css` — `ink-muted` on `surface-sunken` was 2.79:1 in light (REQ-004 review M1); the © line had the same miss and used `ink-secondary`
- Related: [[knowledge/lessons/LESSON-REQ-001-6-contrast-changes-sweep-all-uses|L-REQ-001-6]]
