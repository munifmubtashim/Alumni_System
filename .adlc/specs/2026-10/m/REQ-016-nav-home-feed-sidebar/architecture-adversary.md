# Architecture adversary — REQ-016-nav-home-feed-sidebar

Written by: architecture-adversary (tier: balanced), dispatched sub-agent.

| Field | Value |
|---|---|
| Generated | 2026-10-08 |
| Trigger | ui-surface, large-blast-radius |
| Verdict | found problems |

**Summary:** Checked 6 spec sections (about 30 ACs), 8 tasks, and the real code for routes, SQL, CSS widths, lint boundaries, query keys. 6 findings: 1 critical, 3 major, 2 minor. Biggest: the suggestions ORDER BY puts NULL-department people first in Postgres, so the "department-mates first" ranking is wrong for exactly the users with sparse profiles.

Dispatch questions: route order (`/suggestions` before `/:id`: planned, checked, nothing). Students table (has `department`, no `university`; university is on `users`, so the CTE plan works: checked, nothing). `AlumniListItem` carries job_title, current_company, headline, department, university, photo_url, mentorship_available (via `a.*` + LIST_COLUMNS): checked, nothing. Page widths: see ADV-002. ESLint: `people` is not lazy, so Home and Feed may import it; nothing. `useCurrentUser`/`RequireAuth`: AppShell sits under RequireAuth, `['me']` is loaded, so the Profile tab can read `alumni_id` safely; nothing.

## Findings

### ADV-001: NULL sorts first, so the ranking is inverted for sparse profiles

| Field | Value |
|---|---|
| Severity | critical |
| Confidence | high |
| Lens | failure-mode |
| Where | `architecture.md` §Approach (Backend), `tasks/TASK-002.md` §Approach |

**What:** The plan orders by "same department DESC, same university DESC" and says NULLs "never match". In Postgres `DESC` defaults to `NULLS FIRST`. `a.department` is nullable (migration 003 drops NOT NULL), `users.university` can be empty, and the caller may have no department. Those comparisons yield NULL, not false, so they sort ahead of real matches.
**Break scenario:** Caller is in "CS". Candidate A (CS, true), B (department NULL, NULL), C (Law, false). `ORDER BY (dept match) DESC` gives B, A, C. B, who shares nothing, is suggested before the department-mate. A caller with no department gets pure NULL ordering, which is then just name order.
**Why it holds up:** I tried "the plan uses `=`, which is not true for NULL, so no match". That is true for filtering, not for sorting. The test plan (AlumniQuery tests mock `pool` and regex the SQL text, the existing pattern) cannot catch this, because no real Postgres runs.
**Recommendation:** Specify `COALESCE(lower(a.department) = (SELECT d FROM me), false) DESC` (same for university), or `NULLS LAST`. Add one SQL-text assertion for the COALESCE and say in the task that the ordering was checked once by hand against real Postgres.

### ADV-002: Profile's footer alignment AC is not met by the plan

| Field | Value |
|---|---|
| Severity | major |
| Confidence | high |
| Lens | contradiction |
| Where | spec AC "footer lines up ... Home, Directory, Feed and Profile"; `architecture.md` §Width and footer; `tasks/TASK-004.md` |

**What:** Real caps: Directory `min(100%,72rem)`, Profile `min(100%,53.75rem)` centred (`ProfilePage.module.css:7`), Feed 40rem centred, Home 65rem left-aligned (`HomePage.module.css:16`, not centred), footer today 56.25rem. The architecture sets footer = 72rem and says "narrower pages keep their own caps", which leaves Profile's edges 9rem inside the footer's. TASK-004 only says "if narrower and centred, leave it and note it", which contradicts the AC. Feed becomes 72rem only after TASK-006, but TASK-004's acceptance measures `/feed` at Tier 0, before the grid exists (and TASK-004 lists no Feed CSS file).
**Break scenario:** At 1440px on `/alumni/5`, the profile column is 53.75rem and the footer 72rem. The AC fails; the screenshot sweep finds it late.
**Why it holds up:** I looked for a rule that makes Profile an exception. None exists in the spec; the AC names Profile explicitly.
**Recommendation:** Decide now: either widen Profile to `--page-max` (and say so in the blast radius, Profile is currently "no change"), or amend the AC to exclude Profile with the user's consent. Move the `/feed` measurement to TASK-006/008 and add `FeedPage.module.css` to TASK-004 or drop it from TASK-004's acceptance. Add Home's change from left-aligned 65rem to centred 72rem to the risks (visible layout change).

### ADV-003: Completeness card has no per-role field table

| Field | Value |
|---|---|
| Severity | major |
| Confidence | medium |
| Lens | omission |
| Where | spec A2; `architecture.md` §Home; `tasks/TASK-007.md` §Approach |

