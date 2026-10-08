# REQ-016 — Screenshot difference list (TASK-008)

| Field | Value |
|---|---|
| REQ | REQ-016 |
| Date | 2026-10-08 |
| How | Headless Brave over CDP against the running Vite dev server. Every `/api/*` call was answered with fake data in the browser (`Fetch.requestPaused`), so nothing reached the API or the database. Users: alumni Ada (alumni id 7, headline and bio empty), student Sam (student row, no alumni row), admin Alex (no profile row). Fakes: 5 suggestions (Amina is a mentor, Priya has no company), 5 mentors including Ada herself (so 4 must show), 5 posts. |
| Images | Scratchpad only, not committed: `v3-{home,feed}-{desk,phone}-{light,dark}.png`, `v3-tabbar-feed-phone-{light,dark}.png`, `v3-home-768-light.png`, `v3-home-loading-light.png`, `v3-student-home-phone-dark.png`, `v3-admin-tabbar-phone-light.png`, `v3-admin-home-desk-light.png`, `v2-home-errors-dark.png`, `v2-feed-768-light.png`. `v1-*` are before the fixes below. |

## Spec line by line

| Spec line | Result | What I saw |
|---|---|---|
| Header nav: Home, Directory, Feed, then Admin for admins; no Account | PASS | Alumni and student: Home, Directory, Feed. Admin: plus Admin last. No other item. |
| Each link current on its own path; Home only on `/` | PASS | `aria-current="page"` on Home at `/` only; Feed at `/feed`; accent underline visible in light and dark. |
| Tab bar: Home, Directory, Feed, Profile with icon and label; Admin last for admins; no Account | PASS | 390px light and dark: four tabs with icons and labels; admin sees five with the shield last. |
| Profile tab → `/alumni/<own id>`, current there | PASS | Alumni: `/alumni/7`; after tapping it, only Profile has `aria-current`. |
| Profile tab with `['me']` cached shows the id at once | PASS | After in-app navigation the href is `/alumni/7` on the first frame. On a cold load it is `/me` for one render, then `/alumni/7` (TASK-003 accepted this; see open items). |
| A1: no alumni profile → Profile opens `/me` | PASS | Student and admin: Profile tab href `/me`. |
| Avatar menu: name and email, View profile (alumni only), Account settings, Admin settings (admins), Log out | PASS | Alumni: name, email, View profile, Account settings, Log out. Admin: name, email, Account settings, Admin settings, Log out. Student: no View profile. |
| Feed sidebar from 48rem: "Suggested alumni", 3–5 rows, avatar, name, role + company, Mentor badge, profile link | PASS | 5 rows at 768/1024/1280; Mentor only on Amina; Priya shows "Research Assistant" with no stray comma. |
| Feed sidebar not rendered below 48rem, no request | PASS | 390px: no sidebar in the DOM; requests were `/api/me` and `/api/posts` only. 768px: `/api/alumni/suggestions` sent once. |
| Sidebar loading / empty / error with Retry; feed unaffected | PASS | Error with Retry shown on Home (same component); unit tests cover the Feed case. |
| Feed main column, composer, comments as before | PASS | Same cards and composer; nothing in them changed. |
| Feed main column at exactly 48rem (TASK-006 follow-up) | DIFF → fixed | Before: posts 352px beside a 320px sidebar. The sidebar is now 16rem between 48 and 64rem (20rem from 64rem), gap space-5. Now the posts are 424px beside 256px at 768, and 608/320 at 1024. The 48rem breakpoint is unchanged (A3). |
| Sidebar and its card both named "Suggested alumni" (TASK-006 follow-up) | DIFF → fixed | The `<aside aria-label>` wrapper is now a plain `div`, so the card's own region "Suggested alumni" is the only landmark. This also avoids an `aside` nested in `main`. |
| Row text cut off: "Staff Engineer, Polar Cl…" | DIFF → fixed | `PersonRow` cut the role line to one line. With a Mentor tag, most companies were lost. The role line now wraps to at most 2 lines (name still one line). |
| Home: "Welcome back, <first name>" + subtitle | PASS | "Welcome back, Ada" / "Here's what's happening in your alumni network." |
| Completeness card only when incomplete; progress bar with accessible value; one next step to Account settings | PASS | Alumni 67% (4 of 6), "Add a headline"; student 60% (3 of 5), "Add your current role"; a complete alumni profile and an admin with no row get no card. Native `<progress>` labelled "Profile completeness". |
| "Latest from the feed": 3 newest posts, "See all" → `/feed` | PASS | 3 posts, captions clamped to 3 lines; the author without an alumni id is plain text. Built as a preview, not `PostCard`, an approved deviation (architecture). |
| "Mentors available": 3–4 with badge, "Browse directory", never the user | PASS | 4 shown; Ada (the caller) dropped. |
| Home at 768 with a 16rem side column | DIFF → fixed | Briefly tried the Feed's 16rem on Home: mentor names cut ("Omar Had…") and the title wrapped. Home stays 20rem from 48rem (its left column only holds short previews). |
| "Suggested alumni" on Home reuses the Feed's component and endpoint | PASS | Same card, same `['alumni','suggestions']` request. |
| Each section: loading, empty, its own error + Retry | PASS | Loading: skeleton rows in all three at once. Error: posts and suggestions failed, mentors still showed, each failed card had its own Retry. |
| No quick-link cards, charts, stats or counts | PASS | None on Home for any role. |
| Footer lines up on Home, Directory, Feed, Profile at tablet and desktop | PASS | Left/right edge of page vs footer inner box: 768 → 32/736, 1024 → 32/992, 1440 → 144/1296 on all four pages (12 of 12 equal). |
| Copy "year, department or field" gone | PASS | Not found in `packages/`, root docs or `.adlc/context`. The sentence was removed with the old Home card, so no "…or university" line is needed. |
| Light and dark | PASS | All shots in both themes; no contrast problem seen. |
| Suggestion ranking on real data (TASK-002 note) | PASS | Read-only check on the local database: same department and university first, then department, then university, then name; a caller with neither gets name order. |

## Open items (not fixed here)

1. **Feed avatars show underlined initials** (light and dark, every post whose author has an alumni id). `features/feed/Byline.module.css` `.avatarLink` has no `text-decoration: none`. The file is unchanged since REQ-009, so this predates REQ-016 and Byline is outside this REQ's files. Fix: add `text-decoration: none` to `.avatarLink`.
2. **Profile tab cold-load flicker**: on a full reload the tab points at `/me` until `['me']` arrives (a fraction of a second). TASK-003 accepted this; a tap in that moment opens Account settings.
3. **Stale code comments** outside this REQ's files: `app/AppShell/HeaderAuth.tsx:17` still says "this menu and the Home card are the only ways to /me"; `features/me/useLeaveGuard.ts:22` names the phone "Account" tab. Comments only, no behaviour.
