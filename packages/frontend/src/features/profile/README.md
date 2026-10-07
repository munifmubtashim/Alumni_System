# features/profile/

**Purpose:** the alumni profile page at `/alumni/:id` (REQ-008, design `docs/design/screens/app/S3-*`).

**What is here:**

- `ProfilePage` — reads `:id`, runs `useAlumniProfile` and shows one state: loading (`ProfileSkeleton`), not found (`ProfileNotFound`; the API answers 404 for unknown and malformed ids), load error with Retry (`ProfileLoadError`), or the profile. Every state has its own `h1` (`tabIndex={-1}`) and tab title, and focus moves to the current `h1` when the state or the id changes. A 401 is handled globally (ADR-03).
- `BackLink` — "Back to directory", restoring the directory's search through router state read by `config/directoryReturn`. Below 48rem the text is visually hidden and an `aria-hidden` "Profile" title sits beside the arrow.
- `ProfileHeader` — avatar (`size="lg"`, 72px on phone), the name as `h1`, the headline, a LinkedIn link only for a safe http(s) URL, and the tab title. Never shows the email.
- Sections: `AboutSection`, `EducationSection`, `EmploymentSection` (on a shared `Timeline`) and `RecentPosts` (`PostCard`, `usePostsByUser`, newest 5). Each hides when it has no data; Recent posts owns its loading, error and empty states so a posts failure keeps the profile.
- Pure helpers: `format.ts` (`present`, `headline`, `educationLine`, `employmentTitle`, `safeLinkedInUrl`, `commentCountText`). `PostCard` takes its time text from `config/relativeTime` (shared with the feed).
- Hooks: `useAlumniProfile` (`['alumni','profile',id]`, no `placeholderData`), `usePostsByUser` (`['posts','user',userId]`, idle until the profile gives the `user_id`).

**May import:** `@/components/ui/**`, `@/config/**`, `@/services/**`, `@/store/**`, `@/styles/**`, and types from `@alumni/shared`. Not `@/app/**` (tests may import its providers). Not another lazy feature (`@/features/directory/**`, `@/features/feed/**`, `@/features/me/**`): lazy features meet only through `config/` (the directory through `config/directoryReturn`; ADR-06, ADR-08).

**Imported by:** only the lazy route's dynamic `import()` in `app/router.tsx` (ADR-08). There is no `index.ts`; nothing else may import this folder statically.
