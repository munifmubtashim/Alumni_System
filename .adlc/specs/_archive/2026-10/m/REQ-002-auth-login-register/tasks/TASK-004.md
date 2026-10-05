# TASK-004 — Auth feature layer: session hooks, bridge, guards, validation, error mapping

| Field | Value |
|---|---|
| REQ | REQ-002 |
| Tier | 1 |
| Status | done |
| Repo | alumni-system |
| Depends on | TASK-001, TASK-002 |
| Blocks | TASK-005 |

## Goal

All session behaviour (current user, login, register, logout, global 401, guards, form validation and error mapping) exists as tested, UI-agnostic pieces in features/auth.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/store/sessionNoticeAtom.ts` | create (+ test) |
| `packages/frontend/src/features/auth/useHasSession.ts` | create |
| `packages/frontend/src/features/auth/useCurrentUser.ts` | create |
| `packages/frontend/src/features/auth/useLogin.ts` | create |
| `packages/frontend/src/features/auth/useRegister.ts` | create |
| `packages/frontend/src/features/auth/useLogout.ts` | create |
| `packages/frontend/src/features/auth/SessionBridge.tsx` | create |
| `packages/frontend/src/features/auth/guards.tsx` | create — RequireAuth, GuestOnly |
| `packages/frontend/src/features/auth/redirect.ts` | create — safe `from` resolution |
| `packages/frontend/src/features/auth/validation.ts` | create |
| `packages/frontend/src/features/auth/authErrors.ts` | create |
| `packages/frontend/src/features/auth/index.ts` | create |
| `packages/frontend/src/features/auth/{session,guards,validation,authErrors}.test.ts(x)` | create |

## Approach

- `sessionNoticeAtom`: `atom<'expired' | null>(null)`, not persisted.
- `useLiveToken()` = `useSyncExternalStore(subscribe, getLiveToken)`; `useCurrentUser()` = `useQuery({ queryKey: ['me'], queryFn: getMe, enabled: !!liveToken })`.
- `useLogin()` / `useRegister()`: `useMutation`; on success **only** `setToken(token)` and clear the notice. No `/me` fetch, no navigation (GuestOnly owns that; ADV-003/004). `useLogout()`: `clearToken()` first, then `navigate('/login', { replace: true })`, no notice.
- `SessionBridge` (render-nothing, mounted once in AppShell by TASK-006):
  - (a) mount effect: if `getToken()` is set but `isTokenExpired` → `clearToken()` silently;
  - (b) registers `setUnauthorizedHandler(requestToken => …)`, acting only if `requestToken === getToken()`: `clearToken()` → set notice `'expired'` → `navigate('/login', { replace: true, state: { from: locationRef.current } })`, where `locationRef` is updated every render from `useLocation()`; unregister on unmount (StrictMode-safe);
  - (c) `subscribe` to the token store and call `queryClient.clear()` whenever the token value differs from the last seen value.
- `resolveFrom(state)`: accept only `state.from.pathname` starting with `/` (not `//`), not `/login` or `/register`; keep search and hash; else null.
- Guards:
  - `RequireAuth`: no live token → `<Navigate to="/login" replace state={{ from: location }}/>`; loading → `role="status"` "Loading…"; non-401 error → `Alert tone="error"` with **Retry** (`refetch`) and **Log out** (`useLogout`).
  - `GuestOnly`: live token → `<Navigate to={resolveFrom(location.state) ?? '/'} replace/>`.
- `validation.ts`: `validateLogin`, `validateRegister(values, now = new Date())` returning field→message; messages mirror backend `validation.ts` (read it). Password: `.length >= 8` (characters, as the backend checks) and `TextEncoder` byte length `<= 72`. `authErrors.ts`: map AxiosError to `{ form?: string; fields?: { email?: string } }` per the architecture.

## Acceptance

