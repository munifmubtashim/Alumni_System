# Component — frontend (`packages/frontend`)

| Field | Value |
|---|---|
| Path | `packages/frontend` |
| Owner | munifmubtashim |
| Status | current as of REQ-010 (2026-10-07) |

React 19 + Vite 8 + TypeScript 6 SPA, rebuilt from scratch in [[REQ-001]]. Since [[REQ-002]] it has log in (`/login`), sign up (`/register`) and a signed-in home (`/`), behind route guards. Since [[REQ-004]] it is branded **Alma**: login and sign-up are full-page split layouts without the app header (compact icon theme toggle top-right, pinned brand panel, borderless 380px form); signed-in pages keep the S1 header (logo, `MainNav` with "Directory", "Feed" and "My Profile" links, a user menu with name and email, View profile (alumni only), My Profile and Log out, compact theme toggle). Since [[REQ-006]] there is an alumni directory at `/directory` (lazy-loaded, search and filters in the URL, built on the REQ-005 API). Since [[REQ-008]] there is an alumni profile at `/alumni/:id` (the second lazy page; header, About, Education, Employment, Recent posts, a Back link that restores the directory search; [[knowledge/concepts/detail-page-pattern]]). Since [[REQ-009]] there is a post feed at `/feed` (the third lazy page). Since [[REQ-010]] there is My Profile at `/me` (the fourth lazy page): the signed-in user edits their own details and password, with a save bar, a leave prompt and a success toast. Since [[REQ-011]] alumni also edit a headline, location, degree, start year and a mentorship switch, shown on the profile page (headline, location, badge, degree with years) and as a Mentor tag on the directory card. Photo upload is not built (no API for it).

## Structure

