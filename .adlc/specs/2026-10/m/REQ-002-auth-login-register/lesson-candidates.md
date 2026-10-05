# Lesson candidates — REQ-002-auth-login-register

## CAND-T1-1 [implement-task]
**Claim:** In axios response interceptors typed `unknown`, re-throw the error instead of `return Promise.reject(error)`; the lint rule prefer-promise-reject-errors rejects the latter.
**Saw it in:** `packages/frontend/src/services/httpClient.ts:51`
**Context:** Same behaviour for callers; only-throw-error allows unknown, prefer-promise-reject-errors does not.

## CAND-T1-2 [implement-task]
**Claim:** A custom axios `adapter` that resolves with status 401 does not reject; build and reject an `AxiosError` with a `response` to test error interceptors.
**Saw it in:** `packages/frontend/src/services/httpClient.test.ts` (failingAdapter)
**Context:** validateStatus/settle lives in axios's built-in adapters, not in the request pipeline.

## CAND-T1-3 [implement-task]
**Claim:** To mock HTTP for service functions that take no per-request config, set `httpClient.defaults.adapter` and restore it in `afterEach`, not inline.
**Saw it in:** `packages/frontend/src/services/authApi.test.ts`
**Context:** Inline restore is skipped when an assertion fails first, leaking the mock into later tests.

## CAND-T2-1 [implement-task]
**Claim:** Write `disabled === true || loading`, not `disabled || loading`; the lint's prefer-nullish-coalescing flags `||` on an optional boolean and `??` would be wrong.
**Saw it in:** `packages/frontend/src/components/ui/Button/Button.tsx:31`
**Context:** `??` keeps an explicit `disabled={false}` and so ignores loading.

## CAND-T2-2 [implement-task]
**Claim:** A state-colored border on Input (error) must sit under `:where()` and before the focus rule, or it hides the accent focus border.
**Saw it in:** `packages/frontend/src/components/ui/Input/Input.module.css` (`.input:where([aria-invalid='true'])`)
**Context:** Same specificity trap as G04, now for attribute selectors, not just hover.

## CAND-T2-3 [implement-task]
**Claim:** Classes shared by `<button>` and `<a>` need `text-decoration: none` and an explicit `display`; `:disabled` rules never match the link.
**Saw it in:** `packages/frontend/src/components/ui/Button/Button.module.css` (`.button`)
**Context:** ButtonLink reuses Button.module.css on a react-router Link.

## CAND-T3-1 [implement-task]
**Claim:** Export compound primitives as flat named components (MenuItem), not `Object.assign(Root, { Item })`.
**Saw it in:** `packages/frontend/src/components/ui/Menu/Menu.tsx:22`
**Context:** eslint react-refresh/only-export-components flags every function behind an Object.assign export.

## CAND-T3-2 [implement-task]
**Claim:** Base UI 1.8 Menu styles the current item with `[data-highlighted]` and moves real focus to it; ArrowDown on the trigger opens and focuses item 1.
**Saw it in:** `node_modules/@base-ui/react/menu/item/MenuItemDataAttributes.d.ts`, `packages/frontend/src/components/ui/Menu/Menu.test.tsx`
**Context:** Confirmed in jsdom tests; no data-focus-visible on items either (same as G05 for Radio).

## CAND-T3-3 [implement-task]
**Claim:** A non-interactive label inside a Base UI menu must be `Menu.GroupLabel` inside `Menu.Group`, not a bare div in the popup.
**Saw it in:** `packages/frontend/src/components/ui/Menu/Menu.tsx:62`
**Context:** role=menu only allows menuitem/group/separator children; GroupLabel needs the Group context to wire aria-labelledby.

## CAND-T4-1 [implement-task]
**Claim:** When code clears the token and then navigates, pass `flushSync: true` and render `RouterProvider` from `react-router/dom`, or the guard renders a second redirect.
**Saw it in:** `packages/frontend/src/features/auth/SessionBridge.tsx:47`, `node_modules/react-router/dist/development/lib/components.js:145`
**Context:** RR8 applies router updates in startTransition; the token store change renders at sync priority first, at the old location.

## CAND-T4-2 [implement-task]
**Claim:** React Router 8's `<Navigate>` throws "External navigation is not allowed" for `//host` targets, so validate redirect targets before rendering it.
**Saw it in:** `node_modules/react-router/dist/development/lib/router/navigation.js:39`
**Context:** An unvalidated `state.from` of `//evil.com` would crash into the route error boundary, not just mis-redirect.

