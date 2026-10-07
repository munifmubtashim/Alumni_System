# REQ-009-post-feed-page — Verification

| Field | Value |
|---|---|
| Generated | 2026-10-07 |
| Work path | /Users/munifmubtashim/Alumni_System |
| Isolation | branch |
| Branch | feat/REQ-009-post-feed-page |
| Base | redesign |
| Files changed | 105 (30 are vault files) |
| Commits | 6 on the branch + 1 fix round drafted in `commits-draft.md` (committed after you approve) |
| Review packet | 173KB (over the 120KB target, under the 250KB ceiling; tests and docs were listed, not inlined) |

Full reviewer narratives: `review-log.md` — not loaded by later phases; open on demand.

## Summary

Round 2 (fix round: m1, m2, m3, m11 fixed, correctness re-review: all resolved). Open now: 0 critical, 1 major (needs your call, wrapup), 8 minor, 2 trivial. Reviewed by: correctness (balanced) · quality (balanced) · architecture (balanced) · reflector (balanced) · ui (balanced, static tier + live API checks; no browser was available to that agent).

- M1 (new SQL never run on a real database) is resolved: the UI reviewer's live calls and a check by me ran `PUT /api/comments/:id`, the posts and comments lists, posts-by-user and the `id DESC` tie-break against the real Postgres. `author_alumni_id` came back right (a number, or null for students).
- M2 is a vault-stale finding: needs your call, handled at wrapup.
- Pattern: most minor findings are copies of small helpers (isoDate, error text, test helpers) because lazy features cannot import each other. Same follow-up as LESSON-REQ-008-6.
- The on-screen check was done by me in Chrome before this review (see `ui-evidence/s4-comparison.md`); the UI reviewer's manual checklist (keyboard, admin/student views, Load more) is still open.

## Findings at a glance

| ID | Severity | Finding | Where | Effort | Fix |
|----|----------|---------|-------|--------|-----|
| M1 | major | New SQL not run on real Postgres | PostQuery, CommentQuery | — | resolved (ran live) |
| M2 | major | Vault pages describe the pre-feed state | `.adlc/knowledge/components/*`, ADR-08 text, `now.md` | small | your call (wrapup) |
| m1 | minor | Failed edit restores an old-text snapshot; overlapping edits — resolved, round 2 | small | done |
| m2 | minor | Deleting a comment with a pending reply double-counts in `co — resolved, round 2 | small | done |
| m3 | minor | `isMutating` counts paused — resolved, round 2 | small | done |
| m4 | minor | Copied helpers: `isoDate` (profile + feed), `serverMessage` (auth), `firstName` (Home) — QUAL-001, ARCH-001 | feed/feedFormat.ts, feedErrors.ts | medium | yes |
| m5 | minor | Test helpers copied again (`base64url` now in 10 files); feed testKit is a local copy — QUAL-002, REFL-003 | useFeedMutations.test.tsx, testKit.ts | medium | follow-up |
| m6 | minor | `Byline` and `EditBox` have no direct tests — QUAL-004 | features/feed | small | yes |
| m7 | minor | Three patterns used here are not in `conventions-frontend.md` — QUAL-005 | .adlc/context | small | your call (wrapup) |
| m8 | minor | "Lowest alumni id" subquery written in 3 places — ARCH-002 | PostQuery, CommentQuery, AlumniQuery | small | follow-up |
| m9 | minor | `feedErrors.ts` pulls constants from the auth barrel and parses axios itself; belongs in `services/httpErrors` — ARCH-003 | features/feed/feedErrors.ts | small | yes |
| m10 | minor | `FeedLoadError` is a third copy of the error + Retry block — REFL-003 | features/feed | small | follow-up |
| m11 | minor | Reply/Edit/Delete, menu button and toggle are 16–24px tall t — resolved, round 2 (CSS; phone size not seen in a browser) | small | done |
| m12 | minor | Deleting a comment is instant and cascades to its replies; posts ask first — UI-002 | CommentThread | small | your call |
| t1,t2 | trivial | duplicate chat icon path; unused `enabled` flag and a brittle `querySelector('button')` — QUAL-003, QUAL-006 | — | — | skip |

## Consolidated by severity

### Major
- **M2 — vault pages stale** (reflector, needs-decision). `components/frontend.md` and `backend.md` omit the feed, `postsApi`, `PUT /api/comments/:id`, `author_alumni_id`; `route-layout.md` has no `/feed`; ADR-08's amendment says the profile is "the second lazy page"; ADR-02 should point to ADR-09; `detail-page-pattern.md` says the feed "can follow" it; `now.md` says nothing is in flight. These are vault edits, made at `/wrapup` step 3 on your say-so.

### Minor (what matters)
- **m1, m2, m3, m11:** fixed in round 2 and re-checked by correctness (no new findings). Left-over, accepted: if two overlapping edits both fail, the first edit's text shows until the refetch; a paused offline write's optimistic row can briefly drop when another write refetches. m11 is not seen in a browser at phone width.
- **m12 (UI).** Comment delete has no confirm while post delete does; this is the decision at architecture Open question 1 (confirm only for posts with comments), applied to posts only.
- The rest are copies and follow-ups listed above.

## Acceptance criteria check

- [✓] AC1 `/feed` lists posts newest first; author links to `/alumni/:alumniId` (plain text for students); loading, empty and error states; checked in Chrome and in tests.
- [✓] AC2 Composer, thread with reply box, optimistic post and comment, count bump; covered by hook and component tests. Real-API create/comment verified by the UI reviewer. Optimistic look not seen live (the reviewer had no browser).
- [✓] AC3 Edit/delete only for owner/admin; API refuses others (403 verified live for posts and comments); comment edit endpoint added and verified.
- [✓] AC4 Feed in nav, tab bar, Home card; tokens only (lint-enforced); tests added.
- [✓] AC5 Screenshots next to S4, 4 views plus empty state; differences listed in `ui-evidence/s4-comparison.md`; one fixed, the field fill (D3) left by your decision.
