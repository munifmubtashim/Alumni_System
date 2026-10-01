# UI Redesign Plan

**Phase:** Construction: Bolts 1–13, 15 and 16 done. **Bolt 14 plan approved, not started** (includes a DB migration you run).
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
- ~~`Alumni.graduation_year` vs. DTO `graduation_yr`~~. **Corrected in Bolt 5:** the real DB table is `alumni` with `graduation_year varchar(10)`, so the shared type has the right name. It's the **dal** (`alumni_profile`/`graduation_yr`) that's wrong. Fixed in Bolt 6.
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
- **Sign up** (safe self-registration as an alumnus)
- Alumni directory (card grid), with search and filters
- Alumni profile page
- **My Profile** (view and edit your own profile via `/api/me`)
- **Own-profile-only editing for every role**, and locking down the profile write endpoints (`PUT /api/users/:id`, `PUT /api/alumni/:id`). Bolt 9.1 pulls this part of the security work forward.
- About page
- The backend work that Bolts 5 and 9 need (new endpoints), plus minimal, explicitly approved fixes that a UI bolt needs to work. Both are listed per bolt and marked **[BE]**.

**Later (not in this plan):**
- **Comments:** editing comments (comments are in Bolt 15, one-level replies in Bolt 16).
- **Admin + security:**
  - Admin screens
  - `authMiddleware` on the remaining write routes (posts, comments; see Q10). Profile routes move into Bolt 9.1.
  - Server-derived `user_id` on posts
  - Removing password hashes from `/api/users*`
  - Email/password change, and a self-service password reset (tokens + email). Bolt 12 only adds a contact page.
  - Alumni verification/approval
  - Rate limiting
- Deployment
- A test framework

---

## Bolts
Each bolt is one session. At the end of each: show the diff, give a test checklist, wait for approval, then update this table.

