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
     └─ (inner errorElement) → RequireAuth → / ; /directory, /feed, /alumni/:id, /me (each lazy + HydrateFallback) ; * ; createRoutes(testPages)
```

- **Effects live in the root.** Anything that must run on every page (session/401 handling, theme) mounts in `RootLayout`, exactly once ([[knowledge/lessons/LESSON-REQ-004-1-app-wide-effects-in-root-layout|L-REQ-004-1]], ADR-03).
- **Two error layers per shell.** The root's `errorElement` catches a shell crash (no chrome); each shell's path-less inner route keeps its chrome and shows page errors inside `<main>` ([[knowledge/lessons/LESSON-REQ-001-7-route-errors-pathless-layout|L-REQ-001-7]]).
- **Lazy pages.** `/directory`, `/feed`, `/alumni/:id` and `/me` use the route's `lazy`; each one's `HydrateFallback` must be on its own route object, because the router stops rendering at the nearest route with a fallback (on the root it would hide the shell). A failed chunk shows the inner `RouteError`. The import guard (ESLint + `lazyRoutes.test.ts`) runs one check per lazy feature, so lazy features cannot import each other either. See [[architecture/adr-08-route-code-splitting-and-url-list-state|ADR-08]].
- **Phone tab bar height.** `AppShell` sets `--tab-bar-height` on the shell (0 from 48rem) and `BottomTabs` uses it as its min height, so a page's own fixed bottom bar (the `/me` save bar) can sit just above the tab bar.
- **Tests:** `createRoutes(pageRoutes)` puts test pages under `AppShell`. To test "a guest sees the header", use an unknown path, not `/login` ([[knowledge/gotchas#^g19|G19]]).

- **Deliberate design deviation ([[REQ-012]]).** `/me` is "Account settings" (the S1/S2/S3/S5 screens still draw "My Profile"): it is not in the header nav (reached from the avatar menu and the Home card) and the phone tab bar's third tab reads "Account". `HEADER_NAV_ITEMS` and `TAB_NAV_ITEMS` in `app/AppShell/navItems.tsx` are separate lists so the two navs can differ.

## Related

[[knowledge/concepts/session-and-401]] · [[knowledge/components/frontend]]
