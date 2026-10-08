# REQ-006-alumni-directory-page — Review log

Full reviewer narratives. The consolidated verdict lives in `verification.md` —
read that first; come here for the long form behind a finding ID.

## Correctness findings

Written by: correctness-reviewer (tier: balanced)

**Summary:** Read the diff for the directory feature (params, useDirectoryParams, FilterBar, FilterPopover, DirectoryPage, Pagination, pageWindow, debounce, alumniApi). 2 findings: 0 critical, 0 major, 2 minor. Biggest: a keystroke typed in the 1-2 render window after the debounced URL write is overwritten by the sync block. Dispatch questions: debounce/URL races (CORR-001, CORR-002); page-past-end and total/ceil (checked, nothing; pageWindow traced for totals 1-7); stale query results (checked, nothing; key is the parsed params, no placeholder data); URL parsing vs API 400 rules (checked, nothing; CORR-002 is the only gap); focus after Apply/chip removal (checked, nothing); Popover controlled state (checked, nothing); effect deps (checked, nothing).

### CORR-001: Sync block can overwrite text typed right after the debounced write

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/directory/FilterBar.tsx:113-116` |
| Category | concurrency |

**What:** When the debounced write lands, `urlQ` changes; if the user typed one more character before that render, `text.trim() !== urlQ` and `setText(urlQ)` drops it. That keystroke's own write is also skipped by the guard at line 119, because `qWhenTyped` is the old URL value.
**Why it matters:** One lost character, only if a key lands in the few milliseconds between navigate and render. Cannot confirm without running; the window looks very small.
**Recommendation:** Remember the last value this component sent (a ref set in the debounced callback) and skip the `setText` when `urlQ` equals it.

### CORR-002: A control character pasted into the search box is written to the URL, then silently ignored

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/directory/useDirectoryParams.ts:57-62`, `params.ts:84-93` |
| Category | input-validation |

**What:** `toSearchParams` does not run the `CONTROL_CHARACTER` check that `parseText` does, so a pasted tab lands in `?q=` and is dropped on read.
**Why it matters:** The box shows text but the list is unfiltered and no chip or message explains it. No 400 is sent (the read side protects the API).
**Recommendation:** In `FilterBar.handleTextChange` or `toSearchParams`, drop or strip control characters from `q` so the box and the URL agree.

### Round 2 re-review

Written by: correctness-reviewer (tier: balanced), round 2 (fix commit bbdf907f).

**Summary:** Read the fix in `FilterBar.tsx`, `params.ts`, `DirectoryPage.tsx` and `useDebouncedCallback.ts`. CORR-001 and CORR-002 are both resolved. 0 new findings.

- CORR-001: resolved. The component now remembers the `q` it sent (`sync.sent`, set in the same tick as the navigation). When the URL shows that value the box is left alone, and the pending write for a newer key is not cancelled, because `outsideChanges` is not bumped. `useDebouncedCallback` calls the latest `fn`, so the timer sees current `sync`. A leftover `sent` after a no-op write is harmless: the next `urlQ` change resets it.
- CORR-002: resolved. `handleTextChange` turns control characters into spaces before `setText`, and `toSearchParams` does the same and trims, so the box, the URL and the parser agree. Whitespace-only text writes no `q`.
- Focus change in `DirectoryPage.goToPage`: sound. `tabIndex={-1}` on the h1, `focus({ preventScroll: true })`, then the existing scroll. The heading stays mounted in every state, so focus survives the skeleton swap.


## Quality findings

Written by: quality-reviewer (tier: balanced), dispatched sub-agent.

**Summary:** Checked all 69 files in the packet against conventions.md (naming, CSS-module and token rules, tests, README accuracy). 0 critical, 0 major, 4 minor, 2 trivial. Biggest: the visually-hidden CSS is now in two places and the old copy's comment still says "this is the only copy". Dispatch questions: duplicated visually-hidden CSS = QUAL-001; assertions that cannot fail = QUAL-003 (the feature tests themselves are sound); naming = checked, nothing; README accuracy = QUAL-004 only (the READMEs match the code); CSS-module rules = QUAL-005; copy-pasted helpers = QUAL-002 and QUAL-006.

### QUAL-001: Visually-hidden CSS copied, and the first copy's comment is now false

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `src/features/directory/ResultsGrid.module.css:21`, `src/components/ui/SearchField/SearchField.module.css:63-65` |
| Category | duplication |
| Rule | none (convention-gap: no rule for shared utility classes) |

