# REQ-006 — side-by-side design check

2026-10-06. Page: Vite dev server + API from this worktree, 8 real alumni rows. Design: the `docs/design/screens/app/S2-*.dc.html` files need `support.js`, which is not in the repo, so their templates were expanded into plain HTML in a scratch folder outside the repo and viewed in Chrome next to the page. Phone widths were compared in 390px and 360px iframes (resizing the browser window did not change the viewport).

| Screen | Compared | Result |
|---|---|---|
| Desktop light, list | page vs S2-Desktop-Light | Matches (search box, chips, pills, cards, count). Differences below. |
| Desktop dark | page vs S1/S2 dark values (visual) | Colours follow the dark tokens; looks as designed. |
| Filters active (chips) | page vs S2-Desktop-Light chips | Matches. |
| No results | page vs S2-NoResults | Matches (icon circle, heading, text, button). |
| Phone light 390px | page vs S2-Phone-Light | Matches except the header and department line. |
| Phone dark 360px | page vs S2-Phone-Dark | Matches; no overflow; header wraps to 3 rows. |
| Pagination | not seen in the browser | The dev database has 8 alumni (one page of 12), so pagination is hidden. Covered by unit and page tests only. |

## Fixed during the check

- Search placeholder was cut mid-word at 360px; the input now ends it with an ellipsis (`SearchField.module.css`).

## Remaining differences (all listed in the architecture gate, except where noted)

| Difference | Why |
|---|---|
| Brand "Alma", not "Alumni Network"; no avatar-only user chip; theme toggle with words | REQ-004's header, kept |
| Content column 72rem centred (design: full width, 4 columns at 1440px; page shows 3) | the shell's column, kept |
| Nav underline floats under the label (design: sits on the header's bottom edge); 13px label (design 14px) | no token for the 22px padding; label type token |
| Phone: Directory link in the header, no bottom tab bar; header takes 2 to 3 rows | agreed at the architect gate; header wrapping is REQ-004's |
| Phone heading "Alumni Directory" (design "Directory") and count "N alumni" only under 48rem vs "Showing a–b of N" | one heading on every width |
| Phone card shows the department line (design leaves it out) | AC8 asks for it. **Your call:** hide it under 48rem to match the design exactly. |
| No Mentor tag, no Field filter, one graduation year instead of a range | no backend data (spec non-goals) |
| Card padding, gaps, heading size use the nearest tokens; phone avatar 44px (design 40px); card border and search border use `--border-strong` for contrast | no exact tokens; contrast |
| Inactive filter pills are shown next to chips in the no-results state (design omits them) | consistent filter row |
| Count reads "1 alumnus" when there is one match | grammar |