- [x] Bridge: a 401 carrying the current token → token cleared, cache empty, notice 'expired', at /login with the latest `from`; a 401 carrying an older token or arriving after logout → ignored (no notice); two simultaneous 401s → one navigation; a second expiry later → handled again; a token change (incl. a cross-tab `storage` event, A→B switch) → cache cleared; an expired token at boot → cleared silently; login/register 401 doesn't trigger it
- [x] After login, GuestOnly sends the user to `from` when safe, else `/`; an unsafe `from` (`//evil.com`, `/login`) falls back to `/`; exactly one navigation (no Home flash before `from`); a `/me` failure after sign-up doesn't surface as a form error
- [x] Guards behave per spec in a memory router (guest, signed in, loading, error, expired token)
- [x] validation/authErrors cover every rule and status; lint (boundaries!), format:check, typecheck, test pass

## Notes

Touches auth/session (in scope, approved at the architecture gate). No UI pages here (TASK-005).

Implementation notes (2026-10-05):
- **Action for TASK-006 (must do):** `app/App.tsx` must import `RouterProvider` from `react-router/dom`, not `react-router`. SessionBridge and useLogout call `navigate('/login', { replace, flushSync: true })`. RR 8's RouterProvider applies router updates inside `startTransition`, while `clearToken()` re-renders `useSyncExternalStore` readers at sync priority. Without flushSync, RequireAuth renders once at the old location with no token and fires its own `<Navigate to="/login">`, so there are two navigations (seen in tests). With `react-router/dom`, flushSync flushes the token change and the new location in one render, so there is one navigation. The `react-router` RouterProvider has no flushSync implementation: it logs a warnOnce and falls back to the double (harmless, both `replace`) navigation. The tests use `react-router/dom`; "two simultaneous 401s → one navigation" fails without it. Also tell the AppShell tests to use it.
- Bridge order follows the architecture: clearToken → notice → navigate. `locationRef` is updated in a `useLayoutEffect` with no deps (runs every commit), not during render: react-hooks v7 lint forbids writing refs in render.
- `useHasSession.ts` exports `useLiveToken()` (the architecture's name) and `useHasSession()` (boolean).
- RequireAuth shows the "Loading…" status line for a 401 error too (the bridge is ending the session; the guard redirects on the next render), so there's no error box flash.
- RequireAuth's error Alert: Retry (`loading` while refetching) and Log out, separated by a space inside a plain `<div>`; no CSS module was in scope. TASK-005/006 may restyle it.
- `resolveFrom` returns a string (`pathname + search + hash`) or null. It also rejects `/\host`, auth paths in any case and with a trailing slash (RR matching ignores both), and non-string or malformed search/hash. RR 8's `<Navigate>` throws on external targets, so an unchecked `//evil.com` would crash rather than redirect.
- validation.ts also exports `toRegisterInput(values)`: trims text, leaves out student-only fields for alumni (keeps "hidden fields not sent" in one tested place), and keeps the password as typed. Login validation only checks presence and email shape (no length rules), so older accounts are never blocked.
- authErrors: `mapLoginError` / `mapRegisterError` → `{ form?, fields?: { email? } }`. Non-axios errors and 4xx without a usable `message` → "Something went wrong, try again". A 401 on register and a 409 on login fall through to the server message.
- Logout clears the cache via the bridge's token subscription (single owner), as designed.
- Checks (packages/frontend, 2026-10-05): lint (ESLint incl. boundaries + Stylelint), format:check, typecheck, `npx vitest run` x2: 24 files, 352 tests, all pass, no console warnings from the new tests.

## Related

- Architecture: [[specs/2026-10/m/REQ-002-auth-login-register/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-001-4]], [[knowledge/lessons/LESSON-REQ-001-5]], [[knowledge/lessons/LESSON-REQ-001-6]], [[knowledge/lessons/LESSON-REQ-001-7]], [[knowledge/lessons/LESSON-REQ-001-9]]; gotchas G05, G07
