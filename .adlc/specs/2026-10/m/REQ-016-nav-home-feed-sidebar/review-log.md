# REQ-016-nav-home-feed-sidebar — Review log

Full reviewer narratives. Verdict: verification.md.

## Correctness findings

Written by: correctness-reviewer (tier: balanced)

Checked the suggestions SQL (NULL ordering, caller exclusion, student and no-profile callers, parameters), mentorship parsing, route order and auth, nav and Profile-tab logic, completeness logic, query keys and invalidation, and the Mentors/Latest/Feed-sidebar states. Findings: 0 critical, 0 major, 1 minor, 0 trivial.
Dispatch answers: SQL NULL ordering checked, nothing (COALESCE to false, `LEFT JOIN me ON true` still works if the caller row is gone); caller exclusion by user id checked, nothing (works for students); mentorship param checked, nothing; `/suggestions` sits above `/:id` and behind `router.use(authMiddleware)`, checked, nothing; Profile-tab and completeness logic checked, nothing; Mentors list drops the caller correctly (fetches 5, filters, shows 4), nothing; stale-data: see CORR-001.

### CORR-001: Suggestions stay stale for 5 minutes after the user edits their own department or university

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/people/useSuggestedAlumni.ts:19` |
| Category | logic |

**What:** The suggestions are ranked by the caller's own department and university, but nothing under `features/me` invalidates `['alumni', 'suggestions']` after a save, and the query has `staleTime` of 5 minutes (only admin writes invalidate the `alumni` root).
**Why it matters:** A member changes department in Account settings, goes Home or to the Feed, and still sees the old ranking until the 5 minutes pass or the page reloads. Cosmetic, no wrong data shown.
**Recommendation:** In the `PUT /api/me` success handler (`features/me`), call `invalidateQueries({ queryKey: [ALUMNI_QUERY_ROOT, 'suggestions'] })` using the root from `config/queryKeys` (no cross-feature import needed).

### Round 2

**Summary:** CORR-001 withdrawn (false positive, my error). Refactor, `--page-max` move and type removal checked: 0 new findings (0 critical, 0 major, 0 minor, 0 trivial).

**CORR-001: withdrawn.** `STALE_AFTER_PROFILE_SAVE` already held `['alumni']` at HEAD, and `invalidateQueries` matches by prefix, so it reaches `['alumni','suggestions']` and `['alumni','mentors']`. `staleTime` only gates automatic refetch; an invalidated entry refetches on next mount. The new test (`useUpdateProfile.test.tsx`) pins `isInvalidated === true` on `SUGGESTED_ALUMNI_KEY`, and the key list now seeds both keys with live observers. The switch to `ALUMNI_QUERY_ROOT`/`POSTS_QUERY_ROOT`/`FEED_QUERY_ROOT` is value-identical ('alumni', 'posts', 'feed').

**Refactor (SectionCard/PersonList):** checked, nothing. Pending shows the status line outside the `aria-busy` list; error shows Alert plus Retry with `isFetching` spinner; the `isError && data === undefined` guard keeps stale data on a failed refetch; empty copy is unchanged in all three sections. Heading levels default to 2 and `SuggestedAlumni` passes its prop through. Query keys, `staleTime` and `SUGGESTED_ALUMNI_KEY` are untouched. Only visual change: the Suggested heading now takes `ink-primary` like the Home headings (harmless).

**`--page-max` on `:root` / type removal:** checked, nothing. Every consumer (Home, Directory, Profile, Feed, SiteFooter) reads `var(--page-max)` from a descendant of `:root`, so none loses the value; pages outside the shell now get the cap too. No `SuggestedAlumni` type reference remains in `packages/shared`, the frontend or the backend; `getSuggestedAlumni` returns the same `AlumniListItem[]`. PersonRow container query (`.row` as the container, grid areas, `.skeletonRow` for the placeholder) keeps the link name order avatar, text, tag.

## Quality findings

Written by: quality-reviewer (tier: balanced)

**Summary:** Read the full packet diff (57 code files) against root CLAUDE.md conventions and the spec's AC list. 5 findings: 0 critical, 1 major (duplication), 3 minor, 1 trivial. Biggest: `features/people/SuggestedAlumni.tsx` re-implements the card, loading, empty and error states that `features/home/HomeSection.tsx` already provides. Tokens-only CSS: checked, nothing (no hex, rgb or px in new CSS; only layout sizes in rem and px inside comments). Tests assert behaviour (roles, hrefs, request params, cache keys, states), and every AC has a test except the footer alignment, which jsdom cannot measure. Copy fix: checked, nothing left outside the design bundle and `.worktrees/`.

### QUAL-001: SuggestedAlumni duplicates HomeSection's card and state blocks

| Field | Value |
|---|---|
| Severity | major |
| Effort | medium |
| File | `packages/frontend/src/features/people/SuggestedAlumni.tsx:36-62` (other copy: `features/home/HomeSection.tsx:40-83`) |
| Category | duplication |
| Rule | CLAUDE.md Conventions; spec Quality AC "reuses existing components"; L-REQ-008-6 |

**What:** `SuggestedAlumni` hand-writes the Card with labelled heading, the hidden loading status, the Alert plus Retry error block and the empty note. `HomeSection`, `SectionLoadingStatus`, `SectionError` and `SectionEmpty` do the same in `home/`. The CSS is copied too: `.error`, `.retry`, `.empty` and `.list` in `people/SuggestedAlumni.module.css` match `HomeSection.module.css` and `home/MentorsAvailable.module.css`.
**Why it matters:** Three sections (Suggested, Mentors, Latest) must now look and behave alike, yet a change to the error copy or Retry layout has to be made in two folders. The two copies have already drifted (Suggested has no action link slot).
**Recommendation:** Move `HomeSection` and its three helpers (with CSS) into `features/people` or a shared eager folder, render `SuggestedAlumni` through it (keep `headingLevel`), and delete the copied CSS. Have `MentorsAvailable` reuse the shared `.list` instead of its own copy.

### QUAL-002: app README still says the Feed is 40rem wide

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/app/README.md:12` |
| Category | documentation |
| Rule | CLAUDE.md "README accuracy" (L-REQ-010-5) |

