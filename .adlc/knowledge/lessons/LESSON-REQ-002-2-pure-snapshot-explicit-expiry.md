# Keep session snapshots pure reads, and end time-based expiry with a timer that runs the normal expire path ^L-REQ-002-2

| Field | Value |
|---|---|
| ID | LESSON-REQ-002-2 |
| Captured | 2026-10-05 |
| REQ | REQ-002 |
| Component | frontend |
| Tags | auth, session, react |
| Severity | trap |

## The lesson

A `useSyncExternalStore` snapshot (e.g. `getLiveToken`) must only read; do cleanup in effects. Anything that expires on time needs a timer that runs the same expire path as a 401 — otherwise the session ends silently and stale data stays in storage.

## Saw it in

- `packages/frontend/src/services/authToken.ts` — `getLiveToken` (pure), `getTokenExpiresAt`
- `packages/frontend/src/features/auth/SessionBridge.tsx` — one timer per live token, `exp − 10 s`
- Review CORR-002 (REQ-002): expiry between requests dropped the token with no notice; fixed in round 2