**What:** `.visuallyHidden` (9 identical lines) exists in both files. SearchField's comment says "No shared utility exists yet; this is the only copy", which stopped being true when ResultsGrid copied it.
**Why it matters:** A third use (likely soon: other live regions) makes a third copy, and a fix to one (e.g. `clip` for old browsers) misses the others.
**Recommendation:** Pull it into one place: a `VisuallyHidden` primitive in `components/ui/` (features may import it), or `composes:` from one shared module file. At minimum, fix the stale comment in SearchField.module.css:63.

### QUAL-002: Fake-API and token helpers copied into a sixth test file

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `src/features/directory/DirectoryPage.test.tsx:21-78`; also `src/app/AppShell/AppShell.test.tsx:26-79`, `features/auth/{session,guards,LoginPage,RegisterPage}.test.tsx` |
| Category | duplication |
| Rule | conventions.md → Testing → Mock policy (no rule on sharing helpers) |

**What:** `base64url`, `makeToken`, `ok`, `fail`, `AMINA`, the adapter-by-`METHOD url` switch and the "Unmocked request" rejection are re-typed in each of these files. This REQ adds the sixth copy.
**Why it matters:** A change to the token shape or the axios mocking trick (G11) must be made six times.
**Recommendation:** Add `src/test/apiMock.ts` (helpers only) and import it. conventions.md says `test/` is "Vitest setup only", so that line needs a small edit. Can be a follow-up REQ; not worth blocking this one.

### QUAL-003: Two new contrast rows cannot fail on their own

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `src/styles/contrast.test.ts:59-60` |
| Category | test-coverage |
| Rule | conventions.md → Testing → Guard tests |

**What:** Row 59 (`accent-strong` on `accent-soft`, TEXT) is identical in colours and minimum to row 58 ("accent Tag text"). Row 60 (`accent-strong` on `surface-raised`, NON_TEXT 3:1) is implied by row 54, same colours at the stricter 4.5:1.
**Why it matters:** They read as new Chip/Avatar coverage but add none; a failing token change would already fail rows 54 and 58.
**Recommendation:** Delete both, and widen the `use` text of rows 58 and 54 ("accent Tag text, Avatar initials, Chip text"). Keep row 61 (`accent` on `accent-soft`), which is new.

