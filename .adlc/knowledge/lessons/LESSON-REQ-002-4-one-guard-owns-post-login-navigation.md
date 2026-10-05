# Login and sign-up mutations only store the token; one guard owns where the user goes next ^L-REQ-002-4

| Field | Value |
|---|---|
| ID | LESSON-REQ-002-4 |
| Captured | 2026-10-05 |
| REQ | REQ-002 |
| Component | frontend |
| Tags | auth, routing |
| Severity | guideline |

## The lesson

Don't navigate from login/register mutations. Store the token and let the guest-only guard redirect (to `from` or home). Two navigators race, and a `/me` failure after sign-up would look like a form error.

## Saw it in

- `packages/frontend/src/features/auth/guards.tsx` — `GuestOnly`
- `packages/frontend/src/features/auth/useLogin.ts` — no `navigate` call
