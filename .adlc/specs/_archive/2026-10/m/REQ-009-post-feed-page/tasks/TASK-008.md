# TASK-008 — Compare with S4 designs and fix every difference

| Field | Value |
|---|---|
| REQ | REQ-009 |
| Tier | 5 |
| Status | complete |
| Repo | alumni-system |
| Depends on | TASK-006, TASK-007 |
| Blocks | — |

## Goal

Built page and S4 designs are shown side by side at desktop and phone, light and dark; every difference is listed and fixed or justified.

## Files to touch

| Path | Action |
|---|---|
| `.adlc/specs/2026-10/m/REQ-009-post-feed-page/ui-evidence/` | create screenshots + `s4-comparison.md` |
| feed CSS/components | edit as needed |

## Approach

- Start API + Vite (`npm run dev`; rebuild `businessLogic` first). Use Claude in Chrome: open the S4 design files and `/feed`; screenshots at 1440 and 390 wide, light and dark (theme toggle), plus the empty state (S4-EmptyFeed) and an expanded thread.
- Write `s4-comparison.md`: one row per difference (area, design, built, verdict fixed / intentional + why). Fix all that are not intentional; re-shoot.
- Intentional known ones: brand/logo and nav items of the existing shell, inline edit mode, comment action row.

## Acceptance

- [ ] 4 screenshot pairs + empty state + expanded thread saved
- [ ] Every difference listed; none left unexplained
- [ ] Re-run of checks after fixes

## Notes

If the design .dc.html files need `support.js` to render and it is missing, say so and fall back to reading their markup values; do not guess.

## Related

- Architecture: [[specs/2026-10/m/REQ-009-post-feed-page/architecture]]
- Lessons checked: [[knowledge/lessons/LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]], G26, G28, G29, G30


Done 2026-10-07: 10 screenshots + `ui-evidence/s4-comparison.md`. One difference fixed (phone placeholder), D3 (field fill token) needs a decision. Phone width was checked in 390px iframes because the window would not resize. The empty state was shown by paging past the end in the browser; no data changed.
