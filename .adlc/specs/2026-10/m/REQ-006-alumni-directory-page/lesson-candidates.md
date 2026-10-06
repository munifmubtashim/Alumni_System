
## CAND-001 [implement-task]
**Claim:** A mock axios adapter must reject non-2xx itself; returning `{ status: 400 }` resolves, because axios's status check lives inside its built-in adapters.
**Saw it in:** `packages/frontend/src/services/alumniApi.test.ts` (`failWith`), `httpClient.test.ts:23`
**Context:** My first error test resolved with a 400 body instead of rejecting.

## CAND-002 [implement-task]
**Claim:** Overriding a Button's padding through `className` only works because the feature's CSS Module loads after Button.module.css (same specificity).
**Saw it in:** `packages/frontend/src/features/directory/Pagination.module.css:13`
**Context:** Pagination needs tighter padding than the Button default; a size prop on Button would remove the reliance on CSS order.

## CAND-003 [implement-task]
**Claim:** "Current ± 1" alone does not reproduce the design's 1 2 3 … 24; shift the three-page run inward at the first and last page.
**Saw it in:** `packages/frontend/src/features/directory/pageWindow.ts:19`
**Context:** The task text said current ± 1, the design shows three numbers on page 1; the design won.

## CAND-004 [implement-task]
**Claim:** To test a signed-in header without a /me race, find the user menu with `findByRole`; on pages outside RequireAuth it reads "Account" until /me resolves.
**Saw it in:** `packages/frontend/src/app/AppShell/AppShell.test.tsx` (Header main nav block)
**Context:** Stand-in routes passed to `createRoutes` are not under RequireAuth, so nothing waits for /me before the test looks for the "Amina" button.

## CAND-005 [implement-task]
**Claim:** Build conditional CSS-module classNames with `[a, cond && b].filter(Boolean).join(' ')`, not a template literal.
**Saw it in:** `packages/frontend/src/app/AppShell/MainNav.tsx:24`
**Context:** CSS-module values type as `string | undefined`, so `restrict-template-expressions` rejects `${styles.a} ${styles.b}`.

## CAND-006 [implement-task]
**Claim:** Keep a primitive's `.tsx` exporting only components; put helpers (e.g. `initialsOf`) in a sibling `.ts` file.
**Saw it in:** `packages/frontend/src/components/ui/Avatar/initials.ts:1`
**Context:** `react-refresh/only-export-components` fails lint on a helper exported beside the component.

## CAND-007 [implement-task]
**Claim:** Put a primitive's default sizes inside `:where()` when callers are expected to size it with their own class.
**Saw it in:** `packages/frontend/src/components/ui/Skeleton/Skeleton.module.css:14`
**Context:** Two single-class rules from different CSS Modules tie on specificity, so the winner depends on bundle order.

## CAND-008 [implement-task]
**Claim:** Tests under `src/` cannot use `node:fs` to read CSS (tsconfig.app has only `vite/client` types); assert CSS behaviour elsewhere.
**Saw it in:** `packages/frontend/tsconfig.app.json:9`
**Context:** Conventions say "read files from disk" for CSS content, but that only type-checks under `scripts/`.

## CAND-009 [implement-task]
**Claim:** Base UI 1.8 Popover.Popup is role="dialog" with no name unless you render Popover.Title or pass aria-label; give every panel one.
**Saw it in:** `node_modules/@base-ui/react/popover/popup/PopoverPopup.js:91`
**Context:** Our Popover takes a required `label` that becomes the dialog's aria-label.

## CAND-010 [implement-task]
**Claim:** Base UI 1.8 Popover focuses the first tabbable element on open (mouse and keyboard; the popup itself on touch); use finalFocus={false} or a ref when the trigger will vanish.
**Saw it in:** `node_modules/@base-ui/react/utils/popups/popupStoreUtils.js:45`
**Context:** ADV-002 asked to verify the default; the pill-to-chip swap unmounts the trigger focus would return to.

## CAND-011 [implement-task]
**Claim:** Don't rely on setSearchParams' function form for fresh params; it starts from the render-time searchParams, so two calls in one tick drop the first.
**Saw it in:** `node_modules/react-router/dist/development/lib/dom/lib.js:748`, `packages/frontend/src/features/directory/useDirectoryParams.ts`
**Context:** useDirectoryParams keeps a ref of the last search it wrote and builds each write on that instead.

## CAND-012 [implement-task]
**Claim:** In this repo's type-aware lint, `await act(() => fn())` with a sync callback fails (await-thenable, no-confusing-void-expression); wrap as `act(async () => { fn(); await Promise.resolve(); })`.
**Saw it in:** `packages/frontend/src/features/directory/useDirectoryParams.test.tsx` (`change` helper)
**Context:** Router navigations need the async act to settle before asserting on router.state.

## CAND-013 [implement-task]
**Claim:** Inside a card link, put each text line in a block element (`div`/`p`), not a `span`, or the link's accessible name runs words together.
**Saw it in:** `packages/frontend/src/features/directory/AlumniCard.tsx:37`
**Context:** With spans the computed name was "Amira MendesClass of 2017Product Design"; block elements add the gaps (also in jsdom).

## CAND-014 [implement-task]
**Claim:** `react-refresh/only-export-components` fails a component file that also exports a helper function (constants pass); keep the helper private and test it through the component, or move it to a `.ts` file.
**Saw it in:** `packages/frontend/src/features/directory/DirectoryStates.tsx:11`, `AlumniCard.tsx:18`
**Context:** Exporting `describeFilters` / `jobLine` for unit tests broke `npm run lint`.

## CAND-015 [implement-task]
**Claim:** With Vitest fake timers plus user-event, use `vi.useFakeTimers({ shouldAdvanceTime: true })` and `act(() => vi.advanceTimersByTimeAsync(ms))`; plain fake timers hang every user-event/findBy call.
**Saw it in:** `packages/frontend/src/features/directory/FilterBar.test.tsx:24`
**Context:** All five debounce tests timed out at 5 s with plain `toFake: ['setTimeout']`; leave a margin before a deadline since real time also moves the clock.

## CAND-016 [implement-task]
**Claim:** Guard a debounced URL write by comparing the URL value at keystroke time with the value at fire time, and drop the write if it moved.
**Saw it in:** `packages/frontend/src/features/directory/FilterBar.tsx:119`
**Context:** Needs no "was this my own write?" bookkeeping and no setState in an effect (react-hooks v7 lint); Back and Clear all during the wait stay put.

## CAND-017 [implement-task]
**Claim:** Validate a free-text filter by running it through the URL parser, so an applied value can never be silently dropped on read.
**Saw it in:** `packages/frontend/src/features/directory/FilterBar.tsx:38`
**Context:** A pasted tab would be written to the URL, dropped by the parser, and leave a pending focus target that never mounts.

## CAND-018 [implement-task]
**Claim:** Stub `Element.prototype.scrollIntoView` in any test that changes the directory page; jsdom does not implement it and the call throws.
**Saw it in:** `packages/frontend/src/features/directory/DirectoryPage.test.tsx:148`
**Context:** DirectoryPage scrolls the section into view on a page change; TASK-010 route tests that click pagination need the same stub.

## CAND-019 [implement-task]
**Claim:** Use a 4xx (not 5xx) to test a query's error state through `createQueryClient`, or the default retries add 3 s of delays.
**Saw it in:** `packages/frontend/src/app/queryClient.ts:20`
**Context:** 5xx retries twice with 1 s and 2 s back-off, past `findBy*`'s 1 s timeout.