**What:** The line ends "(Feed 40rem until its sidebar grid; ...)". `FeedPage.module.css` now uses `min(100%, var(--page-max))` with a grid.
**Why it matters:** The README contradicts the code on the one point this REQ changed (footer alignment), and the next reader will "fix" the Feed back to 40rem.
**Recommendation:** Change to "Home, Directory, Profile, Feed and `SiteFooter` use `min(100%, var(--page-max))`". Also `useLeaveGuard.ts` comment now wraps oddly after the edit ("the avatar menu's \"Account\nsettings\""); reflow it.

### QUAL-003: Third copy of the fake-API test helpers

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/people/SuggestedAlumni.test.tsx:15-60` (others: `features/home/homeTestKit.tsx:21-85`, existing feed/admin tests) |
| Category | duplication |
| Rule | convention-gap (homeTestKit.tsx header names this follow-up as QUAL-002) |

**What:** `ok`, `fail`, `never`, adapter reset and a no-retry client are re-declared in `SuggestedAlumni.test.tsx` although `homeTestKit.tsx` has the same set.
**Why it matters:** The kit's own header says one shared `src/test/` helper is still open; each new REQ adds another copy of the G26 adapter rule.
**Recommendation:** At least reuse `homeTestKit` in the people test (eager feature, allowed), or do the `src/test/` move now. Codify "fake API helper lives in src/test/" in conventions.md.

### QUAL-004: Footer alignment test only checks markup

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/app/AppShell/SiteFooter.test.tsx:36-47` |
| Category | test-coverage |
| Rule | none |

**What:** The new test asserts `toHaveClass('inner')` and child nesting. It passes whatever the CSS says, so it cannot catch the failure the AC is about (edges not lining up). The test comment admits this.
**Why it matters:** A class-name assertion pins an implementation detail and gives false confidence; the real check is only the manual screenshot.
**Recommendation:** Drop the class assertion (keep the nesting check), or add a stylelint/CSS-text test that `SiteFooter.module.css` `.inner` and `FeedPage/Home/Directory/Profile` page classes all use `var(--page-max)`.

