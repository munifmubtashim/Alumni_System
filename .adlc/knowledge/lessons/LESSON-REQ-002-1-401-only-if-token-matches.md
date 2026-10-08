# Act on a 401 only when the failed request's token is the current token ^L-REQ-002-1

| Field | Value |
|---|---|
| ID | LESSON-REQ-002-1 |
| Captured | 2026-10-05 |
| REQ | REQ-002 |
| Component | frontend |
| Tags | auth, session, http |
| Severity | guideline |

## The lesson

When a 401 arrives, compare the token that request carried with the token stored now; act (clear, notice, redirect) only if they match. This replaces any burst or debounce guard.

## Saw it in

- `packages/frontend/src/features/auth/SessionBridge.tsx` — `expireSession` checks the token passed by `httpClient`'s 401 hook
- `packages/frontend/src/services/httpClient.ts` — `setUnauthorizedHandler` passes the failed request's own token
- Late 401s after logout or a fresh login would otherwise end the new session (ADV-001)