| # | Bolt | Deliverables | Depends on | Status |
|---|---|---|---|---|
| 1 | **Design tokens + ConfigProvider** | `src/theme/tokens.ts` (brand colors, radius, font, spacing via antd `token` + component tokens), `src/theme/AppThemeProvider.tsx` wrapping `<App/>` in `main.tsx`. Remove hardcoded colors from `Dashboard.tsx` and `LoginPage.tsx` (swap in `theme.useToken()`). Set `index.html` title. | none | Done |
| 2 | **AppLayout: responsive header/nav/footer** | `src/layouts/AppLayout.tsx` (Header + Content + Footer) replaces `components/Dashboard.tsx`. Full `Menu` on `md+`, hamburger `Drawer` on `xs/sm` via `Grid.useBreakpoint`. Nav: Feed, Alumni, About, Logout. Drop the dead Sider links. A `RequireAuth` route wrapper (`<Navigate>`) replaces the `window.location` redirects in pages. `/dashboard` redirects to `/posts`. Add a 404 page. | 1 | Done |
| 3 | **Login page restyle** | Full-width card on `xs`, max-width on `md+` (`Row/Col`). Vertical form layout. Remove the unused Remember-me and empty subtitle. Uses `react-router` navigation instead of `window.location`. Login logic unchanged. | 1 | Done |
| 4 | **Post feed restyle + extraction** | `services/postsApi.getPosts(limit, offset)`, `hooks/usePosts.ts` (moves the axios/jotai logic out of the component), `components/PostCard.tsx` (props: `Post`; avatar from `author_photo`, relative date, `media_url` image), `components/PostFormModal.tsx` (one modal for create + edit, antd `Form` with validation). Feed width via `Col` breakpoints. Replace the fixed `height={600}` with a viewport-relative height. Hide the dead "Comment" button. **[BE]** one-line fix: pass `limit, offset` through `PostController.getAllPosts`. **[BE?]** send `user_id` from `currentUser` on create (see Q2). | 2 | Done |
| 5 | **Sign up** | **[BE]** `POST /api/auth/register` (public). Required: `name`, `email`, `password` (8–72 chars). Optional: `department`, `graduation_year`, `current_company`, `job_title`, `linkedin_url` (http/https). Validation lives in `UserManager.validateRegistration`, and errors return 400 `{ message }`. **Role is hardcoded to `'alumni'` in the SQL, and `role` in the body is ignored.** Password is bcrypt-hashed in the controller. **The `users` + `alumni` rows are created in one transaction** (`UserQuery.createAlumniUser`). Duplicate email (`users_email_key`) → **409**. Response: **201 `{ token, user }` (auto-login), with no `password`**. A new `AppError` class lives in businessLogic. **[shared]** `PublicUser`, `RegisterInput`, `AuthResponse`. **[FE]** `authApi.register`, `hooks/useRegister.ts`, `components/RegisterForm.tsx`, `pages/RegisterPage.tsx` at `/register`, with links between Login and Register. | 3 | Done |
| 6 | **Alumni directory card grid** | `services/alumniApi.ts`, `hooks/useAlumni.ts`, `components/AlumniCard.tsx` (props from `@alumni/shared`), `pages/AlumniListPage.tsx`, route `/alumni`. Grid `Row gutter` + `Col xs=24 sm=12 lg=8 xl=6`. Loading `Skeleton`, `Empty`, and error states. **[shared]** `Alumni.graduation_year` becomes `string` (DB is `varchar(10)`); add optional `name`/`photo_url`/`email`. **[BE]** Point `AlumniQuery`/`AlumniDTO` at the real table **`alumni`** and column **`graduation_year`** (they currently use the non-existent `alumni_profile`/`graduation_yr`, so every `/api/alumni` endpoint fails today), and join `users` for name/photo/email (no password). See Q1. | 2 | Done |
| 7 | **Search + filters** | `components/SearchBar.tsx` (`Input.Search`, debounced), `components/FilterPanel.tsx` (department `Select`, graduation-year `Select`/range, company), `hooks/useFilters.ts` (state synced to URL query params), client-side filtering of `useAlumni` results. On mobile, `FilterPanel` goes in a `Drawer`. On `lg+`, it's a side `Col`. Clear-filters control + result count. | 6 | Done |
| 8 | **Alumni profile page** | `pages/AlumniProfilePage.tsx`, route `/alumni/:id`. Header card (avatar, name, job title @ company, department, grad year, LinkedIn button), bio + experience `Descriptions`, and the person's posts via `GET /api/posts/user/:user_id` (reusing `PostCard`). Two-column on `lg+`, stacked on mobile. Sends the auth header (the route requires JWT). Handles 404/401. Build the header/details as a reusable `components/AlumniProfileView.tsx` for Bolt 9. | 4, 6 | Done |
| 9 | **My Profile** | **[BE]** `GET /api/me` and `PUT /api/me`, both behind `authMiddleware`. The user id comes **only from the JWT `sub`**, never from params or body. GET returns the user (no `password`) joined with their `alumni` row. PUT accepts an allowlist only: `name`, `photo_url`, `department`, `graduation_year`, `current_company`, `job_title`, `experience`, `bio`, `linkedin_url`. **`email`, `password`, `role`, `user_id`, `id` are ignored.** Validation → 400; no profile row → 404. The new route file is `routes/MeRoutes.ts`, with a controller, `UserManager.getMe/updateMe` (rebuild), and new dal queries. **[FE]** `services/meApi.ts`, `hooks/useMyProfile.ts`, `pages/MyProfilePage.tsx` at `/me`: view mode reuses `AlumniProfileView`, plus an Edit mode (antd `Form`) and Save/Cancel. "My Profile" goes in the AppLayout nav. Update CLAUDE.md's "there is no `/me` endpoint" note. | 2, 8 | Done |
| 9.1 | **Own-profile editing for all roles + lock down profile endpoints** | **Rule: every user (admin, alumni, student) can edit only their own profile. Nobody can edit someone else's profile, admins included.** **[BE] `/api/me` for every role:** `GET /api/me` returns 200 for any logged-in user. The response holds the public user fields (`user_id, name, email, photo_url, role`), a `has_alumni_profile` flag, and the alumni fields (null if there's no `alumni` row). It no longer returns 404 for admins/students. `PUT /api/me` with an alumni row works as in Bolt 9. **Without an alumni row, only `name` + `photo_url` are accepted and saved** (alumni fields are ignored and no row is created, so the user does **not** appear in the Alumni directory). email/password/role/ids are still always ignored. **[BE] Lock down `PUT /api/users/:id`:** add `authMiddleware`. **Owner-only**: `:id` must equal the JWT `sub`, otherwise **403**, even for admins. The field allowlist is `name` + `photo_url` only. It no longer writes `email`/`password` (it currently stores the password **unhashed**). Changing email/password stays in Later: security. **[BE] Lock down `PUT /api/alumni/:id`:** add `authMiddleware`. **Owner-only**: the row's `user_id` must equal the JWT `sub`, otherwise **403**. A missing row returns **404**. Use the same allowlist + validation as `/api/me` alumni fields (shared `UserManager` validators), and `user_id` can't be changed. **[BE]** Remove the duplicate, unreachable `PUT /api/users/:id` (admin `updateAlumni`) line in `UserRoutes.ts`. Ownership checks live in the businessLogic managers (`AppError(403)`), and controllers only map errors. **[shared]** `MyProfile` reshaped: `alumni_id: number \| null`, `has_alumni_profile: boolean`, and alumni fields optional. **[FE]** My Profile works for every role. Without an alumni profile, the view shows avatar, name, email, and a role tag (no About/alumni sections), and the edit form shows only Name + Photo URL. `AlumniProfileView` gains a way to hide the alumni sections. My posts are still shown. **Verify (curl):** user A → `PUT /api/users/<B>` and `PUT /api/alumni/<B's row>` = 403. An admin editing another user = 403. No token = 401. The owner = 200. password/email/role in the body are ignored. A student/admin `GET/PUT /api/me` = 200, and only name/photo change. | 9 | Done |
| 10 | **About page** | `pages/AboutPage.tsx`, route `/about`. Sections (per Q4): What it is, Purpose, Features, Who can join, Contact. The **placeholder copy lives in `src/content/about.ts`**, so you can edit the text without touching layout. The contact email is `[your email]` and becomes a mailto link once it\'s a real address. Built with `Typography`, `Card`, `Row/Col`, icon-per-feature grid. | 2 | Done |
| 11 | **Login/Register redesign (split screen)** | `layouts/AuthLayout.tsx` is shared by Login and Register. On `md+` it's a **minimal neutral brand panel** (`layoutTokens.authPanelBg` `#e6ebf2` + thin divider; logo mark, app name, one headline + intro) beside the form. Below `md`, just the logo + name sit above the form. Brand copy lives in `content/brand.ts`. Improvements: (1) a shared AuthLayout; (2) an **inline error banner** for failed sign-in/sign-up instead of a toast; (3) a `GuestOnly` route wrapper sends logged-in users from `/` and `/register` to `/posts`; (4) a **session-expired notice** on login (`/?session=expired`), with `getCurrentUser()` now checking JWT `exp` and `RequireAuth`/"Log in again" routing there; (5) autofocus on the first field; (6) no "Forgot password?" until a reset backend exists. `LoginForm` becomes presentational, with the API call moved to `hooks/useLogin.ts`. No backend changes. | 3, 5 | Done |
| 12 | **Forgot password (contact page)** | No backend. A "Forgot password?" link on Login opens `/forgot-password` (guest-only, `AuthLayout`), which tells the user to contact the alumni office. It uses the **same contact email as the About page** (`content/about.ts`), so one edit updates both. It's a `mailto:` link with the subject "Password reset request" once the email is real, otherwise placeholder text. A "Back to sign in" link goes to `/`. A self-service reset (tokens + email) stays in Later: security. | 11 | Done |
| 13 | **Sign-up field design** | `RegisterForm` reworked for the narrow (400px) auth column: **single column**; required fields first (name, email, password, confirm); a **password strength meter** (`utils/passwordStrength.ts` + `components/PasswordStrength.tsx`, antd `Progress`, token colors: Too short/Weak/Fair/Good/Strong, guidance only, the rule is still 8–72 chars); **optional alumni details in a collapsed `Collapse`** ("Add alumni details (optional)", `forceRender` so values are kept); **graduation year as a searchable `Select`** (1950 → this year + 5); consistent `size="large"` inputs with prefix icons and short helper text. Validation and the API are unchanged. | 11 | Done |
| 14 | **Sign-up roles (student / alumni) + university** | **[DB] migration file you run** (`db/migrations/001_university_and_students.sql`, idempotent, one transaction): `ALTER TABLE users ADD COLUMN university VARCHAR(150)`; `CREATE TABLE students (id SERIAL PK, user_id INT NOT NULL UNIQUE → users ON DELETE CASCADE, department VARCHAR(100), expected_graduation_year VARCHAR(10), created_at, updated_at)`. **It must be applied before the new API runs.** **[BE] `POST /api/auth/register`:** a new required `role` that accepts **only `student` or `alumni`** (anything else, incl. `admin` → 400), and a required `university` (≤150). Alumni → `users` + `alumni` row (optional details as today). Students → `users` + `students` row with **department + expected graduation year (both required for students, year = this year … this year + 8)**. One transaction either way, and still no password in the response. **[BE] `/api/me`:** also returns `university`, plus `has_student_profile`, `department`, and `expected_graduation_year` for students. PUT: **every role can edit name, photo, and university**. Alumni with a row also edit alumni fields (as today); students with a row also edit department + expected year. Users without a row keep name/photo/university only (9.1 rule). Email/password/role are never editable. **[BE]** The alumni list/profile queries also return `u.university`. **[shared]** `User.university`, `RegisterInput.role/university/expected_graduation_year`, `MyProfile` + `Alumni.university`. **[FE] Sign-up:** a role picker first (antd `Segmented`: Alumni | Student), then name/email/password/confirm and **University (antd `AutoComplete`: suggestions from `content/universities.ts`, typing your own allowed, required)**. Student shows department + expected graduation year (required). Alumni shows the existing collapsible optional alumni details. **[FE] Display:** university on alumni cards + profile and on My Profile. The My Profile edit form adds University for everyone and the student fields for students. The About "Who can join" copy is updated (students and alumni can sign up). **Verify:** curl `role:"admin"` → 400; student/alumni sign-up creates the right rows; no password in responses; `/api/me` edit rules per role. | 13 | Pending (plan approved) |
| 15 | **Comments on posts** | No DB change (the `comments` table already exists). Flat comments (replies added in Bolt 16). **[BE]** `GET /api/posts/:id/comments` returns the post's comments oldest first, with `author_name`/`author_photo`. `POST /api/posts/:id/comments` requires a **JWT**; the author is **taken from the token only**; `content` is trimmed and must be 1–2000 chars; an unknown post → 404. `DELETE /api/comments/:id` requires a JWT; only the **comment author or an admin** may delete (403 otherwise). Both writes recount `posts.comment_count` in the same transaction. The old unauthenticated `POST/PUT/GET /api/comments` routes are **removed** (the PUT had swapped args, and anyone could write as anyone). **[shared]** `Comment` is fixed (`posts_id` → `post_id`) and gains `author_name`/`author_photo`. **[FE]** `services/commentsApi.ts`, `hooks/useComments.ts` (lazy-loads when opened, add/delete, keeps the Feed's cached count in sync), and `components/CommentSection.tsx` (list + composer, Ctrl/⌘+Enter to send, delete with `Popconfirm`). `PostCard` gets a "N comments" toggle, so it works in the Feed and on profile pages. | 4 | Done |
| 16 | **Comment replies** | One level of threading via the existing `comments.parent_id` (no DB change). **[BE]** `POST /api/posts/:id/comments` accepts an optional `parent_id`. The parent must exist (404) and belong to the same post (400). A reply to a reply is attached to its top-level comment, so threads stay one level deep. The author still comes from the JWT only. Deleting a comment removes its replies (FK cascade), and `comment_count` (which counts replies too) is recounted in the same transaction. **[shared]** `CreateCommentInput.parent_id?`. **[FE]** `CommentSection` groups replies under their comment (indented). Each comment has **Reply**, which opens an inline reply box (replying to a reply pre-fills `@Name`). The delete confirm warns when replies will go too. The composer was extracted to `components/CommentComposer.tsx`. | 15 | Done |

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
- **[BE] endpoints in Bolts 5 and 9:**
  - No response body contains `password`. Verify with curl.
  - SQL is only parameterized queries in `dal/query`.
  - The layering (route → controller → manager → query) is respected.

