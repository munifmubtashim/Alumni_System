# REQ-009-post-feed-page — Review log

Full reviewer narratives. The consolidated verdict lives in `verification.md` — read that first; come here for the long form behind a finding ID.

## Correctness findings

Written by: correctness-reviewer (tier: balanced)

Summary: read the backend diff (controller, route, manager, 2 queries), `useFeedMutations.ts`, `cacheEdits.ts`, `usePosts.ts`, `postsApi.ts`, `feedFormat.ts` and the pending-guards in PostCard/CommentThread. 3 findings: 0 critical, 0 major, 3 minor. Biggest: overlapping edits of one item restore a snapshot, so a failed first edit can overwrite a newer one until the refetch. No packet gap.
- PUT /api/comments/:id auth + CTE SQL: checked, nothing (404, then owner-or-admin, then validation; one statement; `updated_at` exists; I did not run it, see REFL-001).
- author_alumni_id subqueries: checked, nothing (scalar MIN, same row as `findAlumniByUserId`, no duplicate rows).
- ADR-09: isMutating `=== 1` is right because onSettled runs before the mutation leaves pending; the last mutation always refetches. Skip-rollback on lost token: checked, nothing. Negative ids: edit, delete, reply and thread toggle are all disabled while `id < 0`; nothing sends a negative id.
- Offset paging from raw `fetched`: checked, nothing (a shifted page can repeat a post, `feedPosts` dedupes; deletes by others can skip one until reload, accepted).
- XSS: checked, nothing (no `dangerouslySetInnerHTML`; text via React; profile link built only from a numeric id).
- 404-as-success deletes: checked, nothing (a stale optimistic count is repaired by the settle refetch).

### CORR-001: Failed edit restores a snapshot and can undo a newer overlapping edit

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `features/feed/useFeedMutations.ts:3301-3313` (post), `:3425-3436` (comment) |
| Category | concurrency |

**What:** `useUpdatePost` / `useUpdateComment` save `before` (caption/content) in `onMutate` and `onError` writes it back; ADR-09 promises inverse edits, not snapshots, for exactly this overlap.
**Why it matters:** Edit 1 (A to B) is still running, edit 2 (B to C) starts, then edit 1 fails: the card shows the original text (not C) until edit 2 finishes or the refetch lands. If edit 2 also fails, it restores B, a text that never saved. Self-heals on settle.
**Recommendation:** In `onError`, restore `before` only if the cached caption/content still equals what this mutation wrote (`vars.caption.trim()` / `vars.content`); otherwise leave it for the refetch. Or disable Save on an item while its own update is pending.

### CORR-002: Deleting a comment with a still-pending reply double-counts on rollback paths

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `features/feed/useFeedMutations.ts:3465-3482` |
| Category | logic |

**What:** `commentWithReplies` counts pending replies (negative id, `parent_id === id`) in `wanted`, but the server only deletes real ones, and the pending reply's own POST then fails with "Comment not found" and its `onError` subtracts 1 again.
**Why it matters:** The post's `comment_count` can read 1 too low for a moment. The last settle refetch corrects it; no data is lost.
**Recommendation:** Exclude `id < 0` rows from `removed` when computing `wanted`, or accept (very narrow window). Cheapest: a one-line filter in `commentWithReplies`'s caller.

### CORR-003: A paused (offline) feed write blocks everyone else's refetch

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `features/feed/useFeedMutations.ts:3219,3226` |
| Category | concurrency |

**What:** `isMutating` counts paused mutations (default `networkMode: 'online'`), so while one write waits for the network, every other write's `onSettled` sees a count above 1 and skips its refetch.
**Why it matters:** Until the paused write resumes, other settled writes keep their optimistic values unverified (a stale count, a missing server field). Rare (needs going offline mid-use) and it heals on resume.
**Recommendation:** Confirm in a test with `onlineManager.setOnline(false)`. If it matters, count only `mutation.state.isPaused === false` via `client.getMutationCache().findAll({ mutationKey, predicate })`; otherwise note it in ADR-09.

