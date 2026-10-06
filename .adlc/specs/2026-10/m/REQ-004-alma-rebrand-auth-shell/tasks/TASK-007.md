# TASK-007 — Revision 2: forgot-password placement, compact theme toggle, input height, email placeholder

| Field | Value |
|---|---|
| REQ | REQ-004 |
| Tier | 4 (revision 2 at the implement gate) |
| Status | done |
| Repo | alumni-system |
| Depends on | TASK-006 |

## Goal

The four user-requested refinements in architecture.md → "Revision 2", with logic and validation unchanged.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/features/auth/LoginPage.tsx`, `.module.css`, `ForgotPasswordHelp.tsx`, `.module.css` | edit — ForgotPasswordHelp below the password field, right-aligned; message below it |
| `packages/frontend/src/features/auth/LoginPage.tsx`, `RegisterPage.tsx` | edit — email `placeholder="you@university.edu"` |
| `packages/frontend/src/components/ui/Input/Input.tsx`, `.module.css`, `Input.test.tsx` | edit — padding and line-height per Revision 2; remove `labelAction` (prop, CSS, tests) if no caller is left |
| `packages/frontend/src/components/ui/ThemeToggle/ThemeToggle.tsx`, `.module.css` (new if needed), `ThemeToggle.test.tsx` | edit — `variant="compact"`: icon-only segments, `aria-label`s, Base UI Tooltip |
| `packages/frontend/src/components/ui/SegmentedControl/*` | edit only if it needs to accept a ReactNode label / per-item aria-label; keep the existing API working |
| `packages/frontend/src/app/AuthShell/AuthShell.tsx` (+ test) | edit — `variant="compact"` |
| `packages/frontend/src/features/auth/ForgotPasswordHelp.test.tsx`, `LoginPage.test.tsx`, `RegisterPage.test.tsx` | edit — only if placement changes a structural assertion; report each |
| `packages/frontend/src/components/ui/README.md`, `CLAUDE.md` | edit — ThemeToggle `variant`; Input `labelAction` removed (if so) |

## Acceptance

- [ ] Existing theme tests still find the radios by name "Light"/"Dark"/"System"; compact shows a tooltip with the same text on hover and focus (test the focus path)
- [ ] App header still uses the full labelled toggle
- [ ] "Forgot password?" is the first thing after the password field, right-aligned; AC5 tests pass
- [ ] Email fields have the placeholder; placeholder colour is `--ink-secondary` per the design system
- [ ] Input renders ~40px tall; the show/hide button stays centred
- [ ] No diff to hooks, validators, authErrors, guards, redirect, SessionBridge, services
- [ ] typecheck, lint, format:check, test, build pass in packages/frontend

## Notes

### Implementation notes (2026-10-06)

- **Status: done.** typecheck, lint, format:check, build pass; `npm test` 467 passed (459 + 9 new − 1 removed). No diff to hooks, validators, authErrors, guards, redirect, SessionBridge, useCurrentUser/useHasSession/useLogout, services.
- **Compact toggle:** `SegmentedControl` options gained an optional `icon` (existing API unchanged; text options render exactly as before). An icon option is `<Tooltip.Trigger render={<Radio.Root aria-label={label} />}>`, so the radio keeps role, name, checked state and arrow keys; the tooltip (Portal > Positioner > Popup, `sideOffset` 4, hover delay 300ms) shows the label. Icons are inline Feather SVGs (`aria-hidden`, `currentColor`, 1.25rem). Tooltip styled like Menu: `--surface-raised`, `--border-subtle`, `--ink-primary`, `--text-caption`, no shadow (pair already in contrast.test). `ThemeToggle variant="compact"` uses it; `AuthShell` passes it; `AppShell` unchanged (full).
- **Forgot password:** `ForgotPasswordHelp` now wraps itself in a `.help` column (gap `--space-2`): the button `align-self: flex-end`, the message below at full width. `LoginPage` renders it as the form row right after `PasswordInput`. Input's `labelAction` had no caller left, so the prop, `.labelRow` CSS and its test are gone.
- **Input:** `line-height: var(--text-body-sm-line)` after the `font` shorthand, padding `--space-2 --space-4`: 22 + 16 + 2 = 40px. The 2.5rem show/hide button fills that height and stays centred. Placeholder colour was already `--ink-secondary`.
- **Tests:** ThemeToggle +4 (compact names, tooltip on focus incl. arrow move, tooltip on hover, click); AuthShell +2 (compact on /login, labelled toggle on other pages); LoginPage +2 (forgot help is the next sibling of the password field and next in tab order after show/hide; placeholder); RegisterPage +1 (placeholder). Input: removed the `labelAction` test, renamed "renders the label directly in the field without a label action" (assertion unchanged). No existing assertion changed in ForgotPasswordHelp/LoginPage/RegisterPage tests.
- **Left stale, out of scope (needs approval):** `PasswordInput.tsx` doc comment still lists `labelAction` as a passthrough prop; `packages/frontend/README.md` line ~130 still says Input gained `labelAction`. One-line text fixes each.
- **Not done:** browser check (login/sign-up light at 1440px and phone width). Build still warns the JS chunk is over 500 kB (Tooltip adds a little; not checked whether the warning predates this task).

## Related

- Architecture: [[specs/2026-10/m/REQ-004-alma-rebrand-auth-shell/architecture]]
- Gotchas: [[knowledge/gotchas#^g05|G05]] (Base UI radio), [[knowledge/gotchas#^g09|G09]] (Base UI menu — same family as Tooltip)

### Browser check (orchestrator, 2026-10-06)

Light mode, 1440px and true 390px (in a 390px iframe; Chrome won't resize the window that narrow):
- Input 40px tall; email placeholder shown; compact toggle shows a "Dark" tooltip on hover; radios are still named Light/Dark/System.
- Fixed after the check: "Forgot password?" floated 24px below the field (form rhythm). It now sits in a `.passwordGroup` with `--space-2` under the field, as in the design; DOM order unchanged, auth tests 138/138.
- Phone: 24px gutters, no horizontal scroll, panel collapsed to its logo row, toggle top-right.
- Stale `labelAction` mentions removed (PasswordInput doc comment, frontend README).
- Build warns about a 584 kB bundle (was 565 kB in REQ-002, already flagged); route code-splitting is the planned follow-up.
