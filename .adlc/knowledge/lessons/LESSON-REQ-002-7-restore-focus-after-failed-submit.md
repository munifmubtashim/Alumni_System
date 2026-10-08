# After a failed async submit, move focus to the field or alert — a disabled busy button drops it ^L-REQ-002-7

| Field | Value |
|---|---|
| ID | LESSON-REQ-002-7 |
| Captured | 2026-10-05 |
| REQ | REQ-002 |
| Component | frontend |
| Tags | forms, a11y |
| Severity | guideline |

## The lesson

A submit button that is `disabled` while busy loses keyboard focus to `body`. In the error handler, focus the field to fix (password on 401, email on 409) or the form alert (`tabIndex={-1}`) for other errors.

## Saw it in

- `packages/frontend/src/features/auth/LoginPage.tsx`, `RegisterPage.tsx` — `onError` focus
- `packages/frontend/src/components/ui/Button/Button.tsx` — `disabled={disabled === true || loading}`
- Review UI-001 (REQ-002), verified in a headless browser in round 2
