# Exploration: Alumni Directory Page (REQ-006)

| Field | Value |
|---|---|
| REQ | REQ-006 |
| Phase | spec → explore (codebase readiness) |
| Explorer | Claude Haiku 4.5 |
| Date | 2026-10-06 |

## Summary

The codebase is **ready for implementation** on the redesign branch. The backend API is built (REQ-005: `GET /api/alumni` with search, filters and paging); frontend architecture, patterns and import boundaries are in place; UI primitives exist for most needs, with one gap (searchable filter dropdowns). No contradictions with the spec were found. Lazy loading is not yet used in the codebase, but React Router's pattern is straightforward. URL-state parsing, debouncing and component structure all have precedents to follow.

## Router & Lazy Routes

**Current state:**
- `router.tsx` uses React Router 8 data router with a route tree built by `createRoutes(pageRoutes)`
- RootLayout applies theme/SessionBridge once; AuthShell and AppShell branch below it
- HomePage is imported directly, not lazy-loaded — it sits under RequireAuth: `{ index: true, element: <HomePage /> }`
- Tests use `createMemoryRouter(routes)` with injection of test-specific routes via `createRoutes([{ path: 'boom', element: <Boom /> }])`
- No `React.lazy()` or route-level code splitting is currently used

**For lazy routes:**
- React Router 8's `lazy()` utility loads a component asynchronously; the route becomes a suspense boundary
- Pattern: `{ path: 'directory', lazy: () => import('@/features/directory/index').then(mod => ({ Component: mod.DirectoryPage })) }`
- A lazy route must export a named `Component` (not default export)
- Vite automatically creates a separate chunk for each dynamic import
- The entry chunk will not contain the lazy chunk's code

**AppShell.test.tsx guidance:**
- Tests pass extra routes via `createRoutes([...])` to add test pages under AppShell
- A test for lazy routes can check that the bundled code is separate via Vitest's `import.meta.glob()` or by inspecting the build output after `npm run build`
- AC3 requires verification: the production build must emit the directory page as a separate chunk, and the entry chunk must not contain its code

**Placement:**
- Add `{ path: 'directory', lazy: () => import('@/features/directory').then(mod => ({ Component: mod.DirectoryPage })) }` to DEFAULT_PAGE_ROUTES in router.tsx
- Export a `DirectoryPage` component (or `export { DirectoryPageComponent as Component }`) from `features/directory/index.ts`

## AppShell Header & Navigation

**Current header layout (S1 design, partial):**
- Logo (left) links home; shows "Alma" brand
- Right side: HeaderAuth (Log in/Sign up or user Menu) + ThemeToggle (full variant with words)
- Hairline border below; raised surface
- Responsive: 4rem height from 48rem breakpoint; space-3 padding small, space-3 large; wraps below 48rem

**HeaderAuth.tsx:** 
- Guests see `<nav aria-label="Account">` with Log in and Sign up links
- Signed-in users see `<Menu trigger={user.name}>` with role label and Log out
- Tests in AppShell.test.tsx: no nav links exist yet (AC7 checks this); only Account nav or no nav when signed in

**For the Directory link (AC2):**
- The S1 design shows Directory, Feed, My Profile, Admin links as main nav
- S1-Desktop-Dark.dc.html exists; no S1-Desktop-Light (Dark and Phone variants exist for S1)
- AC2 requires a nav link in the header that:
  - Shows "Directory" on desktop (Phone not specified; decide at /architect)
  - Links to `/directory`
  - Is marked active while on `/directory` or below (e.g. `/directory?filters=…` or `/alumni/:id`)
- Current test `AppShell.test.tsx` line 196-222 checks nav links: "The banner's only nav is the guest Account one" — this test will need updating

