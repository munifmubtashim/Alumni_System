# Concept — design tokens

| Field | Value |
|---|---|
| Status | current as of REQ-001 (2026-10-05) |

`docs/design/design-system/tokens.json` is the single source for color (light + dark), spacing, radius, type and motion. `npm run tokens` (`packages/frontend/scripts/generate-tokens.ts`) writes them to `src/styles/tokens.css` as CSS custom properties. Spacing and type are emitted in rem; radii stay px. Type styles come as `font` shorthands (`font: var(--text-label)`) plus `-size`/`-line`/`-weight` parts. Motion is `--duration-fast` and `--easing-standard`.

## Rules that always hold

- Components reference only `var(--…)`. Stylelint (declaration-strict-value, no hex/rgb, no box-shadow) and an ESLint raw-color rule enforce it. Layout sizes (72rem container, 6px dot, opacity .5) are deliberately literal.
- Theme switches by setting `data-theme` on `<html>`. An inline script in `index.html` applies the saved choice before first paint ([[knowledge/gotchas#^g01|G01]]).
- `tokens.css` is generated and never hand-edited; `npm run tokens:check` and a unit test fail when it drifts from the JSON.
- `src/styles/contrast.test.ts` pins every text/surface pair the CSS uses at 4.5:1, in both themes. Accepted exceptions are per-theme floors (the Input resting border). Change a token, and the test tells you what you broke ([[knowledge/lessons/LESSON-REQ-001-6]]).
- Light `accent` was darkened (`#975c43`, `accent-strong` `#7a4734`) in REQ-001 so accent text reaches AA.

- SVG colours follow the same rule: the brand mark, check marks and icons take `fill`/`stroke` from CSS-module classes on tokens (`fill: var(--accent)`), never hex attributes; icon sizes stay literal layout values ([[REQ-004]]). `public/favicon.svg` is the one hex exception, because the browser renders it outside the page.

Introduced in [[REQ-001]]; see [[architecture/adr-01-ui-layer-headless-css-modules|ADR-01]].
