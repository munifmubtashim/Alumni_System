# features/people/

**Purpose:** short lists of people that more than one page shows, and the section card they sit in (REQ-016). Today: the "Suggested alumni" card on Home and in the Feed sidebar, the row and list that Home's "Mentors available" reuses, and the card shell every Home section uses.

**What is here:**

- `PersonRow` — one person: avatar (`size="sm"`), name, "job title, company" (a missing part is left out, no stray comma; both missing hides the line) and an accent "Mentor" `Tag` only when `mentorship_available` is true. The whole row is one link to `profilePath(id)` (`/alumni/<id>`). It carries **no** directory router state, so the profile's "Back to directory" opens the plain directory. Each line is its own block element so the link's name reads with spaces (G27). The link is a CSS size container: in a row narrower than 16rem (the Feed sidebar at 48–64rem) the Mentor tag moves under the text so "role, company" keeps the full width (UI-001). `PersonRowSkeleton` is the decorative loading placeholder in the same shape.
- `PersonList` / `PersonListSkeleton` — a `<ul>` of `PersonRow`s (pulled out by the rows' own padding so the avatars line up with the heading), and `count` skeleton rows in an `aria-busy` box.
- `SectionCard` + `SectionLoadingStatus`, `SectionError`, `SectionEmpty` — the one section shell (QUAL-001): a `Card` (`<section>` named by its title; `headingLevel` 2, 3 or 4, default 2; an optional `action` link beside the title, with an optional fuller accessible `name`), a visually hidden loading status (place it outside the `aria-busy` skeletons so it is announced), an `Alert` with Retry under it, and a one-line empty note. `SuggestedAlumni` and Home's `LatestPosts` and `MentorsAvailable` all build on it, so a change to the error copy or layout is made once.
- `SuggestedAlumni` — a `SectionCard` (labelled by its title "Suggested alumni") listing `GET /api/alumni/suggestions` as `PersonRow`s. Props: `headingLevel` (2, 3 or 4; default 2) so the title fits the parent's outline, and `className` for placement. It owns its states, so a failure never reaches the parent: three skeleton rows with an announced "Loading suggestions…" (outside the `aria-busy` list), an `Alert` with Retry on error, a short note when the list is empty. A failed background refetch keeps the people already shown.
- `useSuggestedAlumni` — the TanStack Query hook, key `SUGGESTED_ALUMNI_KEY` = `['alumni', 'suggestions']`. It sits under `ALUMNI_QUERY_ROOT` so the admin page's invalidation of `['alumni']` refreshes it. Stale after 5 minutes (suggestions change slowly); the client's retry policy applies. Home and Feed share the one cache entry.
- `index.ts` — the public surface; import from `@/features/people`.

**Eager, not lazy.** This folder is not in `LAZY_FEATURES` (`eslint.config.js`, `app/lazyRoutes.test.ts`): eager Home and lazy Feed both import it, which is allowed. It ends up in the main bundle, so keep it small, and it must never import a lazy feature (`directory`, `profile`, `feed`, `me`, `about`, `admin`); the ESLint lazy ban already covers every file here. It does not reuse the directory's `AlumniCard`, which carries directory router state and a card layout.

**May import:** `@/components/ui/**`, `@/config/**`, `@/services/**`, `@/store/**`, `@/styles/**`, and types from `@alumni/shared`. Not `@/app/**` (tests may import its providers).

**Imported by:** `features/home` and `features/feed` (through `index.ts`); `features/me`'s save test reads `SUGGESTED_ALUMNI_KEY` to pin that a profile save marks the suggestions stale.

**Tests:** use the shared fake API in `src/test/fakeApi.tsx` (`mockApi`, `ok`, `fail`, `never`, `renderWithProviders`).
