# REQ-010-my-profile-page — Review log

Full reviewer narratives. The consolidated verdict lives in `verification.md` —
read that first; come here for the long form behind a finding ID.

## Correctness findings

Written by: correctness-reviewer (tier: balanced)

**Summary:** Read the 14 `features/me` source files, `authApi`, the backend `updateMe`/`changeMyPassword`/validators and `MY_PROFILE_SQL`. 0 critical, 0 major, 2 minor. Focus questions: partial-save flow (checked, nothing: profile result is applied and the baseline moves even when the password call fails); dirty/baseline (checked, nothing: trimmed compare, in-flight typing kept, Discard disabled while saving); useBlocker vs 401 (checked, nothing: token read at navigation time, `/login` exempt); photo_url round trip (checked, nothing: sent back from `saved`, replaced from the PUT result); validation vs backend (checked, nothing: limits, year ranges, URL regex, 72-byte cap and alumni-over-student all match); cache invalidation (CORR-001).

### CORR-001: Feed cache is not refreshed after a name change

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/me/useUpdateProfile.ts:27` |
| Category | logic |

**What:** `STALE_AFTER_PROFILE_SAVE` lists `['alumni']` and `['posts']`, but the feed's keys are `['feed','posts']` and `['feed','comments',id]` (`features/feed/constants.ts:23`). `['posts']` only matches the profile page's `['posts','user',id]`.
**Why it matters:** After renaming yourself, the feed (author_name on posts and comments) shows the old name until the 30 s stale time passes, if you open it right after saving.
**Recommendation:** Add `['feed']` to the list (it prefix-matches both feed keys), or drop the comment's claim that feed rows are covered.

### CORR-002: Form baseline can come from an older `['me']` than the server holds

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `packages/frontend/src/features/me/ProfileForm.tsx:73` |
| Category | logic |

**What:** The form starts from whatever `['me']` holds on mount (up to 30 s old) and ignores later refetches (ADV-004). Save is a full replace of every shown field.
**Why it matters:** If the same account was edited elsewhere (another tab or device) in that window, an unrelated edit here silently writes the old values back. Narrow; not confirmed by running it.
**Recommendation:** Accept as a known limit, or have MePage call `refetch()` on mount and key the form on `dataUpdatedAt` of the first fetch only (before the user types).

(0 trivials not listed)

## Quality findings

Written by: quality-reviewer (tier: balanced)

**Summary:** Read all 20 non-test files in `features/me`, the 2 new primitives, nav/shell/router/home/authApi edits and the docs; read tests for `useUpdateProfile`, validation and error mapping by name and key assertions. 5 findings: 0 critical, 1 major, 3 minor, 1 convention-gap (minor). Biggest: `useUpdateProfile` invalidates `['posts']`, but the feed's keys are `['feed','posts']` and `['feed','comments',id]`, so a saved rename never refreshes the feed, and the test asserts the same wrong literal.
**Field limits copied a third time:** acceptable for the numbers (the code says they are hand copies, the server message is the backstop). Not acceptable for the helpers: see QUAL-002.

### QUAL-001: Feed cache is not invalidated after a profile save

| Field | Value |
|---|---|
| Severity | major |
| Effort | small |
| File | `packages/frontend/src/features/me/useUpdateProfile.ts:24-26` (test `useUpdateProfile.test.tsx:91`) |
| Category | test-coverage |
| Rule | ADR-09 key layout (`features/feed/constants.ts:23`) |

**What:** `STALE_AFTER_PROFILE_SAVE` lists `['posts']`, which matches only `['posts','user',id]` (profile page). The feed uses `['feed','posts']` and `['feed','comments',postId]`, so feed cards keep the old author name and photo until the 30 s stale time ends. The code comment says feed cards are covered; they are not.
**Why it matters:** The test only checks that `invalidateQueries` was called with the same wrong literal, so it passes while the behaviour is missing.
**Recommendation:** Add `['feed']` to the list (a shared prefix, so one entry covers posts and comments). Assert in the test against a real cache holding a `['feed','posts']` query, not a spy on the literal. (`features/me` cannot import `features/feed/constants` because feed is lazy; a literal `['feed']` is fine.)

### QUAL-002: Validation helpers and a password rule copied from auth

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `features/me/validation.ts:~145-215` vs `features/auth/validation.ts:41-80` |
| Category | duplication |
| Rule | none documented |

**What:** `requiredTextError`, the `Expected graduation year` check and `newPasswordError` now exist twice (me version adds the NUL check and the 10-char year text limit; auth version is the older, weaker copy). `NAME_MAX`, `UNIVERSITY_MAX`, `DEPARTMENT_MAX`, `PASSWORD_*`, `EXPECTED_YEAR_SPAN` are exported from both files.
**Why it matters:** A backend rule change needs edits in three places; the two client copies already differ (auth lacks the NUL check).
**Recommendation:** Do not fix in this REQ. Move the shared field rules to a small module in `features/auth` or `config/` (both lazy-safe) in a follow-up and have both validators import it. See CAND-019.

### QUAL-003: "Focus lost" check and `/login` literal repeated

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `features/me/MePage.tsx:40`, `ProfileForm.tsx:47-50`, `SaveBar.tsx:37`; `useLeaveGuard.ts:6` |
| Category | duplication |
| Rule | none documented |

**What:** The test "active element is null, body, or disconnected" is written four times (also `features/profile/ProfilePage.tsx:42`); `ProfileForm.focusIsLost` already exists as a function but is not exported. `useLeaveGuard` defines its own `LOGIN_PATH = '/login'` beside the literals in `useLogout.ts:14` and `SessionBridge.tsx:51`.
**Why it matters:** The focus rule is a repeated accessibility lesson (LESSON-REQ-008-2); one fix should land everywhere.
**Recommendation:** Add `focusIsLost()` to a shared spot (e.g. `components/ui` util or `config/`), and a `LOGIN_PATH` in `config/`. Small, can wait.

### QUAL-004: `Textarea` is a near line-for-line copy of `Input`

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `components/ui/Textarea/Textarea.tsx` vs `components/ui/Input/Input.tsx` |
| Category | duplication |
| Rule | none |

**What:** Label, helper, error, id and `aria-describedby` wiring is duplicated; only the tag, `rows` and `endAdornment` differ.
**Why it matters:** An accessibility fix to one field will miss the other.
**Recommendation:** Acceptable now (two primitives); extract a shared field wrapper if a third field type arrives.

### QUAL-005: No documented rule for lazy features sharing cache keys or field rules

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/context/conventions.md` (absent) |
| Category | convention-gap |
| Rule | convention-gap |

