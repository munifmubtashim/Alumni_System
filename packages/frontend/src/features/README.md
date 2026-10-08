# features/

**Purpose:** one folder per domain. A feature owns its hooks, queries, and domain components, and wires UI primitives to state and services.

**Features today:**

- `theme/` — applies the light/dark/system preference to the page.
- `auth/` — session (token, current user, 401 handling via `SessionBridge`), route guards (`RequireAuth`, `GuestOnly`, and `RequireAdmin` with its 403 `ForbiddenPage`, REQ-015), `useIsAdmin` (what the nav and avatar menu read), login and sign-up pages in a shared `AuthLayout` (full-height page with no app header: brand panel beside the form from 60rem, only its logo row above the form below that), and `ForgotPasswordHelp` (support mailto message).
- `home/` — the signed-in home page: greeting and a quick-link card per page every signed-in user may open (the directory, the feed and Account settings; no admin card).
- `directory/` — the alumni directory page at `/directory` (REQ-006): search, filters and page live in the URL query string (`params.ts` parses it and ignores anything the API would reject; `useDirectoryParams` writes it back, filters and pages push history, typed search replaces it after 300 ms), `useAlumniSearch` (TanStack Query over `services/alumniApi`), and the page's own pieces (`AlumniCard`, `ResultsGrid`, `FilterBar`, `Pagination`, `DirectoryStates`). It has no `index.ts`: the page is loaded lazily, so nothing outside this folder may import it statically (ADR-08, enforced by ESLint and by `app/lazyRoutes.test.ts`).
- `profile/` — the alumni profile page at `/alumni/:id` (REQ-008): header, About, Education, Employment and Recent posts from `GET /api/alumni/:id` and `GET /api/posts/user/:userId`, with a "Back to directory" link that restores the directory search through `config/directoryReturn`. Lazy like `directory/` and also without an `index.ts` (ADR-08).
- `feed/` — the post feed at `/feed` (REQ-009): composer, posts with Load more, comment threads with one level of replies, edit and delete for the author or an admin, and optimistic writes that edit the query cache and undo on failure (ADR-09). Lazy and without an `index.ts`, like `directory/` and `profile/` (ADR-08). Details in its own README.
- `about/` — the public About page at `/about` (REQ-014): static hero, three steps and two cards; no API calls.
- `me/` — the signed-in user's Account settings page at `/me` (REQ-010; named in REQ-012): section cards from the `['me']` query, a sticky save bar while the form has unsaved changes, a leave warning and a success toast; Save sends `PUT /api/me` and, if a new password was typed, `PUT /api/me/password`. Lazy and without an `index.ts`, like the other three (ADR-08). Details in its own README.
- `admin/` — the admin page at `/admin` (REQ-015), admins only (behind `RequireAdmin`): four stat cards, a searchable, sortable, paged alumni table (cards on phones) with sort, search and page in the URL, an add/edit drawer and a delete confirmation, on `GET /api/admin/stats`, `GET /api/alumni` and `/api/admin/alumni`. Lazy and without an `index.ts` (ADR-08). Details, including the deliberate differences from S6, in [its own README](admin/README.md).

**May import:** `@/components/ui/**`, `@/config/**`, `@/store/**`, `@/services/**`, `@/styles/**`, and types from `@alumni/shared`. Not `@/app/**`.

**Imported by:** `app/` and other features. Exception: the lazy features `directory/`, `profile/`, `feed/`, `me/`, `about/` and `admin/` are reached only through their route's dynamic import in `app/router.tsx`. No other file may import them statically, and that includes each other: they meet only through `config/` (e.g. `relativeTime.ts`, which profile and feed both use).
