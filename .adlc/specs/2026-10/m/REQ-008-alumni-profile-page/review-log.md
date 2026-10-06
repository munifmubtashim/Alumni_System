
## Architecture findings

Written by: architecture-reviewer (tier: balanced)

**Summary:** Checked 73 files: import boundaries (profile non-test code imports only ui, config, services, shared; no app/auth/store), lazy rule per feature (ESLint blocks + lazyRoutes test), route placement (`alumni/:id` is a child of the RequireAuth/AppShell branch), services layer, config leaf. 0 critical, 0 major, 2 minor. Biggest: `config/directoryReturn.ts` stretches ADR-06 ("constants only") and ADR-06 was not amended.
Dispatch answers: boundaries clean, nothing; ADR-08 per-feature rule correct (own-folder-only exemption, non-overlapping blocks, separate rule name from the layer blocks so they do not clobber each other), nothing; config as home for the handover: acceptable, see ARCH-001; router placement fine; services (`httpErrors.ts` with axios is OK, services may import axios); ESLint change sound.

### ARCH-001: config/ now holds feature-to-feature logic, but ADR-06 still says "constants only"

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/config/directoryReturn.ts:1` |
| Category | pattern |
| Rule broken | ADR-06 (config is a leaf for constants), ADR-08 amendment |

**What:** `directoryReturn.ts` is a validated state contract (type + two functions), not a constant. The config README was widened, and ADR-08 was amended ("meet in config/"), but ADR-06 text was not.
**Why it matters:** Next two lazy features that need to talk will add their own `config/xReturn.ts`; config becomes a grab bag with no written limit.
**Recommendation:** Add a short amendment to ADR-06 saying config may hold pure, React-free cross-feature contracts, or say it needs an ADR decision at the gate. The code placement itself is the right one (the only leaf both lazy features may import).
**References:** [[architecture/adr-06-config-leaf-layer]], [[architecture/adr-08-route-code-splitting-and-url-list-state]]

### ARCH-002: Half of the directory-profile contract is outside config/

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/directory/AlumniCard.tsx:41` |
| Category | separation |
| Rule broken | architecture.md "config/ is the one place that knows the handover" |

**What:** The profile URL is built inline in the card (`/alumni/${id}`) and `DIRECTORY_PATH` is exported from config, yet `app/AppShell/navItems.tsx:17` and `features/home/HomePage.tsx:18` still hardcode `'/directory'`.
**Why it matters:** A path change needs edits in several places; the "one place" claim holds only for the state shape.
**Recommendation:** Either export a `profilePath(id)` next to `directoryReturnState` and use `DIRECTORY_PATH` in the two other call sites, or drop the "one place" wording. Low urgency.
**References:** [[architecture/adr-06-config-leaf-layer]]

### Round 2 (re-review)

**Summary:** ARCH-002 closed. `profilePath(id)` and `DIRECTORY_PATH` live in `config/directoryReturn.ts`; AlumniCard, navItems and HomePage use them; no hardcoded `/directory` or `/alumni/<id>` URL left in non-test source (only router patterns and the API path in services). `config/` still has zero imports (leaf). New imports (app/AppShell/navItems, features/home, features/directory to config) are all allowed. 0 new findings. ARCH-001 left as your-call, out of scope.

## Correctness findings

Written by: correctness-reviewer (tier: balanced)

**Summary:** Checked about 20 source files (profile feature, directoryReturn, alumniApi, router, ESLint and lazy test guard) against the spec, plus the backend controllers and `requireId`. 0 critical, 0 major, 2 minor. Biggest: a failed background refetch swaps a cached, working profile for the error page (CORR-001).
- Back-link handover: checked, nothing (only `''` or `?…` without `#` accepted; tampered state falls back to plain `/directory`).
- safeLinkedInUrl: checked, nothing (scheme-less values give no link by design; `javascript:`/`data:` rejected; React escapes caption/experience; `photo_url` only goes into `<img src>`).
- relativeTime: checked, nothing (future dates read "just now", invalid gives empty, 5-week cutoff matches doc).
- Dependent posts query: checked, nothing (`skipToken` until the profile loads; key per `user_id`; API sorts `created_at DESC`; `comment_count` is an int column).
- Id change / 401 / lazy guard: checked, nothing (new key means pending/skeleton; 4xx not retried so 401 reaches the ADR-03 handler; one ESLint block per region and the test covers cross-feature imports).