**What:** ADR-08 stops lazy features importing each other, so cross-feature facts (query-key prefixes, field limits) get copied by hand; QUAL-001 is the cost. No page says where such shared facts should live.
**Why it matters:** Each new lazy feature repeats the choice.
**Recommendation:** Decide whether shared query-key prefixes belong in `config/` (a leaf both may read) and write that down.

**Checked, nothing:** console/debug code, TODO without link, commented-out code, naming (`planSave`, `isDirty`, `guarding` read well), test file location/naming, README/CLAUDE.md updates (match the code), `services/authApi` additions (typed, tested).

## Architecture findings

Written by: architecture-reviewer (tier: balanced)

**Summary:** Read 55 changed code files via the packet, plus `features/auth/guards.tsx`, the feed/profile/directory query keys and backend `validation.ts`. 0 critical, 0 major, 3 minor, 1 trivial. Layering, lazy-route lists (six places), `config/` leaf and import boundaries all hold. Biggest: the cache refresh after Save invalidates `['posts']`, which matches no feed key, so feed cards keep the old author name/photo (ARCH-001).
**Dispatch question (AuthGuard vs MePage skeleton/error):** real but low. `RequireAuth` (guards.tsx:37-58) holds the same `['me']` query, so on first visit the user sees its "Loading…" line and its Retry/Log out Alert; MePage's `loading` and `error` views (MePage.tsx:1524-1565) cannot render in the real tree. The criterion "loading skeleton, and an error state with Retry" is met in behaviour, not in letter (see ARCH-002).

