# TASK-004 — UI primitives: SearchField, Popover

| Field | Value |
|---|---|
| REQ | REQ-006 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-system (worktree .worktrees/REQ-006-alumni-directory-page) |
| Depends on | — |
| Blocks | TASK-008 |

## Goal

A search input with an icon and a hidden label, and a Base UI popover for the filter panels.

## Files to touch

| Path | Action |
|---|---|
| `src/components/ui/SearchField/*` | create — `label` (visually hidden), leading search icon (inline SVG, `currentColor`), `type=search`, `ComponentPropsWithRef<'input'>`, font-size ≥ 1rem on phone (no iOS zoom) |
| `src/components/ui/Popover/*` | create — wraps `@base-ui/react/popover`: `Popover` with trigger (pill button with a chevron) and a panel on `--surface-raised`; controlled `open` / `onOpenChange` as well as uncontrolled; focus moves in, Escape closes, focus returns to the trigger. Verify Base UI 1.8's Popover props against the installed package before writing (ADV-002) |
| `src/components/ui/README.md` | edit |

## Approach

- No new dependency; Base UI Popover is in the installed `@base-ui/react`. See G04/G09 for Stylelint and Base UI styling traps.
- A visually-hidden utility lives in the primitive's CSS Module (check whether one exists; do not duplicate if so).

## Acceptance

- [x] Tests: SearchField has an accessible name and types; Popover opens by click and keyboard, Escape closes and returns focus
- [x] `lint`, `typecheck` pass; boundary tests green (no services/features imports)

## Related

- Architecture: [[specs/2026-10/m/REQ-006-alumni-directory-page/architecture]]
- Spec: AC AC6, AC14
- All paths below are under `packages/frontend/`. Tokens only (`var(--…)`), CSS Modules, no inline styles, no raw hex, imports per the boundary rules. Import `describe/it/expect/vi` from vitest.

## Notes

- Base UI 1.8 Popover verified in `node_modules/@base-ui/react/popover`: Root has `open`/`defaultOpen`/`onOpenChange(open, details)`; Popup is `role="dialog"` (named only via Title or `aria-label`), and takes `initialFocus`/`finalFocus`. Default initial focus is the first tabbable element for mouse and keyboard opens, the popup itself for touch (`createDefaultInitialFocus`). Default final focus is the trigger.
- Popover API: `trigger`, `label` (dialog name, required), `children`, `open`, `defaultOpen`, `onOpenChange(open)` (Base UI's event details are dropped so its types stay inside), `align`, `initialFocus`, `finalFocus` (boolean or ref), `triggerRef`, `className`. For ADV-002, TASK-008 can close via controlled `open`, pass `finalFocus={false}` when Apply swaps the pill for a chip and focus the chip's remove button itself, and use `triggerRef` to focus the pill after a chip is removed.
- No visually-hidden utility existed; `.visuallyHidden` lives in `SearchField.module.css` only.
- SearchField border is `--border-strong` (design: border-subtle) to match Input's contrast departure; text is `--text-body` (16px, design 15px) to avoid iOS zoom. Pill padding 10px/16px mapped to space-2/space-4 + 1px border; panel offset 8px (space-2).
- Tests: 6 SearchField, 11 Popover (click, Enter, Space open; Escape returns focus; outside click; defaultOpen; controlled close after Apply; controlled stays closed; finalFocus ref; triggerRef). Full suite 606 passed; typecheck, lint, format:check clean.