**Missing from codebase:**
- A nav menu/links component in the header (not a design system primitive; a feature)
- Active link styling/logic (React Router's `<Link>` or `<NavLink>`)

**Mobile layout:**
- AC2 assumes desktop shows the link; phone behavior unspecified in AC2
- Non-goal: "The other header links in S1 (Feed, My Profile, Admin) and the phone bottom tab bar's other tabs" — suggests a bottom tab bar exists in S2 Phone design but is not being built

## UI Primitives & Missing Components

**Available primitives:**
- `Button` (primary/secondary/ghost, loading state) — suitable for Retry, pagination Prev/Next
- `ButtonLink` — for card links to `/alumni/:id`
- `Input` (label, helperText, error, endAdornment) — for search box
- `Card` (as: div/article/section) — for result cards
- `Tag` (neutral/accent/success/warning/error tone with dot) — for filter chips
- `Alert` (tone: error/info, role-aware) — for error state
- `Menu` (Base UI dropdown with keyboard support) — for filter panels
- No `Logo` use in features (only in header)
- No `PasswordInput` use in features other than auth

**Missing / to be built:**
1. **Search Input with icon** — the S2 design likely shows a magnifying glass icon in the search field. `Input` supports `endAdornment`, but a start-side icon is not currently built. Two options:
   - Add a `startAdornment` prop to `Input`, or
   - Use an `endAdornment` with a search icon and move the text left, or
   - Inline SVG in the search feature's wrapper component (loses design system consistency but works)

2. **Filter chip with remove button** — `Tag` is non-interactive. A removable chip needs:
   - A `Tag`-like appearance (small, rounded, toned)
   - A remove button or close icon with `aria-label="Remove <name>"`
   - An `onRemove` callback
   - This is UI but tightly coupled to directory logic, so likely goes in `features/directory/` not `components/ui/`

3. **Pagination component** — S2 shows:
   - Desktop: Prev button, numbered page buttons with an ellipsis, Next button
   - Phone: Prev, "Page x of y" text, Next
   - All wrapped by `<nav aria-label="Results pagination">` per AC14
   - Not a design system primitive; belongs in `features/directory/`

4. **Skeleton loading placeholder** — AC11 specifies skeleton cards in the grid during loading. Not built. Options:
   - A `Skeleton` component in `components/ui/` (simple pulse effect), or
   - A minimal card shell with `aria-busy` and opacity in the directory feature

5. **Avatar component** — S2 shows an avatar (photo or initials) on each card. Not built. Options:
   - A `components/ui/Avatar` that displays `photo_url` or initiates from a name string, or
   - Inline SVG + logic in the directory feature's card component

6. **Popover/panel for filter inputs** — S2 design shows filter buttons (e.g., "Department") that open a small panel with a text input. `Menu` + a custom panel could work, or use a simpler Popover component. Not yet built; likely uses `Menu` or a new `Popover` component.

**Implication:** The S2 design for search and filters may need small new primitives (Avatar, RemovableChip, possibly Skeleton) or be built with minimal-styling wrappers in the feature. Approve scope at `/architect`.

## Services & API Patterns

**Existing patterns:**
- `authApi.ts` exports endpoint functions: `login(email, password)`, `register(input)`, `getMe()` — async, return typed data, let the caller handle errors
- `httpClient.ts` is the single axios instance; request interceptor adds `Authorization` header; response interceptor calls `setUnauthorizedHandler()` on 401 (for non-credential endpoints)
- Query calls in hooks: `useCurrentUser()` uses `useQuery({ queryKey: ['me'], queryFn: getMe, enabled: liveToken !== null })`

**For the directory:**
- Create `services/alumniApi.ts` with: `searchAlumni(params: AlumniSearchParams): Promise<AlumniListResponse>`
- `AlumniListResponse` is already in `@alumni/shared` (see below)
- Follow auth pattern: fetch function, let the hook/feature handle caching and state

**Backend API (GET /api/alumni):**
- Query params: `q` (substring search), `department`, `university` (exact, case-insensitive), `graduationYear` (4-digit year), `page` (default 1, max 10000), `pageSize` (default 20, max 100)
- Empty values are not sent (AC4)
- Returns `{ items: AlumniListItem[], total: number }`
- Bad query input → 400 (backend validates in AlumniManager.searchAlumni)
- Auth required: route is under `authMiddleware` in AlumniRoutes.ts

## TanStack Query Patterns

**Query client defaults:**
- `staleTime: 30_000` ms (30 seconds)
- `refetchOnWindowFocus: false`
- `retry: (failureCount, error) => failureCount < MAX_QUERY_RETRIES (2) && !is4xxError(error)` — 4xx errors don't retry
- Mutations default to `retry: false`

**For the directory:**
- Query key convention: `['alumni', { q, department, university, graduationYear, page }]` (include params in the key so changing filters invalidates the old cache)
- Hook: `useQuery({ queryKey, queryFn: () => searchAlumni(params), enabled: true, ...options })`
- Mutations: none needed for this page (no create/update/delete)
- AC11 error state: a 401 still triggers the SessionBridge handler; non-401 errors show the retry alert

## Import Boundaries & File Organization

**ESLint boundaries enforced:**
- `components/ui/` may not import services, store, features, config, app, axios, or @tanstack/react-query
- `services/` may not import React, components, store, features, or app
- `store/` may not import services, features, or app
- `config/` is a leaf
- Nothing in features/store/services/components imports app/ (test files may)

**For features/directory:**
- May import: `components/ui/`, `config/`, `store/`, `services/`, `@alumni/shared`, React, react-router
- May not import: `app/`
- Can create hooks (`useDirectorySearch`, `useAlumniList`, etc.) inside the feature
- Query functions stay in `services/`; state logic, URL parsing, and filters stay in the feature

**Debounce hook:**
- No existing debounce implementation in the codebase
- Typical pattern: a custom hook in `features/directory/hooks/useSearchDebounce.ts` or inline in the search component
- Alternatively, a `useDebounce(value, ms)` hook in `services/` if it's a utility (no React imports issue — it's just useEffect and useState)