### QUAL-005: Sidebar widths and breakpoints are bare numbers in three CSS files

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `features/feed/FeedPage.module.css` (16rem, 20rem, 64rem), `features/home/HomePage.module.css:48` (20rem) |
| Category | convention |
| Rule | convention-gap (CSS rule only forbids raw colours, spacing and type) |

**What:** Sidebar width and the 64rem step are repeated as literals; Home keeps 20rem at 48rem while Feed uses 16rem there, and the reason lives only in comments.
**Why it matters:** The two "right column beside content" layouts can drift further apart.
**Recommendation:** Leave as is, or add `--side-col` beside `--page-max` in `AppShell.module.css`. Decide whether layout widths are exempt from the tokens-only rule and write it down.

### Round 2

Written by: quality-reviewer (tier: balanced)

**Summary:** Re-checked the fix pass only. QUAL-001, QUAL-002 and QUAL-003 are resolved; no `HomeSection`, `SuggestedAlumni.module.css` or `MentorsAvailable.module.css` is left, and the READMEs match the code. New CSS is tokens-only (no hex or px; `16rem` is a layout size). 0 critical, 0 major, 2 minor, 1 trivial. QUAL-004 and QUAL-005 stay open as the packet says.

### QUAL-006: `mockApi` now hangs on an unlisted URL instead of failing the test

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/test/fakeApi.tsx:62-63`, used by `features/people/SuggestedAlumni.test.tsx:22` |
| Category | test-coverage |

**What:** The old people test rejected with `Unmocked: <url>`; the shared helper returns `never`, so a stray request just leaves a query pending.
**Why it matters:** A wrong URL in a test shows up as a timeout in `findBy*`, not as a clear message. Home wanted the hang (other sections stay quiet), but the people test did not.
**Recommendation:** Add an option such as `mockApi(routes, { strict: true })` that rejects unlisted URLs, and use it in `SuggestedAlumni.test.tsx`. `fakeApi.tsx` also has no test of its own; two small cases (responder sequence repeats the last one; `resetApi` clears `requests`) would pin it.

### QUAL-007: New useUpdateProfile test overlaps the existing key test

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/frontend/src/features/me/useUpdateProfile.test.tsx:1266-1269, 1312-1327` |
| Category | test-coverage |

**What:** The first test already seeds `['alumni','suggestions']` with an observer and asserts it refetches; the new CORR-001 test checks the same invalidation through `SUGGESTED_ALUMNI_KEY`.
**Why it matters:** Not harmful. It does add the one thing the first lacks: it uses the real exported key, so a key rename in `people` fails here. Keep it, but drop the literal `['alumni','suggestions']` from the first list to avoid two pins. The claim "already invalidates the ['alumni'] prefix" is true: the root list is unchanged in behaviour.

### QUAL-008: `README` for fakeApi says older kits "predate it", but no follow-up is tracked

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/test/README.md:3`, `src/test/fakeApi.tsx:1-7` |
| Category | duplication |

**What:** QUAL-003 is resolved for Home and people, but the feed and admin test kits still carry their own adapter copies; the note names them without a task.
**Why it matters:** Same drift as before, one step smaller. Not a blocker.
**Recommendation:** Log a one-line follow-up task to move the feed and admin kits onto `fakeApi.tsx`, and write "fake API helpers live in `src/test/fakeApi.tsx`" into `conventions-frontend.md` (a `convention-gap`).

Checked, nothing: `PersonRow` container query (the anchor is the container, `.layout` is its descendant, so the `@container` rule matches; skeleton uses its own `.skeletonRow`, so no stray container); `--page-max` in `:root`, no leftovers in `AppShell.module.css`; `SectionCard`/`PersonList` naming and exports; `useLeaveGuard` comment reflow.

## Architecture findings

Written by: architecture-reviewer (tier: balanced), dispatched sub-agent.
Checked 57 files: route order, layer chain (route, controller, Manager, Query), SQL parameterisation, shared types vs DTOs, ESLint lazy/boundary lists, people/ eager sharing, ADR-01/02/08/09, query-key roots, page-width cascade. Findings: 0 critical, 0 major, 2 minor, 0 trivial.
Dispatch questions: route ordering (`/suggestions` above `/:id`, pinned by test) checked, nothing; layering checked, nothing; lazy rules (people is not in `LAZY_FEATURES`, Feed imports it only via `index.ts`) checked, nothing; shared type sync (`SuggestedAlumni` = `AlumniListItem[]`, mentorship `true` only on both sides) checked, nothing.
Biggest: `--page-max` is defined only on the AppShell, so every page that uses it silently loses its width cap if rendered outside that shell.
**Packet-gap:** none for the packet; I read `useUpdateProfile.ts` and `eslint.config.js` (off-diff collaborators).

### ARCH-001: `--page-max` has no fallback and lives only on AppShell

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/home/HomePage.module.css:~33`, `directory/DirectoryPage.module.css:~4721 (packet)`, `feed/FeedPage.module.css`, `profile/ProfilePage.module.css`, `app/AppShell/SiteFooter.module.css` |
| Category | pattern |
| Rule broken | Tokens rule in CLAUDE.md (all sizes from design tokens / one definition); precedent `--tab-bar-height` is also AppShell-scoped |

