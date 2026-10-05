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
