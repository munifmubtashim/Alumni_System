# TASK-001 — Brand constants in config/, Logo primitive, title and favicon

| Field | Value |
|---|---|
| REQ | REQ-004 |
| Tier | 0 |
| Status | done |
| Repo | alumni-system |
| Depends on | — |
| Blocks | TASK-003, TASK-004 |

## Goal

"Alma" comes from one leaf constants module that `app/` and `features/` can both import. A token-coloured `Logo` primitive exists, and the tab shows the Alma title and favicon.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/config/brand.ts` | create — `BRAND_NAME`, `SUPPORT_EMAIL`, `PASSWORD_RESET_SUBJECT`, `supportMailto(subject)` |
| `packages/frontend/src/config/brand.test.ts` | create — `supportMailto` encodes the subject |
| `packages/frontend/src/config/README.md` | create — leaf folder; constants only; imports nothing internal |
| `packages/frontend/src/app/brand.ts` | delete; update its importers (AppShell) to `@/config/brand` |
| `packages/frontend/eslint.config.js` | edit — `config/` may not import app, features, components, store, services (alias + relative) |
| `packages/frontend/scripts/enforcement.test.ts` | edit — fixture proving the ban fires, both import forms |
| `packages/frontend/index.html` | edit — `<title>Alma</title>` |
| `packages/frontend/public/favicon.svg` | replace with `docs/design/brand/favicon.svg` (verbatim) |
| `packages/frontend/src/components/ui/Logo/{Logo.tsx,Logo.module.css,Logo.test.tsx,index.ts}` | create |
| `packages/frontend/src/app/AppShell/AppShell.tsx` | edit — import `BRAND_NAME` from `@/config/brand` (no restyle) |
| `packages/frontend/src/app/AppShell/AppShell.test.tsx` | edit — the 3 `'Alumni Network'` assertions (lines 138/173/183) → `'Alma'` (moved here from TASK-004, ADV-002) |

## Approach

- **`brand.ts`:** `supportMailto(subject)` returns `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}` (a template literal). Module-level constants use the SCREAMING_SNAKE convention.
- **Lint:** follow the existing `layerBan` pattern. `src/config/**` may not import `app`, `features`, `components`, `store`, `services`; `src/components/ui/**` may not import `config` (add to its existing ban list). One source block and one test block, with non-overlapping globs, per the conventions note.
- **Logo:** copy the geometry from `docs/design/brand/alma-mark.svg` (rect rx, path d) into JSX.
  - The mark `<rect>` gets `className={styles.mark}` (`fill: var(--accent)`).
  - The `<path>` gets `className={styles.glyph}` (`stroke: var(--accent-ink)`; stroke width and caps as attributes).
  - The SVG is `aria-hidden`. With `showWordmark`, render `<span className={styles.wordmark}>{label}</span>` (`font: var(--text-heading-sm)`, `color: inherit`). Otherwise the wrapper gets `role="img" aria-label={label}`.
  - `decorative?: boolean`: the whole logo is `aria-hidden` and gets no name (used by the auth panel).
  - `size?: 'sm' | 'md'` maps to 1.75rem / 2.25rem (literal layout sizes).
  - **No hex anywhere** (the ESLint tokens-only rule would catch it).
  - Logo takes `label` as a prop and must not import `config/`: `components/ui` stays prop-driven.

## Acceptance

- [ ] `grep -rn "Alumni Network" packages/frontend/src packages/frontend/index.html` finds nothing except tests that TASK-004 updates
- [ ] Logo tests: name with and without wordmark; `decorative` exposes no name; rendered markup contains no `#` colour
- [ ] Enforcement fixtures for both new bans (config → app/features; ui → config), alias and relative forms
- [ ] Enforcement test fails if the `config/` ban is removed; `npm run lint` and `npm test` pass
- [ ] `npm run typecheck` passes

## Notes

- AppShell's `BRAND_NAME` import and its 3 brand-text test assertions change here, so `npm test` stays green after this task. TASK-004 restyles the header later.
- Don't touch `tokens.json` or `tokens.css`.

### Implementation notes (2026-10-06)

- All acceptance boxes met: typecheck, lint, format:check, `npm test` (445 passed) green. `grep "Alumni Network"` finds nothing in `src/` or `index.html`.
- **Ban proven:** with the `src/config/**` block removed from `eslint.config.js`, 10 config fixtures in `enforcement.test.ts` fail; restored, all 81 pass.
- **Fixtures added:** config/ -> app, features, components, store, services (alias + relative each); components/ui -> config (alias, relative, bare folder `../../../config`, `./config`); allowed cases (config relative sibling, features and app importing `@/config/brand`); package sub-paths `some-lib/app`, `some-lib/config` not flagged.
- **Logo API:** `label`, `showWordmark`, `decorative`, `size` (`data-size` attribute, 1.75rem / 2.25rem in CSS), plus span props and `className`. Named case = wrapper `role="img"` + `aria-label`; wordmark case = visible text, no img role; decorative = `aria-hidden` root, no name. SVG has `aria-hidden` and `focusable="false"`.
- `queryByText` ignores `aria-hidden`, so the decorative test checks the wordmark sits inside the hidden root instead (CAND-001).
- **Left for TASK-005 (docs):** a `Logo` row in `components/ui/README.md` and adding `config/` to its "Must not import" line; `packages/frontend/README.md` line 3 still says "The Alumni Network web app".

## Related

- Architecture: [[specs/2026-10/m/REQ-004-alma-rebrand-auth-shell/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-001-4-import-boundary-lint-must-match-docs|L-REQ-001-4]], [[knowledge/lessons/LESSON-REQ-001-5-css-modules-only-no-inline-styles|L-REQ-001-5]]
