# Navigation, social Home and Feed "Suggested alumni" sidebar

| Field | Value |
|---|---|
| REQ | REQ-016 |
| Status | validated |
| Phase | spec |
| Created | 2026-10-08 |
| Primary repo | alumni-system |
| Touched repos | alumni-system |
| Related | [[adr-01-ui-layer-headless-css-modules]], [[adr-02-server-state-tanstack-query]], [[adr-08-route-code-splitting-and-url-list-state]], [[adr-09-optimistic-updates-by-cache-edit]]; REQ-005 (alumni search API), REQ-007 (app shell), REQ-009 (feed), REQ-011 (mentorship), REQ-012 (Account settings), REQ-015 (admin) |

## Problem

The navigation, the Home page and the Feed don't read as a social network yet.
- The header nav lists Directory and Feed only, with no Home link.
- The phone tab bar's last tab is "Account", which opens settings, not the person's own profile.
- Home is three large quick-link cards: no people, no content, nothing to act on.
- The Feed is a single column with nothing that helps a member find and meet other people.
- The footer's content is narrower than the page above it, so the two edges don't line up.
- The Home card text says "year, department or field", but the Directory filters by year, department and **university**.

## Goal

A signed-in member lands on a Home that shows people and content (a profile-completeness prompt when needed, recent posts, available mentors, suggested alumni). The header and phone tab bar carry the right destinations. On desktop the Feed has a "Suggested alumni" sidebar. The footer lines up with the page content and the copy matches the real filters.

## Non-goals

- No charts, statistics or counts on Home (the admin page keeps its own stat cards).
- No connect, follow or message actions on suggestions; each one only links to a profile.
- No change to the Directory, Profile, Account settings or Admin pages except the copy fix.
- No new design-system primitives unless an existing one cannot be reused.
- No photo upload (still not built, see REQ-010).

## Acceptance criteria

### Navigation
- [ ] Desktop header nav (from 48rem) lists exactly, in order: Home, Directory, Feed, then Admin for admins only. No other item (including Account) appears. Each link is marked current on its own path with the existing accent underline; Home is current only on `/`, not on every path.
- [ ] Phone bottom tab bar (below 48rem) lists, in order: Home, Directory, Feed, Profile, each with an icon and a text label. Admins also get Admin last (existing behaviour, kept). No "Account" tab remains.
- [ ] The Profile tab links to `/alumni/<id>` where `<id>` is the signed-in user's own alumni id, and is marked current on that path.
- [ ] A signed-in user with no alumni profile (for example a student): see Assumption A1.
- [ ] The avatar menu lists, in order: name and email, View profile (only with an alumni profile), Account settings, Admin settings (admins only), Log out. Nothing is removed or added.

### Suggested alumni (API)
- [ ] An authenticated endpoint returns 3–5 suggested alumni for the signed-in user. Guests get 401.
- [ ] The result never contains the signed-in user, and each item has the fields the card needs: alumni id, name, photo, job title, company, headline, department, university, `mentorship_available`.
- [ ] Ranking prefers people who share the user's department, then people who share their university, then anyone else, with a stable tie-break. A user with neither falls back to the general ranking.
- [ ] All SQL is parameterized; no request text reaches the SQL string.
- [ ] Backend tests cover: 401 without a token, the user is excluded, department and university ordering, the count cap, and an empty result.

### Mentors available (API)
- [ ] `GET /api/alumni` gains an optional mentorship filter (REQ-005 contract extended, not replaced). With it, only alumni with `mentorship_available = true` are returned, still as `{ items, total }`. A bad value answers 400, an empty value means absent, and existing callers see no change. Tests cover all three.
- [ ] The signed-in user is not shown in their own Mentors list.

### Feed sidebar
- [ ] From tablet width (48rem) the Feed shows a right sidebar titled "Suggested alumni" with 3–5 people. Each row has an avatar, name, "role + company", a mentorship badge when `mentorship_available` is true, and a link to that person's profile.
- [ ] Below 48rem the sidebar is not rendered at all (not merely hidden), so it makes no request on phones.
- [ ] The sidebar has loading, empty (hidden or a short note) and error (with Retry) states, and its failure never breaks the feed.
- [ ] The Feed's main column, composer, comments and optimistic writes behave as before.

