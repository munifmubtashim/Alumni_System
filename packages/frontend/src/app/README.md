# app/

**Purpose:** the application root:

- `App.tsx`: renders `RouterProvider` from `react-router/dom`, not `react-router`, so logout's `flushSync` navigation works (gotcha G08).
- Providers for TanStack Query and Jotai, and the shared `QueryClient`.
- The router: the path-less `RootLayout` holds two shells. `AuthShell` wraps `GuestOnly` → `/login`, `/register`; `AppShell` wraps `RequireAuth` → `/` (Home) and `/directory`, plus the unknown-path route and test pages. Both guards come from `features/auth`.
- Lazy routes (ADR-08): `/directory` is loaded with the route's `lazy` (`DIRECTORY_ROUTE` in `router.tsx`), so the directory page is its own chunk. Only that dynamic `import('@/features/directory/DirectoryPage')` may reference `features/directory`; an ESLint rule (`@typescript-eslint/no-restricted-imports` in `eslint.config.js`; `import type` is allowed) rejects a static import of it anywhere else in `src/` except tests, and `lazyRoutes.test.ts` scans every file in `src/` (except that folder and tests) as a second check. A new large page follows the same pattern.
- `HydrateFallback`: the "Loading…" line shown in `<main>` while a lazy page's code loads on a direct visit. Set it as a static property of the lazy route object itself, never on the root or on what `lazy` returns: the router stops rendering at the nearest route that has one, so anywhere higher hides the shell. A client-side click to a lazy page shows no fallback (the old page stays until the code arrives). A chunk that fails to load shows the inner `RouteError`.
- `RootLayout`: applies the theme and mounts `SessionBridge` once for every page, auth pages included. Don't mount it in a shell.
- The `AuthShell` layout: no header, only the `ThemeToggle` in the top-right corner, and `<main id="main">`.
- The `AppShell` layout: the header holds the `Logo` (with `BRAND_NAME` from `@/config/brand`, linking home), `MainNav` (`<nav aria-label="Main">`, desktop only), the compact icon-only `ThemeToggle` (the one the login page uses) and `HeaderAuth` (Log in / Sign up for guests; for a signed-in user an avatar menu with their name, email and Log out). On phones (< 48rem) the nav is `BottomTabs` (`<nav aria-label="Main tabs">`, sticky at the bottom). Both read one `NAV_ITEMS` list (`navItems.tsx`), which holds only pages that exist: add Feed, Profile and Admin there when built. The shell follows `docs/design/screens/app/S1-*`; `main` is full width with S1 gutters and each page caps its own width (Home 65rem, Directory 72rem centred).
- The route error element.

**May import:** anything in `src/` (`@/config/**`, `@/features/**` except `features/directory`, which only the lazy route's dynamic import reaches, `@/components/ui/**`, `@/store/**`, `@/services/**`, `@/styles/**`).

**Imported by:** only `src/main.tsx`. Nothing else may import from `app/`.
