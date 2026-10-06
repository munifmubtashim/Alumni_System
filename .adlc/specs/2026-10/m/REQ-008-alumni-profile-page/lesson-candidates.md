# Lesson candidates — REQ-008

## CAND-001 [implement-task]
**Claim:** Wrap numbers in String() inside template-literal URLs; the type-aware ESLint rule restrict-template-expressions rejects a bare number.
**Saw it in:** `packages/frontend/src/services/alumniApi.ts:49`
**Context:** `/posts/user/${userId}` passed tsc but failed lint; typecheck alone does not catch it.


## CAND-002 [implement-task]
**Claim:** Pin the locale ('en') in Intl formatters and build test expectations for dates with the same Intl call, never a hardcoded string.
**Saw it in:** `packages/frontend/src/features/profile/relativeTime.ts:1`
**Context:** Default locale and the runner's time zone vary by machine; a hardcoded "Aug 26, 2026" would flake off-UTC.

## CAND-003 [implement-task]
**Claim:** Test router-state handovers by clicking the link into a stub route that renders what it reads from `useLocation().state`; the href never shows state.
**Saw it in:** `packages/frontend/src/features/directory/AlumniCard.test.tsx` (BackTarget helper)
**Context:** Link `state` is invisible in the DOM, so an href-only test cannot catch a dropped state prop.

## CAND-004 [implement-task]
**Claim:** Expect the full frontend `npm test` to time out on a few heavy page tests when parallel tasks run Vitest at once; rerun before blaming your change.
**Saw it in:** `packages/frontend/src/features/directory/DirectoryPage.test.tsx` (and AppShell, LoginPage, RegisterPage tests)
**Context:** TASK-003 saw 14, then 2, then 0 failures (all "Test timed out in 5000ms") on unchanged code while other REQ-008 tasks shared the tree.

## CAND-005 [implement-task]
**Claim:** Use `skipToken` as the queryFn for a dependent query instead of `enabled` plus a non-null assertion; lint bans `!` and `as` narrowing.
**Saw it in:** `packages/frontend/src/features/profile/usePostsByUser.ts:14`
**Context:** The posts query needs the profile's user_id, which is `number | undefined` until the profile loads.

## CAND-006 [implement-task]
**Claim:** Overriding a `components/ui` primitive's CSS with a same-specificity className relies on the primitive's CSS loading first; check the primitive is in the main bundle or imported earlier.
**Saw it in:** `packages/frontend/src/features/profile/RecentPosts.module.css:1`
**Context:** PostCard narrows Card's padding/gap; Card.module.css is in the main bundle via RouteError, so the lazy chunk's rule wins.

## CAND-007 [implement-task]
**Claim:** In component tests that exercise an error state, turn query retry off on the test client; the app policy retries 5xx twice with backoff and the test times out.
**Saw it in:** `packages/frontend/src/features/profile/RecentPosts.test.tsx` (renderPosts)
**Context:** A 500 from the posts endpoint would otherwise take ~3s of retries before the error shows.

## CAND-008 [implement-task]
**Claim:** Put a space before a VisuallyHidden span as a JSX text node outside it; a leading space inside the span is trimmed from the accessible name in tests.
**Saw it in:** `packages/frontend/src/features/profile/ProfileHeader.tsx:64`
**Context:** "LinkedIn <VisuallyHidden> (opens in a new tab)" computed as "LinkedIn(opens in a new tab)" in dom-accessibility-api.

## CAND-009 [implement-task]
**Claim:** Never put a role="status" line inside an aria-busy="true" container; put aria-busy only on the decorative skeleton.
**Saw it in:** `packages/frontend/src/features/profile/ProfileStates.tsx:23`
**Context:** Some screen readers hold live-region updates inside a busy subtree; RecentPosts.tsx still nests its status inside aria-busy.

## CAND-010 [implement-task]
**Claim:** For a page whose states each own an h1, focus the h1 from one effect keyed on [routeParam, viewState] with a shared ref, not per-state effects.
**Saw it in:** `packages/frontend/src/features/profile/ProfilePage.tsx:35`
**Context:** Covers arrival, id change (cached or not), and error to success after Retry; a repeat error keeps focus on Retry.

## CAND-011 [implement-task]
**Claim:** Read `useLocation().state` into a `const x: unknown` before passing it on; destructuring it fails no-unsafe-assignment because it is typed `any`.
**Saw it in:** `packages/frontend/src/features/profile/BackLink.tsx:15`
**Context:** Lint error on `const { state } = useLocation()`.

## CAND-012 [implement-task]
**Claim:** Give each lazy feature its own import ban that exempts only its own folder; one shared ban that skips every lazy folder lets lazy features import each other.
**Saw it in:** `packages/frontend/eslint.config.js:77`
**Context:** no-restricted-imports options do not merge across flat-config blocks, so the bans are split by non-overlapping file region (rest of src/, each lazy folder).

## CAND-013 [implement-task]
**Claim:** Wait for focus with `waitFor` after a Base UI Menu opens; `findByRole` returns the item a tick before focus lands.
**Saw it in:** `packages/frontend/src/app/AppShell/AppShell.test.tsx:454`
**Context:** "opens the user menu from the keyboard" failed 3 of 8 runs on HEAD.

## CAND-014 [implement-task]
**Claim:** In tests, a page's own `<header>` inside `<main>` also matches `getByRole('banner')`; find the shell by a header control instead.
**Saw it in:** `packages/frontend/src/app/AppShell/AppShell.test.tsx:755`
**Context:** the profile page's header made the existing shell-check pattern throw "multiple elements".

## CAND-015 [implement-task]
**Claim:** `line-height: normal` fails our Stylelint (strict-value; `normal` is not an allowed keyword) — decide at architect time how to match designs that use the browser default line height.
**Saw it in:** `packages/frontend/stylelint.config.js:41`
**Context:** S3 designs set no line-height, so their text boxes are shorter than our type tokens; TASK-008 could not apply `normal`.