**What:** Five CSS modules read `min(100%, var(--page-max))`, but the variable is declared in `AppShell.module.css` only. If any page renders outside that element, the `width` is invalid and the page goes full width with no error.
**Why it matters:** Lazy pages and the footer now depend on a parent they cannot see. A future layout (or an `errorElement` outside the shell) breaks width silently, and tests in jsdom cannot catch it.
**Recommendation:** Add a fallback at each use (`var(--page-max, 72rem)`), or declare `--page-max` once in `styles/global.css` `:root`. The second is the one-definition option and matches how tokens work.
**References:** `packages/frontend/src/app/AppShell/AppShell.module.css`, `.adlc/context/conventions.md` (tokens only).

### ARCH-002: Shared type and component share the name `SuggestedAlumni`

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/shared/src/types/alumni.types.ts:47`, `packages/frontend/src/features/people/SuggestedAlumni.tsx:25` |
| Category | pattern |
| Rule broken | Shared-types convention: `@alumni/shared` names are API shapes, other names stay distinct (`Post` vs `PostCard`) |

**What:** `SuggestedAlumni` is both a type (array of list items) and a React component. A file that needs both (the service imports the type, features import the component) must alias one.
**Why it matters:** Auto-import picks the wrong one; the type being an array alias, not an entity, also reads like a component prop type.
**Recommendation:** Drop the alias and type the service as `AlumniListItem[]` (the endpoint's bare array), or rename it `AlumniSuggestions`. Update `alumniApi.ts:57` and the API conventions page line that names it.
**References:** `.adlc/context/conventions-api.md` (suggestions entry), `packages/shared/src/types/alumni.types.ts`.

### Round 2

Checked the fix pass: `--page-max` (global.css `:root`, no other definition; all 5 readers plus README and comments updated), the shared type removal, and `features/people` plus `src/test/fakeApi.tsx` against `eslint.config.js` and ADR-08. Nothing found; both round-1 findings are closed.
- ARCH-001 closed: grep shows one declaration (`styles/global.css`), the AppShell copy is gone, and Stylelint passes on global.css.
- ARCH-002 closed: `SuggestedAlumni` no longer exists in `packages/shared`; `getSuggestedAlumni` returns `AlumniListItem[]`; conventions-api and the REQ docs say so.
- Boundaries: `features/people` imports only `components/ui`, `config`, `services` and `shared` (all allowed for features) and no lazy feature. `people` is not in `LAZY_FEATURES`, so Home and Feed importing it stays ADR-08 safe. `test/fakeApi.tsx` imports only `services/httpClient` and has no `app/` import; no non-test file imports it except test kits.

## Reflection findings

Written by: reflector (tier: balanced)

Checked 63 lessons (none skipped as superseded), 49 gotchas, 9 ADRs, the touched concept/component pages and every README the diff or its subject touches. 5 findings: 0 critical, 0 major, 4 minor, 1 trivial. Code follows the lessons well (L-REQ-008-6 shared home, L-REQ-009-1 alumni id, L-REQ-015-3 conventions-api updated, G32 rebuild noted). The biggest issue is that four vault pages (not the READMEs) still describe the old nav and Home. Exploration check: it says the endpoint is `/suggested` and that Home reuses the feed query; the code uses `/suggestions` and its own `['feed','latest']` key (docs agree with the code). Doc-drift sweep: READMEs and root CLAUDE.md are updated and consistent; `docs likely affected` list is in REFL-001.

### REFL-001: Vault pages still describe the old nav, Home and feature list

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/knowledge/concepts/route-layout.md:25`, `.adlc/knowledge/components/frontend.md:15`, `.adlc/context/conventions-frontend.md:12` |
| Category | vault-stale |
| Vault reference | [[knowledge/lessons/LESSON-REQ-010-5-nav-and-menu-changes-touch-every-readme-list]] |

