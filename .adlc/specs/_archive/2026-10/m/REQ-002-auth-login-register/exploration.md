# REQ-002 — Codebase exploration

Written by: codebase-explorer (tier: fast)

| Field | Value |
|---|---|
| Generated | 2026-10-05 |
| By | codebase-explorer |
| Repo(s) scanned | alumni-system |

## 1. Similar existing implementations

| Path | What it does | Recommended action |
|---|---|---|
| `packages/backend/src/api/routes/AuthRoutes.ts`, `controllers/UserController.ts:login`, `UserController.ts:register` | Backend login/register endpoints; handle 401/409/400 errors, hash password with bcrypt, return JWT token | follow — frontend will call these unchanged |
| Git history: `d4325b2a:packages/frontend/src/services/authApi.ts` | Old login/register/logout/getCurrentUser functions; JWT decode client-side, expiry check, logout clears token | reference for behavior patterns; don't replicate — use new architecture |
| Git history: `d4325b2a:packages/frontend/src/components/LoginForm.tsx`, `RegisterForm.tsx` | Old antd-based forms with validation rules, error alerts, role selection | reference only; rebuild as plain React + new primitives |
| Git history: `d4325b2a:packages/frontend/src/components/RequireAuth.tsx`, `GuestOnly.tsx` | Route guards checking JWT decode; RequireAuth redirects to login with optional session=expired param | follow pattern but reimplement using new query-based session |
| Git history: `d4325b2a:packages/frontend/src/components/UserMenu.tsx` | Dropdown menu showing user name/email/role, Profile/Password/Logout items | reference; rebuild with Base UI menu |

## 2. Blast radius