(0 trivials not listed.)

## Quality findings

Written by: quality-reviewer (tier: balanced)

Summary: read the packet's backend diff (5 files), feed feature (30 source files, 14 test files by listing), shared helpers, nav, Home, and conventions.md. 6 findings: 0 major, 4 minor, 2 trivial. Biggest: small helpers copied rather than shared (`isoDate`, `serverMessage`, first-name, chat icon, token test helper). No debug code, no untracked TODOs, no convention violation found (tokens-only CSS, import boundaries, file naming all hold). Packet-gap: none.

### QUAL-001: Helpers copied instead of shared (isoDate, serverMessage, first name)

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `features/feed/feedFormat.ts:18`, `features/feed/feedErrors.ts:4` |
| Category | duplication |
| Rule | none documented (see QUAL-005) |

**What:** `isoDate` also lives in `features/profile/PostCard.tsx:14`; `serverMessage` is identical in `features/auth/authErrors.ts:32`; `firstName` in `feedFormat.ts:53` repeats `firstNameOf` in `features/home/HomePage.tsx:32`.
**Why it matters:** Three copies of tiny rules drift (one gets a fix, the others do not). The REQ already moved `relativeTime` to `config/` for this reason.
**Recommendation:** Move `isoDate` next to `relativeTime` in `config/` and use it in profile and feed. Export `serverMessage` from `features/auth` (feed already imports from there) or move it to `services/httpErrors.ts`. Use one `firstName` helper in `config/` for Home and feed.

### QUAL-002: Test token helper copied again; one feed test ignores testKit

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `features/feed/useFeedMutations.test.tsx:23` |
| Category | duplication |
| Rule | none documented |

**What:** `testKit.ts` was written so the feed tests share `base64url`/`signIn`/`fakeApi`, but `useFeedMutations.test.tsx` still carries its own `base64url`, `liveToken`, `Held` and hold-adapter. `base64url` now exists in 10 test files (grep `function base64url`).
**Why it matters:** The feed's one-copy goal is not met, and the app-wide copies are the open QUAL-002 follow-up named in `testKit.ts:5`.
**Recommendation:** Make `useFeedMutations.test.tsx` use `signIn` and `fakeApi().hold` from `testKit`. Then lift `signIn` into `src/test/` and replace the other nine copies (separate task).

### QUAL-003: Chat-bubble SVG path pasted twice

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `features/feed/FeedStates.tsx:92`, `app/AppShell/NavIcons.tsx:30` |
| Category | duplication |

**What:** The same `M21 15a2 2 0 0 1-2 2H7l-4 4V5...` path is in `EmptyFeed` and `ChatBubbleIcon`. `features/` may not import `app/`, so sharing needs a neutral home.
**Why it matters:** Low; an icon restyle must touch two files.
**Recommendation:** Accept, or move the icon to `components/ui/` as an icon primitive if a third use appears.

### QUAL-004: Components and hook without a direct test

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `features/feed/EditBox.tsx`, `features/feed/Byline.tsx`, `features/feed/useComments.ts` |
| Category | test-coverage |
| Rule | `conventions-testing.md` (tests co-located) |

**What:** There is no `EditBox.test.tsx` or `Byline.test.tsx`; they are exercised only through PostCard and CommentThread tests. `EditBox` has its own rules (Save disabled when blank or unchanged, Escape cancels, focus after one frame) and `Timestamp` has the "edited" and invalid-date branches.
**Why it matters:** A change to EditBox is caught only by tests of the callers, which do not name the rule that broke. I did not run the suite; check coverage output before deciding.
**Recommendation:** Add a short `EditBox.test.tsx` (blank, unchanged, trimmed save, Escape, maxLength) and a `Byline.test.tsx` (no alumni id gives plain text, edited marker, bad date gives nothing). Backend: `CommentController.updateComment` is covered only by the 401 route test (`routes.test.ts`); the Manager and Query have their own tests, so this is acceptable.

### QUAL-005: Undocumented rules the feed code now depends on (convention-gap)

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `.adlc/context/conventions-frontend.md` |
| Category | convention-gap |
| Rule | none: not written down |

