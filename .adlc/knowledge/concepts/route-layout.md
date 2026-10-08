# Concept — route layout: one root, two shells

| Field | Value |
|---|---|
| Status | current as of REQ-010 (2026-10-07) |
| Introduced in | [[REQ-004]] |
| Decision | [[architecture/adr-07-root-layout-and-headerless-auth\|ADR-07]] |

`packages/frontend/src/app/router.tsx` builds one tree:

```
/  RootLayout  (SessionBridge, useApplyTheme; outer errorElement)
 ├─ AuthShell  (<main>, compact ThemeToggle top-right)
 │   └─ (inner errorElement) → GuestOnly → /login, /register
 └─ AppShell   (skip link, S1 header: Logo, MainNav (signed in), compact ThemeToggle, HeaderAuth avatar menu; BottomTabs on phones)
     └─ (inner errorElement) → RequireAuth → / ; /directory, /feed, /alumni/:id, /me (each lazy + HydrateFallback) ; RequireAdmin → /admin (lazy; non-admin → 403 page) ; /about (lazy, public, outside RequireAuth) ; * ; createRoutes(testPages)
```

- **Effects live in the root.** Anything that must run on every page (session/401 handling, theme) mounts in `RootLayout`, exactly once ([[knowledge/lessons/LESSON-REQ-004-1-app-wide-effects-in-root-layout|L-REQ-004-1]], ADR-03).
- **Two error layers per shell.** The root's `errorElement` catches a shell crash (no chrome); each shell's path-less inner route keeps its chrome and shows page errors inside `<main>` ([[knowledge/lessons/LESSON-REQ-001-7-route-errors-pathless-layout|L-REQ-001-7]]).
- **Lazy pages.** `/directory`, `/feed`, `/alumni/:id`, `/me`, `/about` and `/admin` use the route's `lazy`; each one's `HydrateFallback` must be on its own route object, because the router stops rendering at the nearest route with a fallback (on the root it would hide the shell). A failed chunk shows the inner `RouteError`. The import guard (ESLint + `lazyRoutes.test.ts`) runs one check per lazy feature, so lazy features cannot import each other either. See [[architecture/adr-08-route-code-splitting-and-url-list-state|ADR-08]].
- **Page width ([[REQ-016]]).** `--page-max` (72rem, `styles/global.css` `:root`) is the shared cap for Home, Directory, Feed, Profile and the footer so their edges line up. Deliberate exceptions: Account settings (`/me`, 42.5rem), About (56.25rem) and Admin (full width) keep their own widths.
- **Phone tab bar height.** `AppShell` sets `--tab-bar-height` on the shell (0 from 48rem) and `BottomTabs` uses it as its min height, so a page's own fixed bottom bar (the `/me` save bar) can sit just above the tab bar.
- **Tests:** `createRoutes(pageRoutes)` puts test pages under `AppShell`. To test "a guest sees the header", use an unknown path, not `/login` ([[knowledge/gotchas#^g19|G19]]).

- **Deliberate design deviation ([[REQ-012]]).** `/me` is "Account settings" (the S1/S2/S3/S5 screens still draw "My Profile"): it is not in the header nav (reached from the avatar menu only; the Home card went in [[REQ-016]]) and the phone tab bar no longer has an Account tab: since [[REQ-016]] its last tab is "Profile" (the user's own `/alumni/<id>`, or `/me` when they have no alumni profile). `HEADER_NAV_ITEMS` and `TAB_NAV_ITEMS` in `app/AppShell/navItems.tsx` are separate lists so the two navs can differ.
- **Deliberate design deviation ([[REQ-013]]).** Account settings shows Start year at every width, although the S5 phone design has none: phones stack Degree, Start year, Graduation year, so no editable field is ever hidden.
- **Public About page and site footer ([[REQ-014]]).** `/about` sits in the `AppShell` branch outside `RequireAuth`, so guests see the Alma header with Log in / Sign up. Deliberate deviations from S7: the Alma header instead of S7's "Alumni Network" header (no Admin link, no "Go to app"); the footer has About and Contact, not Privacy and Terms (no such pages); one copy wording at every width (S7's desktop and phone texts differ) with "reach out" and "hires" reworded because Alma has no messaging or jobs; type sizes with no token (38/26/22px) are token sizes plus or minus a token step. `SiteFooter` shows under every `AppShell` page, which S1 to S6 do not draw. On a 390px phone the guest header wraps to two rows (toggle, Log in, Sign up); that is the shell's existing behaviour.

## Related

[[knowledge/concepts/session-and-401]] · [[knowledge/components/frontend]]