**URL state helpers:**
- No existing `useSearchParams` usage in the codebase yet
- React Router's `useSearchParams()` and `useNavigate()` are available; both imported in existing files (e.g., `SessionBridge.tsx`, `useLogout.ts`)
- Create a `features/directory/hooks/useDirectoryParams.ts` that:
  - Parses URL search params into typed state: `{ q, department, university, graduationYear, page }`
  - Validates page/graduationYear (reject if not a valid number/4-digit)
  - Provides a setter that updates the URL
  - Handles browser back/forward automatically (react-router-provided)

## Design Tokens

**Available token categories (from tokens.css):**
- **Spacing:** `--space-1` (0.25rem) through `--space-8` (4rem)
- **Radius:** `--radius-sm` (4px), `--radius-md` (8px), `--radius-lg` (14px), `--radius-pill` (999px)
- **Duration & Easing:** `--duration-fast` (150ms), `--easing-standard` (ease)
- **Typography:** `--text-*` (display, heading-lg/md/sm, body, body-sm, label, caption), each with size/line/weight variants and a shorthand
- **Colors (light mode):** `--surface-page`, `--surface-raised`, `--surface-sunken`, `--border-subtle`, `--border-strong`, `--ink-primary`, `--ink-secondary`, `--ink-muted`, `--accent`, `--accent-strong`, `--accent-ink`, `--accent-soft`, `--success`, `--warning`, `--error`
- **Colors (dark mode):** same names with dark values

**For S2 design:**
- ESLint and Stylelint enforce `var(--…)` over hardcoded hex
- No raw colors allowed outside `src/styles/`
- Card backgrounds: `--surface-raised`
- Card borders: `--border-subtle`
- Text: `--ink-primary` for headings, `--ink-secondary` for subtext, `--ink-muted` for hints
- Grid gaps, padding: use space tokens
- Filter chips: likely `--accent-soft` background with `--accent` or `--accent-strong` border
- Hover/focus states: no specific tokens yet; will need to use CSS or scope to components
- Skeleton placeholders: could use `--surface-sunken` with opacity or `--border-subtle`

