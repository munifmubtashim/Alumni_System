# app/

**Purpose:** the application root — `App.tsx`, providers (TanStack Query + Jotai), the router, the shared `QueryClient`, the `AppShell` layout, and the route error element.

**May import:** anything in `src/` (`@/features/**`, `@/components/ui/**`, `@/store/**`, `@/services/**`, `@/styles/**`).

**Imported by:** only `src/main.tsx`. Nothing else may import from `app/`.
