# features/profile/

**Purpose:** the alumni profile page at `/alumni/:id` (REQ-008, design `docs/design/screens/app/S3-*`).

**What is here:**

- `ProfilePage` — reads `:id`, runs `useAlumniProfile` and shows one state: loading (`ProfileSkeleton`), not found (`ProfileNotFound`; the API answers 404 for unknown and malformed ids), load error with Retry (`ProfileLoadError`), or the profile. Every state has its own `h1` (`tabIndex={-1}`) and tab title, and focus moves to the current `h1` when the state or the id changes. A 401 is handled globally (ADR-03).
- `BackLink` — "Back to directory", restoring the directory's search through router state read by `config/directoryReturn`. Below 48rem the text is visually hidden and an `aria-hidden` "Profile" title sits beside the arrow.
- `ProfileHeader` — avatar (`size="lg"`, 72px on phone), the name as `h1` with the "Available for mentorship" badge (its own sage pill drawn from the `success-soft` / `success-strong` tokens, not a `Tag`; only when `mentorship_available` is true; beside the name from 48rem, under the line on phone), the line "<headline> · Class of YYYY" (the alumnus's own `headline`, or "Job title at Company" when they wrote none), the location (with a pin from 48rem; on phone it is text only, as in S3), a LinkedIn link only for a safe http(s) URL, and the tab title. Each part hides when empty. Never shows the email.
- Sections: `AboutSection`, `EducationSection`, `EmploymentSection` (on a shared `Timeline`) and `RecentPosts` (`PostCard`, `usePostsByUser`, newest 5). Each hides when it has no data; Recent posts owns its loading, error and empty states so a posts failure keeps the profile.
- Pure helpers: `format.ts` (`headline`, `degreeLine` ("B.Sc. Product Design · 2013–2017"), `educationLine` (the degree line when there is a degree or start year, else "Department · Class of YYYY"), `employmentTitle`, `safeLinkedInUrl`, `commentCountText`). `PostCard` takes its time text from `config/relativeTime` (shared with the feed) and trims text with `config/text`'s `present`.
- Hooks: `useAlumniProfile` (`['alumni','profile',id]`, no `placeholderData`), `usePostsByUser` (`['posts','user',userId]`, idle until the profile gives the `user_id`).

**May import:** `@/components/ui/**`, `@/config/**`, `@/services/**`, `@/store/**`, `@/styles/**`, and types from `@alumni/shared`. Not `@/app/**` (tests may import its providers). Not another lazy feature (`@/features/directory/**`, `@/features/feed/**`, `@/features/me/**`, `@/features/about/**`, `@/features/admin/**`): lazy features meet only through `config/` (the directory through `config/directoryReturn`; ADR-06, ADR-08).

**Imported by:** only the lazy route's dynamic `import()` in `app/router.tsx` (ADR-08). There is no `index.ts`; nothing else may import this folder statically.
