# UI Redesign Plan

**Phase:** Construction: Bolt 3 implemented, awaiting review.
**Last updated:** 2026-10-01

## Goal
Build a responsive, consistent UI on Ant Design that uses the existing API modules. The redesign follows the CLAUDE.md UI Rules: ConfigProvider tokens, antd Grid, the `theme/ components/ layouts/ pages/ hooks/ services/` structure, typed props from `@alumni/shared`, and no API calls inside UI components.

---

## Current State

### Frontend (`packages/frontend/src`)
| Area | What exists | Gap vs. UI Rules |
|---|---|---|
| `App.tsx` | Routes: `/` → LoginPage, layout route (DashboardPage) → `/dashboard` (inline "Welcome!" div), `/posts` | No alumni, profile, or about routes. No 404 page. |
| `main.tsx` | Renders `<App/>` with no `ConfigProvider` | No theme setup |
| `components/Dashboard.tsx` | App shell: dark top `Menu` (Dashboard, Feed), fixed 200px `Sider` (Profile, My Posts, Settings, which link to routes that don't exist), Logout button | Hardcoded `#897d7d`/`white`/`minHeight: 1000`. The Sider never collapses, so it's unusable at 360px. No footer. It sits in `components/` but is really a layout. |
| `components/PostFeed.tsx` | Feed using antd `Listy` (virtual, fixed `height={600}`), create/edit modals, delete confirm, owner/admin menu | Calls `axios.get('/api/posts')` directly inside the component. Hardcoded `maxWidth: 600` and `height: 600`. "Comment" button does nothing. `media_url` is never rendered. |
| `components/LoginForm.tsx` | Horizontal form (`labelCol 8 / wrapperCol 16`), Remember-me checkbox that isn't used | Horizontal labels get cramped on mobile |
| `pages/LoginPage.tsx` | Centered `Card width: 400` | Hardcoded `#f0f2f5`, fixed width overflows at 360px, empty subtitle `Text` |
| `pages/DashboardPage.tsx`, `PostFeedPage.tsx` | Token check via `window.location.href` redirects | With no token, `DashboardPage` redirects to `/posts`, which then redirects to `/`. That's a double hard reload. |
| `services/` | `authApi.ts` (login, JWT decode, logout), `postsApi.ts` (create/update/delete) | No `getPosts`, no `alumniApi.ts` |
| `store/` | `postsAtom`, `postsLoadingAtom`, `postsHasMoreAtom`, `currentUserAtom` | n/a |
| `theme/`, `layouts/`, `hooks/` | **Don't exist** | All required by the UI Rules |
| `index.html` | `<title>frontend</title>` | Placeholder title |

### API endpoints: used vs. unused by the frontend
| Endpoint | Auth | Used by UI? | Notes |
|---|---|---|---|
| `POST /api/auth/login` | none | ✅ LoginForm | Returns `{ token }`. JWT payload is `{ sub, role }` with a 1h expiry. |
| `GET /api/posts?limit&offset` | none | ✅ PostFeed (direct axios) | ⚠️ The controller **ignores `limit`/`offset`** (`postManager.getAllPosts()` is called with no args). Every scroll refetches page 0. The client dedupes it, but `hasMore` never turns false. |
| `POST /api/posts` | none | ✅ | ⚠️ The backend reads `user_id` from the body, but the frontend doesn't send one, so the post gets no author. |
| `PUT /api/posts/:id`, `DELETE /api/posts/:id` | none | ✅ | Ownership is only checked client-side |
| `GET /api/posts/user/:id` | none | ❌ | Useful for "My Posts" and the profile page. It doesn't join `users`, so there's no `author_name`. |
| `GET /api/alumni` | none | ❌ | Returns raw `alumni_profile` rows: **no name, email, or photo** (no join with `users`). There's no server-side search or filter. |
| `GET /api/alumni/:id` | **JWT** | ❌ | The only alumni route that has auth. The `:id` is the `alumni_profile.id`, not the `user_id`. |
| `GET /api/alumni/email/:email` | none | ❌ | n/a |
| `POST /api/alumni`, `PUT /api/alumni/:id` | none | ❌ | ⚠️ `AlumniDTO`'s constructor takes `id` first, but the controller passes `user_id` first. Every field shifts by one on create. |
| `GET /api/users`, `GET /api/users/:id` | none | ❌ | ⚠️ Uses `SELECT *` and returns **password hashes** |
| `PUT /api/users/:id` | none | ❌ | Declared twice. The second (admin `updateAlumni`) is unreachable. |
| `DELETE /api/users/:id` | JWT + admin | ❌ | n/a |
| `GET/POST/PUT/DELETE /api/comments` | none | ❌ | There's no "comments for post X" endpoint. `updateComment` passes its args in the wrong order. |

### Shared types (`@alumni/shared`) vs. the DB/DTO shape
- `Alumni.graduation_year` vs. DB/DTO `graduation_yr`: **mismatch**. Typed UI code would read `undefined`.
- `Comment.posts_id` vs. DB/DTO `post_id`: **mismatch**.
- `User` includes `password`. The UI should never type against that field.
- `Alumni` has no name or photo, so an `AlumniCard` can't show who the alumnus is without a join or a second lookup.

### Serving / environment
- The Vite dev server has no `/api` proxy. Locally, the app runs behind Apache at `https://alumni.local` (`Alumni_local.sh`), which serves the built frontend and proxies `/api` to port 3000. Testing a bolt therefore needs `npm run build` + Apache, or a Vite proxy (see Open Question Q3).
- There's no test runner. Verification is manual plus `npm run build` (`tsc`) and `npx eslint .`.

---

## Scope
**In:**
- Design system (tokens + ConfigProvider)
- Responsive app layout (header/nav/footer)
- Login page restyle
- Post feed restyle
- Alumni directory (card grid), with search and filters
- Alumni profile page
- About page
- Minimal, explicitly approved fixes that a UI bolt needs to work: listed per bolt and marked **[BE]**

**Out (later):**
- Auth/authorization redesign (adding `authMiddleware` to routes, server-derived `user_id`, the `/me` endpoint, the password-hash leak)
- Admin screens
- Comments UI (needs a backend endpoint first)
- Profile editing
- Deployment
- A test framework

---

## Bolts
Each bolt is one session. At the end of each: show the diff, give a test checklist, wait for approval, then update this table.

| # | Bolt | Deliverables | Depends on | Status |
|---|---|---|---|---|
| 1 | **Design tokens + ConfigProvider** | `src/theme/tokens.ts` (brand colors, radius, font, spacing via antd `token` + component tokens), `src/theme/AppThemeProvider.tsx` wrapping `<App/>` in `main.tsx`. Remove hardcoded colors from `Dashboard.tsx` and `LoginPage.tsx` (swap in `theme.useToken()`). Set `index.html` title. | none | Done |
| 2 | **AppLayout: responsive header/nav/footer** | `src/layouts/AppLayout.tsx` (Header + Content + Footer) replaces `components/Dashboard.tsx`. Full `Menu` on `md+`, hamburger `Drawer` on `xs/sm` via `Grid.useBreakpoint`. Nav: Feed, Alumni, About, Logout. Drop the dead Sider links. A `RequireAuth` route wrapper (`<Navigate>`) replaces the `window.location` redirects in pages. `/dashboard` redirects to `/posts`. Add a 404 page. | 1 | Done |
| 3 | **Login page restyle** | Full-width card on `xs`, max-width on `md+` (`Row/Col`). Vertical form layout. Remove the unused Remember-me and empty subtitle. Uses `react-router` navigation instead of `window.location`. Login logic unchanged. | 1 | Done (awaiting review) |
| 4 | **Post feed restyle + extraction** | `services/postsApi.getPosts(limit, offset)`, `hooks/usePosts.ts` (moves the axios/jotai logic out of the component), `components/PostCard.tsx` (props: `Post`; avatar from `author_photo`, relative date, `media_url` image), `components/PostFormModal.tsx` (one modal for create + edit, antd `Form` with validation). Feed width via `Col` breakpoints. Replace the fixed `height={600}` with a viewport-relative height. Hide the dead "Comment" button. **[BE]** one-line fix: pass `limit, offset` through `PostController.getAllPosts`. **[BE?]** send `user_id` from `currentUser` on create (see Q2). | 2 | Pending |
| 5 | **Alumni directory card grid** | `services/alumniApi.ts`, `hooks/useAlumni.ts`, `components/AlumniCard.tsx` (props from `@alumni/shared`), `pages/AlumniListPage.tsx`, route `/alumni`. Grid `Row gutter` + `Col xs=24 sm=12 lg=8 xl=6`. Loading `Skeleton`, `Empty`, and error states. **[shared]** fix `graduation_year` → `graduation_yr`, add optional `name`/`photo_url`/`email` to `Alumni`. **[BE]** join `users` in `AlumniQuery.getAllAlumnil` to return name/photo/email (no password). See Q1. | 2 | Pending |
| 6 | **Search + filters** | `components/SearchBar.tsx` (`Input.Search`, debounced), `components/FilterPanel.tsx` (department `Select`, graduation-year `Select`/range, company), `hooks/useFilters.ts` (state synced to URL query params), client-side filtering of `useAlumni` results. On mobile, `FilterPanel` goes in a `Drawer`. On `lg+`, it's a side `Col`. Clear-filters control + result count. | 5 | Pending |
| 7 | **Alumni profile page** | `pages/AlumniProfilePage.tsx`, route `/alumni/:id`. Header card (avatar, name, job title @ company, department, grad year, LinkedIn button), bio + experience `Descriptions`, and the person's posts via `GET /api/posts/user/:user_id` (reusing `PostCard`). Two-column on `lg+`, stacked on mobile. Sends the auth header (the route requires JWT). Handles 404/401. | 4, 5 | Pending |
| 8 | **About page** | `pages/AboutPage.tsx`, route `/about`. Static content (purpose, how to use, contact) with `Typography`, `Row/Col`. Copy to be supplied by you (see Q4). | 2 | Pending |

---

## Acceptance Criteria (every bolt)
- Works at **360 / 768 / 1280px** and at **200% zoom**, with no horizontal scroll.
- No hardcoded colors or sizes in components: colors, radii, and font sizes come from theme tokens. Spot-check with `grep -rnE "#[0-9a-fA-F]{3,6}|rgba?\(" src --include=*.tsx` (only `src/theme/` may match).
- Ant Design only. No new UI libraries.
- UI components take typed props from `@alumni/shared` and make no API calls (data comes via `hooks/` → `services/`).
- `npm run build` in `packages/frontend` passes (`tsc` + vite).
- `npx eslint .` adds no new errors in touched files.
- No console errors or warnings in the browser on the affected pages.
- Any **[BE]** change: if it touches `businessLogic`, rebuild it (`tsc` in `packages/backend/src/businessLogic`), and smoke-test the affected endpoint with curl/Postman.

---

## Open Questions (please answer before or during approval)
- **Q1 (Bolt 5):** Alumni cards need name/photo. Do you approve a small **[BE]** change: a `JOIN users` in `AlumniQuery.getAllAlumnil` (and `findAlumniById`) selecting `u.name, u.email, u.photo_url`? The alternative is the frontend fetching `/api/users` and joining client-side, which also pulls password hashes over the wire. I don't recommend that.
- **Q2 (Bolt 4):** New posts have no `user_id` today. Should the quick fix (frontend sends `currentUser.id`) go in now? The proper fix (server takes `user_id` from the JWT) is auth work and is currently out of scope.
- **Q3:** For testing bolts, should I add a Vite `server.proxy` for `/api` → `localhost:3000`, so `npm run dev` works? This is a small, config-only change. Or do you always test through Apache at `alumni.local`?
- **Q4 (Bolt 8):** What content should the About page have?
- **Q5:** Brand color, logo, or font preference for the tokens in Bolt 1? If you have none, I'll propose a neutral palette built on antd's default algorithm, with a dark-mode toggle deferred.
- **Q6:** CLAUDE.md says to update `docs/aidlc/plan.md`, but the plan lives at `aidlc/plan.md`. Which path is canonical?

## Known Issues Noted (not in this plan's scope)
- No auth on most write routes (posts, comments, alumni, users `PUT`).
- `GET /api/users*` returns password hashes.
- `AlumniDTO` constructor/controller argument shift on create.
- `CommentController.updateComment` passes `CommentDTO` args in the wrong order.
- There's no comments-by-post endpoint.
- Duplicate `PUT /api/users/:id` route.
- `console.log` of every row in `getAllAlumnil`/`getAllComments`/`getAllUsers`.

## Decisions Log
- 2026-10-01: UI library is **Ant Design only**, with theming via ConfigProvider tokens. This replaces the earlier "Tailwind / CSS modules" placeholder, per the CLAUDE.md UI Rules.
- 2026-10-01: Search/filter is **client-side** over `GET /api/alumni` (no server search endpoint exists). Revisit if alumni count grows past ~1–2k.
- 2026-10-01: `components/Dashboard.tsx` is to be replaced by `layouts/AppLayout.tsx`. The Sider links (Profile, My Posts, Settings) are dropped until those pages exist.