## CAND-T4-3 [implement-task]
**Claim:** After `queryClient.clear()`, a still-mounted `useQuery` puts a fresh empty entry back in the cache; assert `getQueryData(key)` is undefined, not that the cache is empty.
**Saw it in:** `packages/frontend/src/features/auth/session.test.tsx` (cross-tab logout test)
**Context:** The observer rebuilds its query on the re-render the token change causes.

## CAND-T4-4 [implement-task]
**Claim:** Wrap `mutateAsync` promises captured from a test's click handler in `.then(ok, err)` at capture time; a rejection awaited later counts as unhandled in Vitest.
**Saw it in:** `packages/frontend/src/features/auth/session.test.tsx` (`track`)
**Context:** The test awaited `expect(p).rejects` only after `findByText`, so the rejection had already been reported.

## CAND-T5-1 [implement-task]
**Claim:** Type form submit handlers as React `SubmitEvent<HTMLFormElement>`, not `FormEvent`; `FormEvent` is deprecated in @types/react 19.2 and fails lint (`no-deprecated`).
**Saw it in:** `packages/frontend/src/features/auth/LoginPage.tsx:59`
**Context:** The committed LoginPage used FormEvent and failed `npm run lint`.

## CAND-T5-2 [implement-task]
**Claim:** Don't collect field elements via callback refs that write into a shared `useRef` map; react-hooks v7 `refs` rule flags it. Use one `useRef` per field and build the field→ref map inside the event handler.
**Saw it in:** `packages/frontend/src/features/auth/RegisterPage.tsx:73`
**Context:** Needed "focus first invalid field" across six inputs.

## CAND-T5-3 [implement-task]
**Claim:** Commit only after `lint` and `format:check` pass: a page committed mid-task (LoginPage) failed both, and nothing caught it until the next run.
**Saw it in:** `packages/frontend/src/features/auth/LoginPage.tsx:92`
**Context:** Resumed TASK-005 after an interrupted run whose partial output had been committed.

## CAND-T6-1 [implement-task]
**Claim:** Pin the `react-router/dom` RouterProvider with a behaviour test (one navigation on logout / two 401s); swapping the import to `react-router` makes exactly those tests fail.
**Saw it in:** `packages/frontend/src/app/AppShell/AppShell.test.tsx:14`
**Context:** Checked by temporarily swapping the import: 2 of 16 AppShell tests failed (double navigation).

## CAND-T6-2 [implement-task]
**Claim:** When a route moves behind a guard, retarget shell-only tests (theme, skip link) to a guest route like `/login` instead of seeding a session they don't need.
**Saw it in:** `packages/frontend/src/app/AppShell/AppShell.test.tsx:130`
**Context:** `/` became RequireAuth; the REQ-001 shell tests rendered `/`.

## CAND-T6-3 [implement-task]
**Claim:** Wiring pages into the router pushed the single JS chunk to ~565 kB, over Vite's 500 kB warning; plan route-level code splitting before more pages land.
**Saw it in:** `packages/frontend/src/app/router.tsx:2`
**Context:** `npm run build` passes but warns since TASK-006.

## CAND-T7-1 [implement-task]
**Claim:** Before a smoke test, check whether port 3000 already has an API running; reuse it rather than start a second one or kill a process you didn't start.
**Saw it in:** `packages/backend/src/api/server.ts` (PORT from root `.env`)
**Context:** A plain `tsx server.ts` (no watch) was already listening; it may run older code than the checkout.

## CAND-T7-2 [implement-task]
**Claim:** Folder READMEs outside a task's file list go stale silently; the docs task should name every `src/*/README.md` the REQ's code touched.
**Saw it in:** `packages/frontend/src/services/README.md:3`
**Context:** services/ and store/ READMEs still omit authApi and sessionNoticeAtom; not in TASK-007's list, so left alone.

## CAND-022 [review-arch]
**Claim:** When a task adds a service-level hook or store, list every folder README in that layer in the docs task, not only the new files.
**Saw it in:** `packages/frontend/src/services/README.md`
**Context:** authApi, the 401 hook and sessionNoticeAtom are missing from services/ and store/ READMEs.

## CAND-023 [review-arch]
**Claim:** Validation limits mirrored from the backend should come from one shared constant source, or drift is invisible to tests.
**Saw it in:** `packages/frontend/src/features/auth/validation.ts`
**Context:** Frontend rules are a hand copy of backend rules; shared has no runtime code today.

## CAND-Q-001 [review-qual]
**Claim:** Name constants by meaning; do not reuse one name (`ROLE_LABEL`) for different things in two files.
**Saw it in:** `packages/frontend/src/features/auth/RegisterPage.tsx:21`, `packages/frontend/src/app/AppShell/HeaderAuth.tsx:7`
**Context:** One is a form label string, the other a role-to-name map.

