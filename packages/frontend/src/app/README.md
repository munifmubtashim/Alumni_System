# app/

**Purpose:** the application root:

- `App.tsx`: renders `RouterProvider` from `react-router/dom`, not `react-router`, so logout's `flushSync` navigation works (gotcha G08).
- Providers for TanStack Query and Jotai, and the shared `QueryClient`.
- The router: the path-less `RootLayout` holds two shells. `AuthShell` wraps `GuestOnly` → `/login`, `/register`; `AppShell` wraps `RequireAuth` → `/` (Home), the unknown-path route and test pages. Both guards come from `features/auth`.
- `RootLayout`: applies the theme and mounts `SessionBridge` once for every page, auth pages included. Don't mount it in a shell.
- The `AuthShell` layout: no header, only the `ThemeToggle` in the top-right corner, and `<main id="main">`.
- The `AppShell` layout: the header holds the `Logo` (with `BRAND_NAME` from `@/config/brand`, linking home), `HeaderAuth` (Log in / Sign up for guests, a user menu with Log out when signed in).
- The route error element.

**May import:** anything in `src/` (`@/config/**`, `@/features/**`, `@/components/ui/**`, `@/store/**`, `@/services/**`, `@/styles/**`).

**Imported by:** only `src/main.tsx`. Nothing else may import from `app/`.
