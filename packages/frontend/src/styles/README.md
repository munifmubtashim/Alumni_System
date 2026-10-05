# styles/

**Purpose:** global styling. `tokens.css` is generated from `docs/design/design-system/tokens.json` by `npm run tokens` (do not edit it by hand); `global.css` holds the reset and base element styles, using only token custom properties.

**May import:** nothing (CSS only; `global.css` uses no `@import`).

**Imported by:** `src/main.tsx` (font, then `tokens.css`, then `global.css`). Components reference tokens through `var(--…)` in their CSS Modules rather than importing these files.
