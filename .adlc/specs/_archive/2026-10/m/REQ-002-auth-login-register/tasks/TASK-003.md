# TASK-003 — Menu and SegmentedControl primitives on Base UI; ThemeToggle rebuilt on SegmentedControl

| Field | Value |
|---|---|
| REQ | REQ-002 |
| Tier | 0 |
| Status | done |
| Repo | alumni-system |
| Depends on | — |
| Blocks | TASK-005 |

## Goal

A keyboard-accessible, token-styled dropdown menu and a generic segmented choice exist; ThemeToggle uses the latter with no behaviour change.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/components/ui/Menu/{Menu.tsx,Menu.module.css,Menu.test.tsx,index.ts}` | create |
| `packages/frontend/src/components/ui/SegmentedControl/{SegmentedControl.tsx,SegmentedControl.module.css,SegmentedControl.test.tsx,index.ts}` | create |
| `packages/frontend/src/components/ui/ThemeToggle/ThemeToggle.tsx` | edit |
| `packages/frontend/src/components/ui/ThemeToggle/ThemeToggle.module.css` | edit or delete |

## Approach

- Read `node_modules/@base-ui/react/menu/**` type definitions first (G05: check real data attributes in 1.8). Menu API: `<Menu trigger={ReactNode} label?>` with `<Menu.Item onSelect>` and `<Menu.Label>` (non-interactive), or a compound equivalent: keep Base UI types behind our props (ADR-01). Popup: `surface-raised`, 1px `border-subtle`, `radius-md`, `space-2` padding, no shadow; items `space-2 space-3`, highlighted/focus style with `accent-soft` fill.
- SegmentedControl `{ label, options: {value,label}[], value, onValueChange }` built from ThemeToggle's current RadioGroup/Radio code, including the `::after` bold-width reservation and `cx`. ThemeToggle becomes a wrapper passing its three options; its CSS module moves or is deleted.
- Don't edit `contrast.test.ts` or `components/ui/README.md` (owned by TASK-002 this tier); report README additions in your notes for TASK-007.

## Acceptance

- [x] Menu: Enter/ArrowDown open; arrow keys move; Enter selects and closes; Escape closes and returns focus to the trigger; trigger has `aria-haspopup`/`aria-expanded`
- [x] SegmentedControl: radiogroup with name, arrow keys, aria-checked, onValueChange
- [x] The existing `ThemeToggle.test.tsx` passes unchanged (don't edit it)
- [x] lint, format:check, typecheck, test pass

## Related

- Architecture: [[specs/2026-10/m/REQ-002-auth-login-register/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-001-4]], [[knowledge/lessons/LESSON-REQ-001-5]], [[knowledge/lessons/LESSON-REQ-001-6]], [[knowledge/lessons/LESSON-REQ-001-7]], [[knowledge/lessons/LESSON-REQ-001-9]]; gotchas G05, G07

## Notes

- **Menu API (deviation in shape, not intent):** flat named exports `Menu`, `MenuItem`, `MenuLabel` from `components/ui/Menu`, not `Menu.Item`/`Menu.Label`. `Object.assign` compound failed `react-refresh/only-export-components`. Props: `Menu { trigger: ReactNode; children; align?: 'start'|'end'; className? }` (trigger text is the button's name), `MenuItem { children; onSelect; disabled? }`, `MenuLabel { children }` (Base UI Group + GroupLabel, not focusable, skipped by arrows).
- **Base UI 1.8 Menu facts (G05 check):** item highlight attribute is `data-highlighted` (also `data-disabled`); trigger gets `data-popup-open`, `aria-haspopup="menu"`, `aria-expanded`. Real focus moves to the highlighted item. Enter and ArrowDown on the trigger both open and focus item 1; Escape closes and returns focus. All covered in `Menu.test.tsx`.
- **Popup styling:** `surface-raised`, 1px `border-subtle`, `radius-md`, `space-2` padding, no shadow; items `space-2 space-3`, `accent-soft` fill on `[data-highlighted]` / `:focus-visible`. `sideOffset={4}` (= `--space-1`; Base UI wants a number). `min-width: 12rem` and `z-index: 10` are literal layout values.
- **Contrast:** item text `ink-primary` on `accent-soft` = 11.9:1 light, 11.4:1 dark (computed from tokens.json). Not added to `contrast.test.ts` (TASK-002 owns it this tier) — suggest TASK-007 adds `{ fg: 'ink-primary', bg: 'accent-soft', use: 'highlighted Menu item' }` and `{ ink-secondary on surface-raised }` already exists for the label.
- **ThemeToggle:** now a wrapper over `SegmentedControl<ThemeToggleValue>`; its CSS module was moved (content unchanged, header comment updated) to `SegmentedControl.module.css` and deleted. `ThemeToggle.test.tsx` untouched and green.
- **README additions for TASK-007 (`components/ui/README.md`):** add rows — `Menu` / `MenuItem` / `MenuLabel` (Base UI Menu; dropdown with keyboard support; `onSelect` per item; label non-interactive) and `SegmentedControl<T>` (Base UI RadioGroup; `label`, `options`, `value`, `onValueChange`; ThemeToggle is built on it). Update the conventions line "only ThemeToggle uses [Base UI] today" — Menu and SegmentedControl now do too.
- **Checks:** lint (ESLint + Stylelint), format:check, typecheck, `npx vitest run` x2 (19 files, 255 tests) all pass at finish. Mid-run, lint/typecheck errors appeared only in `Button.tsx` (TASK-002) and `services/httpClient.ts` (TASK-001); gone by the final run.