### QUAL-004: conventions.md not updated for the directory, new primitives and the lazy-route rule

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/context/conventions.md` → Frontend section (folder list, UI paragraph) |
| Category | documentation (convention-gap) |
| Rule | [[knowledge/lessons/LESSON-REQ-001-8]] (update conventions in the same REQ) |

**What:** CLAUDE.md and the READMEs are updated, but conventions.md (the reviewers' source of truth) still says "today `Menu` and `SegmentedControl` use [Base UI]", lists no `directory/`, `alumniApi.ts`, `MainNav`, `HydrateFallback`, and has no rule that `features/directory` is imported only by dynamic import.
**Why it matters:** Later reviews check against a stale file; the lazy-import rule is only enforced by one test, not written where reviewers look.
**Recommendation:** Update at wrapup: folder list, Popover and the five new primitives, the ADR-08 lazy-route rule, and the pass-in-brand-text style note for new pages.

### QUAL-005: FilterPopover borrows FilterBar's CSS module

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `src/features/directory/FilterPopover.tsx:5` (uses `styles.panelForm`, `styles.apply` from `FilterBar.module.css:41,47`) |
| Category | convention |
| Rule | conventions.md → Naming → Files (one `.module.css` per component) |

**What:** Two components share one CSS module, unlike every other component in this diff.
**Recommendation:** Move `.panelForm` and `.apply` to `FilterPopover.module.css`.

### QUAL-006: Small copies of existing helpers and constants

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `src/app/AppShell/MainNav.tsx:26`, `src/features/directory/DirectoryStates.tsx:78`, `src/features/directory/FilterBar.tsx:88` |
| Category | duplication |
| Rule | none |

**What:** (a) MainNav joins class names with `.filter(Boolean).join(' ')`, which is `cx` in `components/ui/cx.ts`. (b) The magnifier SVG paths in NoResults repeat SearchField's (`SearchField.tsx:46`). (c) `maxLength: 4` for the year is a literal; the year length is defined by `isValidGraduationYear`'s `\d{4}` in `params.ts`.
**Recommendation:** Use `cx` in MainNav (app/ may import it); export a `GRADUATION_YEAR_LENGTH` from params.ts; leave the icon unless a third use appears.

(0 further trivials not listed.)

### Round 2 re-review (quality-reviewer, fix commit bbdf907f)

**Summary:** Checked the fix commit (26 files) against my round-1 findings. 4 resolved, 1 resolved in part, 2 still open by user decision. 1 new trivial (QUAL-007). The new VisuallyHidden primitive, its tests and its README row are sound; no leftover `visuallyHidden` class anywhere outside it.

- **QUAL-001: resolved.** One `VisuallyHidden` in `components/ui/` (CSS, test, `index.ts`, README row, listed in ui README purpose line); SearchField and ResultsGrid use it; both old CSS copies and the false comment are gone.
- **QUAL-002: still open** (user decision; follow-up REQ).
- **QUAL-003: resolved.** Both redundant rows removed; their `use` text merged into the two surviving rows; the new `accent`/`accent-soft` row is kept.
- **QUAL-004: still open** (user decision; fix at wrapup). CLAUDE.md and READMEs were updated again, conventions.md was not.
- **QUAL-005: resolved.** `FilterPopover.module.css` holds `.panelForm` and `.apply`; the import is switched.
- **QUAL-006: resolved in part.** (a) MainNav now uses `cx`: done. (c) `maxLength: 4` is still a literal at `FilterBar.tsx:90`; (b) was "leave unless a third use". The commit did not claim (c), so it is trivial and left to the user.

### QUAL-007: VisuallyHidden tests assert the class name, not the hiding

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `src/components/ui/VisuallyHidden/VisuallyHidden.test.tsx:9,33` |
| Category | test-coverage |
| Rule | none |

**What:** The tests check `toHaveClass('visuallyHidden')`, so a CSS edit that stops hiding the text still passes. This matches how Skeleton and SearchField tests work (jsdom has no layout), so it is the project norm, not a defect.
**Recommendation:** None needed. Optional: one line in the test file noting that the hiding itself is covered by manual check only.

## Architecture findings

Written by: architecture-reviewer (tier: balanced), dispatched sub-agent.

**Summary:** Read the router, guard test, `alumniApi`, `useAlumniSearch`, `params`, `useDirectoryParams`, `DirectoryPage`, `MainNav`, the ui primitives' imports and the ESLint boundary config (~25 files). 0 critical, 0 major, 2 minor. Layering is clean: no `features/directory` import of `app/`, `services/` is React-free, `components/ui` imports no services/store/features. Biggest: the "no static import of the lazy feature" rule is only a text-scan test, while every other boundary is also a lint rule.
- Layering / lint boundaries: checked, nothing. ADR-01/02/03/07/08: checked, compliant (no UI kit, Query for server data, URL for list state, 401 uses the shared handler, HydrateFallback is on the route object).
- Lazy guard: it does guard (see ARCH-001 for its limits). Primitives placement: checked, nothing (Pagination, FilterPopover and card stay in the feature, as designed).
- `alumniApi` vs `@alumni/shared`: checked, nothing (`AlumniListResponse` used as is; card link uses `Alumni.id`, which `GET /api/alumni/:id` also keys on).
- AppShell/MainNav: checked, nothing (`app/` importing `@/features/auth` is allowed). REQ-005 API assumptions: limits match `conventions.md` (see ARCH-002 for drift risk).
**Packet-gap:** none.

### ARCH-001: Lazy-feature boundary is a test only, not a lint rule

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/app/lazyRoutes.test.ts:12-35` |
| Category | pattern |
| Rule broken | CLAUDE.md "Import boundaries are lint-enforced (with a test per boundary)"; ADR-08 |

**What:** Every other layer boundary is a `no-restricted-imports` block in `eslint.config.js` plus a test. This one is only a regex over file text in a Vitest run, so the editor and `npm run lint` give no warning.
**Why it matters:** A developer sees the failure only at `npm test`. The regex also needs `import`/`export` at line start and would miss `import x = require()` or a `new URL()` style reference. The test also flags `import type` from the feature, which is erased at build and harmless.
**Recommendation:** Add an ESLint block that bans `@/features/directory` and relative forms for all `src/` files outside `features/directory/` (except the dynamic import in `router.tsx`, which the rule does not match anyway). Keep the test as the second layer.
**References:** [[architecture/adr-08-route-code-splitting-and-url-list-state]], `packages/frontend/eslint.config.js` `layerBan`.

