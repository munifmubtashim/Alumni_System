# TASK-006 — Header nav: Directory link

| Field | Value |
|---|---|
| REQ | REQ-006 |
| Tier | 0 |
| Status | pending |
| Repo | alumni-system (worktree .worktrees/REQ-006-alumni-directory-page) |
| Depends on | — |
| Blocks | TASK-010 |

## Goal

Signed-in users see a "Directory" link in the app header, active on `/directory` and below.

## Files to touch

| Path | Action |
|---|---|
| `src/app/AppShell/MainNav.tsx`, `MainNav.module.css` | create — `<nav aria-label="Main">` with `NavLink` (`aria-current="page"` when active; S1 look: label type, ink-secondary, active = ink-primary with a 2px accent underline) |
| `src/app/AppShell/AppShell.tsx`, `AppShell.module.css` | edit — place it between the brand and the actions; wraps on narrow screens; update the file's doc comment |
| `src/app/AppShell/AppShell.test.tsx` | edit — the Account-nav-only assertion; add: shown only when signed in, link target, active state on `/directory` |

## Approach

- Use `useHasSession` (auth feature) to show it for signed-in users only; guests keep the Account nav.
- Decision pending at the gate: phone keeps the link in the header (no bottom tab bar).

## Acceptance

- [x] Tests as listed; no hex; keyboard focus ring visible
- [~] Header check at 360px and at 200% zoom (brand, nav, user menu, theme toggle wrap without overlap or horizontal scroll), noted in the task
- [x] Existing AppShell and session tests green

## Notes

- `MainNav` renders `null` for guests (`useHasSession`), so a guest header keeps only HeaderAuth's "Account" nav. `NavLink` without `end` is active on `/directory` and below and sets `aria-current="page"` itself.
- Design map (S1 `.nav-link`): 14px/500 → `--text-label` (13px/500, as the task says); `#b7afa5` → `--ink-secondary`; active `#f1ece4` → `--ink-primary`, underline `#d08a66` → `--accent` as a 2px bottom border (transparent when inactive, so nothing shifts). Brand-to-nav gap 32px → `--space-6`; link gap 24px → `--space-5`. The design's 22px vertical padding (underline on the header's bottom edge) is not copied: `--space-2` padding, underline under the label. Residual for TASK-011.
- Focus: no local override; the global `:focus-visible` 2px accent outline applies to the link (keyboard test: Tab from the brand lands on Directory).
- Layout: brand + nav share a new `.headerStart` flex row (wrap, gap `--space-4` row / `--space-6` column), between the brand and the actions.
- 360px / 200% zoom: no browser available in this agent run (no Playwright or Chrome), so this is reasoned, not seen. At 360px the content box is 328px: brand (~90px) + gap + "Directory" (~65px) fit on one line; the actions wrap below as they did before. Every header row is `flex-wrap: wrap` with no fixed widths, so 200% zoom (640 CSS px at 1280) also wraps instead of scrolling. Needs one look in a real browser (TASK-011 or the user).
- Tests: the old "no nav links" test became "guest only Account nav, signed-in only Main nav"; new `Header main nav` block uses stand-in `directory/*` and `other` routes via `createRoutes` (not behind RequireAuth, so a guest still gets the header there).

## Related

- Architecture: [[specs/2026-10/m/REQ-006-alumni-directory-page/architecture]]
- Spec: AC AC2
- All paths below are under `packages/frontend/`. Tokens only (`var(--…)`), CSS Modules, no inline styles, no raw hex, imports per the boundary rules. Import `describe/it/expect/vi` from vitest.