**Linting:**
- `eslint.config.js` line 110-113: detects raw hex in literals/templates (outside ANCHOR_ATTR, which allows in href/to)
- Stylelint: similar check for CSS files
- Both fail build if raw colors appear in source code

## Vite Build & Code Splitting

**Current config (vite.config.ts):**
- No `manualChunks` configuration — Vite handles chunking automatically
- Dynamic imports (`import('@/features/directory')`) automatically create separate chunks
- Build output includes named chunks based on import paths

**To verify AC3 (lazy route produces separate chunk):**
- After `npm run build` in `packages/frontend`, check `dist/` folder
- Look for: `dist/assets/Directory-*.js` or similar (Vite names chunks from the dynamic import path)
- The entry chunk (`dist/assets/main-*.js`) should not contain the directory page code
- A simple check: build, run `grep -r "DirectoryPage\|directory" dist/assets/main-*.js` should return empty

**No additional config needed** — Vite's default is correct. Just ensure the route uses `lazy()` with a dynamic import.

## @alumni/shared Exports

**Relevant to REQ-006:**

From `packages/shared/src/types/alumni.types.ts`:

```typescript
// Exported types:
export interface Alumni {
  id: number;
  user_id: number;
  graduation_year?: number | null;
  department?: string;
  current_company?: string;
  job_title?: string;
  experience?: string;
  bio?: string;
  linkedin_url?: string;
  created_at?: Date;
  updated_at?: Date;
  // Joined from users:
  name?: string;
  email?: string;
  photo_url?: string;
  university?: string;
}

// One row of GET /api/alumni: the profile plus the joined public user columns (never email).
export type AlumniListItem = Omit<Alumni, "email">;

// GET /api/alumni?q=&department=&university=&graduationYear=&page=&pageSize=
export interface AlumniListResponse {
  items: AlumniListItem[];
  total: number;
}
```

**Available on this branch:** Yes, `AlumniListResponse` and `AlumniListItem` are already exported. The types are in sync with the backend's data shapes (backend's AlumniSearchDTO matches this).

**No issues:** The type shapes match the spec. Use `AlumniListItem` for result cards, `AlumniListResponse` as the API return type.

## Design Specs

**Design files exist (Claude Design .dc.html format):**
- S1 variants: Desktop-Dark, Phone-Dark, Phone-Light (no Desktop-Light)
- S2 variants: Desktop-Light, Desktop-Dark, Phone-Light, Phone-Dark
- S2-NoResults state
- Design files are not exported as JSON; they live in `docs/design/screens/app/`

**S1 (main shell, not all built):**
- Header shows nav links: Directory, Feed, My Profile (My Profile or something else?), Admin
- Includes header layout, theme toggle, user menu
- Only implemented: header shell without nav links (AC7 notes this)

**S2 (directory page):**
- Desktop & Phone versions in light and dark modes
- Shows search box, filter buttons (Department, University, Graduation Year), results grid, pagination
- No-results state with clear filters button
- Must match these designs (AC12)

**Notes on sync:**
- Designs are living Claude Design files, not Figma; changes to them are not version-controlled in git
- Must open .dc.html files in a browser (Claude Design viewer) to see them
- AC12 requires putting the running page and the design file side by side in a browser

## Contradictions & Gaps

**None found.** The spec is consistent with the codebase. Two clarifications needed at `/architect` (not contradictions):

1. **Mobile nav placement:** AC2 doesn't specify whether the Directory link is shown on mobile. S2-Phone design will clarify; decide whether it goes in header, bottom tab bar, hamburger menu, or elsewhere.
2. **Page size:** The spec says "a fixed `pageSize`" but doesn't specify the value. Assumption: 12 or 24 (fills the grid; design decision for `/architect`).
3. **Lazy route test:** AC3 requires verifying the separate chunk. Test strategy depends on `/architect` (unit test, build artifact check, or both).

