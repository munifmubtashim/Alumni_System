# REQ-009 — S4 design vs built page

Compared on 2026-10-07 in Chrome against the real app (seeded demo account) and the `S4-*.dc.html` files served locally. Desktop at 1430px wide, phone at 390px (side by side, in iframes). Light and dark for both; empty state; open thread; owner menu.
Evidence: this folder. `phone-*-design-left-app-right.jpg` show the design on the left and the app on the right.

Views covered: desktop light, desktop dark, phone light, phone dark, empty state (light — the only design file), open thread (dark), owner menu (light).

## Fixed during the comparison

| # | Where | Design | Built before | Fix |
|---|---|---|---|---|
| F1 | Composer placeholder, phone | "What's on your mind?" (no name) | included the first name | name dropped below 48rem (`useWideScreen`), test added |

## Differences that remain, and why

| # | Area | Design | Built | Verdict |
|---|---|---|---|---|
| D1 | Header | "Alumni Network", logo "A", links Directory / Feed / My Profile / Admin, no theme toggle | "Alma" logo, links Directory / Feed, theme toggle, account menu | intentional: the app shell is REQ-004/007; My Profile and Admin stay out until built |
| D2 | Page title size | 22px desktop | 20px (`--text-heading-md`) | intentional: no 22px token; tokens only |
| D3 | Composer and reply field fill | white (light), `#1d1a17` (dark) | tinted `--surface-sunken` in both | **decision needed.** Same fill as the app's `Input`. No single token gives white in light and `#1d1a17` in dark; matching needs one new token in `tokens.json` |
| D4 | Composer field height | ~55px | ~66px | intentional: body line-height token (22px) vs the design's default line height |
| D5 | Post button | always accent, weight 600 | greyed while the text is blank, weight 500 | intentional: a blank post cannot be sent; weight is the `Button` primitive's |
| D6 | Avatars | initials, composer/post 36px | photo when the user has one (seed users do); 32px for the composer and post | nearest existing `Avatar` size; photos are real data |
| D7 | Phone text sizes | body 13px, meta 11px | body 14px, meta 12px | intentional: the token scale has no 13px regular or 11px; nearest tokens used |
| D8 | Time and meta colour | light grey `#948c84` | `--ink-secondary` | intentional: the design grey is under 4.5:1 on cards |
| D9 | Menu | drop shadow | no shadow | intentional: shadows are banned by lint (tokens-only rule) |
| D10 | Thread toggle on phone | count shown in accent when open | "Hide comments" in muted text (desktop design governs; matches desktop) | minor, intentional |
| D11 | Comment box | no button | "Send" appears once text is typed | added for touch users |
| D12 | Not in S4 | — | edit mode, delete confirm for posts with comments, "edited" mark, Load more, error and retry states, "no longer available" | added by the requirement; follow the primitives |
| D13 | Design file bug | `{{commentToggleLabel}}` is never filled in the desktop-light file | n/a | the design file, not the app |

Matches (checked): page column 640px, card padding 18px and radius, gap 16px, name/time/body type, comment rows (28px avatars, name + text, "time · Reply"), reply pill input, empty-state icon/heading/text, owner menu items "Edit post" / "Delete post" (error colour), author name linking, bottom tab bar with Feed marked current.

Not compared (no design): load more, error states, inline edit, delete confirm — covered by component tests.
