# services/

**Purpose:** non-UI code that talks to the outside world:

- `httpClient.ts`: the single axios instance (base URL `/api`). It adds the `Authorization` header and calls the one handler registered with `setUnauthorizedHandler(fn | null)` when an authed request gets a 401. It passes that request's own token and skips `/auth/login` and `/auth/register`. `features/auth/SessionBridge` registers the handler, so this folder never imports app code (ADR-03).
- `authToken.ts`: the only home of the token (`localStorage['token']`). `subscribe` fires on changes in this tab and others, `getLiveToken` is a pure read that returns `null` for a missing or expired token, and `getTokenExpiresAt` / `isTokenExpired` read the token's `exp`. `setToken` returns `false` if storage refuses the write.
- `authApi.ts`: endpoint functions `login`, `register` and `getMe`.

**May import:** `axios`, browser APIs, and types from `@alumni/shared`.

**Must not import:** React or any UI code (`@/components/**`, `@/features/**`, `@/app/**`).

**Imported by:** `features/` and `app/`.
