# TASK-003 — Auth frame, login and sign-up restyle, forgot-password help

| Field | Value |
|---|---|
| REQ | REQ-004 |
| Tier | 1 |
| Status | done |
| Repo | alumni-system |
| Depends on | TASK-001, TASK-002 |
| Blocks | TASK-005 |

## Goal

Login and sign-up match `docs/design/screens/login` and `signup` (tokens only, light/dark, 360px), with neutral copy and no "Remember me". Login gets the AC5 forgot-password message. **No logic changes** (AC4).

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/features/auth/AuthLayout.tsx`, `AuthLayout.module.css` | edit — two-column frame + brand panel; same props |
| `packages/frontend/src/features/auth/LoginPage.tsx`, `LoginPage.module.css` | edit — markup/classes; `PasswordInput`; `ForgotPasswordHelp` |
| `packages/frontend/src/features/auth/ForgotPasswordHelp.tsx`, `ForgotPasswordHelp.module.css`, `ForgotPasswordHelp.test.tsx` | create |
| `packages/frontend/src/features/auth/RegisterPage.tsx`, `RegisterPage.module.css` | edit — markup/classes; `PasswordInput` |
| `packages/frontend/src/features/auth/LoginPage.test.tsx`, `RegisterPage.test.tsx` | edit — add one show/hide case each. The only edit to existing cases: `getAllByRole('button')).toHaveLength(1)` (LoginPage.test:147, RegisterPage.test:166) → assert exactly one **submit** button (spec AC4) |
| `packages/frontend/src/styles/contrast.test.ts` | edit — add any new fg/bg pair |

## Approach

- **AuthLayout:** grid with a plain `div.panel` (not `<aside>`, ADV-005), holding `<Logo decorative showWordmark label={BRAND_NAME} />`, tagline, 3 points and a `section` form column (h1, children, footer link).
  - At ≥ 60rem: `grid-template-columns: 45fr 55fr`. Below that: the panel is `display: none`. No second logo (the shell header has it, ADV-006).
  - Copy as in architecture.md (no counts). Panel surface: `--surface-sunken` with `--ink-*` text (architect-gate decision).
  - The form column keeps max width ~26rem (design 380–420px), centred.
- **Pages:** change only JSX wrappers, class names and `Input type="password"` → `PasswordInput`.
  - Keep every label text, button text, heading, `role="alert"` and the focus-first-invalid / focus-after-failed-submit logic (L-REQ-002-7) **unchanged**.
  - Keep the hooks, validators, `authErrors` and the submit handler untouched. Diff them to prove it.
- **ForgotPasswordHelp:** a `button type="button"` "Forgot password?" with `aria-expanded`/`aria-controls`, toggling a `<p id>` with the exact AC5 sentence. The email is `<a href={supportMailto(PASSWORD_RESET_SUBJECT)}>{SUPPORT_EMAIL}</a>`. No navigation, no request. Pass it as the password field's `labelAction` (from TASK-002), so it sits on the label row as in the design. In the test, compare the message by `textContent` (the `<a>` splits the sentence).
- **Map design values to tokens:** `#ad6a4d` → `--accent`; `#faf7f2` → `--surface-page`; `#f0ebe3` → `--surface-sunken`; `#e4dcd0` → `--border-subtle`; `#6b6560`/`#948c84` → `--ink-secondary`/`--ink-muted`; 12px labels → `--text-label`/`--text-caption`; 14px → `--text-body-sm`; gaps → `--space-*`. Never copy a hex.

## Acceptance

- [x] All existing LoginPage/RegisterPage/guards/session tests pass. The only edits are the two button-count assertions named above
- [x] ForgotPasswordHelp tests:
  - collapsed by default; Enter/click expands
  - exact sentence; `href === 'mailto:support@alma.app?subject=Password%20reset%20request'`
  - `aria-expanded` toggles
- [x] No "Remember me", no numbers in the panel copy
- [x] `git diff` shows no change to `useLogin.ts`, `useRegister.ts`, `validation.ts`, `authErrors.ts`, `guards.tsx`, `redirect.ts`, `SessionBridge.tsx`
- [x] `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm test` pass; check 360px and 200% zoom by reasoning about the CSS (the UI reviewer checks it in a browser later)

## Notes

- Auth pages stay inside AppShell (no router change), per the architect-gate decision.
- Sign-up's design shows "Forgot password?" by the password field: do **not** add it on sign-up.
- Keep today's headings, error presentation, busy label and error styling (architecture.md → Deviations, ADV-008).

### Implementation notes (2026-10-06)

- Checks green: typecheck, lint, format:check, `npm test` (453 passed). Protected files (hooks, validators, authErrors, guards, redirect, SessionBridge, session files) show no diff; the only removed test lines are the two button-count assertions.
- **Form card kept.** The form column still uses `Card` (as the sign-up design does); the login design has no card. One shared layout, so one choice. UI reviewer may flag it.
- **Panel:** shown only at `width >= 60rem` (`display: none` below), grid `45fr/55fr`, `--surface-sunken`, `--radius-lg`, `--space-7` padding. Tagline is a `<p>` (the form's h1 stays the only heading), points a `<ul>` with decorative check icons in `--accent`. 200% zoom on a 1280px screen is 40rem wide, so one column.
- **ForgotPasswordHelp** renders a fragment (button + `<p hidden>`) into Input's `.labelRow`; the message has `flex-basis: 100%`, so it wraps onto its own row between the label and the input. No `display` on the message (CAND-006).
- **RegisterPage:** Department and Expected graduation year sit in a `.pair` flex row (each `flex: 1 1 12rem`), as in the design; they stack below ~25rem of content width, so at 360px. Focus order unchanged.
- Contrast: added `accent` on `surface-sunken` (non-text, check marks and Logo on the panel). Other panel and card pairs were already listed.

## Related

- Architecture: [[specs/2026-10/m/REQ-004-alma-rebrand-auth-shell/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-002-7-restore-focus-after-failed-submit|L-REQ-002-7]], [[knowledge/lessons/LESSON-REQ-001-6-contrast-changes-sweep-all-uses|L-REQ-001-6]]