### CORR-001: A failed background refetch replaces a cached profile or posts list with the error state

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/profile/ProfilePage.tsx:30` (also `RecentPosts.tsx:35`) |
| Category | error-handling |

**What:** The view checks `isError` without checking for data. In TanStack Query v5 a refetch that fails (after 2 retries) keeps the old `data` but sets `status` to `error`, so `isError` is true.
**Why it matters:** Revisit a profile after the 30 s `staleTime` (`app/queryClient.ts`) while the API is down or flaky: the user sees "Couldn't load this profile" instead of the profile they already have. Same for the posts list.
**Recommendation:** In `ProfilePage`, set `view = 'error'` only when `profile.data === undefined` (and in `RecentPosts` test `posts.isError && posts.data === undefined`). A 404 on refetch should still show not-found, so keep that branch unconditional.

### CORR-002: Focus effect pulls focus back to the h1 after the user has moved on

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/profile/ProfilePage.tsx:35` |
| Category | logic |

**What:** The effect focuses the current h1 on every change of `[id, view]`, with no check of where focus is now.
**Why it matters:** The page mounts in "loading". If a keyboard user tabs to "Back to directory" while it loads, focus jumps to the h1 when the profile arrives, losing their place (and a Retry press that succeeds moves focus the same way).
**Recommendation:** Only move focus if `document.activeElement` is `document.body` or inside the unmounting state (for example, a ref check that the active element is not the BackLink), or limit it to the first arrival.

(0 trivials not listed)

### Round 2 (re-review)

**Summary:** CORR-001 and CORR-002 are closed. Traced 404-on-refetch, id change, Retry success and failure, stale-data refetch error, and focus on the Back link, a removed node and the body; ran the profile tests (91 pass). 0 new findings.
- CORR-001 (resolved): `ProfilePage.tsx:37-38` and `RecentPosts.tsx:44` keep cached data on a failed refetch; a 404 still wins and shows not-found (right, the person is gone). A new id has no placeholder, so it shows loading, never the old person.
- CORR-002 (resolved): focus moves only from the body or a removed node, so Back-link focus survives and a successful Retry (button unmounted) still lands on the h1.
- Known trade-off, not a finding: a keyboard user who tabbed to Back during loading gets no h1 focus when the profile arrives. That is the intended price of the fix.

## Quality findings

Written by: quality-reviewer (tier: balanced)

**Summary:** Read all 73 files in the packet (about 45 code files, 15 docs). 0 critical, 0 major, 4 minor, 2 trivial. Biggest: the token builder and fake-API helpers are now copied into 8 test files (QUAL-001). CSS is tokens-only (px appear only in comments), no hex, no dead debug code, README claims match the code, AC15 test list is fully covered. Dispatch hints: `present()` duplicated (QUAL-002); initials not duplicated (Avatar owns `initialsOf`); skeletons are shaped per page, not duplicated; token builder (QUAL-001); README accuracy checked, nothing; CSS tokens checked, nothing; dead code (QUAL-005).

### QUAL-001: Token builder and fake-API helpers copied into 8 test files (G26)

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `packages/frontend/src/features/profile/ProfilePage.test.tsx:23-37,63-95` |
| Category | duplication |
| Rule | gotchas G26 (do not copy the builder); `src/test/README.md` |

**What:** `base64url`/`makeToken` now exist in 8 files (AppShell, LoginPage, session, RegisterPage, guards, DirectoryPage, ProfilePage, plus authToken tests). `ok`/`fail`/`Responder` also repeat in ProfilePage, RecentPosts, DirectoryPage, AppShell, session tests. The comment names the follow-up "QUAL-002" but no task holds it.
**Why it matters:** each new page test adds another copy; a JWT-shape change needs 8 edits.
**Recommendation:** add `src/test/fakeApi.ts` (`makeToken`, `ok`, `fail`, `held`) and move the files over in one cleanup REQ. Do not start it inside REQ-008. Record the follow-up in the vault, not only in a code comment.