**What:** Three patterns repeat across REQ-006/008/009 with no written rule: (1) shared pure helpers go in `config/` once two lazy features need them; (2) a feature's test helpers live in `testKit.ts` beside the tests (and are linted as app code); (3) hand copies of backend limits carry a comment naming the source (`constants.ts:2-5`, L-REQ-006-3).
**Why it matters:** Without a rule QUAL-001 cannot be called a violation, and the next feature will copy helpers again.
**Recommendation:** Decide whether to codify (1) and (2). No code change.

### QUAL-006: Unused flexibility and brittle focus lookup

| Field | Value |
|---|---|
| Severity | trivial |
| Effort | small |
| File | `features/feed/useComments.ts:11`, `features/feed/PostCard.tsx:86` |
| Category | naming |

**What:** `useComments(postId, enabled)` is called only with `true` (`CommentThread.tsx:162`); the doc says "fetched only while enabled" but the card mounts the thread only when open, so the flag does nothing. `focusMenu` finds the trigger with `querySelector('button')`, which breaks if another button is added to that div.
**Why it matters:** Small; a misleading parameter and a hidden coupling.
**Recommendation:** Drop `enabled` or note it is for tests. Put a `ref` on the menu trigger (Menu takes `className` only today) or select by `aria-label="Post actions"`.

(0 trivials not listed.)


## Architecture findings

Written by: architecture-reviewer (tier: balanced)

**Summary:** Checked layering on the 4 backend files, import boundaries and lazy rules across 22 feed files plus router/eslint/README, ADR-09 against `useFeedMutations.ts`/`cacheEdits.ts`, and the architecture.md decisions and the TASK-009 correction. 0 critical, 0 major, 3 minor. Biggest: `isoDate` is now copied in profile and feed even though `relativeTime` was moved to `config/` for exactly this reason.
- Layering (route to controller to manager to query): checked, nothing. Owner check is in `CommentManager`, SQL only in `CommentQuery`, route behind `authMiddleware`.
- Lazy rules (ADR-08): checked, nothing. Only `router.tsx:63` imports `features/feed`; `LAZY_FEATURES` and the README list include feed; no other lazy feature is imported.
- ADR-09: checked, followed (exact keys, inverse edits, last-mutation invalidate, live-token guard, negative ids with `clientKey`).
- architecture.md decisions and the correction: reflected (single-statement CTE, 404 on zero rows, owner before validation, `id DESC` tie-break, `author_alumni_id` on posts and comments, shared types updated, no migration).

### ARCH-001: `isoDate` copied between profile and feed

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/feed/feedFormat.ts:18` |
| Category | pattern |
| Rule broken | ADR-08 / features README: lazy features meet only through `config/` |

**What:** `features/profile/PostCard.tsx:11` and `feedFormat.ts:18` each define the same "ISO string or undefined" helper.
**Why it matters:** The two lazy features cannot import each other, so each fix has to be made twice and they will drift.
**Recommendation:** Move `isoDate` next to `relativeTime` in `config/relativeTime.ts` (or a sibling) and import it from both, as was done for `relativeTime`.
**References:** [[architecture/adr-08]], `packages/frontend/src/features/README.md:16`

### ARCH-002: `author_alumni_id` subquery written twice in the DAL

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/backend/src/dal/query/PostQuery.ts:12` and `CommentQuery.ts:8` |
| Category | pattern |
| Rule broken | `dal/` owns SQL; one definition of a join rule |

**What:** The `SELECT MIN(a.id) FROM alumni a WHERE a.user_id = ...` rule appears in two column constants, and a third copy is the "lowest id" rule in `AlumniQuery.findAlumniByUserId:39`.
**Why it matters:** If the "which alumni row" rule changes (for example one profile per user is enforced), three places need the edit; the comments already say they must agree.
**Recommendation:** Export one helper such as `authorAlumniIdSql(userIdColumn)` from `dal/` and use it in both query files. Low priority; fine to leave with the comment.
**References:** `.adlc/context/conventions-api.md`