### ARCH-002: API validation limits copied into the client with no shared source

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `packages/frontend/src/features/directory/params.ts:8-14` |
| Category | contract |
| Rule broken | CLAUDE.md "Shared types" (keep shapes in sync manually); conventions.md Pagination |

**What:** `MAX_PAGE`, the 1900 / now+10 year window and the text limits (100/100/150) are hand-copied from the REQ-005 backend validators.
**Why it matters:** If the backend limit changes, the client sends a value the API now rejects with 400, and the page shows the error state instead of ignoring the value. Nothing fails at build time.
**Recommendation:** Leave as is for this REQ, but add a comment in `params.ts` naming the backend file the numbers come from, and a line in the backend validator pointing back. Putting constants in `@alumni/shared` would break its "no runtime code" rule, so that needs an ADR first.
**References:** `.adlc/context/conventions.md` (Pagination), `packages/shared/src/types/alumni.types.ts:25-26`.

### Round 2 re-review (architecture-reviewer, fix commit bbdf907f)

Written by: architecture-reviewer (tier: balanced), dispatched sub-agent.

**Summary:** Re-read the ESLint block, the 13 new enforcement cases, `params.ts`, the new `VisuallyHidden` primitive and its two users. Ran `enforcement.test.ts` + `lazyRoutes.test.ts` (110 pass) and `eslint src/app` (clean). ARCH-001 resolved, ARCH-002 resolved. 0 new findings.
- **ARCH-001 resolved.** The block uses `@typescript-eslint/no-restricted-imports`, a different rule id from the layer bans' `no-restricted-imports`, so it cannot override them; the last test case proves both fire together on `components/ui`. Cases cover alias, relative, sibling (`../directory`), side-effect CSS and `export *` forms. The `import()` in `router.tsx:35` stays legal (the rule does not match dynamic imports; case present). `import type` and test files are let through on purpose. Small leftover, not worth a finding: `lazyRoutes.test.ts` still flags `import type`, so the two layers differ there.
- **ARCH-002 resolved.** `params.ts` header names `validation.ts` and the constants; I checked `MAX_PAGE`, `NAME_MAX`, `DEPARTMENT_MAX`, `UNIVERSITY_MAX`, `optionalYear` all exist there. The reverse pointer in the backend file was not added (it was optional).
- **VisuallyHidden / other fix changes:** checked, nothing. It imports only React, `../cx` and its own CSS (README "may import" list); tokens-only CSS; the `as` prop is typed; documented in the ui README. `SearchField` imports it from a sibling primitive (allowed); `ResultsGrid` (feature) uses it via the `components/ui` public index (allowed). `MainNav` now uses `cx` (REFL-001 fixed). `FilterPopover` owning its CSS module keeps feature styles in the feature. `stripControlCharacters` stays pure in `params.ts`. No ADR touched.

## Reflection findings

Written by: reflector (tier: balanced), dispatched sub-agent.

**Summary:** Checked 26 lessons (0 superseded), 24 gotchas, 8 ADRs (accepted), 3 concept pages, the frontend component page, vault conventions.md and every README/CLAUDE.md the diff touched. 4 findings: 0 critical, 0 major, 4 minor (1 re-derivation, 3 vault-stale/diagram-stale, all needs-decision for /wrapup). Code respects ADR-01/02/03/08, G04, G18, L-REQ-001-5 (no inline styles) and L-REQ-004-2 (contrast pairs added for Avatar/Chip). Biggest: the vault's frontend pages still describe the app as it was before this REQ. Repo docs (root CLAUDE.md, frontend README, app/features/services/components-ui READMEs) are current; `docs/design/README.md` does not exist in this tree (checked, nothing). Dispatch asks: exploration claims checked against the diff, nothing contradicted (its "lazy route needs named Component export" is loose but the code uses `lazy` returning `{ Component }`, which is correct); docs likely affected: none beyond the findings.

