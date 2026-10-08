# TASK-001 — Session plumbing in services: token store, 401 hook, authApi, shared types

| Field | Value |
|---|---|
| REQ | REQ-002 |
| Tier | 0 |
| Status | done |
| Repo | alumni-system |
| Depends on | — |
| Blocks | TASK-004 |

## Goal

The token store is subscribable and expiry-aware; the HTTP client calls one registered handler on an authed 401; endpoint functions for login, register and me exist and are typed.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/services/authToken.ts` | edit |
| `packages/frontend/src/services/authToken.test.ts` | edit |
| `packages/frontend/src/services/httpClient.ts` | edit |
| `packages/frontend/src/services/httpClient.test.ts` | edit |
| `packages/frontend/src/services/authApi.ts` | create |
| `packages/frontend/src/services/authApi.test.ts` | create |
| `packages/shared/src/types/user.types.ts` | edit — add LoginResponse, RegisterResponse |

## Approach

- authToken: keep `TOKEN_STORAGE_KEY = 'token'` and get/set/clear; add `subscribe(listener): () => void` (notify on set/clear and on `window` `storage` events for the key); `isTokenExpired(token: string, nowMs = Date.now())`: decode the payload segment as base64url (map `-`→`+`, `_`→`/`, restore `=` padding) → JSON; expired if malformed, if `exp` is missing or not a finite number, or if `exp * 1000 <= nowMs + 10_000` (10 s skew leeway); `getLiveToken(): string | null` is a **pure read** (no clearing, no notify: it's a useSyncExternalStore snapshot). No React imports.
- httpClient: export `setUnauthorizedHandler(fn: ((requestToken: string) => void) | null)`; add a response interceptor: if `error.response?.status === 401` and the request config carried `Authorization: Bearer <t>` and `config.url` is not `/auth/login` or `/auth/register`, call the handler (if set) **with `<t>`**; always `return Promise.reject(error)`. Keep the single request interceptor as is.
- authApi: `login(email, password): Promise<LoginResponse>` (POST /auth/login), `register(input: RegisterInput): Promise<RegisterResponse>` (POST /auth/register), `getMe(): Promise<MyProfile>` (GET /me), all via `httpClient`, returning `res.data`.
- Shared: add `LoginResponse { token: string }` and `RegisterResponse { token: string; user: PublicUser }` beside `AuthResponse` (keep it; comment that login returns only a token).

## Acceptance

- [x] authToken tests: subscribe fires on set, clear and cross-tab `storage` event; unsubscribe works; isTokenExpired true for past exp, malformed or no exp, false for future exp; getLiveToken returns null for expired/malformed tokens and has no side effects (store unchanged, no notify); isTokenExpired cases: within the 10 s leeway, missing or non-numeric exp, unpadded base64url
- [x] httpClient tests: handler called with the request's token for a 401 on an authed request; not for login/register URLs; not without a token; the error is still rejected; null handler → no throw
- [x] authApi tests: method, URL, body and return value for each (adapter mock)
- [x] `grep -rn "from '@/store\|from '@/features\|from '@/app" src/services` is empty; lint, format:check, typecheck, test pass

## Notes

Touches auth (approved in scope at the architecture gate). Don't add logout/navigation logic here; that's TASK-004.

Implementation notes (2026-10-05):
- The 401 interceptor ends with `throw error` instead of `return Promise.reject(error)`: `@typescript-eslint/prefer-promise-reject-errors` rejects an `unknown` reason. Callers see the same rejected promise with the original error (tests assert it).
- `subscribe` also fires on a `storage` event with `key === null` (another tab ran `localStorage.clear()`), since that removes the token too.
- `isTokenExpired` decodes the payload bytes through `TextDecoder`, so non-ASCII claims (e.g. a name) don't make a valid token look malformed. Non-object payloads (`null`, `42`) count as malformed.
- URL check for login/register strips any query string before comparing.
- authApi tests mock via `httpClient.defaults.adapter` (restored in `afterEach`) because the endpoint functions take no per-request config; still the adapter-mock policy.

## Related

- Architecture: [[specs/2026-10/m/REQ-002-auth-login-register/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-001-4]], [[knowledge/lessons/LESSON-REQ-001-5]], [[knowledge/lessons/LESSON-REQ-001-6]], [[knowledge/lessons/LESSON-REQ-001-7]], [[knowledge/lessons/LESSON-REQ-001-9]]; gotchas G05, G07
