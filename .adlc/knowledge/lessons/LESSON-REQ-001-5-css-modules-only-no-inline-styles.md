# Keep component styling in CSS Modules — inline styles bypass the token lint ^L-REQ-001-5

| Field | Value |
|---|---|
| ID | LESSON-REQ-001-5 |
| Captured | 2026-10-05 |
| REQ | REQ-001 |
| Component | frontend, ui-primitives |
| Tags | css, design-tokens, linting |
| Severity | guideline |
| Supersedes | — |

## The lesson

Don't style components with inline `style` objects, even tiny ones; Stylelint's tokens-only rules only see `.css` files, so inline spacing/type values pass unchecked.

## Saw it in

- `packages/frontend/src/app/RouteError.tsx` — moved to `RouteError.module.css` in review (m1)

---

## Related

- Originating REQ: [[REQ-001]]
- Components: [[knowledge/components/frontend]]
