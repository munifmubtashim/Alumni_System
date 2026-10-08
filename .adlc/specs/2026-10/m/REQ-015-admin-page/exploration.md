# Exploration — Admin page at /admin: stats, alumni table, add, edit, delete

**Date:** 2026-10-07  
**Explored by:** Claude (Haiku)  
**For:** REQ-015

---

## Architecture & Codebase State

### Backend: Routes, Controllers, Managers, Queries

**Layer structure confirmed:** `packages/backend/src/` is organized as three npm workspaces:
- **`api/`** (`@alumni/api`) — Express app, routes, controllers
- **`businessLogic/`** (`@alumni/businesslogic`) — Managers, validation, business rules
- **`dal/`** (`@alumni/dal`) — Query classes, DTOs, database access

**Route files:** Each domain (Auth, Users, Alumni, Posts, Comments, Me) has a dedicated Routes file that binds HTTP verbs/paths to controller methods. `UserRoutes.ts` is the model: imported handlers are plain exported functions (not methods), not a class instance.

**Controllers:** Controllers are functions (not methods on a class today). Example from `UserController.ts`: `export const createUser`, `export const deleteUser`, etc. Each handler receives `req: Request, res: Response`, calls a Manager, and uses the shared `sendError(res, error)` to translate `AppError` → HTTP response.

**Managers:** `UserManager`, `AlumniManager`, `PostManager`, `CommentManager` are classes. Each owns business rules: `UserManager` does password hashing, login verification, and account creation; `AlumniManager` validates fields and delegates to `AlumniQuery`. Methods are async and throw `AppError(status, message)` for HTTP responses.

**Queries:** `UserQuery`, `AlumniQuery`, `PostQuery`, `CommentQuery` are classes in `@alumni/dal/query`. They hold raw parameterized SQL. DTOs are plain classes with a constructor (e.g., `AlumniDTO`, `UserDTO`). Key findings:
- **`UserQuery.createAlumniUser`** creates user + alumni row in one transaction (model for admin create with alumni).
- **`UserQuery.createUser`** creates user only, no profile row.
- **`AlumniQuery.searchAlumni`** runs `ORDER BY u.name, a.id` (name then alumni id for stable tie-break).
- **`PostQuery.deletePost`** deletes post only; cascade deletes comments via FK.
- **`CommentQuery.deleteComment`** runs in a transaction with `posts.comment_count` recount.

**Error middleware:** No centralized Express error middleware yet (noted as a follow-up in conventions). Controllers catch errors and call `sendError(res, error)`. `sendError.ts` maps:
- `AppError` → its `status` + `{ message }`
- Anything else → 500 `{ message: "Something went wrong" }`

