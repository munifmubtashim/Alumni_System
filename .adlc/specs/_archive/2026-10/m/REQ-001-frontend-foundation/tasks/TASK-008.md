# TASK-008 — ThemeToggle primitive on Base UI

| Field | Value |
|---|---|
| REQ | REQ-001 |
| Tier | 3 |
| Status | complete |
| Repo | alumni-system |
| Depends on | TASK-002, TASK-004 |
| Blocks | TASK-009 |

## Goal

A controlled, keyboard-operable three-way Light / Dark / System toggle matching `docs/design/design-system/components/ThemeToggle/`, built on Base UI's radio group, with no knowledge of storage or the DOM theme.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/components/ui/ThemeToggle/{ThemeToggle.tsx,ThemeToggle.module.css,ThemeToggle.test.tsx,index.ts}` | create |

## Approach

- Props: `value: 'light'|'dark'|'system'`, `onValueChange(value)`, optional `label` (default "Theme", used as the group's accessible name). Type the value locally in the component (`ThemeToggleValue`) — **do not import from `@/store`** (lint boundary); TASK-009 maps between them (identical unions).
- Use `@base-ui/react` `RadioGroup` + `Radio.Root`/`Radio.Indicator` (check the installed version's exports and docs in `node_modules/@base-ui/react`); render each option's visible text label. Style via Base UI's `data-checked` / `data-focus-visible` attributes in the CSS module: track `--surface-sunken`, `--radius-pill`; selected segment `--surface-raised` with `--border-subtle` hairline; text `--ink-secondary` → `--ink-primary` **and** `font-weight` from the heading type token (600) when checked — the raised segment alone is only 1.19:1, so the selected option must also read through its text (architecture.md → Contrast); focus-visible outline `--accent`.
- Use a local class join (don't import TASK-007's `cx.ts`, which may not exist yet when this runs in parallel). No `components/ui/index.ts` barrel.
- Read `ThemeToggle/preview.html` for proportions; translate to tokens.

## Acceptance

- [ ] Renders a radiogroup named "Theme" with three radios labelled Light, Dark, System; the one matching `value` is `aria-checked="true"`.
- [ ] Clicking Dark calls `onValueChange('dark')`.
- [ ] Keyboard: Tab focuses the checked radio; ArrowRight/ArrowLeft move selection and call `onValueChange`.
- [ ] Component does not import storage, store, or touch `document.documentElement` (lint + grep).
- [ ] `npm test`, `npm run lint`, `npm run typecheck`, `npm run format:check` pass.

## Notes

If Base UI's radio group can't meet the keyboard criteria, **stop and report** rather than switching libraries — that would change ADR-01.

## Related

- Architecture: [[specs/2026-10/m/REQ-001-frontend-foundation/architecture]]
- Lessons checked: none exist yet

### Implementation notes (2026-10-05)

- **Base UI 1.8.0 API used:** `RadioGroup` from `@base-ui/react/radio-group` (generic `<Value>`, `aria-label`, controlled `value`/`onValueChange(value, details)`), `Radio.Root` from `@base-ui/react/radio` (renders `<span role="radio">` + hidden input). Keyboard (Tab to checked, arrows move and select) works out of the box via its CompositeRoot; all criteria met without workarounds.
- **Deviation 1 — no `data-focus-visible`:** Radio.Root sets only `data-checked`/`data-unchecked`/`data-disabled`/… (`data-focused` only inside Field.Root). Focus ring uses `:focus-visible` (2px `--accent` outline, offset 2px).
- **Deviation 2 — no `Radio.Indicator`:** the design has no dot; the raised segment plus text weight/color are the marker. Adding an empty indicator would only add DOM.
- **Proportions from preview.html, mapped to tokens:** track padding 3px → `calc(var(--space-1) - 1px)`, gap 2px → `calc(var(--space-1) / 2)`, option padding `--space-1 --space-3`, text `--text-label`. Hairlines are `1px solid` (no border-width token; stylelint doesn't police `border` shorthand width). Unchecked options carry a transparent 1px border so selection doesn't shift layout.
- **Known small effect:** checked text goes 500 → 600 weight, so the option widens by a pixel or two on selection (accepted per architecture Contrast; ui-reviewer may weigh in).
- `prefers-reduced-motion` turns off the color/background transition.
- **Checks:** my files pass eslint, stylelint, prettier; ThemeToggle tests 7/7; `npm run typecheck` and `npm run build` exit 0. Full `npm run lint` / `format:check` / `npm test` were red at handoff **only** on parallel tasks' in-progress files: `src/components/ui/Input/Input.module.css` (no-descending-specificity), `src/features/theme/useApplyTheme.test.tsx` (eslint), `index.html` (prettier), `src/store/themeAtom.test.ts` (3 no-flash script tests), `src/components/ui/Button/Button.test.tsx` (Enter/Space test). Re-run after TASK-006/007 finish.
- Boundary grep (`localStorage|documentElement|store|services|features`) matches only the test's assertion that `data-theme` is untouched.