**What:** `route-layout.md:25` says `/me` is reached "from the Home card" and the phone tab bar's third tab reads "Account"; both are gone (the tab is now "Profile", Home has no quick-link cards). `components/frontend.md:15` lists `home/ (HomePage)` and has no `people/`; it has no REQ-016 line. `conventions-frontend.md:12` "Today:" list omits `people/` (and Home's new parts).
**Why it matters:** Reviewers check code against these pages; they will call the new nav a regression.
**Recommendation:** At /wrapup step 3, edit those three lines, add a REQ-016 bullet to `components/frontend.md`, and note `--page-max` in `route-layout.md`. (`.adlc/index.md:25` REQ-007 "quick-link cards" is history, leave.)

### REFL-002: ADR-08 and lazy-feature docs have no rule for a shared eager feature

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/people/index.ts` |
| Category | concept-drift |
| Vault reference | [[architecture/adr-08-route-code-splitting-and-url-list-state]], [[knowledge/lessons/LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]] |

**What:** ADR-08 (amendment) says lazy features meet "in `config/`" and conventions say features have no `index.ts`. REQ-016 adds a third way: an eager folder with an `index.ts` that Home (eager) and Feed (lazy) both import. It works and the lint ban already covers it, but no accepted page records it.
**Why it matters:** The next REQ that needs to share UI between lazy features will re-decide this (and L-REQ-008-6 asks for a decided home).
**Recommendation:** Add a short ADR-08 amendment: "shared UI goes in an eager feature folder with an `index.ts`, not on `LAZY_FEATURES`, never importing a lazy feature". Promote CAND-006 (REQ-016 list) to a lesson or this amendment.

### REFL-003: Home's post preview is a third copy of the date and author-link logic

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/home/LatestPosts.tsx:28-34`, `:46-60` |
| Category | re-derivation |
| Vault reference | [[knowledge/lessons/LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]] |

**What:** `isoDate`, `UNKNOWN_AUTHOR` ("Unknown member") and the link-only-when-`author_alumni_id` rule now exist in `feed/Byline.tsx` + `feedFormat.ts`, `profile/PostCard.tsx:15` and `LatestPosts.tsx`. The spec asked to reuse "the feed's author line".
**Why it matters:** The copying is deliberate (Byline is in the lazy Feed), but it is the third copy and none has a tracked follow-up; a change to the unknown-author rule will miss one.
**Recommendation:** Move `isoDate` and `UNKNOWN_AUTHOR` to `config/` (pure, leaf-safe) and have all three import them; or log a follow-up task. Record the choice in the Home README.

### REFL-004: Footer now 72rem but Account settings, About and Admin are narrower

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/me/MePage.module.css:17`, `features/about/AboutPage.module.css:50` |
| Category | concept-drift |
| Vault reference | [[knowledge/lessons/LESSON-REQ-012-2-record-design-deviations]] |

**What:** `--page-max` (72rem) is used by Home, Directory, Profile, Feed and the footer. `/me` caps at 42.5rem, `/about` at 56.25rem (the old footer width), and `/admin` is full width, so the footer edge lines up with four pages and not with these three.
**Why it matters:** The "footer lines up with page content" goal only holds partly; CLAUDE.md's "each page caps its own width" does not say which pages share `--page-max`.
**Recommendation:** Say in `SiteFooter` docs and CLAUDE.md which pages are on `--page-max` and that Me/About/Admin are deliberate exceptions (narrow form, reading page, full-width table); no code change needed unless the user wants them aligned.

### REFL-005: Home query key `['feed','latest']` depends on an undocumented prefix rule

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/frontend/src/features/home/LatestPosts.tsx:19-24`, `config/queryKeys.ts:17` |
| Category | concept-drift |
| Vault reference | [[knowledge/concepts/optimistic-cache-edits]], [[knowledge/lessons/LESSON-REQ-010-1-invalidate-other-features-cache-with-real-keys]] |