| Path | Why touched | Risk |
|---|---|---|
| `packages/frontend/src/app/providers.tsx` | QueryClientProvider already present; response interceptor for 401 handling wired here or in httpClient | low (adds middleware setup, no config change) |
| `packages/frontend/src/services/httpClient.ts` | Add axios response interceptor for global 401 handling (logout + redirect) without importing store/features | medium (new interceptor, careful: must not break import boundaries per ESLint) |
| `packages/frontend/src/services/authToken.ts` | Unchanged; continues as single source of truth for token in localStorage | low (read-only for new code) |
| `packages/frontend/src/app/AppShell/AppShell.tsx` | Add user menu header section for signed-in users (avatar + menu), show login/signup links for guests | medium (layout changes to header; new conditional rendering) |
| `packages/frontend/src/app/router.tsx` | Add `/login` and `/register` routes; add route guard for protected pages | medium (new routes, new guard component) |
| `packages/frontend/src/store/` | Create `sessionAtom.ts` for decoded user (id, role) and "session expired" notice; optional if decoded client-side | low (new file; read-only boundary for services) |
| `packages/frontend/src/features/` | Create `auth/` folder: `useLoginMutation.ts`, `useRegisterMutation.ts`, `useCurrentUserQuery.ts`, `LoginPage.tsx`, `RegisterPage.tsx`, `HomePage.tsx` (simple welcome) | high (new feature folder, new queries/mutations, new pages, form state handling) |
| `packages/frontend/src/components/ui/` | May need: error state variant for Input, or inline error component; possibly select/segmented control for role choice, menu/popover wrapper | high (new primitives or Input extension needed) |
| `packages/frontend/src/test/` | Add test utilities for auth mocking (mock httpClient 401 responses, stub current user query) | low (new helpers, no existing test changes) |
| `packages/frontend/eslint.config.js` | No changes needed; existing boundaries already prevent services from importing store | low (verification: services can't import store, so response interceptor must not set atom directly) |

## 3. Integration points

### Entry points
- New routes: `/login`, `/register` → feature page components in `src/features/auth/`
- Route guard (e.g. `<ProtectedRoute>`) → wraps `/` home and any signed-in routes
- Guest guard (e.g. `<GuestRoute>`) → wraps `/login` and `/register`

### Shared utilities and state
- **httpClient** (`services/httpClient.ts`) — request interceptor already adds token; response interceptor must catch 401 globally and trigger logout (careful: no store/feature imports)
- **authToken.ts** (`services/authToken.ts`) — single home of token; reading/writing handled here
- **Session state** — two options per ADR-02 context:
  - Option A: Small atom for the "session expired" notice only; decoded user (id, role) held in a TanStack Query `useCurrentUserQuery` hook result
  - Option B: No atom; treat every 401 outside the login request itself as "clear token + redirect to login + show notice", decoding the JWT client-side for the "expired on load" check
- **Query hooks** — `features/auth/useCurrentUserQuery.ts` calls `GET /api/me` (requires token); invalidate on logout

### Cross-cutting concerns
- **Authentication middleware** — httpClient request interceptor adds token from `authToken.getToken()`; response interceptor (401) must clear token + redirect without import cycles
- **Error handling** — 401 from `/api/me` while signed in → logout. 401 from login/register → "Email or password is incorrect" (form-level). Network errors → "Couldn't reach the server" (form-level, not global)
- **Token expiry** — spec says decode JWT `exp` client-side to catch expiry before API call (optional; can treat first 401 as signal instead)
- **CORS** — backend has `app.use(cors())` with no credentials mode; preflight will work
- **Vite dev server** — no API proxy configured; frontend dev server and backend must be on different ports. API calls use relative paths `/api/*` so hostname/port come from the same origin

### Type contracts
- **@alumni/shared types** — `RegisterInput`, `PublicUser`, `AuthResponse`; but login returns only `{ token }`, not `AuthResponse` — spec notes this needs verification at architect
- **Backend validation** — `UserManager.validateRegistration()` enforces: password 8–72 chars, email valid, name 1–100, university 1–150, department 1–100, expected_graduation_year (students only, this year to +8)
- **Backend responses**:
  - Login 401: `{ message: "Invalid" }`
  - Register 201: `{ token, user }` where `user` is `PublicUserRow` (no password)
  - Register 409: `{ message: "An account with this email already exists" }`
  - Register 400: `{ message: "…" }` (validation error)
  - `/api/me` 401: `{ message: "Invalid or expired token" }`

## 4. Test coverage

| Test file | Scenarios covered | Gaps for new code |
|---|---|---|
| `packages/frontend/src/services/authToken.test.ts` | token read/write/clear, unavailable storage | no new coverage needed (utilities already tested) |
| `packages/frontend/src/services/httpClient.test.ts` | auth header attached when token present, not attached when absent | needs: 401 response interceptor behavior (clears token, redirects, etc.) — test with mock adapter |
| `packages/frontend/src/app/AppShell/AppShell.test.tsx` | header renders, theme toggle works, error layer | needs: test user menu visibility when signed in, login/signup links when guest |
| `packages/frontend/src/app/router.tsx` (no test yet) | createRoutes exports; tests use it via createMemoryRouter | needs: test guard redirects to login (guest), test guard redirects to home when signed in, test GuestRoute redirects signed-in users |
| No test yet for login form | — | needs: success (stores token, navigates to home or return-to URL); 401 shows "Email or password is incorrect", email preserved; network error shows "Couldn't reach the server"; validation errors (empty, bad email); busy state; double-click prevention |
| No test yet for register form | — | needs: success 201 (stores token, navigates to home); duplicate email 409 shows on email field; backend 400 validation shows on form; role choice shows/hides student fields; student fields (department, year) required; validation (password 8–72, email, lengths); busy state |
| No test yet for session | — | needs: reload keeps user signed in (token valid); 401 from non-login endpoint shows "Your session has expired, please log in again" and clears token; logout clears token + redirects; token expired on load treated as signed-out |
| No test yet for home page | — | needs: greets user by name and states role |

### Gaps for new code

**Form validation and error display:**
- Input component only has `helperText`; no error state (red border, error icon, error message color). Need to add error prop or create a separate error display mechanism.
- No test coverage for field-level validation messages (email pattern, password length, required fields, duplicates).

**Session management:**
- No test coverage for global 401 handling (axios response interceptor).
- No test coverage for redirect-after-login flow (return to original URL).
- No test coverage for token expiry check on load.

**Route guards:**
- No existing guard component; need to create and test both `<ProtectedRoute>` and `<GuestRoute>`.

**Menu/user dropdown:**
- Base UI `menu` available but not yet used in codebase; need example of styling and keyboard behavior per design tokens.

**Primitives:**
- Role choice (student vs alumni) at sign-up: either use Base UI `select`, or segmented control (not in Base UI; need custom), or radio group with Base UI `radio-group`.
- No select or segmented control primitive yet.

**Error recovery:**
- Login/register forms must clear validation errors when user edits a field (similar to old `onEdit` callback).

## Vault references

Pages from the knowledge vault relevant to this REQ:

- [[knowledge/gotchas#^g05|G05]] — Base UI Radio: focus via `:focus-visible`, name from text content. When building role choice UI (radio group or select), use Base UI's `radio-group` and `radio`; focus state must use `:focus-visible` pseudo-class in CSS, not a data attribute.
- [[knowledge/gotchas#^g01|G01]] — Theme storage key duplicated in `index.html` inline script and `themeAtom.ts`. Similar pattern may apply to session state if you use `atomWithStorage` for auth; coordinate storage keys and test reload scenarios with `vi.resetModules()`.
- [[knowledge/lessons/LESSON-REQ-001-7]] — Route error layers: page errors on a path-less child route. Use the existing two-layer pattern in `router.tsx` for error boundaries; new protected/guest guard routes fit inside the page layer.
- [[knowledge/lessons/LESSON-REQ-001-9]] — Guard Jotai storage atoms against throwing storage (private mode, quota). If session state uses `atomWithStorage`, wrap getItem/setItem/subscribe in try/catch as done in `themeAtom.ts`.
- [[knowledge/lessons/LESSON-REQ-001-4]] — Import-boundary lint: services cannot import store or features. The 401 response interceptor in `httpClient.ts` (a service) cannot directly set an atom; either use a callback pattern or handle redirect/logout outside the interceptor.
- [[knowledge/lessons/LESSON-REQ-001-5]] — No inline styles in components; use CSS Modules. All form styling (input borders, error colors, labels) must be in `.module.css` files with design tokens.
- [[knowledge/lessons/LESSON-REQ-001-6]] — When changing a token for contrast, sweep all uses and pin the pairs. If form error text uses a new token, verify contrast against all backgrounds (light/dark themes).
- [[concepts/design-tokens]] — All colors, spacing, type sizes come from `src/styles/tokens.css` (generated from `tokens.json`). Login/register/home pages must build entirely from tokens; no hardcoded values.
- [[components/frontend]] — Frontend structure: `src/app/` (shell, router, providers), `src/features/` (domains), `src/components/ui/` (primitives), `src/store/` (Jotai atoms), `src/services/` (HTTP, token).
- [[architecture/adr-01-ui-layer-headless-css-modules|ADR-01]] — UI on Base UI + CSS Modules. Menu (Base UI `menu` + CSS) and role picker (Base UI `radio-group` + CSS) are new components following this pattern.
- [[architecture/adr-02-server-state-tanstack-query|ADR-02]] — TanStack Query for server state, Jotai for client-only state. `GET /api/me` is a Query (reusable across pages); login/register are Mutations; session token stays in `authToken.ts` (not in an atom). Global 401 handling is mentioned as an open question belonging to the auth REQ.

## Open questions

- **Session state design** — Should decoded user (id, role) live in a Query hook result (`useCurrentUserQuery` from TanStack Query), a Jotai atom, or nowhere (re-decode JWT client-side on every check)? The spec says "current user comes from GET /api/me via TanStack Query" but doesn't say whether to cache the decode elsewhere. Recommend: Query hook only (no atom copy), to keep ADR-02's line clear.

- **Global 401 interception** — How does the response interceptor in `httpClient.ts` (a service) trigger logout and redirect without importing store? Options:
  - A: Interceptor sets a marker (e.g. `window.__logout = true`) that the App root polls and acts on.
  - B: Interceptor calls a callback function passed to httpClient.create().
  - C: 401 handling deferred to feature layers (form/page), not global; each login/register form catches 401 and each query hook catches 401 outside login requests.
  - Recommend option C for simplicity and import-boundary compliance; the notice can live in a small atom set by feature code.

- **Redirect after login** — Should the login form remember the `?next=` URL from query params and navigate there after success, or always navigate to home? Old code had no next-URL support. Spec doesn't mention it but says "land on the page they originally asked for". Recommend: implement next-URL pattern (extract from location, validate it's same-origin, redirect there on success).

- **Token expiry on load** — Should the frontend decode JWT `exp` and skip the first `/api/me` if expired, or just treat the first 401 as "no session"? Recommend: decode client-side for UX (faster, no wasted request); use pattern from old `authApi.isSessionExpired()`.

- **Input error state** — The Input component has no error variant. Options:
  - A: Extend Input with `error: string | null` prop and error styling.
  - B: Create a separate `<ErrorMessage>` component or use `helperText` for errors.
  - C: Use Base UI `field` + `fieldset` wrapper for form state management.
  - Recommend option A (minimal, reusable) for inline field errors; wrap forms in Base UI `form` for overall state if time permits.

- **Role selection UI** — Student vs. Alumni choice at sign-up. Options:
  - A: Base UI `radio-group` (two options) with CSS styling.
  - B: Base UI `segmented control` (if available; check exports).
  - C: Base UI `select` dropdown.
  - D: Simple HTML `<select>` with custom styling.
  - Recommend option A (radio group, clearer for two options); use existing ThemeToggle as a style reference.

- **Form library** — Should login/register use:
  - A: Plain controlled React state (`useState` per field) + manual validation.
  - B: A form library like `react-hook-form` or Formik.
  - Spec says "plain controlled inputs, or a small form library; new dependency needs approval at architect gate." Recommend plain React for simplicity; add library only if validation/state management becomes unwieldy.

- **Design tokens for forms** — Are there design tokens for:
  - Error text color (red/orange)?
  - Disabled/readonly state?
  - Focus ring width/color?
  - Form spacing (gap between fields)?
  - Busy state button styling (fade, spinner)?
  - Check `docs/design/design-system/` or ask the architect whether to generate new tokens or infer from existing (e.g., error = accent color).
