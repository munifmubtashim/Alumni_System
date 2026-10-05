# app/

**Purpose:** the application root:

- `App.tsx`: renders `RouterProvider` from `react-router/dom`, not `react-router`, so logout's `flushSync` navigation works (gotcha G08).
- Providers for TanStack Query and Jotai, and the shared `QueryClient`.
- The router: `/login` and `/register` sit under `GuestOnly`, and `/` (Home) sits under `RequireAuth`. Both guards come from `features/auth`.
- The `AppShell` layout: the header holds `HeaderAuth` (Log in / Sign up for guests, a user menu with Log out when signed in), and the shell mounts `SessionBridge` once.
- The route error element.

**May import:** anything in `src/` (`@/features/**`, `@/components/ui/**`, `@/store/**`, `@/services/**`, `@/styles/**`).

**Imported by:** only `src/main.tsx`. Nothing else may import from `app/`.