### REFL-001: MainNav re-derives the shared `cx` class joiner

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/app/AppShell/MainNav.tsx:26` |
| Category | re-derivation |
| Vault reference | [[knowledge/components/frontend]] ("plus the shared `cx.ts` class joiner (reuse it; don't write another)") |

**What:** MainNav builds its className with `[styles.link, isActive && styles.active].filter(Boolean).join(' ')`, which is exactly `components/ui/cx.ts`; every other new primitive (Avatar, Chip, SearchField, Popover, Skeleton) imports `cx`.
**Why it matters:** CAND-005 turns this into a "convention" (use filter/join, not template literals); the real rule is "use `cx`", so the candidate would teach the wrong thing. `cx` accepts `false`, so it also passes `restrict-template-expressions`.
**Recommendation:** import `cx` from `@/components/ui/cx` in MainNav (`app/` may import any `components/ui` path). At wrap-up, discard or reword CAND-005.

### REFL-002: Vault frontend pages and conventions.md predate this REQ

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/knowledge/components/frontend.md`, `.adlc/context/conventions.md:127-148,60` |
| Category | vault-stale (needs-decision, for /wrapup step 3) |
| Vault reference | [[knowledge/components/frontend]] · [[context/conventions]] · [[architecture/adr-08-route-code-splitting-and-url-list-state]] |

**What:** The component page says "current as of REQ-004", "no nav links yet", lists no `directory/`, no `alumniApi`, no `MainNav`/`HydrateFallback`, and the 10 old primitives (not Avatar, Chip, Skeleton, SearchField, Popover). conventions.md Frontend still says Base UI is used by "`Menu` and `SegmentedControl`" (now also `Popover`), lists only `authApi` under services and omits `MainNav`/`HydrateFallback` from `app/`.
**Vault says:** the pages describe the REQ-004 frontend.
**Code does:** adds the directory feature, 5 primitives, the lazy route, the header nav (root CLAUDE.md already says all this).
**Recommendation:** at wrap-up, bring the component page up to REQ-006 (Touched by, Structure, ADR-08 link, new CAND-backed gotchas) and add to conventions.md Frontend: ADR-08 rule (new big pages use `lazy` + `HydrateFallback`; list state in the URL via a pure parser) and `src/app/lazyRoutes.test.ts` in "Guard tests that must stay green". Also fix the "CSS in tests: read files from disk" line if CAND-008 is kept, and note `import.meta.glob(..., { query: '?raw' })` as the way a `src/` test reads source text.

