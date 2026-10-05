# Concept — frontend session and 401 handling

| Field | Value |
|---|---|
| Status | current as of REQ-002 (2026-10-05) |

The signed-in state is derived, never stored twice. `services/authToken.ts` is the only home of the token (`localStorage['token']`). Components read it through `useSyncExternalStore` (`useLiveToken` / `useHasSession`), whose snapshot `getLiveToken()` is a pure read that returns `null` for a missing, malformed or expired token. The current user is the `['me']` TanStack Query (`useCurrentUser`). Decision: [[architecture/adr-03-frontend-session-and-401-handling|ADR-03]].

## How the pieces connect

- **Registered handler, not an upward import.** `services/` may not import features or store (lint-enforced), so `httpClient` exposes `setUnauthorizedHandler(fn | null)`. `features/auth/SessionBridge` — mounted once in `AppShell` — registers it. Use this shape whenever a lint-isolated layer must trigger app behaviour.
- **One expire path.** `SessionBridge.expireSession(token)` clears the token, sets `sessionNoticeAtom` ("Your session has expired, please log in again") and navigates to `/login` with `from`. Both a 401 and the expiry timer call it, and it acts only if the token still matches ([[knowledge/lessons/LESSON-REQ-002-1]]).
- **Expiry timer.** `SessionBridge` arms one timer per live token at `exp − 10 s`, reset on token change and cleared on unmount. A token already expired on load is dropped silently, with no notice ([[knowledge/lessons/LESSON-REQ-002-2]]).
- **Cache follows the token.** Any token change (including another tab's `storage` event) clears the query cache.
- **Navigation ownership.** Login/register mutations only store the token (failure to store throws `TokenNotSavedError`). `GuestOnly` sends a signed-in user to `resolveFrom(location.state) ?? '/'`; `RequireAuth` sends a guest to `/login` with `from` ([[knowledge/lessons/LESSON-REQ-002-4]], [[knowledge/lessons/LESSON-REQ-002-5]]).
- **flushSync.** Logout and expiry navigate with `flushSync: true`, which needs `RouterProvider` from `react-router/dom` ([[knowledge/gotchas#^g08|G08]]).

## Tests

`features/auth/session.test.tsx` and `guards.test.tsx` cover the flows; `AppShell.test.tsx` pins the single redirect. Traps: [[knowledge/gotchas#^g11|G11]], [[knowledge/gotchas#^g12|G12]].

Introduced in [[REQ-002]].
