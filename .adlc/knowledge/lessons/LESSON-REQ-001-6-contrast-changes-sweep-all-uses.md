# When fixing contrast for one use of a token, sweep every use and pin the pairs in the contrast test ^L-REQ-001-6

| Field | Value |
|---|---|
| ID | LESSON-REQ-001-6 |
| Captured | 2026-10-05 |
| REQ | REQ-001 |
| Component | frontend, design-tokens |
| Tags | accessibility, contrast, design-tokens |
| Severity | guideline |
| Supersedes | — |

## The lesson

When a token is swapped or darkened for contrast, grep every place it's used (placeholder, disabled, hover), add each foreground/background pair the CSS really uses to `contrast.test.ts`, and record accepted exceptions as per-theme floors rounded down.

## Saw it in

- `packages/frontend/src/components/ui/Input/Input.module.css` — helper text moved off `ink-muted`, placeholder missed (UI-001)
- `packages/frontend/src/styles/contrast.test.ts` — exception floors 1.44/1.6 (exact 1.4497/1.6097)

---

## Related

- Originating REQ: [[REQ-001]]
- Components: [[knowledge/components/frontend]]