## CAND-Q-002 [review-qual]
**Claim:** A feature barrel (`index.ts`) should export only what other folders import; keep tests importing internals directly.
**Saw it in:** `packages/frontend/src/features/auth/index.ts:1`
**Context:** Auth barrel re-exports validators, error mappers and layout nobody outside uses.

## CAND-Q-003 [review-qual]
**Claim:** When a new primitive shares a folder with another (ButtonLink in Button/), give it its own co-located test file.
**Saw it in:** `packages/frontend/src/components/ui/Button/ButtonLink.tsx:1`
**Context:** Convention is one test file per component file; ButtonLink has none.

## CAND-Q-004 [review-qual]
**Claim:** When adding files to a folder, update that folder's README in the same task, not only the headline docs.
**Saw it in:** `packages/frontend/src/services/README.md:3`
**Context:** Same root as CAND-T7-2; seen again from the quality lens.

## CAND-Q-005 [review-qual]
**Claim:** The submit flow (flushSync errors, focus first invalid, map server error) is repeating across forms; extract a helper at the third form.
**Saw it in:** `packages/frontend/src/features/auth/LoginPage.tsx:57`, `packages/frontend/src/features/auth/RegisterPage.tsx:94`
**Context:** Two forms already duplicate it.

## CAND-001 [review-reflect]
**Claim:** To let a lint-isolated layer (services) trigger app behavior, expose a `setXHandler(fn | null)` registration and register it from one feature component; never import upward.
**Saw it in:** `packages/frontend/src/services/httpClient.ts` (setUnauthorizedHandler), `features/auth/SessionBridge.tsx`
**Context:** Covered by ADR-03 for 401s; the general pattern has no concept page.

## CAND-002 [review-reflect]
**Claim:** A useSyncExternalStore snapshot must be a pure read; do expiry cleanup in a mount effect, not in getSnapshot.
**Saw it in:** `packages/frontend/src/services/authToken.ts` (getLiveToken), `SessionBridge.tsx` boot cleanup
**Context:** Side effects in a snapshot loop or warn; ADV-002 caught it at architect time.

## CAND-003 [review-reflect]
**Claim:** Ignore a 401 unless the failed request's token equals the current token; this replaces any burst or debounce guard.
**Saw it in:** `packages/frontend/src/features/auth/SessionBridge.tsx:44`
**Context:** Late 401s after logout or re-login must not end the new session.

## CAND-004 [review-reflect]
**Claim:** Login and register mutations only store the token; one guard component (GuestOnly) owns post-login navigation.
**Saw it in:** `packages/frontend/src/features/auth/guards.tsx` (GuestOnly), `useLogin.ts`
**Context:** Two navigators race and a /me failure after sign-up would look like a form error.

