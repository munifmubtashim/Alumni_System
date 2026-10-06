# Mount app-wide effects in a path-less root layout, never inside one shell ^L-REQ-004-1

| Field | Value |
|---|---|
| ID | LESSON-REQ-004-1 |
| Captured | 2026-10-06 |
| REQ | REQ-004 |
| Component | frontend |
| Tags | frontend, routing, session, auth |
| Severity | trap |

## The lesson

Effects that every page needs (`SessionBridge`'s 401/expiry handling, `useApplyTheme`) go in a path-less root layout route above all shells. When a page group moves to a new shell, an effect left inside the old shell silently stops running there.

## Saw it in

- `packages/frontend/src/app/RootLayout.tsx`, `router.tsx` — moving login/sign-up out of `AppShell` would have unmounted `SessionBridge` on the very pages that show the session-expired notice ([[architecture/adr-07-root-layout-and-headerless-auth|ADR-07]])
