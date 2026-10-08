## CAND-001 [implement-task]
**Claim:** A boolean query filter that only means "on" should accept exactly `true` and 400 on `false`, not treat `false` as "off".
**Saw it in:** `packages/backend/src/businessLogic/src/validation.ts` (parseAlumniSearch, mentorship)
**Context:** Accepting `false` silently would look like a "non-mentors" filter that doesn't exist.

## CAND-002 [implement-task]
**Claim:** Measure layout edges headless over CDP with faked `/api` responses (Fetch.requestPaused) and an unsigned JWT-shaped token in localStorage; no account or DB write needed.
**Saw it in:** `packages/frontend/src/services/authToken.ts:67` (expiry read from the payload only)
**Context:** TASK-004 needed getBoundingClientRect on signed-in pages with no known test login; Brave headless + Node 24's WebSocket did it with no new dependency.

## CAND-003 [implement-task]
**Claim:** A page width that must line up with the shell's footer belongs in a custom property on `.shell` (`--page-max`), not a per-page rem value; the footer's side padding must equal `.main`'s.
**Saw it in:** `packages/frontend/src/app/AppShell/AppShell.module.css:20`, `SiteFooter.module.css` (`.inner`)
**Context:** Home (65rem, left), Directory (72rem), Profile (53.75rem) and the footer (56.25rem) had four different edges before REQ-016.

## CAND-002 [implement-task]
**Claim:** A nav link that depends on `['me']` must have a safe fallback href and its tests must wait for `['me']` before asserting the href.
**Saw it in:** `packages/frontend/src/app/AppShell/navItems.tsx` (navItemPath)
**Context:** The Profile tab points at /me until `alumni_id` loads, then switches; asserting too early reads the fallback.

## CAND-003 [implement-task]
**Claim:** A Home link at `/` under a path-less root layout needs NavLink `end`, or it is current on every page.
**Saw it in:** `packages/frontend/src/app/AppShell/navItems.tsx` (HOME_NAV_ITEM)
**Context:** All app routes are children of `/`, so a plain NavLink to `/` always matches.

## CAND-004 [implement-task]
**Claim:** After adding a businessLogic method, run `tsc` in `packages/backend/src/businessLogic` before `typecheck:backend`, or the api project fails with "Property does not exist".
**Saw it in:** `packages/backend/src/api/controllers/AlumniController.ts:29`
**Context:** Tests resolve `@alumni/businesslogic` to source, but `tsc -p src/api` reads the stale `dist/*.d.ts`; CLAUDE.md only says the running API needs the rebuild.

## CAND-005 [implement-task]
**Claim:** Wrap every boolean used as an `ORDER BY … DESC` rank in `COALESCE(<cmp>, false)`; a NULL comparison sorts first under DESC.
**Saw it in:** `packages/backend/src/dal/query/AlumniQuery.ts` (SUGGEST_SQL)
**Context:** Suggestions rank by "same department"; candidates with no department would otherwise outrank real matches (ADV-001).

## CAND-006 [implement-task]
**Claim:** A component shared by an eager page and a lazy page goes in its own eager feature folder with an `index.ts`, kept off `LAZY_FEATURES`.
**Saw it in:** `packages/frontend/src/features/people/index.ts`
**Context:** Suggested alumni is on Home (eager) and Feed (lazy); no lint or test change was needed, the lazy ban already covers the new folder.

## CAND-007 [implement-task]
**Claim:** To test a width-gated component, spy on `window.matchMedia` for that one query; the test setup stub answers every width query false (a phone).
**Saw it in:** `packages/frontend/src/features/feed/FeedPage.test.tsx` (`wideScreen`), `packages/frontend/src/test/setup.ts:12`
**Context:** Existing feed tests silently run the phone layout, so a "wide" assertion needs the stub; `useWideScreen` treats a missing matchMedia as wide, the stub does not.

## CAND-008 [implement-task]
**Claim:** Never put `Foo.tsx` and `foo.ts` side by side in one folder; on macOS `./Foo` resolves to `foo.ts` and the component import is undefined.
**Saw it in:** `packages/frontend/src/features/home/ProfileCompletenessCard.tsx` (renamed from `ProfileCompleteness.tsx`, next to `profileCompleteness.ts`)
**Context:** The task named both files; tests failed with "Element type is invalid ... got: undefined" until the component file was renamed.

## CAND-009 [implement-task]
**Claim:** `react-refresh/only-export-components` allows exported primitive constants but not exported arrays; keep query-key tuples private in component files (or move them to a `.ts`).
**Saw it in:** `packages/frontend/src/features/home/LatestPosts.tsx` (`LATEST_POSTS_KEY`)
**Context:** G27 says "constants pass"; an `as const` array does not.

## CAND-010 [implement-task]
**Claim:** Count a field toward profile completeness only if the app has an editor for it; otherwise the card can never reach 100% for most users.
**Saw it in:** `packages/frontend/src/features/home/profileCompleteness.ts` (ALUMNI_FIELDS / STUDENT_FIELDS)
**Context:** REQ-016 A2 counts photo; Account settings has no photo control (REQ-010), so the "Add a profile photo" step leads nowhere.

## CAND-011 [implement-task]
**Claim:** Don't wrap a shared card that is already a named region in a landmark with the same name; use a plain div for placement.
**Saw it in:** `packages/frontend/src/features/feed/FeedPage.tsx:110`
**Context:** `<aside aria-label="Suggested alumni">` around `SuggestedAlumni` (a `section` labelled by the same heading) made screen readers say the name twice.

## CAND-012 [implement-task]
**Claim:** When faking API calls in a screenshot run, never delay `/api/me`; RequireAuth waits on it, so you capture the route "Loading…" instead of the section skeletons.
**Saw it in:** scratchpad `harness.mjs` (TASK-008 screenshot pass)
**Context:** The first loading shot of Home showed only "Loading…" because the delay held the current-user request too.

## CAND-013 [implement-task]
**Claim:** Size a sidebar per breakpoint, and check it at the exact breakpoint width; a fixed 20rem rail at 48rem leaves the main column barely wider than the rail.
**Saw it in:** `packages/frontend/src/features/feed/FeedPage.module.css` (48rem / 64rem grid)
**Context:** At 768px the Feed was 352px of posts beside a 320px sidebar; Home kept 20rem because 16rem cut mentor names.
