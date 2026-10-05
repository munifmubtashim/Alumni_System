# Concept — design tokens

| Field | Value |
|---|---|
| Status | stub — `STATUS: needs verification` (filled in by /wrapup of REQ-001) |

`docs/design/design-system/tokens.json` is the single source for color (light + dark), spacing, radius and type. A generator writes them to `packages/frontend/src/styles/tokens.css` as CSS custom properties; components reference only `var(--…)`. Theme switches by setting `data-theme` on `<html>`. Lint (Stylelint + ESLint) rejects raw values and shadows. Introduced in [[REQ-001]]; see [[architecture/adr-01-ui-layer-headless-css-modules|ADR-01]].
