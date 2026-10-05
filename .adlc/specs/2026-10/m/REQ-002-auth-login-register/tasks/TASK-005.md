# TASK-005 — Login and Register pages + auth layout

| Field | Value |
|---|---|
| REQ | REQ-002 |
| Tier | 2 |
| Status | done |
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

- [x] Tests for both pages (memory router with GuestOnly + mocked authApi): success → token stored and GuestOnly navigated to `from` or `/`; notice shown once, then gone on return; 401 / 409 / 400 / network messages; validation messages and focus on the first invalid field; busy button can't double-submit; role switch shows/hides student fields and the payload matches the role
- [x] No raw values in CSS (Stylelint), no inline styles; lint, format:check, typecheck, test pass

## Notes

Implementation notes (2026-10-05, resumed run):
- AuthLayout and LoginPage (committed in HEAD by the earlier run) matched the Approach, but LoginPage failed lint (`FormEvent` is deprecated in @types/react 19.2; now `SubmitEvent`) and Prettier (one long JSX line). Both fixed; no behaviour change.
- RegisterPage: the "I am a…" label is shown as visible text (aria-hidden) above the SegmentedControl, whose `aria-label` carries the same text, because SegmentedControl only takes a string `label` (no `aria-labelledby`). This keeps "every field has a visible label" without editing the primitive.
- 409: Input's `error` prop is a string, so the link to /login is passed as the email field's `helperText` ("Log in instead"), shown only while the 409 message is up and cleared when the email is edited. Focus moves to the email field.
- Switching role clears the department/year errors so they don't reappear stale; their values are kept. `toRegisterInput` (TASK-004) leaves them out for alumni.
- Focus on the first invalid field: one `useRef` per field; a callback-ref map was rejected by the react-hooks v7 `refs` lint rule.
- University input uses `autoComplete="organization"` (not in the Approach; harmless hint).
- Tests mock the axios adapter (REQ-001 policy), not `authApi`, and render the page under the real `GuestOnly` in a memory router with `react-router/dom`'s RouterProvider. The session-notice test runs with and without StrictMode.
- Checks (packages/frontend, 2026-10-05): lint (ESLint + Stylelint), format:check, typecheck, `npm test`: 26 files, 379 tests, all pass, no console warnings.

## Related

- Architecture: [[specs/2026-10/m/REQ-002-auth-login-register/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-001-4]], [[knowledge/lessons/LESSON-REQ-001-5]], [[knowledge/lessons/LESSON-REQ-001-6]], [[knowledge/lessons/LESSON-REQ-001-7]], [[knowledge/lessons/LESSON-REQ-001-9]]; gotchas G05, G07