---

## Open Questions (please answer before or during approval)
- **Q1 (Bolt 6):** Alumni cards need name/photo. Do you approve a small **[BE]** change: a `JOIN users` in `AlumniQuery.getAllAlumnil` (and `findAlumniById`) selecting `u.name, u.email, u.photo_url`? The alternative is the frontend fetching `/api/users` and joining client-side, which also pulls password hashes over the wire. I don't recommend that.yes
- **Q2 (Bolt 4):** New posts have no `user_id` today. Should the quick fix (frontend sends `currentUser.id`) go in now? The proper fix (server takes `user_id` from the JWT) is part of the later security work.yes
- **Q3:** For testing bolts, should I add a Vite `server.proxy` for `/api` → `localhost:3000`, so `npm run dev` works? This is a small, config-only change. Or do you always test through Apache at `alumni.local`?i usually run Alumni_local.sh for test deployment  
- **Q4 (Bolt 10):** What content should the About page have?Q4: Sections: What it is, Purpose, Features, Who can join, Contact. Write placeholder text for each; I'll edit it later. Contact: [your email].
- **Q5:** Brand color, logo, or font preference? Bolt 1 shipped a neutral navy/blue palette by default. Changing it is a single edit to `src/theme/tokens.ts`.you can use these by your recommandation