**What:** A2 lists photo, headline, job title, company, department, graduation year, bio, then says "students against the fields their account has". `MyProfile` for a student has no headline/job title/company (null/absent) and uses `expected_graduation_year`, not `graduation_year`. Admin with an alumni row, alumni with no row, and "total fields" (the progress denominator) are not defined. The implementer will guess, and `profileCompleteness.test.ts` will encode the guess.
**Break scenario:** Student counts 7 fields, can never fill 3 of them, and sees a permanent card and a bar stuck at 57%, with a next step linking to a form that has no such field.
**Why it holds up:** The test list in TASK-007 names "0 fields, partial, complete, no-profile" but no student case; "has" is not a checkable rule.
**Recommendation:** Add a table to the architecture: fields per kind (alumni: all 7; student: photo, department, expected_graduation_year, bio; neither row: card hidden), denominator = that list, next step = first missing in a fixed order, and the Account-settings field each step names. Add a student test.

### ADV-004: Home's data goes stale against the app's own writes

| Field | Value |
|---|---|
| Severity | major |
| Confidence | medium |
| Lens | hidden-coupling |
| Where | `architecture.md` §Home (keys), `tasks/TASK-005.md`, `tasks/TASK-007.md` |

**What:** Home's latest-posts key `['feed','latest']` is not touched by feed mutations, which use exact keys (`POSTS_QUERY_KEY`, `invalidateQueries({exact:true})`, `useFeedMutations.ts:100`). `['suggestions']` sits outside `ALUMNI_QUERY_ROOT`, so REQ-015's admin invalidation (by that root) misses it. Default stale time is 30s (`queryClient.ts`).
**Break scenario:** A user posts in the Feed, taps Home inside 30s: their post is missing. Or deletes a post: it is still listed with a link. An admin deletes an alumnus: the person stays in Suggested alumni and Mentors for up to 30s, and the row opens "Profile not found". Mentors on `ALUMNI_QUERY_ROOT` is fine; Suggestions is not.
**Why it holds up:** I checked whether Home mounts fresh each visit. It does, but a mount inside stale time shows cache first.
**Recommendation:** Put suggestions under the shared root (`['alumni','suggestions']`) so admin and Account saves reach it. Have feed create/delete settle also invalidate `[FEED_QUERY_ROOT,'latest']` (prefix match, not exact), or give the latest query `staleTime: 0`. Add a test for each.

### ADV-005: "Copy appears nowhere in the repo" is unsatisfiable as written

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | high |
| Lens | testability |
| Where | spec AC Fixes; `tasks/TASK-007.md` |

**What:** `department or field` also lives in four design-bundle files under `docs/design/screens/app/*.dc.html` (generated, hex-coloured, Claude Design output), in archived review packets under `.adlc/specs/_archive/**`, in the `.worktrees/` copy, and in this REQ's own spec and task text. A repo-wide grep can never be clean.
**Why it holds up:** Verified by grep. The design bundle is the reference to follow; archives are history.
**Recommendation:** Reword the AC to "in `packages/` source and tests, and in non-archived `.adlc/context`/docs". State whether `docs/design/**` is edited (suggest: leave, note the divergence in the Home README). Make TASK-007's grep command match that scope.

### ADV-006: Unstated product choices: duplicates and a fixed alphabetical set

| Field | Value |
|---|---|
| Severity | minor |
| Confidence | medium |
| Lens | omission |
| Where | `architecture.md` §Home / Mentors; spec Mentors AC |

**What:** Mentors use the directory default order (name), so every user sees the same first mentors; the suggestions fall back to name order too (ADV-001 aside). Mentors and Suggested alumni are on one Home page with no de-duplication, so the same person can show twice. Also the Risks line "Mentors can show fewer than 4" is wrong: pageSize 5 minus the caller leaves at least 4 when 5 exist.
**Why it holds up:** Spec A4 says "no memory", but does not say duplicates are fine. Likely acceptable, but the implementer must pick.
**Recommendation:** Write down: duplicates across Home sections are accepted (or Suggested drops ids already in Mentors, client-side), and fixed name order is accepted for v1. Correct the Risks sentence.

## Coverage

- **Lenses run:** omission, failure-mode, hidden-coupling, rollback (no schema change, code revert is clean: nothing found), contradiction, testability, ux-consistency.
- **Lenses skipped:** cross-repo (single repo).
- **Acceptance-criteria coverage:** Navigation (5) checked, planned in TASK-003 (the no-profile Profile tab is A1; the Profile-tab current state on `/me` for no-profile users is fine). Suggested alumni API (5) checked: ADV-001. Mentors API (2) checked, TASK-001 covers it. Feed sidebar (4) checked, TASK-006. Home (7) checked: ADV-003, ADV-004; the "reuse feed post data and author line" AC is a documented deviation (ADR-08), acceptable but needs the user's explicit nod at the gate. Fixes (2) checked: ADV-002, ADV-005. Quality (4) checked; screenshot AC mapped to TASK-008.
- (0 trivials not listed.)