### QUAL-002: `present()` is defined twice

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/profile/format.ts:4` |
| Category | duplication |
| Rule | none documented (convention-gap) |

**What:** Same function, same body as `features/directory/AlumniCard.tsx:13`. The profile cannot import directory (ADR-08), so it copied it.
**Why it matters:** the two lazy features cannot share it by import; a fix to one (say, handling non-strings) silently misses the other.
**Recommendation:** move `present` to a leaf both may import (new `src/config/text.ts` or `src/utils/`), delete both copies. Needs a decision on where pure helpers live; ADR-06 only names `config/` for constants and contracts. See CAND-020.

### QUAL-003: Error-plus-Retry block and its CSS copied three times

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/profile/RecentPosts.module.css:36-46` |
| Category | duplication |
| Rule | none |

**What:** `.error` (column, gap-3) and `.retry` (`padding: space-2 space-4`) match `features/directory/DirectoryStates.module.css:53-62`, and `ProfileStates.module.css` `.message`/`.retry`. The JSX (Alert + `Button loading={isFetching}` + refetch) repeats too (`RecentPosts.tsx`, `ProfileStates.tsx`).
**Why it matters:** the Retry look will drift between pages.
**Recommendation:** when a third page needs it, extract a `components/ui/RetryAlert` (props: title, children, onRetry, retrying). Not worth blocking this REQ.

### QUAL-004: `/directory` still hard-coded in two places beside `DIRECTORY_PATH`

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/app/AppShell/navItems.tsx:17`, `features/home/HomePage.tsx:18` |
| Category | naming |
| Rule | none |

**What:** `config/directoryReturn.ts:11` adds `DIRECTORY_PATH`, but the nav and Home quick link still use the literal.
**Why it matters:** a renamed route needs edits in three places and only one is named as the owner.
**Recommendation:** either use `DIRECTORY_PATH` in those two files (config is importable from both), or stop exporting it and keep the literal private. Same for `/alumni/` in `AlumniCard.tsx`.

### QUAL-005: `Timeline` supports many entries, but the app only ever passes one

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/frontend/src/features/profile/Timeline.tsx:35-41` |
| Category | dead-code |
| Rule | none |

**What:** The connecting `.line`, `lastIndex` logic and the `.item:not(:last-child)` CSS never run in production: Education and Employment each pass one item. They are tested, so they look alive.
**Why it matters:** about 30 lines of CSS/JS carrying behaviour no screen shows. Acceptable as a deliberate hook for job history; just say so.
**Recommendation:** keep, but add one line to the `Timeline` doc comment: "multi-entry support is for the future job-history REQ".

