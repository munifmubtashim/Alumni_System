# REQ-008 — S3 comparison (design vs running page)

Method (2026-10-07): the S3 files and the live page were opened in the same Chrome, served from one Vite origin. Desktop at 1400px wide. Phone in two 390px iframes side by side (design left, app right), so media queries ran at phone width. Computed font size, weight, position and size were read from both and compared. Test data: Arif Chowdhury (all fields, one post), Munif Mubtashim (empty profile), `/alumni/abc` (not found). Dark and light checked on desktop and phone; screenshots taken before and after the fix pass.

Classes: **FIXED**, **TOKEN** (nearest type token; design size has none), **COLOUR** (design colour differs from the contrast-checked token, L-REQ-004-2), **DATA** (no stored data, spec AC5), **SHELL** (the app shell's own parts), **DESIGN** (the design contradicts itself).

## Desktop (Light and Dark)

| # | Element | Design | Page | Class |
|---|---|---|---|---|
| 1 | Page width, left edge, avatar size (84px), section gaps (28px), post-card padding and radius order | 860px, x=270, 84px | same | match |
| 2 | Back link text box | 16px high | 18px → now 16px | FIXED (caption line token) |
| 3 | Avatar top / header offset | 141px | 143px → now 141px | FIXED (follows #2) |
| 4 | Education bottom space before Employment | 43px | 28px → now 44px | FIXED |
| 5 | Timeline title→detail distance | 17px | 22px → now 18px | FIXED, 1px TOKEN (label line, no 17px token) |
| 6 | Timeline detail line (13px) | 16px | 18px → now 16px | FIXED (caption line token) |
| 7 | Headline box | 18px high | 22px → now 18px | FIXED |
| 8 | Name size | 24px | 28px | TOKEN (`--text-heading-lg`; gate decision) |
| 9 | Name line box | 30px | 36px | TOKEN (no `line-height: normal`: stylelint's strict-value rule rejects it; changing the rule is a project decision) |
| 10 | Headline size | 15px | 14px | TOKEN |
| 11 | Section headings (16px) line box | 20px | 24px | TOKEN (same stylelint reason; +4px per heading) |
| 12 | Section-heading sizes, body 14px, details 13px, meta 12px, timeline dot 10px, colours of ink, border, surface, dark accent | — | — | match |
| 13 | Accent colour (links, dots, avatar text, Back link) light theme | `#ad6a4d` family | token accent family | COLOUR (contrast, L-REQ-004-2); dark accent matches exactly |
| 14 | Card radius | 12px | 14px (`--radius-lg`) | TOKEN |
| 15 | Header bar: "Alumni Network", Feed / My Profile / Admin links, SM avatar | design frame | app shell (Alma, Directory, theme toggle, account menu) | SHELL (REQ-007) |
| 16 | Location, "Available for mentorship" badge | shown | not shown | DATA |
| 17 | Education degree and year range ("B.Sc. · 2013–2017"); three-job Employment timeline with dates | shown | one Education entry (university, department · Class of YYYY); one Employment entry + free-text experience | DATA |
| 18 | LinkedIn link opens in new tab | — | adds a visually hidden "(opens in a new tab)" | deliberate (accessibility) |

## Phone (Light and Dark)

| # | Element | Design | Page | Class |
|---|---|---|---|---|
| 1 | Content side padding 16px; avatar 72px; avatar→name gap 10px; name→headline gap 4px; section gap 24px | — | same | match |
| 2 | Headline, About, timeline title, post text sizes | 13px | 14px → now 13px (exact label token) | FIXED |
| 3 | LinkedIn: text only, 12px/500 | text only | icon + 13px → now text only, 12px | FIXED |
| 4 | Timeline details | 12px | 12px, line 16px | match |
| 5 | Post meta | 11px | 12px | TOKEN |
| 6 | Name | 19px | 20px | TOKEN |
| 7 | Section headings | 15px | 16px | TOKEN |
| 8 | Heading and title line boxes | normal | token lines (+4px per heading, +1px per title) | TOKEN (as desktop #9, #11) |
| 9 | Top bar | its own bar: arrow + "Profile", bottom border, no logo bar | shell logo bar, then a slim arrow + "Profile" row | SHELL (gate decision, matches S2 phone) |
| 10 | Bottom tab bar with Profile tab active | four tabs | shell bar has Directory only | SHELL |
| 11 | Location, mentorship badge, degree, dates, three jobs | shown | not shown | DATA |
| 12 | Post text colour, **light** phone | accent (inherits the link colour; the paragraph has no colour in S3-Phone-Light) | primary ink, as in the other three S3 files | DESIGN |
| 13 | Accent family in light theme | `#ad6a4d` | token accent | COLOUR |

## Not-fixable without a decision (open for you)

- Heading/title/name **line boxes** (desktop #9, #11, phone #8): `line-height: normal` is rejected by the project's stylelint `strict-value` rule. Adding `normal` to its allowed values would remove about 4px per heading and 6px at the name. Not done: it changes a project lint rule.

## Other states checked in the browser

- Not found (`/alumni/abc`): heading "Profile not found", Back to directory link, tab title "Profile not found · Alma".
- Empty profile (no bio, company, LinkedIn): only the header and "Recent posts: No posts yet".
- Back link: from `/directory?q=a&graduationYear=2015` → card → Back returned to the same URL with the search and the year chip restored.
- The API answered 500 on the directory search until `businesslogic/dist` was rebuilt (a stale local build, not a code change; known gotcha in CLAUDE.md).
