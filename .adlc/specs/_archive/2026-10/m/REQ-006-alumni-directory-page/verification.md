# REQ-006-alumni-directory-page — Verification

| Field | Value |
|---|---|
| Generated | 2026-10-06 |
| Work path | /Users/munifmubtashim/Alumni_System/.worktrees/REQ-006-alumni-directory-page |
| Isolation | worktree |
| Branch | feat/REQ-006-alumni-directory-page |
| Files changed | 69 (frontend + CLAUDE.md; `.adlc/**` excluded from the packet) |
| Commits | 4 (af37e709 feat, b7901088 docs, bbdf907f fix round 1; vault commit follows the gate) |
| Base | feat/REQ-005-alumni-search-filters (REQ-005 is unmerged; config base `main` would include its commits) |

Full reviewer narratives: `review-log.md` — not loaded by later phases; open on demand.

## Summary

**Round 2 (after fix commit bbdf907f): 0 critical, 0 major, 5 minor open (all your call), 2 trivial open.** Round 1 had 1 major, 12 minor, 3 trivial; 11 of those are resolved. Round 2 re-reviewers (correctness, quality, architecture, ui) found no new defects; reflector was not re-run (its only code finding, REFL-001, is fixed; the rest are vault docs). Round-2 packet 160KB (round 1: 288KB, over the 250KB ceiling). The UI reviewer was static-only both rounds: nothing was independently seen in a browser (my own Chrome check is in `design-check.md`, taken before the fixes).

Verdict file after round 2: about 5KB.

## Findings at a glance

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| UI-001 | major | focus lost after a page change | resolved, round 2 (h1 focused; new test fails without the fix) |
| CORR-001, CORR-002 | minor | lost keystroke race; control characters written to the URL | resolved, round 2 |
| QUAL-001, 003, 005 | minor/trivial | duplicated hidden CSS (now a `VisuallyHidden` component); redundant contrast rows; shared CSS module | resolved, round 2 |
| ARCH-001, ARCH-002 | minor | no ESLint ban on the lazy page import; copied API limits unexplained | resolved, round 2 |
| REFL-001, REFL-004 | minor/trivial | `MainNav` re-implemented `cx`; spec linked wrong ADR names | resolved |
| QUAL-002 | minor | test helpers copied in six test files | open, your call (touches the "test/ is setup only" rule) |
| QUAL-004, REFL-002, REFL-003 | minor | `conventions.md`, `components/frontend.md`, `concepts/route-layout.md`, G19 stale | open, your call: handled at /wrapup step 3 |
| UI-002 | minor | shared `retry: 2` shows skeletons about 3 s before a server error | open, your call |
| QUAL-006 (rest), QUAL-007 | trivial | year `maxLength: 4` literal and duplicated magnifier SVG left; VisuallyHidden tests assert the class name (matches project norm) | open, no action needed |

Reviewed by: correctness (balanced) · quality (balanced) · architecture (balanced) · reflector (balanced, round 1 only) · ui (balanced, static tier).

## Consolidated by severity

### Minor (5 open)

- **QUAL-002** — copy-pasted `makeToken` / `ok` / `fail` / adapter in six test files. A shared `src/test/apiMock.ts` would need the conventions line "test/ is setup only" updated. Recommendation: a follow-up task.
- **QUAL-004 / REFL-002 / REFL-003** — vault docs not yet updated for this REQ. Recommendation: update at /wrapup step 3.
- **UI-002** — Recommendation: set a smaller `retry` on `useAlumniSearch` if a quicker error state is wanted; or leave.

Notes carried forward:
- The spec says `/alumni/:id` "shows the existing not-found page"; it renders the empty app shell (the router's `*` route has no element). Out of scope; the spec wording is wrong.
- Not seen in a browser by an independent reviewer: 200% zoom, the focus ring on the heading, dark-mode details, pagination with more than 12 results.

## Acceptance criteria check

- [✓] AC1–AC9, AC11, AC13, AC15 — as in round 1; 717 frontend tests pass, typecheck, lint, format and build clean
- [✓] AC10 pagination — focus after a page change fixed (UI-001); more than one page never seen in a browser (dev DB has 8 alumni)
- [⚠] AC12 design match — author's Chrome comparison only; known differences in design-check.md
- [⚠] AC14 accessibility — UI-001 fixed; 200% zoom and ring appearance not seen by anyone