### ARCH-003: `feedErrors.ts` takes message constants from the auth barrel

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| File | `packages/frontend/src/features/feed/feedErrors.ts:2` |
| Category | separation |
| Rule broken | features README: lazy features meet only through `config/` |

**What:** The feed's error text depends on `@/features/auth` (`UNEXPECTED_MESSAGE`, `UNREACHABLE_MESSAGE`), and `feedErrors.ts` also does its own axios response parsing, which `services/httpErrors.ts` is the home for.
**Why it matters:** It couples the lazy feed chunk to the auth barrel (which also exports `LoginPage`), and a second page needing the same mapping will copy it again.
**Recommendation:** Move the two messages and the status-to-text mapping to `services/httpErrors.ts` (or `config/`), and have auth and feed both import from there.
**References:** `packages/frontend/src/services/httpErrors.ts`, `packages/frontend/src/features/README.md:16`

(0 trivials not listed. No packet gap.)


## Reflection findings

Written by: reflector (tier: balanced)

**Summary:** Checked 38 lessons (0 superseded), 30 gotchas, 9 accepted ADRs, 4 concept pages, 2 component pages, plus the CLAUDE.md and conventions-*.md sweep (these are current: feed, PUT comments, author_alumni_id, ADR-09 all landed). 3 findings: 1 major repeated-mistake, 1 major vault-stale (needs-decision, for /wrapup), 1 minor re-derivation. No ADR conflict; ADR-09 is followed as written (inverse edits, exact keys, isMutating === 1, 401 skip). Biggest: new SQL was never run against a real Postgres. No diagrams drift (route-layout.md tree is covered in REFL-002). Packet-gap: none.

### REFL-001: New SQL (CTE update, alumni-id subquery, id tie-break) never run against a real database

| Field | Value |
|---|---|
| Severity | major |
| Effort | small |
| File | `packages/backend/src/dal/query/CommentQuery.ts:30`, `PostQuery.ts` (`POST_COLUMNS`, `getAllPosts`) |
| Category | repeated-mistake |
| Vault reference | [[knowledge/lessons/LESSON-REQ-005-2-mocked-sql-tests-need-one-real-run]] |