### REFL-003: route-layout concept diagram no longer matches the router

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/knowledge/concepts/route-layout.md:13-18` |
| Category | diagram-stale (needs-decision, for /wrapup step 3) |
| Vault reference | [[knowledge/concepts/route-layout]] · [[knowledge/gotchas#^g19|G19]] |

**What:** The tree shows `AppShell (skip link, S1 header: Logo, HeaderAuth, full ThemeToggle)` and `RequireAuth → / ; *`. The code now has `MainNav` in the header and a lazy `directory` route (with its own `HydrateFallback`) under `RequireAuth`. G19's last bullet ("a guest header has the Account nav; 'no nav links' tests must allow it") is also incomplete: a signed-in header now has the Main nav.
**Recommendation:** add `MainNav` and `→ / ; directory (lazy, HydrateFallback)` to the tree, a one-line "lazy routes" bullet pointing at ADR-08, and extend G19's bullet to "Account (guest) or Main (signed in)". Mark the `Date`/`Status` line REQ-006.

### REFL-004: requirement.md links to ADR files that do not exist

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `.adlc/specs/2026-10/m/REQ-006-alumni-directory-page/requirement.md:11` |
| Category | vault-stale (needs-decision) |
| Vault reference | [[architecture/adr-02-server-state-tanstack-query]] |

**What:** The Related row links `adr-01-ui-layer`, `adr-02-state-management`, `adr-03-session-and-401`; the real files are `adr-01-ui-layer-headless-css-modules`, `adr-02-server-state-tanstack-query`, `adr-03-frontend-session-and-401-handling` (architecture.md uses the right ones).
**Recommendation:** fix the three wikilinks at wrap-up.

**Checked, nothing:** ADR-08 consequences (HydrateFallback on the route object, pure tested parser, build-time chunk check, Home eager) are all met; ADR-02 (server data only in TanStack Query, no atoms); ADR-03 (no new 401 handling; the cache clears on token change so no cross-user results); L-REQ-001-4 (the lazy boundary is test-enforced and documented as "guard test", not claimed as lint); L-REQ-002-6 (every touched folder README and the root CLAUDE.md are updated; `store/`, `config/`, `styles/`, `test/` READMEs need nothing); the `ink-muted` uses (`DirectoryStates.module.css:25`, `Pagination.module.css:34`, `SearchField.module.css:21`) are all `aria-hidden` decoration, so L-REQ-004-2's text/control floors do not apply; root CLAUDE.md "Conventions (redesign)" has no line the ADR-08 contradicts (L-REQ-001-8: optional, the user's text).


## UI/UX findings

Written by: ui-reviewer (tier: balanced), dispatched sub-agent.

**Summary:** Static-only tier. I started the API (port 3100) and Vite (5273) and both came up, but I could not sign in: minting a token from the JWT secret was refused by the permission system, and launching the cached headless browser was refused too. So nothing here was seen running. I read all directory, nav, Popover, Chip, SearchField and routing source and the S2 design CSS, and traced states by hand. 2 findings: 0 critical, 1 major, 1 minor. Biggest: after clicking Next or a page number the button disappears while the next page loads, so keyboard focus drops to the page top. Servers stopped, ports 3100 and 5273 free, `.env` copy deleted. The author's design-check.md (visual match, 360px, dark) is unverified by me; it is the only visual evidence. AC12 and the 200% zoom half of AC14 are in the checklist below.

### UI-001: Focus is lost when changing page (Pagination unmounts during the load)

| Field | Value |
|---|---|
| Severity | major |
| Effort | small |
| Route / flow | `/directory` with more than 12 results, Prev / Next / page number |
| Lens | a11y, interaction-state |
| Evidence | static: `DirectoryPage.tsx:79-103`, `useAlumniSearch.ts` (no `placeholderData`) |

**What:** Pagination renders only in the results branch. A page change gives a new query key with no cached data, so `isPending` is true, the body becomes skeletons and the clicked button is removed from the DOM. `goToPage` only scrolls (`DirectoryPage.tsx:62-65`); it never moves focus.
**Why it matters:** A keyboard or screen-reader user presses Next and focus falls to `<body>`; they must tab through the whole header and filters again for every page. The pagination row also vanishes and returns, so the page jumps. (AC14 "keyboard users can reach and use everything".) Cached pages (30 s) do not show this, so it is intermittent.
**Recommendation:** After `setPage`, focus the results heading or the section (give `<section>` or the `<h1>` `tabIndex={-1}` and call `.focus()` in `goToPage`, then keep the existing scroll). Optionally keep Pagination mounted (disabled) while loading to stop the jump.

### UI-002: A server error shows skeletons for about 3 seconds before the error state

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | `/directory` when the API answers 5xx or the network drops |
| Lens | interaction-state |
| Evidence | static: `app/queryClient.ts:4-17` (2 retries, default backoff 1 s + 2 s) |

**What:** On a 5xx the shared client retries twice, so `isPending` stays true (skeletons and "Loading alumni…") for roughly 3 s, then the error with Retry appears. A 4xx fails at once.
**Why it matters:** Not broken (AC11 holds), just slow feedback on an outage. The Retry button's own click also retries twice, so the button spins for ~3 s.
**Recommendation:** Pass `retry: 1` (or `false`) in `useAlumniSearch` if a quicker error is wanted; otherwise accept it as the app-wide default.

### Checked by reading, nothing found

- AC1/AC2: `DIRECTORY_ROUTE` sits under `RequireAuth` in `AppShell`; `MainNav` uses `NavLink` (current on `/directory` and below) and shows only with a session.
- AC5/AC7: debounce is written from the handler and guarded against Back, Clear all and Apply (ADV-001). Filters push history, typing replaces. Bad URL values are dropped by `params.ts`. (CORR-001/002 cover the two small edges.)
- AC6/AC14 focus: Apply focuses the new chip, removing a chip focuses its pill, Clear all focuses search, Escape returns to the pill; chip remove names are "Remove Department: …". Validation errors use `aria-invalid` and `aria-describedby`.
- AC8/AC9/AC10/AC11: no stray comma in the job line, grid `minmax(min(16.25rem,100%),1fr)`, `pageWindow` gives 1 2 3 … 24 / 1 … 11 12 13 … 24 / 1 … 22 23 24, Prev and Next disabled with the real attribute, past-end shows "Back to page 1", count region is polite and empty when loading, in error and past the end.
- Cards link to `/alumni/:id`, which has no route yet: `router.tsx:49` is `{ path: '*', element: null }`, so a click shows an empty shell, not the "existing not-found page" the spec's non-goal text mentions. Known and out of scope for this REQ; the later profile REQ should add a real not-found view.
- AC13: no hex or raw px in the directory, Popover, Chip or MainNav CSS I read (a few rem literals with comments, e.g. `Popover.module.css` 16rem panel, 0.75rem chevron; they scale with zoom).

## UI manual-verification checklist

Run `npm run dev` (needs a signed-in user with more than 12 alumni for items 4 and 5; the dev database has 8, so seed a copy or use a test DB).

1. Guest opens `/directory?q=x`: goes to `/login`, and after login lands back on `/directory?q=x` with the box filled (AC1, AC7).
2. Header shows Directory with a 2px accent underline on `/directory`; Tab reaches it with a visible ring (AC2).
3. Type "ann": URL updates about 300 ms after you stop, skeletons show, then cards; Back restores the previous list and box text (AC5, AC7, AC11).
4. With more than 12 results press Next with the keyboard: focus should stay in the page (expect UI-001: it drops to the top today). Then `?page=999`: "Nothing on this page" and "Back to page 1" work (AC10).
5. Apply University, Department and Grad. year (try 20 and 2099: inline error, panel stays open); each becomes a chip; remove one; Clear all (AC6, AC14).
6. Stop the API and reload: skeletons about 3 s, then error with Retry; restart and Retry loads (AC11).
7. Compare side by side with S2-Desktop-Light, S2-Desktop-Dark, S2-Phone-Light, S2-Phone-Dark, S2-NoResults (the scratch expansion in the session scratchpad `design/`), at 1440, 390 and 360 px (AC12).
8. At 360 px and at 200% browser zoom: no horizontal scroll, header wraps cleanly, popover panel stays inside the screen, search placeholder not cut mid-word (AC14).
9. Screen reader: count announces once per result change; skeleton loading says "Loading alumni…"; card link reads name then details (AC14).

**UI review tier:** static-only (app booted, no authenticated browser session available) — `/directory` states, filters, pagination and nav traced from source; 0 screenshots; 0 critical / 1 major / 1 minor.


### Round 2 re-review (UI/UX)

Written by: ui-reviewer (tier: balanced), dispatched sub-agent. Tier: static-only (no servers, no browser, per instruction). Read fix commit bbdf907f.

**Summary:** UI-001 resolved. `goToPage` now focuses the h1 (`tabIndex={-1}`, `DirectoryPage.tsx:73-80,125`) synchronously while Pagination is still mounted, so focus never falls to `<body>`; it holds through loading and results because the h1 is never remounted. The global `:focus-visible` ring (`global.css:53`) applies to it. The new DirectoryPage test (`:338-370`) focuses the Next button then asserts the h1 has focus during the held "Loading alumni…" state and after results; without the fix focus stays on the removed button, so it would fail. VisuallyHidden keeps the label (`SearchField.tsx:24`) and the "Loading alumni…" `role="status"` (`ResultsGrid.tsx:23`); props pass through, same CSS. FilterBar race fix and control-character stripping read correctly. 0 new findings. UI-002 stays open by user decision.

- UI-001: **resolved.** Order is sane: focus (preventScroll) then `scrollIntoView` on the section, so no double jump. Screen readers hear "Alumni Directory, heading", then the polite loading status. Focus also moves on cached pages where the button survives; acceptable and consistent.
- Mouse users: the ring shows only if the browser deems it keyboard-initiated (`:focus-visible` heuristics), so no stray ring after a click. Not verified in a browser.
- FilterBar: own write recognised by value, newer keystrokes survive, Back/Clear all/Apply still cancel stale writes (outside-change counter). A stale `sent` can linger until the next URL change but cannot misfire, since reaching that `q` again needs a change that resets it. Control characters become spaces before both box and URL, so they agree.
- Not covered (no browser): real focus ring look on the h1 at 200% zoom and in dark mode; add to the manual checklist item 4: after Next, the heading shows a ring and Tab continues into the filters/grid.

**UI review tier:** static-only — `/directory` page change, search box, loading status re-read from the fix commit; 0 screenshots; 0 critical / 0 major / 0 minor new (UI-001 resolved, UI-002 open).