- `src/app/` — `App` (`RouterProvider` from `react-router/dom`, [[knowledge/gotchas#^g08|G08]]), providers (TanStack Query + Jotai), `router.tsx` (the `directory`, `alumni/:id`, `feed` and `me` routes are `lazy`, each with its own `HydrateFallback`, [[architecture/adr-08-route-code-splitting-and-url-list-state|ADR-08]]; `createRoutes`: path-less `RootLayout` (mounts `SessionBridge` + `useApplyTheme`) → `AuthShell` (`GuestOnly` pages) and `AppShell` (header + `HeaderAuth`; `RequireAuth`, `*`, test pages), each with its own inner error layer — [[knowledge/concepts/route-layout]]), `RouteError`, `queryClient.ts`
- `src/config/` — `brand.ts` (`BRAND_NAME`, `SUPPORT_EMAIL`, `PASSWORD_RESET_SUBJECT`, `supportMailto`), `directoryReturn.ts`, `feedPath.ts`, `mePath.ts` (`ME_PATH`), `relativeTime.ts`; a lint-enforced leaf: imports nothing internal, and `components/ui` may not import it ([[architecture/adr-06-config-leaf-layer|ADR-06]]).. Only `main.tsx` imports it (lint-enforced; tests are exempt).
- `src/features/` — one folder per domain: `theme/` (`useApplyTheme`), `auth/` (session hooks, `SessionBridge`, guards, validation, error mapping, Login/Register pages), `home/` (`HomePage`), `profile/` (`ProfilePage`, `ProfileHeader`, `BackLink`, `ProfileStates`, `AboutSection`, `EducationSection`, `EmploymentSection`, `Timeline`, `RecentPosts` + `PostCard`, `format.ts`, `relativeTime.ts`, `useAlumniProfile`, `usePostsByUser`; lazy, no `index.ts`), `directory/` (`DirectoryPage`, `useAlumniSearch`, `params.ts` + `useDirectoryParams` (URL state), `FilterBar`, `FilterPopover`, `AlumniCard`, `ResultsGrid`, `DirectoryStates`, `Pagination`; no `index.ts`: the route imports `DirectoryPage` by file path), `feed/` (lazy, see its README), `me/` (`MePage`, `ProfileForm`, `PersonalSection`, `EducationSection`, `CareerSection`, `PasswordSection`, `SaveBar`, `LeavePrompt`, `useUpdateProfile`, `useLeaveGuard`, `validation.ts`, `profileErrors.ts`; lazy, no `index.ts`).
- `src/components/ui/` — Button (`loading`), ButtonLink, Input (`error`, `endAdornment`), PasswordInput (show/hide), Textarea (Input's label, helper and error contract; `rows` 4), Logo (inline SVG on token classes; `label`, `showWordmark`, `decorative`), Card, Tag, Alert, Menu, SegmentedControl (text or icon options; icon options get a Base UI Tooltip), Switch (Base UI on a native button; `label`, optional `description`, controlled `checked`; REQ-011), ThemeToggle (`variant` full / compact), Avatar (photo or initials; sizes md, sm, xs, lg), Chip (removable), Skeleton, SearchField, Popover (Base UI; controlled `open`), Toast (success message in a `role="status"` region with a dismiss button; the caller owns the timer), VisuallyHidden, plus the shared `cx.ts` class joiner (reuse it; don't write another). Props in, events out; no services or store imports.
- `src/store/` — Jotai atoms (`themePreferenceAtom`, `sessionNoticeAtom`).
- `src/services/` — `httpClient.ts` (one axios instance, attaches the token, `setUnauthorizedHandler` 401 hook), `authToken.ts` (the only home of the token; `subscribe`, `getLiveToken`, expiry), `authApi.ts` (`login`, `register`, `getMe`, `updateMyProfile`, `changePassword`), `alumniApi.ts` (`searchAlumni`, `getAlumniProfile`, `getPostsByUser`), `httpErrors.ts` (`isNotFoundError`).
- `src/styles/` — generated `tokens.css`, `global.css`, `contrast.test.ts`.
- `scripts/` — `generate-tokens.ts`, plus Node-side tests (`enforcement.test.ts`, `generate-tokens.test.ts`).

## Decisions and rules

- UI: [[architecture/adr-01-ui-layer-headless-css-modules|ADR-01]] — own primitives on CSS Modules + tokens; Base UI for complex behavior.
- State: [[architecture/adr-02-server-state-tanstack-query|ADR-02]] — TanStack Query for server data, Jotai for client-only state.
- Session and 401s: [[architecture/adr-03-frontend-session-and-401-handling|ADR-03]], [[knowledge/concepts/session-and-401]].
- Forms: [[architecture/adr-04-forms-without-a-library|ADR-04]] — controlled inputs, pure validators, `useMutation`; no form library.
- Code splitting and list state in the URL: [[architecture/adr-08-route-code-splitting-and-url-list-state|ADR-08]].
- Tokens: [[knowledge/concepts/design-tokens]].
- Toolchain pins: TypeScript ~6.0, ESLint 9, jsdom 29 — see [[knowledge/lessons/LESSON-REQ-001-1]].

## Gotchas

[[knowledge/gotchas#^g01|G01]] theme key duplicated · [[knowledge/gotchas#^g02|G02]] vitest nesting · [[knowledge/gotchas#^g03|G03]] standalone tsconfigs · [[knowledge/gotchas#^g04|G04]] Stylelint numbers / `:where()` · [[knowledge/gotchas#^g05|G05]] Base UI radio · [[knowledge/gotchas#^g06|G06]] token script · [[knowledge/gotchas#^g07|G07]] lint self-test · [[knowledge/gotchas#^g08|G08]] react-router/dom · [[knowledge/gotchas#^g09|G09]] Base UI menu · [[knowledge/gotchas#^g10|G10]] lint spellings · [[knowledge/gotchas#^g11|G11]] axios test adapter · [[knowledge/gotchas#^g12|G12]] session test traps · [[knowledge/gotchas#^g17|G17]] Tooltip on a Radio · [[knowledge/gotchas#^g18|G18]] `hidden` vs `display` · [[knowledge/gotchas#^g19|G19]] auth/shell test traps · [[knowledge/gotchas#^g20|G20]] index.html copies · [[knowledge/gotchas#^g25|G25]] Base UI Popover · [[knowledge/gotchas#^g26|G26]] list-page test traps · [[knowledge/gotchas#^g27|G27]] component and lint traps · [[knowledge/gotchas#^g28|G28]] type-aware lint traps · [[knowledge/gotchas#^g29|G29]] test traps · [[knowledge/gotchas#^g30|G30]] CSS override order and live regions

## Touched by

- [[REQ-001]] — foundation rebuild
- [[REQ-002]] — login, sign-up, session, header user menu, signed-in home
- [[REQ-004]] — Alma rebrand; full-page auth layout; RootLayout/AuthShell; config/ leaf; Logo, PasswordInput, compact ThemeToggle
- [[REQ-006]] — alumni directory page (`/directory`), lazy route, `MainNav`, Avatar/Chip/Skeleton/SearchField/Popover/VisuallyHidden, `alumniApi`
- [[REQ-007]] — S1 shell: `BottomTabs`, `navItems` (`NAV_ITEMS`), avatar menu in the header, compact ThemeToggle in the header, Menu `label` / `MenuSeparator`, Avatar `xs`, Home quick-link cards
- [[REQ-008]] — alumni profile page (`/alumni/:id`), second lazy route, `features/profile`, `config/directoryReturn`, `httpErrors`, Avatar `lg`, per-feature lazy bans
- [[REQ-009]] — post feed page (`/feed`), third lazy route, `features/feed` (composer, posts, comment threads, owner-or-admin edit and delete), `services/postsApi`, `config/relativeTime` + `feedPath`, Menu `tone="danger"`, Feed in nav, tab bar and Home; optimistic writes ([[architecture/adr-09-optimistic-updates-by-cache-edit|ADR-09]])
- [[REQ-010]] — My Profile page (`/me`), fourth lazy route, `features/me` (form, save bar, leave prompt, toast), `config/mePath`, Textarea and Toast primitives, `authApi` `updateMyProfile`/`changePassword`, My Profile in nav, tab bar, avatar menu (with View profile) and Home, `--tab-bar-height` on `AppShell`
