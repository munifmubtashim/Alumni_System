# TASK-005 — Shared HTTP client, auth-token store, TanStack Query client + providers

| Field | Value |
|---|---|
| REQ | REQ-001 |
| Tier | 2 |
| Status | complete |
| Repo | alumni-system |
| Depends on | TASK-003 |
| Blocks | TASK-009 |

## Goal

One axios instance attaches the auth token in exactly one place, and the app has a configured QueryClient and a providers component ready for the shell.

## Files to touch

| Path | Action |
|---|---|
| `packages/frontend/src/services/authToken.ts` (+ `.test.ts`) | create |
| `packages/frontend/src/services/httpClient.ts` (+ `.test.ts`) | create |
| `packages/frontend/src/app/queryClient.ts` (+ `.test.ts`) | create |
| `packages/frontend/src/app/providers.tsx` | create |

## Approach

- `authToken.ts`: `TOKEN_STORAGE_KEY = 'token'` (matches the key the backend-facing old client used). This module is the **single source of truth for the token** (ADR-02): `httpClient` reads it here; a later auth REQ may mirror *decoded claims* into an atom, but never the token itself; `getToken(): string | null`, `setToken(t)`, `clearToken()`; all wrapped in try/catch for unavailable storage.
- `httpClient.ts`: `export const httpClient = axios.create({ baseURL: '/api', headers: { Accept: 'application/json' } })`; one request interceptor: if `getToken()` returns a value, set `config.headers.Authorization = \`Bearer ${token}\``. Export nothing else. No response interceptor (401 handling belongs to the auth REQ — leave a one-line comment).
- `queryClient.ts`: `export function createQueryClient()` returning the client with defaults from architecture.md (`staleTime: 30_000`, `refetchOnWindowFocus: false`, query retry up to 2 times except on 4xx `AxiosError`, mutations `retry: false`). Export `is4xxError(err)` helper used by retry.
- `providers.tsx`: `AppProviders({ children, queryClient?, store? })` → `QueryClientProvider` → Jotai `Provider store={store}`. Optional args let tests inject fresh instances. Module-level default client created lazily once.

## Acceptance

- [x] Interceptor test: with token set, a request (axios adapter mocked) carries `Authorization: Bearer abc`; with no token, no header.
- [x] `httpClient.defaults.baseURL === '/api'`.
- [x] Query retry test: 404/401 error → no retry; 500/network error → retried, max 2.
- [x] `grep -rn "Authorization" packages/frontend/src` matches only `httpClient.ts` (and its test).
- [x] `npm test`, `npm run lint`, `npm run typecheck` pass.

## Notes

### Implementation notes (2026-10-05)

- **`fetchQuery` is deprecated in TanStack Query 5.104** (`@typescript-eslint/no-deprecated` fails lint); the retry test uses `client.query(options)` instead. Retry tests pass `retryDelay: 0` per call so the default backoff (1s, 2s) does not slow the suite; `retry` itself still comes from the client defaults.
- **Axios mocked per request** via the `adapter` option on the request config; the adapter records the final config after interceptors run. No new dependencies.
- `is4xxError` returns false for network errors (no `response`), so they are retried like 5xx.
- `providers.tsx` also creates the default Jotai store lazily (alongside the QueryClient) so app and tests behave the same; tests pass their own `store`. No provider test was listed in the task; TASK-009 will exercise it through the shell.
- `authToken.test.ts` avoids the word "Authorization" so the acceptance grep stays limited to httpClient files.
- Checks: lint, format:check, test (33/33), typecheck all exit 0. Grep for "Authorization" in src matches only httpClient.ts and httpClient.test.ts.

## Related

- Architecture: [[specs/2026-10/m/REQ-001-frontend-foundation/architecture]]
- Lessons checked: none exist yet
