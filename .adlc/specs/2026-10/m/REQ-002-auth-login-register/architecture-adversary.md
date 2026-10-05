# Architecture adversary — REQ-002-auth-login-register

Written by: architecture-adversary (tier: balanced), dispatched sub-agent.

| Field | Value |
|---|---|
| Generated | 2026-10-05 |
| Trigger | new-adr, sensitive-surface (auth/session), ui-surface |
| Verdict | found problems |

## Summary

Read the spec (all ACs), architecture, 7 tasks, ADR-03, plus the live code (`authToken.ts`, `httpClient.ts`, `router.tsx`, `AppShell`, `queryClient.ts`, backend JWT/validation). 9 findings: 0 critical, 5 major, 4 minor. The biggest: the 401 handler acts on any 401 from a request that carried *a* token, not *the current* token, so a late 401 from an old request can log out a brand-new session (ADV-001). Dispatch questions: JWT `role` vs `/api/me` role: checked, nothing (no task reads the JWT role; only `exp` is decoded). Open-redirect via `from`: checked, nothing (state-only, `//` rejected, pushState is same-origin). StrictMode double-mount of SessionBridge: checked, nothing by itself (register/null/register is idempotent); its "burst guard" is the problem (ADV-001). Task file ownership: checked, only ADV-009. Every spec AC maps to a task.

## Findings

### ADV-001: 401 handler judges "had a token", not "had the current token"

| Field | Value |
|---|---|
| Severity | major |
| Confidence | high |
| Lens | failure-mode |
| Where | `architecture.md` §Approach (HTTP client, SessionBridge "burst guard"); `tasks/TASK-001.md` Approach; `tasks/TASK-004.md` Approach |