**Auth middleware:** `authMiddleware.ts` verifies JWT and sets `req.user = { sub, role }`. Routes gate by role with `requireRole("admin")`, `requireRole("alumni")`. Public routes only: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/health`. All others use `router.use(authMiddleware)`.

**Guard test:** `routeGuard.test.ts` walks the Express app and fails if any route outside the public list answers without a token. It will catch missing `requireRole("admin")` on new admin routes and unguarded top-level middleware additions.

### Validation Patterns

**Backend validation in `packages/backend/src/businessLogic/src/validation.ts`:**
- `optionalText(value, field, max)` — trim, check length, return or throw `AppError(400)`.
- `requiredText(value, field, max)` — call `optionalText`, throw if falsy.
- `optionalYear(value, field)` — 4 digits, 1900 to now + 10, throw `AppError(400)` otherwise.
- `optionalBoolean(value, field)` — true/false only; `undefined` → false; anything else → throw.
- `validateAlumniFields(body)` — full replace (omitted text clears, omitted bool → false); throws on bad data or start_year > graduation_year.
- `parseAlumniSearch(query)` — parses the alumni directory query string; unknown keys ignored, bad values default (no 400).
- `requireId(value, what)` — malformed or >2147483647 → throw `AppError(404, "${what} not found")`.
- Paging constants: `DEFAULT_PAGE_SIZE = 20`, `MAX_PAGE_SIZE = 100`, `MAX_PAGE = 10000`. Helpers `singleQueryValue` and `pagingNumber` are private; a new paged endpoint should export them (noted in conventions).

**Frontend validation in `packages/frontend/src/features/me/validation.ts`:**
- Same limits as backend (hand copies: `NAME_MAX = 100`, `DEPARTMENT_MAX = 100`, etc.).
- `YEAR_ORDER_MESSAGE = "Graduation year can't be before the start year"` (matches backend).
- Type definitions: `ProfileValues`, `PasswordValues`, `MeErrors` (partial record of field → message).

### Database Schema & Cascade Delete Order

**Foreign keys with ON DELETE CASCADE:**
- `alumni.user_id` → `users.id` (delete user → alumni row)
- `students.user_id` → `users.id` (delete user → student row)
- `posts.user_id` → `users.id` (delete user → posts)
- `comments.user_id` → `users.id` (delete user → comments)
- `comments.post_id` → `posts.id` (delete post → comments on that post)
- `comments.parent_id` → `comments.id` (delete comment → reply comments)

**Delete order for admin removing a user:** Postgres handles all cascades atomically when the user is deleted, so a simple transaction `DELETE FROM users WHERE id = $1` followed by `COMMIT` removes the user + all alumni, posts, comments, and replies. Alternatively, explicit deletion order works but is unnecessary.

**Alumni fields (REQ-011):** `headline (VARCHAR 120)`, `location (VARCHAR 100)`, `degree (VARCHAR 100)`, `start_year (INTEGER)`, `mentorship_available (BOOLEAN NOT NULL DEFAULT false)`. All are on alumni table, never students.

---

## Frontend Architecture

### Router & Lazy Routes

**Router structure:** `packages/frontend/src/app/router.tsx` exports `routes` and `createAppRouter(opts?)`. Five lazy routes today:

| Name | Path | Component Import |
|---|---|---|
| Directory | `directory` | `@/features/directory/DirectoryPage` |
| Profile | `alumni/:id` | `@/features/profile/ProfilePage` |
| Feed | `feed` | `@/features/feed/FeedPage` |
| Me (Account) | `me` | `@/features/me/MePage` |
| About | `about` | `@/features/about/AboutPage` (public, outside `RequireAuth`) |

Each has `HydrateFallback` (the "Loading…" fallback) and a `lazy` function returning `{ Component }`.

**Lazy feature guard:** `lazyRoutes.test.ts` uses a regex `STATIC_IMPORT` to detect static imports (`import`/`export … from`) and bans them outside a feature's own folder. The test reads `LAZY_FEATURES` array (hardcoded list of five features) and fails if any file outside a feature imports it statically. The test also checks:
- All routes in the tree have `lazy`, `HydrateFallback`, no `Component` or `element`.
- The router's `import('…')` is found in `router.tsx`.

**For admin page (/admin):** Must add:
1. New entry to `LAZY_FEATURES` in `lazyRoutes.test.ts`: `{ name: 'admin', route: ADMIN_ROUTE, path: 'admin', dynamicImport: "import('@/features/admin/AdminPage')" }`.
2. `ADMIN_ROUTE` definition in `router.tsx` (with `HydrateFallback` and `lazy`).
3. Add it to `DEFAULT_PAGE_ROUTES` inside `RequireAuth`.
4. Import statements for `ADMIN_ROUTE` in `router.tsx`.
5. Never import `@/features/admin` statically outside the feature folder (except in `router.tsx`).

### AppShell Navigation

**File:** `packages/frontend/src/app/AppShell/navItems.tsx`

**Current nav items:**
- `HEADER_NAV_ITEMS` (desktop nav, S1's order): Directory, Feed. Account settings (/me) is deliberately left out; users reach it from the avatar menu and Home card.
- `TAB_NAV_ITEMS` (phone tab bar): Directory, Feed, Account.

**Pattern for admin:** Per requirement and S6, admin links must appear in three places:
1. **Avatar menu item:** "Admin settings" (label for menu, not link text).
2. **Desktop header nav:** "Admin" link, current-page underline on `/admin`.
3. **Phone tab bar:** "Admin" link with shield icon.

**Implementation approach:** Add admin link to both `HEADER_NAV_ITEMS` and `TAB_NAV_ITEMS` (with path `/admin`, label "Admin"). Menu item is added separately in the Menu component (not in `navItems.tsx`). ESLint may have import restrictions on navItems usage; verify they're not violated.

### Auth & Sessions

**Current user query:** `useCurrentUser()` (hook, uses TanStack Query `['me']` key) returns `{ data: MyProfile, isError, isFetching, … }`. `MyProfile` includes `has_alumni_profile` and `has_student_profile` booleans, so we can check role on the client.

**Role availability:** The `['me']` query from `services/authApi.ts` (`getMe`) returns a `MyProfile` (from `@alumni/shared/user.types.ts`). Checking the shared types — the role is likely not exposed on `MyProfile` (it's on `PublicUserRow` from the backend's DAL). **Status: needs verification** whether `role` is on `MyProfile` or requires a separate query. If not present, a 403 page can only show a generic message; the backend will prevent access.

**RequireAuth component:** Gates child routes to signed-in users; redirects guests to `/login` and returns them after login via `resolveFrom`. A 403 (signed in, wrong role) is caught at the page level.

### State Management

**Server data:** TanStack Query (`@tanstack/react-query`). Shared `QueryClient` in `app/queryClient.ts`. Mutations (create, update, delete) use `onMutate` for optimistic updates (editing the cache), `onError` to revert, and `onSettled` to invalidate when done.

**Client state:** Jotai atoms in `store/` (e.g., `themePreferenceAtom`, persisted under `localStorage['alumni.theme']`).

### Existing UI Primitives

**Custom primitives in `components/ui/`** (CSS Modules + design tokens only, no styled-components library):
- Button, ButtonLink
- Input, PasswordInput, Textarea
- Card, Chip, Tag, Skeleton
- Alert, Toast
- Avatar, Logo
- Menu, Popover, SegmentedControl, Switch, ThemeToggle
- SearchField
- VisuallyHidden

**Base UI components** (headless, behavior only):
- `Menu` (from `@base-ui/react/menu`)
- `Radio`, `RadioGroup` (used in `SegmentedControl`)
- `Tooltip` (used in `SegmentedControl`)
- `Switch` (from `@base-ui/react/switch`)
- `Popover` (from `@base-ui/react/popover`)

**Dialog/Drawer primitive status:** Not found in codebase. Base UI provides `@base-ui/react/dialog` (available in v1.8.0), but it is not currently used. **A Dialog or Drawer must be built or added.** Options:
1. Use Base UI's Dialog component (headless, behavior only; unstyled).
2. Build a custom Dialog/Drawer primitive using HTML `<dialog>` + Base UI's Popover or Dialog for behavior.
3. Use a simpler popup pattern (absolute positioned overlay).

**Recommendation:** Use Base UI's Dialog for modal behavior (focus trap, escape close, aria-modal) and wrap it in a custom Drawer styled primitive (CSS Modules). This aligns with how `Menu` and `Popover` are used.

### Directory Feature (Reusable Patterns)

**Files:** `packages/frontend/src/features/directory/`

**Params handling:** `params.ts` exports `parseDirectoryParams(search: URLSearchParams)` and `toSearchParams(params: DirectoryParams)`. These mirror the backend's rules (limits, year validation). Page defaults to 1, absent/invalid values are ignored (not errors).

**Search hook:** `useDirectoryParams()` reads URL and keeps client state for search, filters, and page. It provides `setQuery`, `setFilters`, `setPage`, `clearAll`. Typing example: `DirectoryParams` with optional filters and required page.

**Pagination component:** `Pagination.tsx` shows Prev/Next buttons and "Showing X of N" (unformatted count). Disabled states on edges.

**Fetching:** `useAlumniSearch(params)` calls TanStack Query hook that sends params to backend's `GET /api/alumni`. Returns `{ data: AlumniListResponse, isPending, isError, … }`.

**Sorting:** Not yet implemented in directory (REQ-015 requires it). Backend `searchAlumni` takes no sort param today; it always orders `u.name, a.id`. For admin page, a new optional `sort` and `order` param are needed (backend side).

**Reusable for admin table:** The params pattern, pagination component, and fetch/error states are direct models for the admin alumni table.

### Feed Delete Pattern

**File:** `packages/frontend/src/features/feed/FeedPage.tsx`

**Delete confirmation:** 
- If post has comments: inline confirm in the card (`confirmingDelete` state) before calling delete mutation.
- If post has no comments: delete immediately (no confirm).
- Confirm dialog is in the PostCard; parent tracks `confirmId` state.
- After delete: focus moves to page heading (post's card unmounts).

**API call:** `useDeletePost()` mutation via TanStack Query. On success, the feed is invalidated and refetched. On failure, message is shown in the card, not a toast.

**Pattern for admin delete:** REQ-015 uses a separate S6 dialog (not inline), always shows, trash icon in danger circle, danger button, Cancel / Delete buttons. This is different from feed (more formal, separate component).

### Me Feature Form Patterns

**File:** `packages/frontend/src/features/me/ProfileForm.tsx`

**Form approach:** Controlled state with managed errors. No form library (ADR-04). Errors object maps field name → message. Validation runs:
- On blur (field left).
- On submit (Save clicked).
- On password input change (only for password fields).

**Error display:** After blur or submit, error messages appear inline under the field. On submit failure, focus moves to the first invalid field using `flushSync`.

**Save bar:** Shows "Unsaved changes", Discard, and Save buttons while the form is dirty. Disappears on save success. Uses a toast for "All sections saved" caption. Blocks leaving with unsaved changes (`useBlocker` + browser confirm).

**Pattern for admin drawer:** Similar validation on form fields, but in a Drawer rather than a page. Errors show on blur/submit. Close button (×) asks for confirmation if anything was typed.

---

## Design System & Token Mapping

**File:** `packages/frontend/src/styles/tokens.css` (generated from `docs/design/design-system/tokens.json`)

**Available tokens:**

| Category | Token | Light | Dark | Usage |
|---|---|---|---|---|
| **Surfaces** | `surface-page` | #faf7f2 | #1d1a17 | Page background |
| | `surface-raised` | #ffffff | #272320 | Cards, modals |
| | `surface-sunken` | #f0ebe3 | #171412 | Input backgrounds |
| **Borders** | `border-subtle` | #e4dcd0 | #3a352f | Default hairline, card borders |
| | `border-strong` | #cfc4b4 | #4c453c | Hover/focus, input resting |
| **Text** | `ink-primary` | #2b2724 | #f1ece4 | Primary text |
| | `ink-secondary` | #6b6560 | #b7afa5 | Secondary text, labels |
| | `ink-muted` | #948c84 | #837b72 | Disabled, least emphasis |
| **Accent** | `accent` | #975c43 | #d08a66 | Primary buttons, active state |
| | `accent-strong` | #7a4734 | #e4a07c | Hover/pressed state |
| | `accent-ink` | #fdf8f3 | #1d1a17 | Text on accent background |
| | `accent-soft` | #f3e4d9 | #3a2c23 | Tint for selected tags, subtle highlights |
| **Semantic** | `success` | #5f7a56 | #93b188 | Positive status (muted sage) |
| | `success-soft` | #e9efe5 | #2a3326 | Sage tint background |
| | `success-strong` | #4f6947 | #93b188 | Text on sage tint |
| | `warning` | #a9813f | #d7ac6e | Caution status (muted ochre) |
| | `error` | #a3503f | #d1796a | Error / destructive (muted brick) |
| **Type** | `text-display`, `text-heading-lg`, `text-heading-md`, `text-heading-sm`, `text-body`, `text-body-sm`, `text-label`, `text-caption` | — | — | Full font stacks |
| **Spacing** | `space-1` to `space-8` | 4px to 64px | — | Grid-based spacing |
| **Radius** | `radius-sm`, `radius-md`, `radius-lg`, `radius-pill` | 4px, 8px, 14px, 999px | — | Border radius scale |
| **Motion** | `duration-fast` | 150ms | — | Transition speed |
| | `easing-standard` | ease | — | Default timing curve |

**Design file (S6):** `docs/design/screens/app/` contains:
- `S6-Desktop-Light.dc.html`, `S6-Desktop-Dark.dc.html` — main admin page layout.
- `S6-AddDrawer.dc.html` — "Add alumni" drawer.
- `S6-DeleteConfirm.dc.html` — delete dialog.
- `S6-Phone-Light.dc.html`, `S6-Phone-Dark.dc.html` — mobile layouts.

**Token mapping from S6 design notes (to be verified against the files):**
- Stat card backgrounds: `surface-raised` (cards over `surface-page`).
- Stat card borders: `border-subtle`.
- Table header / card header background: `surface-raised`.
- Table rows: alternating `surface-raised` and `surface-page` or no background.
- Hover state on table rows: `accent-soft` (subtle tint).
- Search field: `surface-sunken` background, `border-strong` focus.
- Buttons (primary): `accent` background, `accent-ink` text, `accent-strong` on hover.
- Buttons (secondary): `border-strong` border, `ink-primary` text, `accent-soft` background on hover.
- Buttons (danger/Delete): `error` background (to verify in S6), `accent-ink` text (to verify).
- Delete dialog background tint (overlay): No `error-soft` token found. Requirement notes S6 uses "danger-tinted circle" — may need to check design file for exact color or create a new token.
- Text: `ink-primary` (body), `ink-secondary` (metadata), `ink-muted` (disabled).
- Stats numbers: use thousands separator (CSS `list-style-type: decimal` or via JavaScript `Number.toLocaleString()`).

**Missing token:** S6 may use an "error tint" or "danger tint" for the delete dialog that isn't in `tokens.json`. **Status: needs verification** against the actual S6 design files (`.dc.html`).

---

## Seed Data

**File:** `db/seed/seed_demo_data.sql`

**Admin account included:** Yes.
- Email: `admin@alumni.test`
- Password: `Password123!`
- Name: `Admin Office`
- Role: `admin`
- University: `University of Dhaka`
- No alumni row (admins are not alumni).

Additional demo accounts exist (students, alumni) for testing. The seed script is re-runnable; it deletes all users except the one executing it (`munifmubtashim@gmail.com`) and recreates the demo set.

---

## Implementation Checklist & Considerations

### Backend

- [ ] **Admin stats endpoint:** `GET /api/admin/stats` (admin-only) returning:
  - Total alumni count (rows in `alumni` table).
  - Students count (rows in `students` table).
  - Posts count (rows in `posts` table).
  - Mentors available count (`alumni` rows where `mentorship_available = true`).
  - Endpoint should return `{ items: { totalAlumni, students, posts, mentorsAvailable } }` or similar.
  - Test: route guard test (401, 403 for non-admin), counts are correct.

- [ ] **Admin alumni search/sort endpoint:** New `sort` and `order` optional params on `GET /api/alumni`.
  - Whitelist allowed sort columns: `name`, `graduation_year` (no `department`, `university`, `mentor` per spec).
  - `order`: `asc` or `desc`.
  - Validation: unknown sort → 400; validation in `UserManager.parseAlumniSearch` or new helper.
  - Update `AlumniQuery.searchAlumni` to accept and apply sort/order.
  - Tie-break is always `a.id` (ensures stable paging).

- [ ] **Admin update alumni endpoint:** `PUT /api/admin/alumni/:id` (admin-only).
  - Takes subset of fields: name (from users), university, graduation_year, department, current_company, job_title.
  - Does NOT take email, role, password (per spec non-goals).
  - Does NOT take REQ-011 fields (headline, location, degree, start_year, mentorship_available).
  - Validates name/university/company/job fields via `validateUserBasics` + `validateAlumniFields`.
  - Returns updated alumni row with author fields (like the search endpoint).
  - Tests: 400 for bad data, 404 if alumni doesn't exist, 403 for non-admin, 200 for success.

- [ ] **Admin create alumni endpoint:** `POST /api/admin/alumni` (admin-only).
  - Takes: name (required), email (required), temporary password (required), university, graduation_year, department, current_company, job_title.
  - Creates user + alumni row in one transaction (model: `UserQuery.createAlumniUser`).
  - Password validation: `validateNewPassword` (8-72 chars).
  - Email must be unique: 409 "An account with this email already exists".
  - Returns the created user + alumni profile.
  - Tests: 400 for bad input, 409 for taken email, 201 on success.

- [ ] **Admin delete user endpoint:** `DELETE /api/admin/users/:id` (admin-only).
  - Deletes user + all related data (alumni, posts, comments cascade via FK).
  - Refuses 403 if the target is the requester ("You can't delete your own account").
  - Returns 404 if user doesn't exist.
  - Wraps deletion in a transaction for safety.
  - Tests: 400/404 for bad id, 403 for self-delete, 401/403 for non-admin, 200 on success, 404 if already deleted.

- [ ] **Update route guard test:** Ensure all three new endpoints are listed as `requireRole("admin")` and tested for 401 (no token) and 403 (non-admin).

### Frontend

- [ ] **New admin lazy route:** Add to `router.tsx`, `lazyRoutes.test.ts`, and `LAZY_FEATURES`.

- [ ] **Admin navigation links:** Update `navItems.tsx` (or merge into a single source) to add "Admin" to both `HEADER_NAV_ITEMS` and `TAB_NAV_ITEMS`. Add "/admin" item to avatar menu.

- [ ] **Forbidden page:** Build a 403 page inside AppShell for non-admins accessing `/admin`. Generic message: "You don't have access to this page" + link home.

- [ ] **Admin page structure:** `features/admin/AdminPage.tsx` with:
  - Stat cards (skeleton loading, error with Retry, live counts).
  - Alumni table (desktop) or card list (phone) with search, sort, paging, edit/delete per row.
  - "Add alumni" button.
  - Error states for all sections.

- [ ] **Stat cards:** `AdminStats.tsx` component, TanStack Query hook for `GET /api/admin/stats`.
  - On add/delete, refetch stats.
  - Format numbers with thousands separator: `count.toLocaleString()`.

- [ ] **Alumni table/list:** Reuse or adapt directory patterns.
  - Desktop: native `<table>` with sortable headers (click → toggle sort direction, show arrow icon).
  - Phone: cards (name, year · department, two icon buttons).
  - Search via `GET /api/alumni` with `q` param (existing).
  - Sort column + direction in URL query string (new params: `sort`, `order`).
  - Pagination: existing directory pattern.

- [ ] **Add alumni drawer:** 
  - Base UI Dialog (headless) + custom Drawer styled primitive (CSS Modules, `surface-raised` background, shadow).
  - 420px wide on desktop, full width on phone.
  - Fields: Full name, Email, Temporary password, University, Graduation year, Department, Current role (Company?), Company. (Spec says "Current role, Company" as two fields.)
  - Validation: error on blur/submit, focus to first invalid.
  - Close: × button, backdrop click, Escape (all ask for confirmation if text entered).
  - Focus trap during open, returns to trigger button after close.
  - On success: close drawer, toast "<name> added", refetch stats and table.
  - On error (409 taken email): show "An account with this email already exists" on Email field.

- [ ] **Edit drawer:** Same as Add, but:
  - No Email or Temporary password fields.
  - Prefill from the selected alumni row.
  - Title: "Edit alumni".
  - On save: send `PUT /api/admin/alumni/:id`, close drawer, toast "Changes saved".
  - On 404 (deleted meanwhile): toast/error "This alumni no longer exists", refresh table.

- [ ] **Delete dialog:**
  - S6 design: trash icon in danger-tinted circle, "Delete <name>?", descriptive text.
  - "This permanently removes their profile, posts, and comments from Alma. This action can't be undone."
  - Cancel button (default focus), danger "Delete alumni" button.
  - Escape and Cancel close it.
  - Focus moves to row's delete button (or table heading if row gone) after close.
  - Loading state on Delete button during request.
  - On success: close dialog, toast "<name> deleted", refetch stats and table.
  - On 403 (self-delete): show message in dialog, button disabled or closed.
  - On failure: show error message, dialog stays open.

- [ ] **Tests:**
  - Admin-only links visible for admins, hidden for non-admins.
  - 403 page shown to non-admins accessing `/admin`.
  - Lazy route test passes (no static imports of `admin` feature outside its folder).
  - Add drawer: validation, submit, error handling, close with confirmation.
  - Edit drawer: prefill, submit, error handling.
  - Delete dialog: confirm flow, loading state, error handling.
  - Sorting: clicking headers changes URL `sort` and `order` params, table reloads, arrow icons show.
  - Search: text input updates URL `q` param (debounce 300ms), returns to page 1.
  - Pagination: Prev/Next update page param, buttons disabled on edges, "Showing X of N" updates.
  - After add/delete, stats refresh without full page reload.
  - Stats loading/error states.
  - Phone layouts (drawer full width, card list, etc.).

### Design & Polish

- [ ] **Colors from S6:**
  - Map all hex values from design to tokens (or identify missing tokens).
  - Verify "danger tint" for delete dialog background (may need custom color or new token).
  - Error button: use `error` token or a custom tint based on design.

- [ ] **Responsive:** 360px–full width, 200% zoom no horizontal scroll. Desktop table may scroll internally; drawer full width on phone.

- [ ] **Comparison:** Before review, screenshot all pages (desktop/phone, light/dark) and compare with S6. Record any intentional deviations.

---

## Key Patterns & Gotchas

1. **Cascade deletes:** Postgres FKs handle all cascades atomically. Admin delete endpoint wraps `DELETE FROM users` in a transaction for safety, but explicit ordering is unnecessary.

2. **Validation syncing:** Directory params, form fields, and seed data all have hard-coded limits. Keep them in sync with backend (NAME_MAX, DEPARTMENT_MAX, etc.) — frontend defaults to backend's 400 message if they drift (ADR-04).

3. **Lazy feature lists:** Six places must be updated when adding admin page:
   - `LAZY_FEATURES` in `lazyRoutes.test.ts`
   - `ADMIN_ROUTE` definition in `router.tsx`
   - `DEFAULT_PAGE_ROUTES` in `router.tsx`
   - `import { ADMIN_ROUTE, … }` in `router.tsx`
   - `navItems.tsx` (header and tab bar)
   - Avatar menu (separate, in Menu component)

4. **Sorting on new paged endpoint:** Backend's `AlumniQuery.searchAlumni` must accept sort + order, apply via SQL, and always tie-break by `a.id`. Frontend sends params in URL; validation rejects unknown sort columns (400).

5. **Dialog/Drawer primitives:** Not yet in the codebase. Use Base UI's Dialog for behavior + custom Drawer styled component.

6. **URL-driven state:** Admin table's search, sort, and page live in the URL (ADR-08), like directory. Reload and Back preserve state.

7. **Optimistic updates:** Stats and table refetch on add/delete (no optimistic cache edit needed; full refetch is simple and correct).

8. **Admin's own row:** An admin has no alumni profile (only a user row with role='admin'), so their row never appears in the alumni table. Delete UI hides the Delete button on any row with no alumni or if it's the signed-in user (backend also refuses 403).

---

## Related Files & Patterns

- **Backend validation:** `packages/backend/src/businessLogic/src/validation.ts` (model for admin field validation).
- **Backend transactions:** `UserQuery.createAlumniUser` (model for admin create in a transaction).
- **Frontend params:** `packages/frontend/src/features/directory/params.ts` (model for URL-driven state).
- **Frontend forms:** `packages/frontend/src/features/me/ProfileForm.tsx`, `validation.ts` (model for form errors and validation).
- **Frontend mutations:** `packages/frontend/src/features/directory/useAlumniSearch.ts`, feed mutations (model for TanStack Query hooks).
- **Frontend delete:** `packages/frontend/src/features/feed/FeedPage.tsx` (inline confirm; admin delete is a separate dialog).
- **Seed data:** `db/seed/seed_demo_data.sql` (admin account exists for testing).

---

## Assumptions & Verification Status

- **Admin role exposure on ['me'] query:** The `MyProfile` type may not include `role`. If missing, frontend cannot check role; backend prevents access with 403. **STATUS: needs verification** by checking `@alumni/shared/user.types.ts`.
- **Error tint for delete dialog:** S6 shows a danger-tinted circle icon. Existing tokens include `error` but no `error-soft`. S6 design file must be checked for the exact color. **STATUS: needs verification** against `S6-DeleteConfirm.dc.html`.
- **Dialog component in Base UI 1.8.0:** Assumed to be available. **STATUS: needs verification** by checking Base UI docs or npm package.
- **Sort order whitelist:** Only `name` and `graduation_year` are sortable per spec. Backend validation must reject others. **STATUS: needs validation logic written**.
- **Thousands separator format:** JavaScript `Number.toLocaleString()` will use the user's locale (US: "1,234", many European locales: "1.234"). **Status: user may want a specific format** — check design or use a fixed `1,234` format.
- **Temporary password sharing:** Spec assumes admin shares the temporary password with the new user out-of-band (email, Slack, etc.). No email endpoint is in scope. **STATUS: needs verification** of process with user.

---

**End of exploration.**
