# TASK-008 — S3 side-by-side comparison and fixes

| Field | Value |
|---|---|
| REQ | REQ-008 |
| Tier | 4 |
| Status | pending |
| Repo | alumni-system |
| Depends on | TASK-007 |
| Blocks | — |

## Goal

S3 side-by-side comparison and fixes.

## Files to touch

| Path | Action |
|---|---|
| `.adlc/specs/2026-10/m/REQ-008-alumni-profile-page/s3-comparison.md` | create (the difference list) |
| `packages/frontend/src/features/profile/*.module.css` and components | edit (fixes only) |

## Approach

- Start API and Vite (`npm run dev`), sign in (see `.adlc/config.yml` ui auth; seed data from `db/seed/seed_demo_data.sql`), open `/alumni/<id>` of a profile with bio, company, LinkedIn and posts.
- For each of S3 Desktop Light, Desktop Dark, Phone Light, Phone Dark (design files in `docs/design/screens/app/`, open in the browser): screenshot the design and the page at 1440 and 390 wide in the same theme, next to each other, and list every difference (spacing, size, weight, colour, order, wrapping, radius, icon).
- Classify each as: fixed, deliberate (omitted data, token-versus-design colour, nearest type token, shell tab bar), or needs a call. Fix what is fixable with tokens; repeat the comparison after fixes.
- Also check 360px wide and 200% zoom, the loading, not-found and error states, keyboard focus.

## Acceptance

- [ ] `s3-comparison.md` has all four combinations, one table each, every difference listed with its class.
- [ ] No "fixable" difference is left open.
- [ ] No hex values were added to source; `npm run lint`, `format:check`, `test`, `build` still pass.

## Notes

The ui-reviewer at /review repeats this independently. Tokens differ from the design file on purpose in places (see architecture); do not hard-code the design's colours to make a difference disappear.

## Related

- Architecture: [[specs/2026-10/m/REQ-008-alumni-profile-page/architecture]]
- Lessons checked: L-REQ-006-1/2/3, L-REQ-004-2, L-REQ-001-5

### Fix pass (task-implementer, 2026-10-07)

Measured list came from the orchestrator's browser comparison (D1-D5, P1-P5).

- Done: D5 (`Section.module.css` `.trailingSpace`, 16px under Education from 48rem, used by `EducationSection.tsx`); P1 (About text and the experience note 13px on phone, 14px from 48rem; About line height stays `--text-body-sm-line` = 22px, the token nearest the design's 1.6 = 20.8px; headline was already 13px on phone); P2 (timeline title 13px/600 on phone); P3 (post caption 13px on phone; meta was already 12px); P5 (LinkedIn icon `display: none` below 48rem, decorative aria-hidden svg, never toggled by `hidden`, so G18 does not apply). P4 needed no change (h2 16px, name 20px already).
- D4 checked from CSS, no change: dot 10px / margin-top 6px / gap 16px, line 1px `--border-subtle` with `margin: var(--space-1) 0`, 20px under every entry but the last (phone 9 / 5 / 14 / 14) all match S3; `Timeline.test.tsx` already covers the line on all but the last of 3 entries.
- Not done, blocked: D1-D4 and P4 `line-height: normal`. Stylelint's declaration-strict-value rule rejects `normal` for `line-height` (not in `ignoreValues`; tested), and the config is outside this task's blast radius. Exact token matches exist for some (back link 16px = `--text-caption-line`, headline 18px = `--text-label-line`, timeline detail 16px = `--text-caption-line`) but not for h1 (30/34px) or h2 (20px). Needs a call: allow `normal` in `stylelint.config.js` (+ enforcement test + conventions), or borrow nearest line tokens, or accept as nearest-token.