### QUAL-006: `PostCard` has no test file of its own

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/frontend/src/features/profile/PostCard.tsx:1` |
| Category | test-coverage |
| Rule | conventions: co-located `*.test.tsx` |

**What:** Every other component has a sibling test; `PostCard` is covered only through `RecentPosts.test.tsx` (time element, missing date, caption, plural). Coverage is complete, only the file layout differs.
**Recommendation:** none required; optionally move the four PostCard cases into `PostCard.test.tsx` so the injectable `now` prop is tested directly (nothing passes `now` today, so that prop is unused outside its own signature).

### Round 2 (re-review)

Written by: quality-reviewer (tier: balanced)

**Summary:** checked 13 changed frontend files. QUAL-004 is closed. 1 new trivial finding, nothing minor or above. Tests, README text and CSS tokens (no hex, no raw px) look right. QUAL-001..003, 005, 006 not re-examined (your call).

**QUAL-004 closed.** A grep of non-test source finds `'/directory'` and `/alumni/` literals only in `config/directoryReturn.ts` (the owner), plus `services/alumniApi.ts:43` (an API URL, a different thing, correctly separate) and doc comments. `navItems.tsx`, `HomePage.tsx` and `AlumniCard.tsx` now import from config. The three `profilePath` tests cover number, string and an encoded odd id. The config README matches the code.

### QUAL-007: `profilePath` lives in a file named `directoryReturn`

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `packages/frontend/src/config/directoryReturn.ts:14` |
| Category | naming |
| Rule | none |

**What:** `profilePath` and `DIRECTORY_PATH` are plain route paths, but sit in a file named for the back-link handover. The README does say so.
**Recommendation:** none now. If a third route path appears, move the paths to `config/paths.ts` and keep `directoryReturn.ts` for the state helpers. The new background-refetch tests also hard-code query keys (`['alumni','profile','7']`, `['posts','user',7]`); exporting the key builders would stop them going stale silently (trivial, same note).

Written by: reflector (tier: balanced)

**Summary.** Checked 31 lessons (0 superseded), 23 gotchas, 8 ADRs (accepted), 3 concept pages, 2 component pages and the user-facing docs. 4 findings: 0 critical, 0 major, 4 minor. No repeated mistake, no gotcha ignored, no ADR conflict. Biggest: `knowledge/components/frontend.md` was not updated for the profile feature (needs-decision, goes to /wrapup step 3). Dispatch questions: the eight touched docs (CLAUDE.md Frontend section, `packages/frontend/README.md`, app/features/services/config/ui READMEs, ADR-08, route-layout) were swept and are correct except as listed below; G14 (404 for bad id) is respected (`ProfilePage.tsx:405`); L-REQ-006-1 and L-REQ-006-2 are respected (`BackLink.tsx`, `ProfilePage.tsx:408`). Docs likely affected, for /wrapup: `packages/frontend/README.md` has a "Directory (REQ-006)" section but no profile section; `.adlc/index.md` has no REQ-008 row.

### REFL-001: Frontend component page does not know the profile feature

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/knowledge/components/frontend.md:9,13,15,41` |
| Category | vault-stale |
| Vault reference | [[knowledge/components/frontend]] |

**What:** The page lists only `directory/` under features, says the router has one lazy route (the `directory` one), and has no REQ-008 line.
**Why it matters:** It is the page a later REQ reads first for "what exists"; it will also miss `config/directoryReturn`, `services/httpErrors` and Avatar `lg`.
**Recommendation:** At /wrapup step 3, add `profile/` (page, header, sections, `RecentPosts`, `format.ts`, `relativeTime.ts`, no `index.ts`), the `PROFILE_ROUTE`, `directoryReturn.ts`, `httpErrors.ts`, and a `[[REQ-008]]` line. Needs-decision, not a fix round.

### REFL-002: ADR-06 and the CLAUDE.md `config/` line still say "constants only"

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/architecture/adr-06-config-leaf-layer.md` (Decision, Consequences); `CLAUDE.md:85`; `packages/frontend/README.md:60` |
| Category | concept-drift |
| Vault reference | [[architecture/adr-06-config-leaf-layer]] |

**What:** `config/directoryReturn.ts` is a cross-feature contract (it owns a router-state key and validates it on read), not a constant. Only `config/README.md` and the ADR-08 amendment say so.
**Why it matters:** ADR-06 is the rule people check before adding to `config/`; CLAUDE.md and the README list only `brand.ts`, so the next contract between two lazy features may be put elsewhere or re-derived.
**Recommendation:** Add one line to ADR-06 Consequences ("also holds small pure contracts between features that may not import each other, e.g. `directoryReturn.ts`") and name `directoryReturn.ts` in the two structure lines. Wrapup decision.

### REFL-003: `present()` and the job-line logic now exist twice

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/profile/format.ts:3`, `packages/frontend/src/features/directory/AlumniCard.tsx:17,23` |
| Category | re-derivation |
| Vault reference | [[knowledge/components/frontend]] (no page names a shared text helper); ADR-08 amendment (lazy features cannot import each other) |

**What:** The profile copied the "trimmed or undefined" helper and the "join the parts that exist" idea from the directory card.
**Why it matters:** The two lazy features may not import each other, so each REQ will copy it again (feed next). A change to what counts as blank would then have to be made in several places.
**Recommendation:** Either move `present` to a small shared home reachable by both (for example `config/` as a pure helper, per its README) and import it in both, or record in the profile README that the duplicate is deliberate. The same applies to `jobLine` vs `employmentTitle` only if a third user appears.