- **Q10 (Bolt 9.1, needs your answer):** Two related holes aren't profile edits, so I left them out of 9.1. Should they be included? Each is a small, similar change.
  - **`POST /api/users` has no auth and accepts any `role`, so anyone can create an `admin` account.** This is the most serious one. I recommend locking it to admin-only in 9.1.
  - `PUT`/`DELETE /api/posts/:id` and the comment write routes have no auth, so anyone can edit or delete anyone's posts and comments (the UI hides the buttons, but the API doesn't check). The fix would be owner-only, plus admin for delete.

- **Q11 (Bolt 14):** I planned **department + expected graduation year as required for students**, since they're the only student details. OK, or should they be optional like the alumni details?
- **Q12 (Bolt 14):** Which universities should the dropdown suggest? Send me the list for `content/universities.ts` (users can still type one that isn't listed). Until then I'll leave the list empty, so it acts as free text.
- **Q13 (follow-up, not in 14):** Add a **University filter** to the Alumni directory (Bolt 7 style, multi-select)? It would be a small Bolt 17.

## Known Issues Noted (deferred to "Later: admin + security / comments")
- No auth on most write routes (posts, comments, alumni, users `PUT`). **Profile routes (`PUT /api/users/:id`, `PUT /api/alumni/:id`) are fixed in Bolt 9.1.** Posts/comments/`POST /api/users`: see Q10.
- `PUT /api/users/:id` writes `password` **unhashed** and lets anyone change anyone's email/password. Fixed in Bolt 9.1 (owner-only, name/photo only).
- `GET /api/alumni` (list) has no auth. It returns name/photo/profile fields but deliberately **no email**. Gating the list behind `authMiddleware` belongs to the security work.
- `GET /api/users*` returns password hashes.
- `UserQuery.createUser` ignores `photo_url`.
- `alumni.user_id` has no UNIQUE constraint, so nothing in the DB enforces one profile per user. Registration creates exactly one.
- Email uniqueness and login are case-sensitive (`Foo@x.com` ≠ `foo@x.com`). Normalising this is for the security work.
- No migrations/schema file in the repo. The schema was checked by reading the local DB (`\d users`, `\d alumni`).
- `CommentController.updateComment` passes `CommentDTO` args in the wrong order.
- There's no comments-by-post endpoint.
- Duplicate `PUT /api/users/:id` route. Removed in Bolt 9.1.
- `console.log` of every row in `getAllAlumnil`/`getAllComments`/`getAllUsers`.

## Decisions Log
- 2026-10-01: UI library is **Ant Design only**, with theming via ConfigProvider tokens. This replaces the earlier "Tailwind / CSS modules" placeholder, per the CLAUDE.md UI Rules.
- 2026-10-01: Search/filter is **client-side** over `GET /api/alumni` (no server search endpoint exists). Revisit if alumni count grows past ~1–2k.
- 2026-10-01: `components/Dashboard.tsx` is to be replaced by `layouts/AppLayout.tsx`. The Sider links (Profile, My Posts, Settings) are dropped until those pages exist.
- 2026-10-01: The plan's canonical path is **`aidlc/plan.md`**, and CLAUDE.md was corrected to match (resolves Q6).
- 2026-10-01: Bolts were reordered to 1–10 as listed. **Sign up** (Bolt 5) and **My Profile** (Bolt 9) were added and are now in scope, including their backend endpoints. Comments and admin + security are deferred to "Later".
- 2026-10-01: Sign-up always creates `role = "alumni"`, whatever the request says. The user and alumni_profile rows are created atomically in one transaction.
- 2026-10-01: `/api/me` identifies the user only from the JWT, and PUT uses a field allowlist. Email, password, and role changes are deferred to the security work.
- 2026-10-01 (Bolt 4): The feed now uses **page scroll + an IntersectionObserver sentinel** instead of the virtual `Listy` with a fixed height. `Listy.height` only accepts a pixel number, so it couldn't be viewport-relative, and a nested scroll box breaks at 360px and at 200% zoom. Page size is 20. The server clamps `limit` to 1–100 and `offset` to ≥ 0.
- 2026-10-01 (Bolt 4): Q2 interim answer: the frontend sends `currentUser.id` as `user_id` on create, so posts get an author. Deriving it server-side from the JWT stays in "Later: security".
- 2026-10-01 (Bolt 5): **The DB schema is the source of truth**: table `alumni` with `graduation_year varchar(10)`. The dal is aligned to it (new code now, existing `AlumniQuery` in Bolt 6).
- 2026-10-01 (Bolt 5): Q7 answered: sign-up requires only name, email, and password. Alumni fields are optional, but an `alumni` row is always created.
- 2026-10-01 (Bolt 5): Q8 answered: **auto-login**. Register returns 201 `{ token, user }`.
- 2026-10-01 (Bolt 5): Q9 answered: open sign-up is acceptable for now. Verification/approval goes in "Later: admin + security".
- 2026-10-01 (Bolt 6): Q1 answered **yes**. `AlumniQuery` joins `users`. The list returns `name, photo_url` (no email, since the list endpoint is unauthenticated). `findAlumniById`/`findAlumniByEmail` (single profile; `/:id` requires a JWT) also return `email`. The password is never selected.
- 2026-10-01 (Bolt 6): `AlumniQuery`/`AlumniDTO`/`AlumniController` were aligned to table `alumni` + `graduation_year` (string). This fixes all `/api/alumni` endpoints. The `AlumniDTO` constructor no longer takes `id` first, which fixes the argument shift on create. `getAllAlumnil` stopped logging every row and now orders by name.
- 2026-10-01 (Bolt 6): Alumni cards aren't clickable yet. Linking to `/alumni/:id` comes with the profile page in Bolt 8, to avoid dead links.
- 2026-10-01 (Bolt 7): Filters live in the URL (`?q=&dept=&company=&from=&to=`, `replace` navigation so typing doesn't fill history), so filtered views can be bookmarked and shared. Search is 300 ms debounced. It matches **every** whitespace-separated term against name, job title, company, and department, case-insensitively. Department and company filters are multi-select (OR within a field, AND across fields), case- and whitespace-insensitive. The graduation year is a From/To range, and alumni without a year are excluded once a range is set. Filter options are derived from the loaded data.
- 2026-10-01 (Bolt 7): Filter logic (`filterAlumni`, `getFilterOptions`) is pure functions in `hooks/useFilters.ts`, verified with a throwaway script (no test runner in the repo yet).
- 2026-10-01 (Bolt 8): **[BE]** `GET /api/alumni/:id` now returns **404** for missing or non-numeric ids (it used to return 200 with an empty body). `GET /api/posts/user/:id` joins `users` for `author_name`/`author_photo`, like the main feed.
- 2026-10-01 (Bolt 8): Alumni cards link to `/alumni/:id`. The name is a real `<Link>`, so middle-click opens a new tab, and the rest of the card is clickable. The profile shows posts **read-only** (no edit/delete there). A 401 (expired token) shows "Session expired → Log in again", because `RequireAuth` only checks that a token decodes, not its expiry.
- 2026-10-01 (Bolt 8): `components/AlumniProfileView.tsx` (header + About card, optional `actions` slot) is built for reuse by My Profile (Bolt 9). Shared display helpers live in `src/utils/alumni.ts`.
- 2026-10-01 (Bolt 9): `PUT /api/me` is a **full replace** of the editable fields. `name` is required, and omitted or empty optional fields are cleared to NULL. Limits: bio 2000 chars, experience 5000; `photo_url`/`linkedin_url` must be http(s). The `users` + `alumni` updates run in one transaction. A user with no `alumni` row (e.g. admin/student created via `/api/users`) gets **404** on GET and PUT, and nothing is changed. Verified: `role`/`email`/`password`/`user_id`/`id` in the body are ignored, and a PUT can't touch another user.
- 2026-10-01 (Bolt 9): My Profile shows your own posts **read-only**. Managing posts stays in the Feed. Saving a new name/photo also updates your posts already cached in the Feed. The year/URL form rules moved to `utils/formRules.ts` (shared by Register and Edit), the per-user post loading to `hooks/useUserPosts.ts`, and the post list to `components/UserPostList.tsx` (shared by both profile pages).
- 2026-10-01 (Bolt 9.1, planned): New rule from you: **everyone (admin, alumni, student) edits only their own profile, the same way. No one, including admins, can edit another user's profile.** Accounts without an `alumni` row can edit **name + photo only**, and no alumni row is auto-created, so they stay out of the Alumni directory. This **supersedes** Bolt 9's "no alumni row → 404" behavior for `/api/me`. The unauthenticated `PUT /api/users/:id` and `PUT /api/alumni/:id` become owner-only.
- 2026-10-01 (Bolt 9.1, implemented): Ownership checks live in `UserManager.updateOwnUser` / `AlumniManager.updateOwnAlumni` (403 for non-owners, admins included). Shared validators moved to `businessLogic/src/validation.ts`. The old unrestricted `UserQuery.updateUser` (which wrote email and an **unhashed** password) and `AlumniManager.updateAlumni` were removed. `PUT /api/users/:id` now returns the same safe profile shape as `/api/me`. Q10 (`POST /api/users`, posts/comments) is **not** included and is still open.
- 2026-10-01 (Bolt 9.1): Existing accounts created via `/api/users` (all current local users: ids 1, 3, 4, 5) have no `alumni` row, so per your rule they can edit **name + photo only** until they get an alumni row.
- 2026-10-01 (Bolt 10): Q4 answered: the About sections are What it is, Purpose, Features, Who can join, and Contact, with placeholder text to be edited later. The copy is in `src/content/about.ts`. "Who can join" states the current reality: sign-up creates alumni accounts, and student/admin accounts are set up by administrators.
- 2026-10-01 (Bolt 10): Q5 answered ("use your recommendation"), so the Bolt 1 neutral navy/blue palette stays.
- 2026-10-01 (Bolt 10): `/about` stays behind login (inside `AppLayout`, as planned). Making it public, e.g. linking it from the login page, would be a small follow-up.
- 2026-10-01 (Bolt 11): You picked Option A (split screen) plus all six login improvements, for Login and Register. The live "N alumni members" count on the brand panel was left out (unanswered); it's an easy add using the public `GET /api/alumni`.
- 2026-10-01 (Bolt 12): You chose "contact page only" for Forgot password. There's no self-service reset, because there's no email provider and no reset-token storage yet. The page reuses the About contact email.
- 2026-10-01 (Bolt 11 revision): At your request the sign-in pages were made **minimal**. The blue gradient brand panel became the neutral `colorBgLayout` background with a thin divider, and the highlights list, ©, and the colored mobile header were removed. Login, Register, and Forgot password all share this through `AuthLayout`.
- 2026-10-01 (Bolt 11 revision): The panel color was darkened slightly to `#e6ebf2`, using its own theme value `layoutTokens.authPanelBg`, so the app-wide `colorBgLayout` is unchanged.
- 2026-10-01 (Bolt 13): Your recommendation request. A collapsible optional section was chosen over a multi-step wizard, because it keeps sign-up on one short screen (minimal), and with a wizard a duplicate-email error would only surface at the last step.
- 2026-10-01 (Bolt 14, planned): You chose: sign-up role **student or alumni** (never admin; the server enforces it); **university required for both**, entered with **suggestions + free text**; stored in a new **`users.university`** column via a **migration file you run**; students also give **department + expected graduation year**, stored in a new **`students`** table (mirrors `alumni`, one row per user). This **replaces Bolt 5's "role is always alumni"** rule.
- 2026-10-01 (Bolt 15): You asked for comments "by your recommendation": flat comments inline under each post, comment as yourself only (JWT), the author or an admin can delete, no editing in v1, and a server-maintained `comment_count`. The old open comment routes were removed instead of patched, which closes the comments part of Q10.
- 2026-10-01 (Bolt 16): You asked for replies. They're **one level deep** (replies to replies join the same thread with an `@Name` prefix). Deep nesting gets unreadable on phones, and the existing `parent_id` + cascade delete support this without a DB change.
- 2026-10-01: Bolts 12, 13, 15 and 16 approved. The Bolt 14 plan was approved "for now"; implementation hasn't started.
- 2026-10-01: You approved Bolts 1–16 "for now". Bolt 14 is approved but **not implemented yet**: its migration, API and UI changes are still to do, so its status stays "Pending (plan approved)".
