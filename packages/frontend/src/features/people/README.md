# features/people/

**Purpose:** short lists of people that more than one page shows (REQ-016). Today: the "Suggested alumni" card on Home and in the Feed sidebar, and the row that Home's "Mentors available" list reuses.

**What is here:**

- `PersonRow` — one person: avatar (`size="sm"`), name, "job title, company" (a missing part is left out, no stray comma; both missing hides the line) and an accent "Mentor" `Tag` only when `mentorship_available` is true. The whole row is one link to `profilePath(id)` (`/alumni/<id>`). It carries **no** directory router state, so the profile's "Back to directory" opens the plain directory. Each line is its own block element so the link's name reads with spaces (G27). `PersonRowSkeleton` is the decorative loading placeholder in the same shape.
- `SuggestedAlumni` — a `Card` (`<section>`, labelled by its title "Suggested alumni") listing `GET /api/alumni/suggestions` as `PersonRow`s. Props: `headingLevel` (2, 3 or 4; default 2) so the title fits the parent's outline, and `className` for placement. It owns its states, so a failure never reaches the parent: three skeleton rows with an announced "Loading suggestions…" (outside the `aria-busy` list), an `Alert` with Retry on error, a short note when the list is empty. A failed background refetch keeps the people already shown.
- `useSuggestedAlumni` — the TanStack Query hook, key `SUGGESTED_ALUMNI_KEY` = `['alumni', 'suggestions']`. It sits under `ALUMNI_QUERY_ROOT` so the admin page's invalidation of `['alumni']` refreshes it. Stale after 5 minutes (suggestions change slowly); the client's retry policy applies. Home and Feed share the one cache entry.
- `index.ts` — the public surface; import from `@/features/people`.

**Eager, not lazy.** This folder is not in `LAZY_FEATURES` (`eslint.config.js`, `app/lazyRoutes.test.ts`): eager Home and lazy Feed both import it, which is allowed. It ends up in the main bundle, so keep it small, and it must never import a lazy feature (`directory`, `profile`, `feed`, `me`, `about`, `admin`); the ESLint lazy ban already covers every file here. It does not reuse the directory's `AlumniCard`, which carries directory router state and a card layout.

**May import:** `@/components/ui/**`, `@/config/**`, `@/services/**`, `@/store/**`, `@/styles/**`, and types from `@alumni/shared`. Not `@/app/**` (tests may import its providers).

**Imported by:** `features/home` and `features/feed` (through `index.ts`).