### ARCH-001: Save invalidates `['posts']`, which no query uses

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/me/useUpdateProfile.ts:46,61-63` |
| Category | contract |
| Rule broken | Spec criterion "matching /alumni/:id profile and directory lists are refreshed"; ADR-09 key discipline |

**What:** Feed keys are `['feed','posts']` and `['feed','comments',id]` (`features/feed/constants.ts:23`); the profile's recent posts use `['posts','user',id]`. `['posts']` only reaches the profile's posts. The comment in the hook says "feed and profile cards", which is half true.
**Why it matters:** After a rename or new photo the feed still shows the old author name until it goes stale (30 s) and remounts. Tests that assert on `['posts']` would pass anyway.
**Recommendation:** Invalidate `['feed']` as well (prefix covers posts and comments). Features cannot import each other, so keep a string literal with a comment pointing at `feed/constants.ts`, or move the three shared key roots to `config/`.
**References:** [[architecture/adr-09]], [[architecture/adr-08]] (no static cross-feature import)

### ARCH-002: MePage's loading and error branches are unreachable behind RequireAuth

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/me/MePage.tsx:1524-1565`, `features/auth/guards.tsx:37-58` |
| Category | separation |
| Rule broken | ADR-03 / guards pattern (one owner for `['me']` load state) |

**What:** `RequireAuth` already owns pending and error for `['me']` and only renders `<Outlet/>` with data, so `MePage`'s skeleton, Retry Alert and `MeSkeleton` are dead code outside tests. Worse, MePage's claim "the form stays even if a background refetch fails" is false: a failed refetch with cached data sets `isError`, and the guard then replaces the whole page with its Alert, unmounting the form and losing unsaved edits (guards.tsx:41).
**Why it matters:** Two owners for one state, with comments describing behaviour that the guard overrides; edge-case data loss on a transient refetch failure (e.g. reconnect).
**Recommendation:** Pick one owner. Either (a) change the guard to show its error only when `currentUser.data === undefined` (small, benefits every page, fixes the data-loss edge) and keep MePage's views as a defensive fallback, or (b) delete MePage's loading/error views and the spec's skeleton line. Needs a spec decision (the user chooses); the first-visit skeleton is only possible by option (a) plus a route-level skeleton, which the guard's `Loading…` currently blocks.
**References:** [[architecture/adr-03]], `features/auth/guards.tsx:25-62`

### ARCH-003: ProfileForm is a 317-line orchestrator holding eight pieces of state

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `packages/frontend/src/features/me/ProfileForm.tsx:1832-2077` |
| Category | separation |
| Rule broken | ADR-04 (controlled form; split once it grows) |

**What:** One component owns values, baseline, saved profile, password, field errors, two form errors, toast, leave prompt and the whole save-result handling (`applyResult`, 40 lines with `flushSync` and focus). Sections are cleanly split; the state machine is not.
**Why it matters:** The next field or save step lands in this one function; the mutation, toast and prompt could not be tested without rendering everything.
**Recommendation:** Extract a `useProfileFormState` hook (values, baseline, password, errors, `bind`, discard) and keep toast plus `applyResult` in a second hook; ProfileForm becomes layout. Not urgent for this REQ.
**References:** [[architecture/adr-04]], `features/auth/RegisterPage` pattern

