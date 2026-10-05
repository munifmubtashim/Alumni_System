# TASK-005 — Login and Register pages + auth layout

| Field | Value |
|---|---|
| REQ | REQ-002 |
| Tier | 2 |
| Status | pending |
| Repo | alumni-system |
| Depends on | TASK-002, TASK-003, TASK-004 |
| Blocks | TASK-006 |

## Goal

`/login` and `/register` screens meet every Log in and Sign up criterion in the spec, built from primitives on tokens.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/features/auth/AuthLayout.tsx` | create (+ .module.css) |
| `packages/frontend/src/features/auth/LoginPage.tsx` | create (+ .module.css, .test.tsx) |
| `packages/frontend/src/features/auth/RegisterPage.tsx` | create (+ .module.css, .test.tsx) |
| `packages/frontend/src/features/auth/index.ts` | edit — export pages |

## Approach

- AuthLayout: centered Card `as="section"` with `aria-labelledby` the page heading, `max-width: min(100%, 26rem)`, heading `--text-heading-lg`, `space-5` rhythm, footer link line (`ink-secondary` + accent link).
- LoginPage: shows the `sessionNoticeAtom` notice as `Alert tone="info"`, "Your session has expired, please log in again", and clears the atom on unmount (so it doesn't reappear). Mutations don't navigate: GuestOnly redirects once the token is set (TASK-004). Inputs email (`type=email`, `autoComplete=email`) and password (`autoComplete=current-password`); on submit validate → field errors + focus the first invalid field; else `useLogin().mutate`; map errors with `authErrors` (401 → form Alert "Email or password is incorrect" + clear password; network/5xx → "Couldn't reach the server, try again"); Button primary `loading`.
- RegisterPage: SegmentedControl "I am a…" Student | Alumni (default Student); name (`autoComplete=name`), email, password (`autoComplete=new-password`, helper "At least 8 characters"), university; for Student also department and expected graduation year (`Input type=number inputMode=numeric min max`); hidden fields keep values but aren't validated or sent; 409 → email field error with a `Link` to /login; 400 → form Alert with the server message.
- Use `<form noValidate>` so our messages, not the browser's, show; one primary button per screen.

## Acceptance

- [ ] Tests for both pages (memory router with GuestOnly + mocked authApi): success → token stored and GuestOnly navigated to `from` or `/`; notice shown once, then gone on return; 401 / 409 / 400 / network messages; validation messages and focus on the first invalid field; busy button can't double-submit; role switch shows/hides student fields and the payload matches the role
- [ ] No raw values in CSS (Stylelint), no inline styles; lint, format:check, typecheck, test pass

## Related

- Architecture: [[specs/2026-10/m/REQ-002-auth-login-register/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-001-4]], [[knowledge/lessons/LESSON-REQ-001-5]], [[knowledge/lessons/LESSON-REQ-001-6]], [[knowledge/lessons/LESSON-REQ-001-7]], [[knowledge/lessons/LESSON-REQ-001-9]]; gotchas G05, G07
