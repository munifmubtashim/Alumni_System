# S5 vs built page — differences (REQ-010, 2026-10-07)

Method: the built page (Vite dev, demo alumni account) and the S5 files (served locally) were opened in one real browser and compared by eye, plus measured computed styles on desktop (1440 wide). Screenshots are in this folder.

## What was and was not compared

| Combination | Shot of built page | Shot of S5 |
|---|---|---|
| Desktop light, unsaved bar | yes (`app-desktop-light-unsaved`, `-bottom`) | yes (`design-desktop-light`) |
| Desktop dark | yes, no bar (`app-desktop-dark-top`) | yes (`design-desktop-dark`) |
| Phone light, unsaved bar | yes (`app-phone-light-unsaved`) | not shot (S5-Phone-Light differs from Dark only in colours, checked in source) |
| Phone dark, unsaved bar | yes (`app-phone-dark-unsaved`) | yes (`design-phone-dark`) |
| Toast | phone light only (`app-phone-light-toast`) | yes (`design-unsaved-toast`) |
| Desktop toast, 360 px, 200% zoom, system theme | **not done** | |

The not-done items need another pass (listed as open at the bottom).

## Differences

| # | Difference | Disposition | Cause |
|---|---|---|---|
| 1 | No Headline, Location, Degree, Start year fields; no Mentorship section; no Change photo button | expected | API gaps, decided at the spec gate |
| 2 | Added fields S5 does not show: About, Department, Experience, LinkedIn on desktop and phone, Confirm password on phone | expected | asked for in the brief or required by the API |
| 3 | Avatar shows the stored photo (or initials) with no button beside it | expected | no photo upload API (1); photo is the saved `photo_url` |
| 4 | Brand "Alma" and its logo instead of "Alumni Network" "A" tile; no Admin link | expected | brand rename (REQ-004); Admin page does not exist |
| 5 | Header carries the theme toggle; phone shows the app header above S5's "< My Profile" bar | expected | app shell already does this on every page (S1, S3) |
| 6 | Accent is a darker/lighter terracotta than S5's older #ad6a4d | expected | tokens win over design hex (screens README) |
| 7 | Inputs in light theme use a tinted fill; S5 uses white | expected, **your call** | the shared `Input` primitive uses the sunken surface token everywhere (login, sign-up); dark theme matches S5 |
| 8 | Type sizes: h1 20 px (S5 22), section titles 16 (S5 15), labels 13/500 (S5 12/600), input text 16 px with 8/16 padding (S5 14 px, 10/12) | expected | the token type scale and shared `Input` (16 px stops iOS zoom); card padding 22, radius 14 and the 680 px column match S5 |
| 9 | No soft shadow under the save bar or the toast | expected | no shadow tokens by design (soft borders instead) |
| 10 | Toast check mark is the text colour, not green; toast has a dismiss button; 150 ms animation (S5 250 ms); on phone it spans the width | expected | contrast on the inverse surface; keyboard users can dismiss; motion token |
| 11 | Password section has an intro line, show/hide eyes and a "At least 8 characters" hint; S5 has a placeholder "Leave blank to keep current" | expected | shared `PasswordInput` and accessibility; same meaning |
| 12 | Phone: save bar sits above the tab bar; S5 phone shows no tab bar | expected | the app shell has a tab bar on phones (S1); verified no overlap and last field not covered |
| 13 | After saving, S5's toast screen shows a caption "All sections saved — no unsaved changes." under the cards; the built page showed the toast only | **fixed** (TASK-008) | `ProfileForm` now shows it after a save in this visit, only while nothing is unsaved (`.allSaved`, label size, ink-secondary); not re-shot |

## Verified working in the browser

- Save bar shows only when a field changed; Discard removes it; Save shows "Profile updated successfully" and hides the bar.
- Reloading or navigating away with unsaved changes is blocked by the browser's leave prompt.
- Save bar clears the tab bar on a 390 px phone (about 16 px apart) and the last field can be scrolled clear of it.
- A save followed by restoring the name leaves the demo account unchanged.

## Open

- Re-shoot desktop toast, phone light S5, 360 px, 200% zoom and system theme (not done here).
- Item 7 if you want white inputs on this page (item 13 is fixed; its screenshot is not re-taken).
- Check the toast is announced by VoiceOver (reported by TASK-002).