**What:** `CommentQuery.updateComment` (`WITH c AS (UPDATE ... RETURNING *) SELECT ... FROM c JOIN users`), the `(SELECT MIN(a.id) ...)` author column in three queries, and the new `ORDER BY ... posts.id DESC` are tested only by mocked `pool.query`. Neither verification.md nor review-log.md records a psql or live-API run.
**Why it matters:** The lesson (trap) says mocked tests pass on invalid SQL (REQ-005's `ESCAPE` bug). `c.*` inside the CTE joined with `COMMENT_COLUMNS` (`c.*`) is the kind of statement worth one real run; if it fails, every comment edit and every feed load is a 500.
**Recommendation:** Run each new statement once against local Postgres (edit a comment, `GET /api/posts?limit=2&offset=1`, a user with and without an alumni row) and record the result in verification.md before wrapup.

### REFL-002: Vault pages still describe two lazy features and no feed (vault-stale, needs-decision)

| Field | Value |
|---|---|
| Severity | major |
| Effort | small |
| File | `.adlc/knowledge/components/frontend.md`, `components/backend.md`, `concepts/route-layout.md:16,21`, `architecture/adr-08-...md:44`, `architecture/adr-02-...md`, `now.md:21` |
| Category | vault-stale |
| Vault reference | [[knowledge/lessons/LESSON-REQ-004-3-moving-a-component-update-adrs]] · [[knowledge/lessons/LESSON-REQ-001-8-adr-changes-update-claude-conventions]] |

**What:** After this REQ the code is right and these pages lag: frontend.md says "current as of REQ-008" and lists no `features/feed`, `postsApi`, `config/feedPath` or `config/relativeTime`; route-layout.md names only `/directory` and `/alumni/:id` as lazy and draws the route tree without `/feed`; ADR-08's amendment says the profile is "the second lazy page"; backend.md omits `PUT /api/comments/:id` and `author_alumni_id`; ADR-02 consequences do not point to ADR-09 though ADR-09 says it fixes a gap in ADR-02; `detail-page-pattern.md:9` still says the feed "can follow" it (it did not use it); `now.md` says no REQ in flight.
**Recommendation:** At /wrapup step 3, add a REQ-009 amendment to ADR-08 (third lazy page, `FEED_ROUTE`), a one-line "see ADR-09" in ADR-02, add `/feed` to the route-layout tree, and refresh the two component pages and their "Touched by" lists.

### REFL-003: A third copy of the error-plus-Retry block and a feed-local test kit (re-derivation)

| Field | Value |
|---|---|
| Severity | minor |
| Effort | medium |
| File | `features/feed/FeedStates.tsx:77`, `features/feed/testKit.ts` |
| Category | re-derivation |
| Vault reference | [[knowledge/lessons/LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]] |

**What:** The lesson told the next REQ to decide a shared home first. `FeedLoadError` (+ its CSS) copies `ProfileLoadError`, and `testKit.ts` adds a feed-local copy of the fake-login/client helpers still repeated in directory, profile and auth tests. `relativeTime` did move to `config/`, which is the right call, but the rest of the follow-up stays open.
**Recommendation:** Do not block this REQ. At wrapup, record one tracked follow-up task (shared `ErrorRetry` markup or a `src/test/` helper) naming all three features, so the fourth page (My Profile) does not make a fourth copy.

(0 trivials not listed)


## UI/UX findings

Written by: ui-reviewer (tier: balanced)

**Summary.** No browser tool was available (no Chrome MCP, no Playwright), so this is NOT a browser run. I did two things instead: drove the live API on :3000 through the Vite proxy as admin, alumni and student demo accounts, and read the feed components line by line. 0 critical, 0 major, 2 minor. The API contract holds (fields, 401/403/404/400 paths, cascade, cleanup verified: feed back to the 10 seeded posts). Everything that needs eyes is in the manual checklist at the end.
**Dispatch questions.** Admin sees edit/delete on others, student does not: API 403s confirmed, UI gate `permissions.ts` is correct by reading; screen unverified. Author link: `author_alumni_id` null for students (Sara, Tanvir, Nadia, Admin), set for alumni; code renders plain text when null; checked in code and data. Load more: only 10 seeded posts and page size is 20, so it cannot show live; unverified. Keyboard/360px/light/dark: not run.

### UI-001: Touch targets on phones are tiny, and Delete sits next to Edit

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | `/feed` at 360px, comment row actions, post menu, comment toggle |
| Lens | responsive / a11y |
| Evidence | static: `CommentThread.module.css:93` (.action padding 0, font inherit), `PostCard.module.css:59-67` (menu trigger 1rem icon + `--space-1`), `PostCard.module.css:78` (.toggle padding 0) |

**What:** Reply, Edit, Delete are bare text buttons about 16px tall, separated by " · ". The post menu trigger is about 24px. The comment toggle has no padding.
**Why it matters:** On a phone a thumb easily hits Delete instead of Edit, and Delete acts at once (UI-002). Under the 24px WCAG 2.2 minimum for the comment actions.
**Recommendation:** In a `max-width: 48rem` block, give `.action`, `.toggle` and `.menuTrigger` a min block size of ~2rem (or vertical padding) and a bit more gap between actions.

### UI-002: Comment delete is instant, even when it also removes replies

| Field | Value |
|---|---|
| Severity | minor |
| Effort | small |
| Route / flow | `/feed` thread, Delete on a top-level comment that has replies |
| Lens | heuristic (error prevention) |
| Evidence | API: deleting a parent comment returned 200 and the reply was gone (cascade); `CommentThread.tsx:118-125` calls `remove.mutate` with no confirm; `cacheEdits.ts:176` drops replies too |

**What:** Posts with comments ask "Delete this post and its N comments?" first; a comment with replies deletes itself and its replies silently with no undo. Failure rolls back correctly, but success cannot be reversed.
**Why it matters:** Inconsistent with the post flow, and the count drops by more than one with no warning.
**Recommendation:** For a comment that has replies only, reuse the inline confirm ("Delete this comment and its N replies?"). Leave single comments instant if you want it light.

### Checked, nothing found (by reading code and API)
- Composer: Post disabled when blank, text cleared and focus kept on submit, text restored on error, double submit impossible (field clears). EditBox: Save disabled when blank or unchanged, Escape cancels, focus returns to trigger.
- Pending items (negative id) get no menu, no Reply, disabled toggle. Thread 404 shows "This post is no longer available" and refetches the feed.
- API: PUT /api/comments/:id works for owner and admin, 403 for others, 400 empty or over 2000, 404 missing, 401 without token. POST comment returns `author_alumni_id`. Create-post response has no author fields, so the card must take them from `me` (verify on screen that the optimistic and real post show the same name and link).
- Edit failure on a comment shows its alert at the bottom of the thread, not at the row (small; not listed as a finding).

## UI manual-verification checklist (browser not available)
1. `/feed` as arif.chowdhury: post "x", see it at once, then real; author name links to his profile. Menu: Tab to the dots, Enter, arrows, Escape returns focus.
2. Toggle a thread with the keyboard (Enter/Space); add a comment and a reply; count bumps; Reply, Edit, Delete on your own only.
3. Sign in as admin: Edit/Delete on others' posts and comments. As nadia.rahman (student): none on others; her own name is plain text, not a link; Sara/Tanvir likewise.
4. Delete a post with comments: inline confirm, focus lands on Cancel; confirm, focus goes to the "Feed" heading. Delete the test rows afterwards.
5. 360px (iframe harness) light and dark: no horizontal scroll, bottom tab shows Feed, comment actions are tappable (UI-001), 200% zoom.
6. Stop the API and reload: error with Retry; empty-feed state needs an empty DB (see `ui-evidence/app-empty.jpg`).

**UI review tier:** static-only (plus live API checks) — feed API contract and feed components; 0 screenshots; 0 critical / 0 major / 2 minor.

## Correctness re-review (round 2)

Written by: correctness-reviewer (tier: balanced)

Reviewed the 4 uncommitted files against CORR-001/002/003 and UI-001, plus the ADR-09 rules. 0 new findings. CORR-001 resolved, CORR-002 resolved, CORR-003 resolved, UI-001 resolved (CSS side). All CSS values are tokens or calc() of tokens (`--space-1/5/6`, `--text-caption-line`, `--text-label-line` all exist); negative margins offset the larger hit area, so desktop layout is unchanged (mobile-only growth, reset at 48rem).

Answers to the dispatch questions:
- (1) Left-over gap (both overlapping edits fail, first edit's text shows until the refetch): acceptable. The refetch always runs because the last of the overlapping edits to settle sees running count 1. The reverse order (second fails first, then first) ends at the correct original text, and the new test covers the forward order. Only a third running write would delay it, and that write refetches itself.
- (2) CORR-002: no new miscount. A pending reply (negative id) is excluded from `wanted`, so its later failed create takes off the +1 it added. Rollback of the delete restores `count`, which is built from `wanted`, so it stays consistent. Not-loaded thread still counts 1.
- (3) CORR-003: `running()` filters pending and not paused. A lone mutation is still pending and unpaused inside its own onSettled, so it counts 1. Paused writes no longer block refetch. No storm: it is the same `=== 1` gate, so at most one refetch per settle burst. The old "two settle in the same tick both see 2 and skip" case is unchanged by this round (not new, rare, next focus or mount refetch heals it).
- (4) ADR-09 rules: exact keys, the `canRollBack()` live-token skip, and negative-id handling are all intact. Checked, nothing.
- (5) CSS: checked, nothing.

Note (not a finding): with a paused offline write present, another write's refetch can briefly drop the paused write's optimistic row until it resumes and settles. That is the cost of the CORR-003 choice, and the test requires it.
