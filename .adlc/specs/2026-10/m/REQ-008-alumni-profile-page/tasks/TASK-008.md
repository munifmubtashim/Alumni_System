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