### Home
- [ ] Welcome back, `<first name>` with the subtitle "Here's what's happening in your alumni network." stays at the top.
- [ ] A profile-completeness card shows only when the profile is incomplete. It has a progress bar (with an accessible value) and one next step linking to Account settings. A complete profile shows no card.
- [ ] "Latest from the feed" shows the 3 most recent posts (reusing the feed's post data and author line) with a "See all" link to `/feed`.
- [ ] "Mentors available" shows 3–4 alumni with the mentorship badge and a "Browse directory" link to `/directory`.
- [ ] "Suggested alumni" reuses the same component and endpoint as the Feed sidebar.
- [ ] Every section has a loading state and an empty state, and a failed section shows its own error with Retry without hiding the others.
- [ ] The three large quick-link cards are gone. Home shows no charts, statistics or counts.

### Fixes
- [ ] The footer's content column lines up with the page content width on Home, Directory, Feed and Profile at desktop and tablet widths.
- [ ] The copy "year, department or field" no longer appears in `packages/`, the root and package docs, or `.adlc/context`. Where the sentence is kept, it reads "year, department or university". (The design bundle `docs/design/*.dc.html`, archived review packets and this REQ's own text are left unchanged.)

### Quality
- [ ] Reuses existing components and the REQ-005 search API where possible. New data goes through TanStack Query; colours, spacing and type come from tokens only (no hex values from design files).
- [ ] New page parts are lazy-loaded where they are not needed on first paint, within the existing ADR-08 rules (`LAZY_FEATURES`, `lazyRoutes.test`).
- [ ] Frontend and backend tests are updated or added and pass; `typecheck`, `lint`, `format:check`, `tokens:check` and `build` pass.
- [ ] Before the REQ is finished, screenshots of Home, Feed and the phone tab bar are taken at desktop and phone width in light and dark. Every difference from this spec is listed in the review and fixed or explicitly accepted by the user.

## Assumptions

- A1. A user with no alumni profile (a student, or an admin with none) gets a Profile tab that opens Account settings (`/me`), because there is no public profile to open. `STATUS: needs verification`
- A2. "Incomplete profile" means at least one of these is empty on the user's own record: photo, headline, job title, company, department, graduation year, bio. The progress bar is filled fields over total fields; the next step names the first missing one. Students are measured against the fields their account has. `STATUS: needs verification`
- A3. "Tablet width" is the existing 48rem breakpoint.
- A4. Suggestions are computed per request with no caching on the server. They exclude nobody else (no "already seen" memory).
- A5. Home's posts come from `GET /api/posts?limit=3`; no new posts endpoint is needed.
- A6. No database migration is needed; every field already exists.

## Open questions

- [ ] None that block the gate. A1 and A2 are decisions to confirm.

## Out of scope (for now)

- Connections, follow or message actions on suggestions.
- Dismissing or refreshing a suggestion.
- Server-side caching or a dedicated recommendation score beyond department/university.
- A Privacy/Terms footer.

## Related

- Concepts: none
- Components: `features/directory/AlumniCard`, `features/feed/PostCard`, `features/feed/Byline`, `components/ui/Avatar`, `components/ui/Tag`, `app/AppShell/{MainNav,BottomTabs,navItems,SiteFooter}`
- Lessons: [[LESSON-REQ-008-6-copying-between-lazy-features-needs-a-home]] (a component shared by Home and the lazy Feed needs a shared home), [[LESSON-REQ-008-3-cross-feature-handover-through-config]], [[LESSON-REQ-009-1-profile-links-need-the-alumni-id]]
- ADRs: [[adr-01-ui-layer-headless-css-modules]], [[adr-02-server-state-tanstack-query]], [[adr-08-route-code-splitting-and-url-list-state]]

## Backlinks

_(populated by /wrapup or manually)_