## CAND-005 [review-reflect]
**Claim:** Redirect-back must come only from in-app `location.state`, validated to start with a single `/` (not `//` or `/\`), never from a URL parameter.
**Saw it in:** `packages/frontend/src/features/auth/redirect.ts:resolveFrom`
**Context:** Prevents open redirect; recurs for every future guard.

## CAND-006 [review-reflect]
**Claim:** Import RouterProvider from `react-router/dom` when navigations use `flushSync`; the plain entry does not wire ReactDOM.flushSync.
**Saw it in:** `packages/frontend/src/app/App.tsx:24`
**Context:** Likely a gotcha (silent behavior difference, easy to "fix" back).

## CAND-007 [review-reflect]
**Claim:** When a REQ adds a new feature folder or services/store files, the doc sweep must include the component page, concept pages and every folder README.
**Saw it in:** `.adlc/knowledge/components/frontend.md:8`, `.adlc/decisions.md:11`
**Context:** Component page and ADR catalog went stale in the same diff that edited conventions and CLAUDE.md.

## CAND-024 [review-corr]
**Claim:** Never let a storage write failure be swallowed when the app's logged-in state is derived by re-reading storage; surface the failure to the caller.
**Saw it in:** `packages/frontend/src/services/authToken.ts:5523`
**Context:** setToken catches and ignores a localStorage error, so login succeeds on the server but the UI never signs in.

## CAND-025 [review-corr]
**Claim:** A time-based expiry derived inside a pure snapshot read needs a timer or an explicit expire step, or the session ends silently with stale data left behind.
**Saw it in:** `packages/frontend/src/services/authToken.ts:5592`
**Context:** getLiveToken returns null after exp but nothing clears storage or sets the expired notice.

- **Claim:** A busy submit button set to `disabled` drops keyboard focus; restore focus to the field or alert after the response. Source: ui-review
  `packages/frontend/src/components/ui/Button/Button.tsx` (`disabled={disabled === true || loading}`)
  Seen on login 401 and network error: `document.activeElement` ends up as body.

## CAND-026 [implement-task]
**Claim:** Put a must-succeed step after the API call (like storing the token) inside `mutationFn` and throw a typed error, so its failure reaches the page's `onError` like any server error.
**Saw it in:** `packages/frontend/src/features/auth/useLogin.ts:25`
**Context:** setToken used to sit in `onSuccess` and swallow storage errors, so a blocked-storage login "succeeded" with no message (CORR-001).

## CAND-027 [implement-task]
**Claim:** To test a token-expiry timer, call `vi.useFakeTimers({ shouldAdvanceTime: true })` before making any token, so `Date.now` (used for `exp`) and `setTimeout` share one fake clock and Testing Library's `findBy` still polls.
**Saw it in:** `packages/frontend/src/features/auth/session.test.tsx:624`
**Context:** Real-time expiry tests would need a token a second from death and race the /me load.

## Candidate verdicts

Dedup basis: `ls knowledge/lessons/` and `origin/redesign` (fetched 4 hours before wrap-up) — both hold only LESSON-REQ-001-1..9; no REQ-002 candidate duplicates them.

| Candidate | Verdict | Target / Reason |
|---|---|---|
| CAND-T1-1 | demote-to-gotcha | ^g10 (lint spellings, item 3) |
| CAND-T1-2 | demote-to-gotcha | ^g11 |
| CAND-T1-3 | demote-to-gotcha | ^g11 (merged) |
| CAND-T2-1 | demote-to-gotcha | ^g10 (item 2) |
| CAND-T2-2 | discard | already covered by G04 (`:where()` for state rules over focus) |
| CAND-T2-3 | discard | one-off; only ButtonLink shares Button's classes |
| CAND-T3-1 | demote-to-gotcha | ^g10 (item 5) and ^g09 |
| CAND-T3-2 | demote-to-gotcha | ^g09 |
| CAND-T3-3 | demote-to-gotcha | ^g09 (merged) |
| CAND-T4-1 | demote-to-gotcha | ^g08 |
| CAND-T4-2 | promote | LESSON-REQ-002-5 (merged with CAND-005) |
| CAND-T4-3 | demote-to-gotcha | ^g12 (item 1) |
| CAND-T4-4 | demote-to-gotcha | ^g12 (item 2) |
| CAND-T5-1 | demote-to-gotcha | ^g10 (item 1) |
| CAND-T5-2 | demote-to-gotcha | ^g10 (item 4) |
| CAND-T5-3 | discard | one-off from an interrupted run; the lint-before-commit rule is in G10's "Don't" |
| CAND-T6-1 | demote-to-gotcha | ^g08 (merged — the pinning test) |
| CAND-T6-2 | discard | trivial; one-off test retargeting |
| CAND-T6-3 | discard | follow-up (route code-splitting), not a lesson |
| CAND-T7-1 | discard | local-machine state, not codebase behaviour |
| CAND-T7-2 | promote | LESSON-REQ-002-6 |
| CAND-022 | promote | LESSON-REQ-002-6 (merged) |
| CAND-023 | discard | open decision m10 (shared validation limits) — follow-up |
| CAND-Q-001 | discard | generic naming advice; follow-up m7 |
| CAND-Q-002 | discard | follow-up m9; revisit if a second feature barrel repeats it |
| CAND-Q-003 | discard | follow-up m6; the one-test-file convention already exists |
| CAND-Q-004 | promote | LESSON-REQ-002-6 (merged) |
| CAND-Q-005 | discard | follow-up m8 — extract at the third form |
| CAND-001 | discard | captured in concept page [[knowledge/concepts/session-and-401]] |
| CAND-002 | promote | LESSON-REQ-002-2 (merged with CAND-025) |
| CAND-003 | promote | LESSON-REQ-002-1 |
| CAND-004 | promote | LESSON-REQ-002-4 |
| CAND-005 | promote | LESSON-REQ-002-5 |
| CAND-006 | demote-to-gotcha | ^g08 (duplicate of CAND-T4-1) |
| CAND-007 | promote | LESSON-REQ-002-6 (merged) |
| CAND-024 | promote | LESSON-REQ-002-3 (merged with CAND-026) |
| CAND-025 | promote | LESSON-REQ-002-2 (merged) |
| (unnumbered, ui-review: busy button drops focus) | promote | LESSON-REQ-002-7 |
| CAND-026 | promote | LESSON-REQ-002-3 (merged) |
| CAND-027 | demote-to-gotcha | ^g12 (item 3) |