### ARCH-004: `--tab-bar-height` is a hand-summed copy of BottomTabs' size (trivial)

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/frontend/src/app/AppShell/AppShell.module.css:259-264` |
| Category | pattern |
| Rule broken | LESSON-REQ-007-1 |

**What:** The var is a calc mirroring BottomTabs' padding, used as its `min-block-size`; a wrapped label makes the bar taller than the var, so the SaveBar can sit under it. The comment admits this.
**Recommendation:** Accept; if it bites, measure with a `ResizeObserver` in `BottomTabs` and set the var from there.
**References:** [[lessons/LESSON-REQ-007-1-sticky-bottom-bar-needs-scroll-padding]]

## Reflection findings

Written by: reflector (tier: balanced)

**Summary:** Checked 42 lessons (0 superseded), 35 gotchas, 9 accepted ADRs, 5 concept pages, 2 component pages, no Mermaid diagram in touched vault pages. 3 findings: 0 critical, 1 major, 1 minor, 1 trivial; all needs-decision for /wrapup. Biggest: ADR-04's "re-decide at the first large form" trigger fired here and the REQ recorded "no deviation". Already filed by other reviewers and not repeated: feed cache key (`['posts']` vs `['feed','posts']`, CORR-001/QUAL-001/ARCH-001), the four copies of the focus-lost check (QUAL-003; also LESSON-REQ-008-6 territory), Textarea duplication (QUAL-004). Lessons 006-3 (limit pointer plus pinned values), 002-3, 007-1, 009-4 (six lists) and 008-4 (ban plus test) are followed. Docs likely affected: `NAV_ITEMS` list (Directory and Feed only) and the avatar menu text in several READMEs. Packet-gap: none.

### REFL-001: ADR-04's revisit trigger fired and nothing was decided

| Field | Value |
|---|---|
| Severity | major |
| Effort | small |
| File | `packages/frontend/src/features/me/ProfileForm.tsx` (317 lines), `validation.ts` (347 lines) |
| Category | adr-conflict |
| Vault reference | [[architecture/adr-04-forms-without-a-library]] |

**What:** ADR-04 says "Revisit when a form passes ~8 fields ... likely the My Profile REQ" and "re-decide at the first large form". /me has up to 9 profile fields plus 3 password fields (12) with hand-written touched, dirty and focus logic. The architecture says "Deviation: none" and "no new ADR", and ADR-04 was not touched.
**Why it matters:** The decision was made implicitly. The next form (admin, mentorship) will re-open the question without a recorded answer, and `packages/frontend/README.md:151` and CLAUDE.md still say "revisit".
**Recommendation:** At /wrapup step 3, add a Consequences row to ADR-04 (or a short ADR-10) stating the outcome: stayed on Option 1 for REQ-010, with the reason (backend-mirroring validators, pure `planSave`) and the new trigger (e.g. a second form this size, or ARCH-003's hook split not enough). Then fix the README line 151 and the CLAUDE.md "~8 fields" clause.

### REFL-002: User-facing docs still describe the old nav and header (repo-doc sweep)

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | listed below |
| Category | vault-stale |
| Vault reference | [[knowledge/lessons/LESSON-REQ-009-4-adding-a-lazy-feature-touches-six-lists]], [[knowledge/lessons/LESSON-REQ-002-6-docs-task-lists-every-folder-readme]] |

**What:** The lazy-page counts were all updated, but the nav, menu and endpoint text was not:
- `packages/frontend/README.md:98` Endpoints names only `login`, `register`, `getMe` (missing `updateMyProfile`, `changePassword`); `:121` Header says "Directory and Feed links" and a menu of "name, email, Log out"; the folder map's `components/ui/` list (about line 72) lacks Textarea and Toast; no My Profile section like the Profile and Feed ones; `:151` see REFL-001.
- `src/app/README.md:12` says the avatar menu has "name, email and Log out" and `NAV_ITEMS` holds "Directory and Feed: add Profile and Admin there when built"; Profile (My Profile) is now built.
- `src/features/feed/README.md:17` and `src/features/profile/README.md:14` ban only directory/profile (feed: directory and profile; profile: directory) and do not name `me` (TASK-008 follow-up, confirmed still open).
- `.adlc/knowledge/components/frontend.md:9` intro still says "`MainNav` with a 'Directory' link, user menu" (REQ-009's Feed link was missed too); the REQ-010 sentence further on is correct.
- Root `CLAUDE.md`: checked, current (structure, HTTP, routing, lazy, My Profile bullet).
**Recommendation:** Edit these lines in TASK-008's pass; the sweep belongs to /wrapup step 1. No code change.

### REFL-003: Contrast pairs for the new surfaces are not named in `contrast.test.ts`

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/frontend/src/styles/contrast.test.ts` (unchanged), `components/ui/Toast/Toast.module.css:1` |
| Category | concept-drift |
| Vault reference | [[knowledge/lessons/LESSON-REQ-001-6-contrast-changes-sweep-all-uses]], [[knowledge/gotchas#^g33|G33]] |

**What:** Toast uses `surface-page` text on an `ink-primary` ground and the save bar message uses `accent-strong` on `surface-raised`. Both pairs already exist in the test as other uses (the ratio is the same either way), so they pass, but the comment "see contrast.test.ts" points at rows that do not name the toast or save bar.
**Recommendation:** Add the two `use:` labels to the existing rows so a future token change reads as breaking these surfaces (LESSON-REQ-001-6 asks that pairs be pinned by use).

## UI/UX findings

Written by: ui-reviewer (tier: balanced)

Summary: no browser tool and no Playwright/Puppeteer is installed, so this is the static tier: I read the /me page, SaveBar, LeavePrompt, Toast, nav/menu/Home changes and their CSS against the UI ACs and S5 notes, and did not run the app. No critical or major findings. 3 minor findings. The biggest is that the toast disappears after 4 s with no way to pause it. Everything runtime-only is on the checklist below. Dispatch questions: dirty/pristine bar, double-submit guard (`handleSubmit` returns while pending, Discard disabled while saving), leave-guard states, tokens-only CSS, tab bar vs save bar stacking: checked, nothing.

### UI-001: Success toast auto-closes after 4 s with no pause

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | `/me` after Save |
| Lens | a11y |
| Evidence | static: `features/me/ProfileForm.tsx` (`TOAST_MS`, timer effect) |

**What:** the toast timer runs regardless of hover or keyboard focus on the Dismiss button. **Why it matters:** a slow reader or screen-magnifier user can lose the message; if focus is on Dismiss when the timer fires, focus drops to body. **Recommendation:** pause the timer while the toast is hovered or focused, or after auto-close call the same focus-if-lost step as `onDismiss`. Low priority: the "All sections saved" caption stays as a record.

### UI-002: Toast live region is inserted already holding its text

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | `/me` after Save, screen reader |
| Lens | a11y |
| Evidence | static: `components/ui/Toast/Toast.tsx` (`<p role="status">` rendered with children) |

**What:** many screen readers do not announce a `role="status"` node that appears with its content already in it; they announce changes to an existing one. **Why it matters:** blind users may get no "Profile updated" confirmation. Already on the controller's Open list (VoiceOver). **Recommendation:** verify with VoiceOver and NVDA; if silent, keep an always-mounted empty status region in `ProfileForm` and write the text into it, with the visual Toast aria-hidden.

### UI-003: Leave prompt has no Escape key and is not a dialog

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | `/me`, click a nav link with unsaved changes |
| Lens | interaction-state |
| Evidence | static: `features/me/LeavePrompt.tsx` |

**What:** the prompt replaces the save bar in place (labelled group, focus to "Keep editing"). Escape does nothing, and on a phone the bar sits at the bottom while the clicked link was at the top, so the change may be easy to miss. **Recommendation:** add an Escape handler that calls `onStay`; check on a phone that the swap is noticeable (see checklist).

(No trivials.)

**UI review tier:** static-only — `/me` page, save bar, leave prompt, toast, avatar menu, MainNav, BottomTabs and Home card read from source; 0 screenshots taken (existing controller shots in `ui-evidence/` were not re-verified); 0 critical / 0 major / 3 minor.

### UI/UX round 2

Written by: ui-reviewer (tier: balanced). Static tier again (no browser tool); read Toast.tsx and its CSS, ProfileForm.tsx, LeavePrompt.tsx and the Toast and SaveBar tests.

Summary: UI-001, UI-002 and UI-003 are resolved. 0 critical / 0 major / 0 minor new; 2 trivials below. Escape does not steal from menus: the handler is on the prompt's own group, never calls stopPropagation, and only fires while focus is inside the prompt.

- **UI-001 resolved.** Pause is per toast id (hover and focus), so a toast that unmounts while hovered or focused (no mouseleave/blur fires) cannot freeze the next one. Leaving restarts a fresh 4 s. Dismiss and timer close both go through flushSync plus focus-to-heading if focus was lost (`ProfileForm.tsx`, `closeToast` and the timer effect).
- **UI-002 resolved.** `<p role="status">` is always mounted and empty while closed; an empty region is not announced. Dismiss button and check icon are not rendered while closed, so no stray control in the tab order. The Toast test "keeps an empty status region mounted" covers it.
- **UI-003 resolved.** Escape on either button calls `onStay`, same path as the Keep editing click. Only active while focus is inside the prompt (focus starts there); Escape from a field after the user clicks away is not handled, which is acceptable.
- **Closed look:** `.toast` (fixed, padding, background) is applied only when open, so closed leaves a zero-height outer div and a margin-0 empty `<p>`: no pill, no layout space. Open look is unchanged: same classes, same CSS. Tokens only in `Toast.module.css`; the Dismiss ring (`currentcolor`) and reduced-motion (`animation: none`) are unchanged.

### UI-004: Saving twice in a row does not re-announce or replay the enter animation (trivial)

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| Route / flow | `/me`, second Save while the first toast is still open |
| Lens | a11y |
| Evidence | static: `ProfileForm.tsx` (`key={toast.id}` removed) |

**What:** the toast used to remount per save (`key`); now the same node gets the same text, so a screen reader hears nothing new and the pill does not animate again (the 4 s timer does restart). **Why it matters:** only if the user saves again within 4 s; the first message is still on screen. **Recommendation:** none needed, or clear the toast before the next save starts.

### UI-005: Keyboard users cannot easily reach a toast that pauses on focus (trivial)

**What:** the toast sits after the form in DOM order and focus returns to the heading after Save, so keyboard users rarely land on Dismiss; for them the 4 s timer still applies. The pause-on-focus rule is correct, just rarely triggered. **Recommendation:** none; noted so nobody expects keyboard pause to be common.

**UI review tier (round 2):** static-only: toast, leave prompt, their tests and CSS read; 0 screenshots; 0 critical / 0 major / 0 minor (2 trivials). Add to manual checklist: hover the toast past 4 s (it stays), move away (closes after about 4 s); with a screen reader on, Save and listen for "Profile updated successfully"; with unsaved edits click a nav link, press Escape (stays on /me), and with the header menu open press Escape (menu closes first, prompt untouched).

## UI manual-verification checklist

Use the demo alumni account (see `db/seed/seed_demo_data.sql`); undo any saved change afterwards.

1. `/me` as guest: redirected to `/login`; after login you land back on `/me`.
2. Reload `/me`: skeleton cards show, then the form. Stop the API and reload: error with Retry; restart and press Retry: form appears.
3. Sections are Personal, Education, Career, Password. Log in as student and as admin: student has expected-year rules; admin shows name and university plus Password only.
4. Pristine form: no save bar. Type in any field: bar shows "You have unsaved changes". Type the old value back: bar goes. Discard restores values.
5. Clear Full name, press Save: inline error, focus on the field, no request in the Network tab. Try year 1800 and a LinkedIn URL without http.
6. Save a valid change: bar shows "Saving…" with both buttons inert; click Save twice quickly: one PUT only. Then toast "Profile updated successfully", bar gone, caption "All sections saved".
7. Toast at desktop width (not yet shot): top-right, readable in light and dark, Dismiss works by keyboard, auto-closes after about 4 s.
8. Wrong current password: error on that field, profile change stays saved, no success toast for the password.
9. Dirty form: click Directory in the nav, press browser Back, reload and close tab. In-app link and Back show the leave prompt (Keep editing focused, Leave works); reload and close show the browser prompt. Clean form: none of these ask. Click "My Profile" in nav while dirty: no prompt.
10. 360 px wide, light and dark: no horizontal scroll, "< My Profile" bar shows, the h1 is hidden, save bar sits just above the tab bar, last field scrolls clear, tab bar has 3 tabs without wrapping.
11. 200% zoom at 1440 and at 360 px: single column, save bar and toast do not cover the focused field; also a short landscape phone height (about 360 px tall) where header, bar and tab bar compete for space.
12. Theme System (switch OS appearance live) and Light/Dark: toast, save bar message (accent text) and field errors are readable.
13. Avatar menu: shows View profile (alumni only, not student/admin), My Profile, then Log out; keyboard arrows and Escape work. Nav and tab "My Profile" show as current on `/me`; Home has the new card.
14. After saving the name, open `/alumni/<id>` and the directory: new data shows without reload.
15. Console stays free of errors during all of the above.

## Correctness findings — round 2

M1 (CORR-001) is resolved. `STALE_AFTER_PROFILE_SAVE` now includes `['feed']`, which prefix-matches `['feed','posts']` and `['feed','comments',id]` (checked against `features/feed/constants.ts`). The test seeds all five keys with active `QueryObserver`s and checks real refetch counts, not spy calls. The toast and Escape changes add no stale timers, double closes, focus loops or leaked listeners. The timer effect clears on unmount and on every `toast` or `toastPaused` change. Hover and focus are tracked by toast id, so a stale id cannot pause a later toast. The Escape handler is a plain React `onKeyDown`, so nothing is registered or leaked. Two minor findings follow.

### CORR-R2-001 [minor] Auto-close takes focus from the page body and scrolls to the top
- `ProfileForm.tsx`, timer callback: `if (focusIsLost()) headingRef.current?.focus()`.
- `focusIsLost()` is true when `activeElement` is `document.body`. After the save the user may click plain text, or scroll down to read and click a blank area. When the timer fires 4 s later, focus jumps to the h1 and the page scrolls to the top.
- Dismiss is user-initiated, so that case is fine. The auto-close case only needs to restore focus when focus was inside the toast, and the pause-on-focus rule means that never happens at timer time. A cheaper rule: on timer close, skip the focus move, or `focus({ preventScroll: true })`.

### CORR-R2-002 [nit] A second identical toast is not announced, and a hover can go unpaused
- `key={toast.id}` was removed. If a second save succeeds while the first toast is still up, the status text is unchanged ("Password changed successfully" twice), so the DOM does not change and the screen reader says nothing. The timer does restart, because `toast` changes.
- If the pointer is over the toast when it is replaced, `hoveredToast` still holds the old id and no new `mouseenter` fires, so the new toast is not paused until the pointer leaves and re-enters.
- Both are rare (a second save while a toast is open or hovered). Accept, or clear the text for one frame before writing the new one.

### Note (not a defect)
- Invalidating `['feed']` from `/me` could, in theory, refetch over an optimistic feed write still in flight from before the user navigated. The feed's own "last mutation on that key" guard does not cover this. It is a very narrow window, and a refetch returns server truth anyway.
