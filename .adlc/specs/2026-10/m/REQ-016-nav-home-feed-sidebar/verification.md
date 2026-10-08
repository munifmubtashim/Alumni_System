# REQ-016-nav-home-feed-sidebar — Verification

| Field | Value |
|---|---|
| Generated | 2026-10-08 |
| Work path | /Users/munifmubtashim/Alumni_System |
| Isolation | branch |
| Branch | feat/REQ-016-nav-home-feed-sidebar |
| Files changed | 57 code files (+ docs and vault records) |
| Commits | 3 (plus 1 spec/architecture commit) |
| Base | redesign |

Full reviewer narratives: `review-log.md` — open on demand. UI evidence: `ui-evidence/`.

## Summary

Round 2 (fix pass, uncommitted on top of HEAD; round-2 packet 98KB; round-1 packet 336KB, over the 250KB ceiling).
Reviewed by: correctness · quality · architecture (round 2); reflector and ui ran in round 1 only (balanced; ui at headless tier, /api faked, no DB writes). UI-001 re-checked by me in a 768px screenshot.
Open now: 0 critical, 0 major, 7 minor, 4 trivial. Resolved this round: 7 of 7 actionable findings (CORR-001 was withdrawn as a false positive: a profile save already invalidates the `alumni` key prefix).
Pattern left: test-helper sprawl (feed/admin kits) and vault/doc follow-ups. No finding contradicts an ADR.
Checks after the fix pass: backend 664, frontend 1628 tests, typecheck, lint, format, tokens, build all pass.

## Findings at a glance

| ID | Severity | Finding | Where | Effort | Fix |
|----|----------|---------|-------|--------|-----|
| QUAL-006 | minor | `mockApi` leaves an unlisted URL pending (old people test rejected with a message); add a strict option; fakeApi has no own test | src/test/fakeApi.tsx | small | yes |
| QUAL-008 | minor | Feed and admin test kits keep their own adapter copies; write the "fake API helpers live in src/test/fakeApi.tsx" rule into conventions | features/feed, features/admin testKit, conventions-testing.md | medium | yes (rule) / follow-up (kits) |
| QUAL-004 | minor | SiteFooter test checks a class name only; cannot catch misalignment (jsdom has no layout) | app/AppShell/SiteFooter.test.tsx | — | your call |
| REFL-001 | minor | Vault pages stale: route-layout concept, components/frontend.md, conventions-frontend.md | .adlc/knowledge, .adlc/context | small | your call (wrapup step 3) |
| REFL-002 | minor | `features/people` (eager shared folder) is a new pattern with no ADR-08 amendment | architecture/adr-08 | small | your call |
| REFL-003 | minor | LatestPosts is a third copy of isoDate / "Unknown member" / author-link rules | home/LatestPosts.tsx | medium | your call (follow-up) |
| REFL-004 | minor | Footer on 72rem but /me, /about, /admin keep other widths: record as deliberate | docs | — | your call |
| QUAL-005 | trivial | Sidebar widths 16/20rem and the 64rem step are bare numbers in two CSS files | FeedPage/HomePage css | — | your call |
| REFL-005 | trivial | `['feed','latest']` is safe only because feed writes use exact keys; note in the concept page | knowledge/concepts | — | your call |
| UI-002 | trivial | Feed avatar initials underlined (since REQ-009; outside this diff) | features/feed/Byline.module.css | small | your call |
| QUAL-007 | trivial | New useUpdateProfile test overlaps the existing key test; keep | features/me | — | none |

Resolved: QUAL-001 — resolved, round 2 · UI-001 — resolved, round 2 · ARCH-001 — resolved, round 2 · ARCH-002 — resolved, round 2 · QUAL-002 — resolved, round 2 · QUAL-003 — resolved, round 2 · CORR-001 — withdrawn, round 2 (false positive).

Long form for every finding, including round 2: `review-log.md`.

## Acceptance criteria check

- [✓] Navigation (header order, tab bar, Profile tab, avatar menu): met; screenshots + tests; keyboard order checked by ui-reviewer.
- [✓] Suggestions API (auth, caller excluded, ordering, parameterized, tests): met; NULL ordering safe (COALESCE). Ordering checked on SQL text in tests and on a real DB read-only in TASK-008. Real-data check of NULL ranking: done once, read-only.
- [✓] Mentors API filter (`mentorship=true`, 400s, backward compatible): met; caller dropped client-side.
- [✓] Feed sidebar (3–5 rows, fields, absent below 48rem with no request, states): met. ⚠ UI-001 at 768px text cut.
- [✓] Home (welcome, completeness card only when incomplete with progress + one step, latest 3 + See all, mentors + Browse directory, suggestions reused, per-section loading/empty/error, no quick-link cards/charts): met.
- [✓] Fixes: footer aligned on Home/Directory/Feed/Profile (measured 12/12 plus ui-reviewer); copy gone from packages/, root docs, .adlc/context.
- [✓] Quality: tokens only, TanStack Query, no lazy-boundary break, typecheck/lint/format/tokens/build and tests green (backend 664, frontend 1627).
- [✓] Screenshots at desktop and phone width, light and dark, with a written difference list (`screenshot-diff.md`), differences fixed.
- Decisions recorded and accepted at gates: photo not counted in completeness; Home post preview is its own (ADR-08); Profile widened to 72rem.
