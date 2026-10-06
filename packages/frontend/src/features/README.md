# features/

**Purpose:** one folder per domain. A feature owns its hooks, queries, and domain components, and wires UI primitives to state and services.

**Features today:**

- `theme/` — applies the light/dark/system preference to the page.
- `auth/` — session (token, current user, 401 handling via `SessionBridge`), route guards (`RequireAuth`, `GuestOnly`), login and sign-up pages in a shared `AuthLayout` (full-height page with no app header: brand panel beside the form from 60rem, only its logo row above the form below that), and `ForgotPasswordHelp` (support mailto message).
- `home/` — the signed-in home page: greeting and a quick-link card per existing page.
- `directory/` — the alumni directory page at `/directory` (REQ-006): search, filters and page live in the URL query string (`params.ts` parses it and ignores anything the API would reject; `useDirectoryParams` writes it back, filters and pages push history, typed search replaces it after 300 ms), `useAlumniSearch` (TanStack Query over `services/alumniApi`), and the page's own pieces (`AlumniCard`, `ResultsGrid`, `FilterBar`, `Pagination`, `DirectoryStates`). It has no `index.ts`: the page is loaded lazily, so nothing outside this folder may import it statically (ADR-08, enforced by ESLint and by `app/lazyRoutes.test.ts`).
- `profile/` — the alumni profile page at `/alumni/:id` (REQ-008): header, About, Education, Employment and Recent posts from `GET /api/alumni/:id` and `GET /api/posts/user/:userId`, with a "Back to directory" link that restores the directory search through `config/directoryReturn`. Lazy like `directory/` and also without an `index.ts` (ADR-08).

**May import:** `@/components/ui/**`, `@/config/**`, `@/store/**`, `@/services/**`, `@/styles/**`, and types from `@alumni/shared`. Not `@/app/**`.

**Imported by:** `app/` and other features. Exception: the lazy features `directory/` and `profile/` are reached only through their route's dynamic import in `app/router.tsx`. No other file may import them statically, and that includes each other: they meet only through `config/`.