**What:** Home hides under the feed root so admin invalidation reaches it, and relies on feed optimistic writes touching only exact keys (comment says so, plus `refetchOnMount: 'always'`). The concept page does not say that other keys under `['feed']` are allowed.
**Why it matters:** A future feed edit that uses prefix `setQueriesData({queryKey:['feed','posts']})` is safe; one that uses `['feed']` would corrupt Home's array shape.
**Recommendation:** One line in `optimistic-cache-edits.md`: "optimistic edits use `['feed','posts'...]` prefixes, never the bare `['feed']` root; Home owns `['feed','latest']`."

(Lesson candidates: CAND-014 and CAND-015 added; CAND-002/003 in the file are duplicated by number, wrapup should renumber.)

## UI/UX findings


Written by: ui-reviewer (tier: balanced)

**Summary.** Drove headless Brave over CDP with faked /api (no DB writes) at 1280, 768, 390 (plus 640 and 320 for 200% zoom), light and dark, as alumni, student and admin. All Navigation, Feed sidebar, Home and Fixes ACs pass. Header nav is Home/Directory/Feed (+Admin) with correct `aria-current`; phone tabs have icons, labels and 56px height, and Profile goes to `/alumni/7` (current there) or `/me` for student/admin. The sidebar makes no request below 48rem. Footer lines up with page content (64 to 1216px) on all four pages. Keyboard tab order is logical with visible 2px rings. Errors show a per-section Retry and loading, empty and complete-profile states behave. 0 critical / 0 major / 1 minor / 1 trivial.

### UI-001: Suggested-alumni role text is cut off at tablet width

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | `/feed` at 768px (sidebar) |
| Lens | responsive |
| Evidence | `ui-evidence/r-feed-768-dark.png` |

**What:** At 768px the sidebar is about 255px wide. The Mentor badge takes a fixed share, so "Product Designer, Fjord Studio" shows as "Product Designer,..." and other rows wrap to 2 lines.
**Why it matters:** The role and company line is the main reason to click a row, and the AC asks for "role + company".
**Recommendation:** In the sidebar CSS (`FeedPage.module.css` / the `SuggestedAlumni` row), put the Mentor badge under the name at narrow widths, or let the role line wrap to 2 lines instead of ellipsis.

### UI-002: Feed post avatar initials render as a default blue underlined link (not from this REQ)

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| Route / flow | `/feed` post cards, light and dark |
| Lens | consistency |
| Evidence | `ui-evidence/r-feed-390-light.png`, `ui-evidence/r-feed-768-dark.png` |

**What:** The avatar of a post with an author profile shows "MC", "OH" and so on underlined in browser-default link colour; the Home previews and sidebar avatars do not.
**Why it matters:** It looks unfinished next to the new Home and sidebar rows. The diff does not touch `PostCard`, so it was already there.
**Recommendation:** Give the avatar link `color: inherit; text-decoration: none` in the PostCard CSS (separate task is fine).

**Notes:** Tab bar sticking mid-image in full-page shots is a screenshot artefact, not a bug. A1 (student without profile): Profile tab goes to `/me`, and Home still renders. Completeness uses a native `<progress>`. No source file was changed; dev server stopped, port 5173 free.

**UI review tier:** headless (Brave via CDP, faked /api) — routes `/`, `/directory`, `/feed`, `/alumni/:id`, `/me` at 1280/768/390, 640/320 zoom check, keyboard tab order, error/loading/complete states; ~45 screenshots in the scratchpad (5 copied to `ui-evidence/`); 0 critical / 0 major / 1 minor / 1 trivial.