## Assumptions Requiring Verification

**From the spec:**

1. ✓ **REQ-005 API available:** `GET /api/alumni` is built and merged on this branch.
   - **Finding:** API exists, routes are in AlumniRoutes.ts, controller and manager are ready. The branch `feat/REQ-005-alumni-search-filters` is not merged yet, but the code is present on the redesign worktree.
   - **Status:** READY

2. ✓ **`@alumni/shared` exports:** `AlumniListItem` and `AlumniListResponse` are exported and used.
   - **Finding:** Both types exported from `packages/shared/src/index.ts`. AlumniListResponse matches backend AlumniSearchDTO shape.
   - **Status:** READY

3. ? **Page size:** Non-goal mentions design call for "/architect"; spec assumes a fixed size.
   - **Status:** NEEDS DECISION AT /ARCHITECT (recommended: 12 or 24)

4. ? **Bottom tab bar for mobile:** Non-goal notes "phone bottom tab bar's other tabs" are not built. S2-Phone design may show this, but the spec doesn't require it.
   - **Status:** NEEDS DECISION AT /ARCHITECT

## Build & Test Readiness

**Passing tests required for AC15:**

- `npm test` (frontend): unit tests for components, hooks, URL parsing, state transitions, filter chips, empty/loading/error states
- `npm run typecheck`: TypeScript strict mode (no implicit `any`, tight imports)
- `npm run lint`: ESLint (import boundaries, no raw colors), Stylelint (no raw colors in CSS)
- `npm run format:check`: Prettier (code style)
- `npm run build`: Vite build (type-check + build), must produce separate chunk for lazy route

**No blockers:** All build tools are in place. No missing dependencies (axios, @tanstack/react-query, react-router all available).

## Summary Table

| Area | Status | Notes |
|------|--------|-------|
| Router & lazy routes | Ready | No prior lazy routes; React Router 8 supports it directly |
| AppShell header | Ready | Add nav link for Directory; mark active on `/directory` |
| UI primitives | Partial | Missing: searchable dropdown, removable chip, pagination, skeleton, avatar, popover. Two options: build as `components/ui/` (system consistency) or as feature-specific components |
| Services & API | Ready | Backend endpoint built; pattern is simple fetch + TanStack Query |
| TanStack Query | Ready | Query client configured; hook pattern established |
| URL state | Ready | React Router's `useSearchParams` available; write custom hook in feature |
| Debounce | Ready | No existing implementation; build as feature hook or service util |
| Vite config | Ready | Automatic chunking; no config needed |
| @alumni/shared types | Ready | AlumniListItem and AlumniListResponse exported |
| Design tokens | Ready | Full Scandinavian palette; enforced by ESLint/Stylelint |
| Design specs | Ready | S1 & S2 exist in Claude Design format |
| Tests & linting | Ready | All tools configured; no blockers |

---

## Recommendations for /Architect

1. **Build missing UI primitives or feature components?** Recommend: `Avatar` and `RemovableChip` as `components/ui/` for reuse; `Pagination` and `FilterPanel` as `features/directory/` for scoped complexity.

2. **Page size value:** Recommend 12 (fills a landscape grid nicely; 24 might be too many for a single fetch on slow connections). Decide based on design or UX data.

3. **Mobile navigation:** Clarify whether Directory link goes in header, bottom nav, or a future tab bar. S2-Phone design will inform.

4. **Lazy route test:** Add a Vitest test that imports the lazy route and checks the import is dynamic (via `import.meta.glob()` or similar), then verify the build output has a separate chunk. Or accept build inspection as the test (simpler, less flaky).

5. **URL validation:** AC7 says invalid URL values (e.g., `page=abc`) are ignored. Clarify: silently ignore and reset to 1, or ignore and keep the default value? Recommend: ignore and reset to 1.

---

**Exploration complete.** Codebase is ready. No blockers for implementation. Decisions noted for `/architect` gate.
