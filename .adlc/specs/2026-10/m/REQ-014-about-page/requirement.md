---
kind: task
---
# Public About page at /about, linked from a site footer and the auth pages

| Field | Value |
|---|---|
| REQ | REQ-014 |
| Kind | task |
| Created | 2026-10-07 |
| Primary repo | alumni-system |
| Related | [[knowledge/lessons/LESSON-REQ-012-2-record-design-deviations\|L-REQ-012-2]] (record design deviations) · [[knowledge/gotchas#^g04\|G04]] · [[knowledge/gotchas#^g33\|G33]] · ADR-08 (lazy routes) · design `docs/design/screens/app/S7-*` |

## Goal

`/about` is a public page (no login) that follows `docs/design/screens/app/S7-*` at desktop and phone widths, light and dark: hero with the mission line, "How it works" in three steps, "For students" and "For alumni" cards, and a simple footer. It is reachable from a site footer and from the log-in and sign-up pages. Copy is honest about what Alma does today; no counts or statistics.

## Acceptance criteria

- [ ] AC1. A signed-out visitor who opens `/about` stays there (no redirect to `/login`) and sees the S7 sections; a signed-in user sees the same page inside the normal header. The route is lazy (own chunk, ADR-08) and listed in both `LAZY_FEATURES` guards.
- [ ] AC2. An "About" link reaches `/about` from the site footer (every page in the app shell) and from both `/login` and `/register`. Nothing on the page states a member, university or other count, and every claim matches a feature that exists.
- [ ] AC3. Styling uses design tokens only (lint passes, no hex). Screenshots of the page beside the S7 designs at desktop and phone width, light and dark, are compared; remaining differences are only the recorded deviations below.

## Scope / non-goals

- Frontend only: no API, auth logic, migration or new token. No Privacy/Terms pages (none exist).
- Not building the S7 "Admin" nav link, an About entry in the main nav, or any change to S1–S6 beyond the shared footer under them.

## Approach

- **Route:** `ABOUT_ROUTE` in `app/router.tsx` (path `about`, `lazy` import of `features/about/AboutPage`, own `HydrateFallback`), placed in the app-shell branch *outside* `RequireAuth`. `ABOUT_PATH` lives in `config/aboutPath.ts` so the footer and `AuthLayout` link without importing the lazy feature. Add `about` to `LAZY_FEATURES` in `eslint.config.js` and `app/lazyRoutes.test.ts`.
- **Page:** new `features/about/` (`AboutPage.tsx`, `AboutPage.module.css`, `AboutPage.test.tsx`, README): hero (h1 + lead), "How it works" ordered list of 3 steps, two benefit cards, centered columns capped like S7 (760/900px literals). Colors, type, spacing and radii from tokens; type sizes snap to the nearest type token.
- **Footer + links:** new `app/AppShell/SiteFooter.tsx` (© year Alma, About, Contact via `supportMailto`) rendered under `<main>` in `AppShell`; an "About Alma" link under the form in `features/auth/AuthLayout.tsx`.
- **Tests and docs:** page test (sections, 3 steps, no digits in copy beyond step numbers), route test (guest reaches `/about`), footer test, link assertions in the Login/Register tests; update `app/README.md`, `config/README.md`, `CLAUDE.md` routing line and the route-layout concept.

## Deliberate deviations from S7 (recorded per L-REQ-012-2)

1. Header is the real Alma `AppShell` header (Alma logo; Log in / Sign up for guests; real nav and avatar menu when signed in), not S7's "Alumni Network" header with an Admin link and "Go to app".
2. Footer has About and Contact (mailto); S7's Privacy and Terms are left out because those pages do not exist (S7 links them to `#`).
3. Copy: S7 desktop and phone use different wording; one wording serves every width. Two phrases promise things Alma lacks ("reach out to alumni" — there are no direct messages; "hires" — no jobs feature) and are reworded to match the feed and directory.
4. Hex in the S7 files is the old accent; colors map to tokens. Font sizes with no token (38/26/22/19px) use the nearest type token.
