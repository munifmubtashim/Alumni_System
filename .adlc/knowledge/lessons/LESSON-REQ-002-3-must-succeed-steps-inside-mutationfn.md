# Put must-succeed client steps inside `mutationFn` and never swallow a storage write failure ^L-REQ-002-3

| Field | Value |
|---|---|
| ID | LESSON-REQ-002-3 |
| Captured | 2026-10-05 |
| REQ | REQ-002 |
| Component | frontend |
| Tags | auth, forms, tanstack-query |
| Severity | trap |

## The lesson

If a step after the API call must succeed for the user to be signed in (storing the token), run it inside `mutationFn` and throw a typed error on failure, so the page's `onError` shows it. A storage helper must report a failed write, not swallow it.

## Saw it in

- `packages/frontend/src/services/authToken.ts` — `setToken` returns `false` when storage refuses
- `packages/frontend/src/features/auth/useLogin.ts`, `useRegister.ts` — throw `TokenNotSavedError`
- Review CORR-001 (REQ-002): blocked storage made login "succeed" with no sign-in and no message
