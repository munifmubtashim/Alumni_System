# REQ-008-alumni-profile-page — Verification

| Field | Value |
|---|---|
| Generated | 2026-10-07 |
| Work path | /Users/munifmubtashim/Alumni_System |
| Isolation | branch |
| Branch | feat/REQ-008-alumni-profile-page |
| Files changed | 73 |
| Commits | 8 (spec, architecture, 6 implementation) + round-2 fixes (uncommitted until the gate) |
| Base | redesign |

Full reviewer narratives: `review-log.md` — not loaded by later phases; open on demand. Screenshots from the UI reviewer: `ui-evidence/`.

## Summary

- **Round 2.** m1–m6 were fixed and re-reviewed by all five reviewers (UI headless again): all six resolved, no regressions, no new finding above trivial. **0 critical, 0 major, 5 minor open (m7–m11, your call), 4 trivial.**
- Tests 888 pass; typecheck, lint, format, tokens and build clean. Round-2 packet 82KB (round 1: 256KB, over the 250KB ceiling).
- No finding contradicts an accepted ADR. m7 (ADR-06 wording) and m11 (components page) are drift / vault-stale: your call, handled at `/wrapup` step 3 if you agree.
- UI reviewer round 2: phone tap target, desktop back link unchanged (126×16 at 1400 and 768), posts error width, loading announcement, no console errors; S3 numbers did not regress.

## Findings at a glance

| ID | Severity | Finding (one line) | Status |
|----|----------|--------------------|--------|
| m1 | minor | Failed refetch replaced loaded profile/posts with the error view (CORR-001) | resolved, round 2 |
| m2 | minor | Focus jumped to the heading even after the user tabbed elsewhere (CORR-002) | resolved, round 2 |
| m3 | minor | Phone "Profile" text was not part of the back link (UI-002) | resolved, round 2 |
| m4 | minor | Posts error alert narrower than the cards (UI-001) | resolved, round 2 |
| m5 | minor | "Loading posts…" status inside an aria-busy region (REFL-004) | resolved, round 2 |
| m6 | minor | Hard-coded `/directory` and inline `/alumni/<id>`; now `DIRECTORY_PATH` and `profilePath` (ARCH-002, QUAL-004) | resolved, round 2 |
| m7 | minor | ADR-06, CLAUDE.md:85, frontend README:60 still say `config/` is "constants only" (ARCH-001, REFL-002) | open, your call |
| m8 | minor | `present()` copied into profile and directory; no shared home for helpers both lazy features may use (QUAL-002, REFL-003) | open, your call |
| m9 | minor | Fake-login test helper copied into 8 test files, G26 (QUAL-001) | open, your call |
| m10 | minor | Error + Retry block repeated in 3 places (QUAL-003) | open, your call |
| m11 | minor | components/frontend.md and index.md lack REQ-008; frontend README has no profile section (REFL-001) | open, /wrapup |
| t1 | trivial | `Timeline` supports many entries, only one is passed (QUAL-005) | note |
| t2 | trivial | `PostCard` has no test file of its own; unused `now` prop (QUAL-006) | note |
| t3 | trivial | Title "Profile · Alma" while loading (UI-003) | none |
| t4 | trivial | `profilePath` / `DIRECTORY_PATH` live in `directoryReturn.ts`; if a third route path appears move to `config/paths.ts`; refetch tests hard-code query keys (QUAL-007) | note |

Reviewed by: correctness (balanced) · quality (balanced) · architecture (balanced) · reflector (balanced) · ui (balanced), rounds 1 and 2

## Consolidated (open items only; resolved findings and their threads are in review-log.md)

### Minor — your call

- **m7** — Amend ADR-06 (config may hold small pure contracts shared by lazy features such as `directoryReturn.ts`) and fix the three "constants only" sentences. An ADR decision.
- **m8** — Choose a home for pure helpers shared by lazy features (e.g. `src/lib/`), then move `present()`. A project-wide layout choice; each future lazy feature will otherwise copy it.
- **m9** — A shared `src/test/fakeApi.ts` (token builder, `ok`, `fail`) in a separate cleanup REQ.
- **m10** — Extract the error + Retry block when a third page needs it.
- **m11** — `/wrapup` step 3: components page, index row, frontend README profile section.

## Acceptance criteria check

- [✓] AC1 route behind sign-in, in the shell — guard test + UI reviewer; guest to `/login` and back
- [✓] AC2 lazy chunk — `ProfilePage-*.js` 10.3 kB, entry has none; guard test per feature
- [✓] AC3 TanStack Query, API in `services/` — two hooks, call functions tested
- [✓] AC4 header — avatar, `h1`, headline, safe LinkedIn
- [✓] AC5 no invented data — verified in the browser and by tests
- [✓] AC6–AC8 About / Education / Employment hide when empty; `experience` plain text
- [✓] AC9 posts — skeleton, error with Retry (polish fixed, round 2), empty, newest 5
- [✓] AC10 Back link — restored `/directory?q=a&graduationYear=2015` in two independent browser runs; plain `/directory` on direct visit (phone tap target fixed, round 2)
- [✓] AC11 states — loading, not found (unknown and malformed id), error + Retry, 401 logs out, id switch never shows the old person (refetch edge case fixed, round 2)
- [✓] AC12 S3 match — differences listed in `s3-comparison.md`; UI reviewer confirmed all fall inside the allowed classes
- [✓] AC13 tokens only — no hex in new CSS
- [✓] AC14 accessibility — m2, m3, m5 fixed in round 2 and re-checked in the running app
- [✓] AC15 tests — 881 pass; typecheck, lint, format, tokens, build clean
