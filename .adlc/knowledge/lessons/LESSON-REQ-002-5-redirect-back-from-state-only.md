# Take redirect-back targets only from in-app `location.state`, validated to one leading `/` ^L-REQ-002-5

| Field | Value |
|---|---|
| ID | LESSON-REQ-002-5 |
| Captured | 2026-10-05 |
| REQ | REQ-002 |
| Component | frontend |
| Tags | auth, routing, security |
| Severity | critical |

## The lesson

Never read a return URL from a query parameter. Read it from `location.state.from`, accept it only if it starts with a single `/` (not `//` or `/\`) and isn't an auth page, else go home. React Router 8's `<Navigate>` throws on `//host`, so an unvalidated value also crashes the route.

## Saw it in

- `packages/frontend/src/features/auth/redirect.ts` — `resolveFrom`
- `node_modules/react-router/dist/development/lib/router/navigation.js` — "External navigation is not allowed"