### REFL-004: Loading status nested in `aria-busy` is fixed in one place, left in another

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/profile/RecentPosts.tsx:578` vs `ProfileStates.tsx:486` |
| Category | concept-drift |
| Vault reference | CAND-009 (not yet a lesson); [[knowledge/lessons/LESSON-REQ-006-2-list-skeletons-strand-focus]] (same loading-state family) |

**What:** `ProfileSkeleton` keeps `aria-busy` on the decorative skeleton only; `RecentPosts` wraps its `role="status"` line inside an `aria-busy="true"` div.
**Why it matters:** Two loading patterns in one feature; some screen readers hold live-region updates inside a busy subtree, so "Loading posts…" may not be announced. Correctness-reviewer may also raise it; cross-reference, not a new rule.
**Recommendation:** Move `aria-busy` onto the inner `<div className={styles.list}>` (as `ProfileSkeleton` does) and keep the status paragraph outside it.

### Round 2 (re-review)

Written by: reflector (tier: balanced). Re-read the round-2 diff (m1-m6) against lessons, gotchas, ADRs and the config/README claim. 0 new findings.
- REFL-004 closed: `RecentPosts.tsx` now keeps the `role="status"` line outside the `aria-busy` list, as `ProfileSkeleton` does; the test asserts it is not contained in the busy node.
- config/README: the new text matches `directoryReturn.ts` (`DIRECTORY_PATH`, `profilePath` with `encodeURIComponent`). No other non-test file in `src/` builds `/directory` or `/alumni/<id>` by hand (`alumniApi.ts:43` is the API path, a different thing). `navItems.tsx` and `HomePage.tsx` import `config/`, a leaf, so ADR-06 and the import rules hold.
- G14 (bad id is 404) still holds: only 404 replaces a shown profile. L-REQ-006-2 holds and is sharpened: the focus guard (`ProfilePage.tsx`, body or disconnected node only) still covers a clicked card and a succeeded Retry. G18 respected (label still clipped, not `display:none`).
- Only one new vault gap: CAND-028 below. CAND-021-ish (isError with data) is already covered by the existing candidate.

## UI/UX findings

Written by: ui-reviewer (tier: balanced)

**Summary.** Ran the app in headless Brave driven over the DevTools protocol (no Playwright installed). Checked `/alumni/8`, `/7`, `/abc`, `/99999`, desktop and phone, light and dark, plus loading, 500, 401, posts-error, Retry, id switch, Back link, keyboard, 320/360px. 0 critical, 0 major, 2 minor, 1 trivial. AC4-AC12 and AC14 hold. The "deliberate" S3 differences I re-checked (accent colour, radius, name/heading type tokens, shell parts, omitted data) all sit in the classes AC12 allows. The biggest item is the narrow posts-error box (UI-001).

### UI-001: Posts-error alert is narrower than the post cards, Retry sits outside it

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | `/alumni/8`, posts request returns 500 |
| Lens | design-match / consistency |
| Evidence | `ui-evidence/profile8-posts-error.png` |

**What:** the "Posts didn't load" alert is ~593px wide while the 860px post cards span the full column, and the Retry button hangs below the alert, not inside it.
**Why it matters:** the section changes width between states and Retry looks detached. Not an AC break (AC9 asks for message + Retry, rest of profile kept; verified).
**Recommendation:** make the alert fill the column (width 100%) in `RecentPosts.module.css`, or put Retry inside the alert.

### UI-002: Phone back control is a 28px arrow; "Profile" beside it is not part of the link

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | `/alumni/*` at 390px |
| Lens | a11y / interaction-state |
| Evidence | `ui-evidence/phone-light-abc.png`; measured link box 28x28 |

**What:** `BackLink.tsx` makes only the chevron the link (28x28); the visible "Profile" title is an aria-hidden span outside it, so tapping the word does nothing. On the not-found page this arrow is the only way back.
**Why it matters:** small touch target (meets WCAG 2.2 AA 24px, misses the usual 44px); the label looks tappable and is not.
**Recommendation:** put the "Profile" span inside the link (keep the accessible name "Back to directory"), or pad the link to a 44px box.

### UI-003: Loading state's page title and h1 are generic (trivial)

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| Route / flow | `/alumni/8` while loading |
| Lens | a11y |
| Evidence | `ui-evidence/profile8-loading.png`; title "Profile · Alma", status "Loading profile…" |

**What:** during load the title is "Profile · Alma" and then becomes the person's name; this is correct behaviour and the status region is polite. Only noting that AC14 "title names the person" holds once loaded (verified for 8 and 7). No action needed.

### Checked, nothing found
- AC4: LinkedIn `target=_blank`, `rel="noopener noreferrer"`, hidden "(opens in a new tab)"; one h1; headline has no stray separators.
- AC10: from `/directory?q=a&graduationYear=2015` the Back link returned to the same URL; direct visit gives plain `/directory`.
- AC11: `/abc` and `/99999` show "Profile not found" (404s only in the network log, no console errors); 500 shows alert + Retry, Retry recovers; 401 logs out to `/login`; switching 8 to 7 shows loading then the new person, never stale data.
- AC14: 360px and 320px no horizontal scroll; 640px (200% of 1280) none. At 180px only the shell header overflows (not this page). Phone bottom padding clears the tab bar (content ends 20px above it).
- S3 compare: layout, spacing, hierarchy match for supported data in all four variants; `s3-comparison.md` differences are all inside the AC12 classes. The unresolved line-box +4px per heading (stylelint `normal`) is a project-rule decision, agreed as not blocking.

**UI review tier:** headless (Brave via CDP, no Playwright) — profile 8/7/abc/99999, directory-to-profile-to-back, 6 failure/loading modes, 4 viewports x themes; 22 screenshots in `ui-evidence/`; 0 critical / 0 major / 2 minor (+1 trivial note).

### Round 2 (re-review)

Written by: ui-reviewer (tier: balanced)

**Summary.** Re-ran the running app (headless Brave, own API on 3100 and Vite on 5174, both stopped). UI-001, UI-002 and the loading-status part of REFL-004 are resolved; 0 new findings. Checked phone/desktop/767/768 widths, light and dark, not-found page, posts-500 plus Retry at 390 and 1400, and the posts loading state. S3 numbers hold.

- **UI-001 resolved.** Posts-error alert is now the full column width (358px at 390, 860px at 1400, same as the section), Retry sits under it at the start edge, both themes, no horizontal scroll. Retry recovers the list. Evidence: `ui-evidence/round2-posts-error-{phone,desk}-{light,dark}.png`.
- **UI-002 resolved.** At 390px the link box is 82x30 and holds the chevron and the "Profile" word. A real mouse click on the word went to `/directory?q=a&graduationYear=2015` (search restored). On `/alumni/abc` the same click returned to `/directory`. Accessible name is still "Back to directory" (the word is aria-hidden). Evidence: `round2-phone-notfound-light.png`, `round2-profile8-phone-{light,dark}.png`.
- **Desktop back link unchanged.** At 1400 and 768: chevron plus "Back to directory", 126x16 at x=270 (1400) and x=32 (768), 14px, "Profile" is not shown. At 767 the phone layout applies. Same in dark.
- **S3 numbers.** Back link height 16px and avatar top 141px on desktop, as in `s3-comparison.md` rows 2 and 3. Phone avatar top 143px (shell plus a 30px link row; as before).
- **REFL-004 (RecentPosts half) resolved.** The "Loading posts…" `role=status` line is no longer inside an `aria-busy` ancestor; only the skeleton list carries `aria-busy`. After the request finishes, no `aria-busy` remains and the posts show.
- **Console:** no errors; only the injected 500s and the expected 404 for `/alumni/abc` appear in the network log.

**UI review tier:** headless (Brave via CDP) — profile 8 and abc, 4 widths x 2 themes, posts error and loading; 15 round-2 screenshots; 0 critical / 0 major / 0 minor.