**Break scenario:** (a) User clicks Log out while a `/me` or other request is in flight. The request was sent with the old token and comes back 401. The handler runs: it sets notice `'expired'` and the user lands on `/login` with "Your session has expired" after a deliberate logout. (b) Same race across logout then quick login as someone else: the late 401 clears the *new* token and kicks the new user out. (c) The "guard so a burst acts once until the next login" is never wired to login (`useLogin` doesn't touch the bridge), so if it is a ref/flag it never resets: the second expiry in the same page session is ignored and the user is stuck with a dead token.

**What's missing / wrong:** The interceptor only checks that an `Authorization` header existed. Nothing compares it to the token currently in storage, and the guard's reset condition is undefined.

**Why this holds up:** Refutation tried: `queryClient.clear()` cancels in-flight work. It does not abort the axios call (no AbortSignal is wired in `getMe`), and the interceptor sits below Query. Nothing in the plan aborts requests on logout.

**Recommendation:** In `httpClient`, read the token from `error.config.headers.Authorization`, call `handler(requestToken)`. In the bridge handler, return early unless `getToken() === requestToken`. This replaces the burst guard: after the first 401 clears the token, parallel ones are no-ops, a late 401 after logout/re-login is ignored, and nothing needs resetting. Add tests: 401 after logout (no notice), 401 from an old token after a new login (new token survives), second expiry in one page session.

### ADV-002: `hasLiveToken` mutates and notifies from inside `getSnapshot`

| Field | Value |
|---|---|
| Severity | major |
| Confidence | medium-high |
| Lens | failure-mode |
| Where | `architecture.md` §Token store; `tasks/TASK-004.md` (`useSyncExternalStore(subscribe, hasLiveToken)`) |

**Break scenario:** Page loads with an expired token. `useHasSession` renders in `RequireAuth`, React calls `getSnapshot` = `hasLiveToken`, which calls `clearToken()`, which calls the subscribers. Subscribers include the header's `useHasSession` store listeners, so React gets a store-change update scheduled while another component is rendering ("Cannot update a component while rendering a different component"). React also calls getSnapshot several times per render (and twice in dev), so the side effect repeats.

**What's missing / wrong:** `getSnapshot` must be a pure read. The design makes the one read function also the cleaner and the notifier.

**Why this holds up:** Refutation tried: the clear only happens once, so snapshots stay stable. True for the value, but the notify-during-render still happens on that first call, and `AC: expired on load = signed out` is exactly the path that triggers it.

**Recommendation:** Split it. `getLiveToken()` is pure (returns token only if `!isTokenExpired`, never writes). Clear the expired token in one explicit place outside render: a module-level call at boot in `main.tsx`/`App.tsx`, or in SessionBridge's mount effect. Pass the pure function to `useSyncExternalStore`. Update the `authToken` tests accordingly (a pure read does not clear).

### ADV-003: GuestOnly steals the redirect-back

| Field | Value |
|---|---|
| Severity | major |
| Confidence | high |
| Lens | contradiction |
| Where | `architecture.md` §Guards (GuestOnly → `/`) vs §Mutations (`useLogin` navigates to `from`); spec "returns to that route" |

**Break scenario:** Guest opens a protected page, is sent to `/login` with `state.from`. Login succeeds, `setToken()` notifies subscribers, `useHasSession` flips, and `GuestOnly` immediately renders `<Navigate to="/" replace/>`. That happens before `useLogin` finishes its `await queryClient.query(['me'])`. The user flashes onto Home (which starts its own `['me']` load), then the mutation continuation navigates to `from` from an unmounted LoginPage. Two competing navigations; the "return to that route" test in TASK-006 passes or fails on timing.

**What's missing / wrong:** Two components both own post-login navigation.

**Why this holds up:** Refutation tried: `useNavigate` in a data router still works after unmount, so `from` is reached eventually. It is still a double navigation with a Home flash, and any change that makes the mutation fail (ADV-004) leaves the user on Home instead.

**Recommendation:** `GuestOnly` should navigate to `resolveFrom(location.state) ?? '/'`, and `useLogin`/`useRegister` should not navigate at all (let GuestOnly do it), or set the token only after `/me` succeeded. Pick one owner and say so in the architecture.

### ADV-004: `/me` failure after the token is stored is shown as a submit failure

| Field | Value |
|---|---|
| Severity | major |
| Confidence | high |
| Lens | failure-mode |
| Where | `architecture.md` §Mutations (`useRegister`); `tasks/TASK-004.md` Approach |

**Break scenario:** Sign-up returns 201 and the token is stored. The follow-up `queryClient.query(['me'])` fails (5xx, network blip, 2 retries exhausted). The mutation rejects, `authErrors` maps it to "Couldn't reach the server, try again", the user presses the button again, and gets 409 "An account with this email already exists". For login: token is stored but the form says it failed, while GuestOnly bounces to Home anyway.

**What's missing / wrong:** The plan treats "credentials accepted" and "profile loaded" as one atomic step. The first is irreversible; the second is retryable.

**Why this holds up:** Refutation tried: `/me` is a cheap call that rarely fails. The 409-on-retry outcome is nonetheless a data-visible trap for the one flow that creates an account, and it needs a 5xx or flaky mobile network, which this app's 360px audience will hit.

**Recommendation:** After `setToken`, don't await `/me` inside the mutation. Let `RequireAuth`'s loading/error/Retry states (already designed) handle it. If the prime is kept, wrap it in try/catch and ignore failure. Add a test: register 201 then `/me` 500 → user is signed in, no form error.

### ADV-005: Cross-tab logout/login leaves a stale `['me']` in the cache

| Field | Value |
|---|---|
| Severity | major |
| Confidence | medium-high |
| Lens | failure-mode |
| Where | `architecture.md` §Token store (`storage` event) and §Mutations; `queryClient.ts` (`staleTime` 30 s) |

**Break scenario:** Tabs A and B open. User logs out in B. A's guards react via the `storage` event and redirect to `/login`, but nothing clears A's query cache (only the same-tab `useLogout` and the bridge do). Within 30 s, someone logs in as a different user in A. `useLogin`'s `queryClient.query(['me'])` honours the default `staleTime` and returns the old user's cached profile: Home says "Welcome, <previous user>" with the new user's token. Same if B logs in as another account while A stays signed in: A keeps showing the old name (no focus refetch).

**What's missing / wrong:** The cross-tab path is in the token store but the cache-clearing responsibility is only in logout/bridge handlers.

**Why this holds up:** Refutation tried: `useQuery`'s `enabled` flips off when the token disappears. That stops fetching but does not remove cached data, and `queryClient.query` reads the cache.

**Recommendation:** In SessionBridge, subscribe to the token store and call `queryClient.clear()` whenever the token value changes to something different from the previous one (also covers B logging in as someone else). Additionally pass `staleTime: 0` (or `removeQueries(['me'])` first) in the login/register prime. Test with a dispatched `StorageEvent`.

### ADV-006: Header and RequireAuth give no way to log out when `/me` is failing

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | ux-consistency |
| Where | `tasks/TASK-006.md` (HeaderAuth "while loading show a neutral placeholder"); `architecture.md` §Guards (error → Alert + Retry) |

**Break scenario:** Token valid by `exp`, but `/me` returns 5xx or 404 (user row deleted, the case the backend does not turn into 401). `RequireAuth` shows Alert + Retry forever. The header menu's state for `isError` is unspecified, so an implementer may render the placeholder or nothing, and the user cannot reach Log out.

**What's missing / wrong:** Only loading and success are specified for the user menu.

**Why this holds up:** Refutation tried: the user can clear storage by hand. Not acceptable for a real user. Retry on 404 will never succeed.

**Recommendation:** Specify that the signed-in header always renders the menu with "Log out" regardless of `['me']` state (trigger text falls back to "Account"), and the RequireAuth error Alert offers "Log out" beside Retry. Add one AppShell test for the error state.

### ADV-007: Token decoding edge cases are under-specified

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | omission |
| Where | `tasks/TASK-001.md` (isTokenExpired), `architecture.md` §Token store |

**Break scenario:** (a) base64url payload without `=` padding: plain `atob` throws or mis-decodes unless `-`/`_` are mapped and padding added; the "malformed ⇒ expired" fallback would then log out every valid token with a payload length not divisible by 4. (b) `exp` present but not a number (`"abc"`, `null`): `exp * 1000 <= now` is false for `NaN`, so a garbage token counts as live. (c) Client clock more than ~1 h ahead: a freshly issued token is already "expired", `hasLiveToken` clears it, and login silently loops back with no message.

**What's missing / wrong:** The task says "missing `exp` ⇒ expired" but not these cases; tests listed cover only valid/expired/malformed/no-exp.

**Why this holds up:** Refutation tried: real server tokens always have numeric `exp` and standard JWT encoding. (a) is still a real bug class (padding) that unit tests with hand-built tokens catch only if the test token has a length that needs padding; (c) is unlikely so accept-and-document.

**Recommendation:** Add to TASK-001: normalise base64url + pad before `atob`; require `Number.isFinite(exp)`; add test tokens with padding lengths 0, 2 and 3 and a non-numeric `exp`; note clock-skew as an accepted risk in ADR-03 (server 401 remains the backstop).

### ADV-008: Bridge handler closes over a stale location; session notice never consumed

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | omission |
| Where | `tasks/TASK-004.md` (SessionBridge "on mount setUnauthorizedHandler"); `sessionNoticeAtom` |

**Break scenario:** The handler is registered once on mount but reads `currentLocation` for `state.from`. If the closure captured the first location, a 401 after the user navigated elsewhere returns them to the entry page, not where they were. Separately, the "one-shot" notice is only cleared on a successful login; the user who sees it, opens `/register`, and returns to `/login` sees it again.

**What's missing / wrong:** The location source (ref vs deps) and notice consumption are unspecified, so the implementer guesses.

**Why this holds up:** Refutation tried: re-registering on every location change fixes it, but then StrictMode/unmount `null` windows open. Using `router.state.location` or a ref avoids that, yet the task does not say so.

**Recommendation:** State: handler reads location from a `useRef` updated each render (or `window.location` via the router). `LoginPage` clears the notice in an unmount effect. Add a test: navigate once, then 401, assert `from` is the latest page.

### ADV-009: Task seams — default routes, Alert dependency, password rule wording

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | hidden-coupling / testability |
| Where | `tasks/TASK-004.md`, `tasks/TASK-006.md`, `architecture.md` §Forms |

**Break scenario:** (a) TASK-006 makes `/` a `RequireAuth` route, so the existing `AppShell.test.tsx` cases that render `routes` at `/` and expect the empty shell now redirect to `/login`; the task's "update only where the header changed" understates this, and "keep `createRoutes(pageRoutes)` working" doesn't say whether `DEFAULT_PAGE_ROUTES` becomes the auth tree. (b) TASK-004 uses `Alert` from TASK-002 but lists only TASK-001 as dependency, hence the `<p role="alert">` fallback (two code paths). (c) The architecture says password "8–72 bytes", but the backend (`validation.ts:41,44`) requires `value.length >= 8` (characters) and ≤72 bytes. A 3-character CJK password is 9 bytes: a byte-based minimum lets it pass the client and gets a server 400.

**What's missing / wrong:** Three small seams that cause rework in tier 3/1/1.

**Why this holds up:** Refutation tried: tiers run in order so Alert exists by tier 1. Then the dependency should simply be declared; the fallback text is dead code.

**Recommendation:** TASK-006: say `DEFAULT_PAGE_ROUTES` stays inert and the auth routes are added by `routes` only, and list which AppShell tests change. TASK-004: add TASK-002 to Depends on and drop the fallback. Architecture/TASK-004: min uses `.length`, max uses UTF-8 bytes.

## Coverage

- **Lenses run:** omission, failure-mode, hidden-coupling, rollback (nothing: frontend-only, no data change, reverts by git), contradiction, testability, ux-consistency.
- **Lenses skipped:** cross-repo (single repo).
- **Acceptance-criteria coverage:** Log in (6 ACs) checked; Sign up (7) checked; Session (5) checked (findings ADV-001/002/004/005 bear on them); Guards and navigation (4) checked (ADV-003, ADV-006); Signed-in home (1) checked; Quality bar (4) checked. No spec criterion is planned-as-zero.
