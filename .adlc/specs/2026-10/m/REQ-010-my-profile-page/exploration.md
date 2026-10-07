# My Profile page (/me) — codebase exploration

| Field | Value |
|---|---|
| REQ | REQ-010 |
| Explored | 2026-10-07 |
| Codebase | alumni-system |
| Scope | frontend routes/navigation, form patterns, services, backend ME endpoints, shared types, design tokens |

## Summary

REQ-010 needs to build a signed-in user's profile editor at `/me`. The codebase has established patterns for lazy routes (from REQ-008, REQ-009), form validation and error handling (from auth features), the backend endpoints and DTOs (MeController, UserManager.updateMe, UserQuery), and the shared types (MyProfile, UpdateMyProfileInput, ChangePasswordInput). No Toast, Switch or Textarea components yet exist; the architect must decide on third-party dependencies or build them. Photo_url handling on PUT /api/me is confirmed: omitted fields become null, clearing the URL. The existing design tokens lack toast/inverse surfaces and shadow tokens, but success, error and warning colors are available.

---

## 1. Lazy feature structure (REQ-008 feed, REQ-009 profile patterns)

### Router and route definition
- **File:** `packages/frontend/src/app/router.tsx`
- **Pattern:** Each lazy page is an exported `const ROUTE_OBJECT` with properties:
  - `path: string` — the URL path
  - `lazy: async () => { … import … }` — dynamic import that returns `{ Component }`
  - `HydrateFallback: ReactNode` — loading fallback, **must be on the route object itself** (not `loadingComponent`), so a direct visit keeps the shell
- **Examples:**
  ```tsx
  export const DIRECTORY_ROUTE: RouteObject = {
    path: 'directory',
    HydrateFallback,
    lazy: async () => {
      const { DirectoryPage } = await import('@/features/directory/DirectoryPage');
      return { Component: DirectoryPage };
    },
  };
  ```
  - PROFILE_ROUTE: `path: 'alumni/:id'`, imports `DirectoryPage`
  - FEED_ROUTE: `path: 'feed'`, imports `FeedPage`
- **Incorporated into routes:** All three are children of `RequireAuth` (signed-in guard), alongside `HomePage` (eager, not lazy).

### ESLint enforcement
- **File:** `packages/frontend/eslint.config.js` (not inspected; referenced in lesson)
- **Rule:** Bans static imports of lazy feature modules outside their own folder. Only the router's dynamic `import()` is allowed.

### Test enforcement
- **File:** `packages/frontend/src/app/lazyRoutes.test.ts`
- **Data structure:** `LAZY_FEATURES` array (lines 19–38) with one object per lazy page:
  ```ts
  { name: 'directory', route: DIRECTORY_ROUTE, path: 'directory', dynamicImport: "import('@/features/directory/DirectoryPage')" },
  { name: 'profile', route: PROFILE_ROUTE, path: 'alumni/:id', dynamicImport: "import('@/features/profile/ProfilePage')" },
  { name: 'feed', route: FEED_ROUTE, path: 'feed', dynamicImport: "import('@/features/feed/FeedPage')" },
  ```
- **Tests:** One per lazy feature verifying:
  - No static imports of that feature outside its folder
  - The router still references it via the dynamic import
  - The route is in the tree with `lazy` and `HydrateFallback` set
- **When adding REQ-010:** A new entry must be added to `LAZY_FEATURES`, the test will then check for static import violations, presence in router.tsx, and the route structure.

### The six places to update (from LESSON-REQ-009-4)
When a new lazy feature is added, update:
1. `router.tsx` — add the route object and include it in the tree
2. `lazyRoutes.test.ts` — add entry to `LAZY_FEATURES` array
3. `eslint.config.js` — add to the lazy feature list (rule config not inspected)
4. `app/README.md` — update the count of lazy pages
5. `features/README.md` — update the count of lazy pages
6. `frontend/README.md` — update the count of lazy pages
7. **Vault copies (documentation):** ADR-08's count, the `route-layout.md` concept, and `components/frontend.md`

---

## 2. AppShell navigation and avatar menu

### NavItems definition
- **File:** `packages/frontend/src/app/AppShell/navItems.tsx`
- **Structure:**
  ```ts
  interface NavItem {
    to: string;
    label: string;
    icon: ReactNode;  // for BottomTabs
  }
  
  export const NAV_ITEMS: readonly NavItem[] = [
    { to: DIRECTORY_PATH, label: 'Directory', icon: <GridIcon /> },
    { to: FEED_PATH, label: 'Feed', icon: <ChatBubbleIcon /> },
  ];
  ```
- **Usage:** Shared by `MainNav` (desktop header) and `BottomTabs` (phone tab bar).
- **Update for REQ-010:** Add `/me` entry with label "My Profile" and an icon (profile or person icon needs to be designed or imported).

### MainNav (desktop header navigation)
- **File:** `packages/frontend/src/app/AppShell/MainNav.tsx`
- **Pattern:**
  - Renders only if signed in (`useHasSession()`)
  - Maps `NAV_ITEMS` to `<NavLink>` elements
  - Hidden by CSS below `48rem` (phone breakpoint)
  - `NavLink` marks the current path (and below) with `aria-current="page"`
- **Current pages:** Directory, Feed
- **For REQ-010:** Will automatically include "My Profile" once added to `NAV_ITEMS` and marked current on `/me` path.

### BottomTabs (phone tab bar)
- **File:** `packages/frontend/src/app/AppShell/BottomTabs.tsx`
- **Pattern:**
  - Renders only if signed in
  - Same `NAV_ITEMS` mapped to tab links, each with icon above label
  - Current tab shown in accent colour
  - Hidden by CSS above `48rem`
- **Sticky:** Located after `<main>` in `AppShell.tsx`, layout provides bottom padding to prevent overlap with the last field (LESSON-REQ-007-1).

### HeaderAuth (avatar menu)
- **File:** `packages/frontend/src/app/AppShell/HeaderAuth.tsx`
- **Pattern:**
  - Guests see: "Log in" and "Sign up" buttons
  - Signed-in users see: `<Menu>` trigger (avatar + chevron) with:
    - `<MenuLabel>` showing name and email (from `useCurrentUser`)
    - `<MenuSeparator>`
    - `<MenuItem onSelect={logout}>Log out</MenuItem>`
- **Current menu items:** Only "Log out"
- **Comment in code (line 12):** "View profile and Admin settings join it when those pages exist."
- **For REQ-010:** Add before "Log out":
  - `<MenuItem>View profile</MenuItem>` (to `/alumni/:alumni_id`, **shown only if user has an alumni profile**)
  - `<MenuItem>My Profile</MenuItem>` (to `/me`)

### Home page quick-links
- **File:** `packages/frontend/src/features/home/HomePage.tsx`
- **Structure:**
  ```ts
  interface QuickLink {
    to: string;
    title: string;
    description: string;
  }
  
  const QUICK_LINKS: readonly QuickLink[] = [
    { to: DIRECTORY_PATH, title: 'Browse the directory', description: 'Find classmates…' },
    { to: FEED_PATH, title: 'Catch up on the feed', description: 'See what alumni…' },
  ];
  ```
- **Comment (line 16):** "Only pages that exist are listed; add the profile and admin cards when those pages are built."
- **For REQ-010:** Add a third card: `{ to: '/me', title: 'My Profile', description: '…' }` (description TBD from S5 design or architect choice).

### Phone top bar pattern (profile BackLink)
- **Reference:** The requirement mentions "the phone shows S5's top bar with back arrow and 'My Profile'."
- **Analogous pattern:** REQ-008 (profile at `/alumni/:id`) may use a `BackLink` component; the architect can check `features/profile` for the implementation pattern.
- **Note:** A back button or "My Profile" title in the phone header would be added to the page component itself (not the AppShell), following the page's own navigation needs.

---

## 3. Existing UI primitives, APIs and missing components

### Existing primitives
- **Input:** Props: `label` (required), `helperText`, `error`, `endAdornment`, `id`, standard `<input>` props (name, type, placeholder, value, onChange, autoComplete, etc.). Errors shown below, helper text optional. Error state sets `aria-invalid="true"`.
- **PasswordInput:** Wrapper on `Input` with show/hide toggle. Props: same as Input except no `type` or `endAdornment`. Returns `PasswordInputProps`.
- **Button:** Props: `type`, `variant` ('primary' or 'ghost'), `loading`, standard button props. Loading disables and shows loading state.
- **Alert:** Props: `tone` ('error' or 'info'), `title` (optional bold first line), `children`. Role: `"alert"` on error, `"status"` on info. Styled with a colored dot and border.
- **Avatar:** Props: `name` (initials derived), `size` ('xs', 's', etc.), className. Shows initials or a fallback avatar.
- **Skeleton:** Props: className. A loading placeholder (used in directory, profile).
- **Menu** (from Base UI): Props: `label`, `trigger` (element), `align` ('end', etc.), `children` (`<MenuLabel>`, `<MenuSeparator>`, `<MenuItem>`). `<MenuItem>` has `onSelect` callback.
- **Card:** Container for grouped content (used in quick-links, directory results).

### Missing components (needs architect decision)
- **Textarea:** For `bio` (2000 char max), `experience` (5000 char max). No custom component yet; options:
  - Build a custom `<Textarea>` (similar to `Input`) with error/helper text support
  - Use Base UI's textarea (if available)
  - Use a native `<textarea>` with custom styling (less consistent with the Input pattern)
- **Switch / Toggle:** For future mentorship toggle (spec says it's omitted for now, no column or API support yet). Not needed for REQ-010 unless the requirement changes. Base UI v1.8.0 does not include a switch/toggle component; would need to build one or add a third-party library.
- **Toast / Notification:** For the success message after saving ("Profile updated successfully"). Options:
  - Build a custom Toast component (using Jotai atom for state, dismissible, auto-hide)
  - Base UI v1.8.0 does not have Toast; would need a third-party library (e.g., `sonner`, `react-hot-toast`)
  - The Alert component is static (shown on the page); a Toast floats and dismisses automatically

### Base UI version and available components
- **Version:** `@base-ui/react@^1.8.0` (in package.json)
- **Used in codebase:**
  - `Menu` (popover menu, `@base-ui/react/menu`)
  - `Popover` (generic popover, `@base-ui/react/popover`)
  - `Radio` and `RadioGroup` (for SegmentedControl, `@base-ui/react/radio`, `@base-ui/react/radio-group`)
  - `Tooltip` (on SegmentedControl icons, `@base-ui/react/tooltip`)
- **NOT in v1.8.0 (checked via imports):** Toast, Switch, Textarea
- **Recommendation:** Architect must decide whether to build Toast (lightweight, fits the codebase pattern) or adopt a third-party library (faster, but adds a dependency). Switch can be deferred until the mentorship feature is designed.

---

## 4. Form patterns from RegisterPage and auth validation

### Controlled form state
- **File:** `packages/frontend/src/features/auth/RegisterPage.tsx`
- **Pattern:**
  ```ts
  const [values, setValues] = useState<RegisterValues>({ role: 'student', name: '', … });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  ```
- **Field change:** Handler clears that field's error when the user types:
  ```ts
  function handleChange(field: RegisterField) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }
  ```

### Validation rules (pure functions, sync)
- **File:** `packages/frontend/src/features/auth/validation.ts`
- **Exported constants:** `NAME_MAX`, `EMAIL_MAX`, `UNIVERSITY_MAX`, `DEPARTMENT_MAX`, `PASSWORD_MIN_CHARS`, `PASSWORD_MAX_BYTES`, `EXPECTED_YEAR_SPAN`
- **Functions:**
  - `validateRegister(values, now?)` → `RegisterErrors` (field errors or empty object)
  - `validateLogin(values)` → `LoginErrors`
  - `toRegisterInput(values)` → request body (trims text, removes student fields for alumni)
- **For REQ-010:** Will need new validation functions for profile fields:
  - Alumni and students share: `name` (required, max 100), `university` (optional, max 150), `bio` (optional, max 2000)
  - Alumni only: `department` (optional, max 100), `graduation_year` (optional, 4-digit 1900 to now+10), `current_company` (optional, max 100), `job_title` (optional, max 100), `experience` (optional, max 5000), `linkedin_url` (optional, must start with `http://` or `https://`, max 500 or similar)
  - Students only: `expected_graduation_year` (optional, 4-digit now to now+8)
  - Password change: `current_password` (required), `new_password` (8–72 UTF-8 bytes, different from current), `new_password_confirm` (matches new_password)
- **Client mirrors backend:** Comment in validation.ts (line 3): "Rules and messages mirror the backend (businessLogic/src/validation.ts and UserManager.validateRegistration), so the client and the server agree."

### Field focus on validation failure
- **File:** `RegisterPage.tsx` lines 32–85
- **Pattern:**
  ```ts
  const FIELD_ORDER: readonly RegisterField[] = ['name', 'email', 'password', …];
  const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field] !== undefined);
  flushSync(() => setErrors(nextErrors));  // render before focus
  if (firstInvalid) focusField(firstInvalid);
  ```
- **Reason:** Using `flushSync` ensures the error message is rendered before the field receives focus, so screen readers announce the error with the field.

### Server error handling
- **File:** `packages/frontend/src/features/auth/authErrors.ts`
- **Functions:**
  - `mapRegisterError(error)` → `{ form?: string, fields?: { email?: string } }`
  - `mapLoginError(error)` → same shape
- **Logic:**
  - Network/5xx → `"Couldn't reach the server, try again"` (UNREACHABLE_MESSAGE)
  - 401 (login) → `"Email or password is incorrect"` (INVALID_CREDENTIALS_MESSAGE)
  - 409 (register) → `{ fields: { email: "An account…already exists" } }`
  - 400 → server's `message` field (e.g., "Name must be at most 100 characters")
  - Unknown → `"Something went wrong, try again"` (UNEXPECTED_MESSAGE)
- **On submit failure (RegisterPage lines 121–137):**
  ```ts
  registerUser.mutate(input, {
    onError: (error) => {
      const mapped = mapRegisterError(error);
      if (mapped.fields?.email) {
        setErrors((prev) => ({ ...prev, email: mapped.fields.email }));
        focusField('email');  // focus field with error
        return;
      }
      setFormError(mapped.form ?? UNEXPECTED_MESSAGE);  // show form-level message
      formErrorRef.current?.focus();  // focus alert
    },
  });
  ```
- **For REQ-010:** Will need a similar `mapProfileError(error)` or extend authErrors.ts to handle PUT /api/me and PUT /api/me/password responses.

---

## 5. Services, query keys and cache invalidation

### authApi service
- **File:** `packages/frontend/src/services/authApi.ts`
- **Functions:**
  - `login(email, password)` → `LoginResponse`
  - `register(input)` → `RegisterResponse`
  - `getMe()` → `MyProfile`
- **Pattern:** Only API calls; token storage and caching are caller's responsibility (features/auth).
- **For REQ-010:** Will need:
  - `updateMyProfile(input: UpdateMyProfileInput)` → `MyProfile`
  - `changePassword(input: ChangePasswordInput)` → `void` (204 No Content)

### Query keys and invalidation
- **useCurrentUser query key:** `['me']` (from `packages/frontend/src/features/auth/useCurrentUser.ts`)
- **Directory search key:** `['alumni', 'search', params]` (from `packages/frontend/src/features/directory/useAlumniSearch.ts`)
- **Alumni profile key:** `['alumni', 'profile', id]` (from `packages/frontend/src/features/profile/useAlumniProfile.ts`)
- **Posts by user key:** `['posts', 'user', userId]` (from `packages/frontend/src/features/profile/usePostsByUser.ts`)
- **For REQ-010 success (requirement AC §59):** After a successful PUT /api/me, invalidate:
  - `['me']` — so `/me` page and avatar menu reflect the updated name
  - `['alumni', 'profile', '<user's alumni_id>']` — so `/alumni/:id` shows new data without a reload
  - `['alumni', 'search', '*']` — all directory search results (or use `setQueryData` to patch the result)
- **Method:** Use `queryClient.invalidateQueries()` in the mutation's `onSuccess` callback, or use optimistic updates with `onMutate` and `onError` (ADR-09, used in feed).

### HTTP error handling
- **httpErrors.ts:** `isNotFoundError(err)` → checks `axios.isAxiosError(err) && err.response?.status === 404`
- **Query client retry logic (queryClient.ts):** 4xx errors don't retry (will fail immediately); used to avoid retrying 404s or 400s.

---

## 6. React Router version and useBlocker

- **Version:** `react-router@^8.4.0` (from package.json)
- **useBlocker availability:** ✓ Available in Router v8. Signature: `useBlocker(shouldBlock: boolean | ({ currentLocation, nextLocation }) => boolean)` returns `{ state, reset, proceed }`.
- **Use case for REQ-010:** Block navigation with unsaved changes (requirement AC §56). Example:
  ```ts
  const blocker = useBlocker(() => isDirty);  // isDirty = form differs from saved profile
  if (blocker.state === 'blocked') {
    // Show confirmation dialog; user can blocker.proceed() or blocker.reset()
  }
  ```
- **Note:** In a data router (React Router v8), `useBlocker` works with both in-app navigation and browser back/close. The requirement specifies "Leaving the page (in-app link, back button, tab close or reload)" — useBlocker covers in-app and back; tab close and reload are handled by browser's `beforeunload` if needed.

---

## 7. Design tokens (colors, shadows, toast surface, switch)

### Available tokens (from docs/design/design-system/tokens.json and src/styles/tokens.css)

**Color tokens (light / dark):**
- `surface-page` (#faf7f2 / #1d1a17): page background
- `surface-raised` (#ffffff / #272320): cards, modals
- `surface-sunken` (#f0ebe3 / #171412): input backgrounds, code blocks
- `border-subtle` (#e4dcd0 / #3a352f): card borders, dividers (soft line replaces shadow)
- `border-strong` (#cfc4b4 / #4c453c): hover/focus borders, input border at rest
- `ink-primary` (#2b2724 / #f1ece4): primary text
- `ink-secondary` (#6b6560 / #b7afa5): secondary text, labels
- `ink-muted` (#948c84 / #837b72): disabled labels
- `accent` (#975c43 / #d08a66): primary buttons, links, active state
- `accent-strong` (#7a4734 / #e4a07c): hover/pressed on accent
- `accent-ink` (#fdf8f3 / #1d1a17): text on solid accent
- `accent-soft` (#f3e4d9 / #3a2c23): accent tint for tags, highlights
- `success` (#5f7a56 / #93b188): **positive status** ← use for success toast
- `warning` (#a9813f / #d7ac6e): caution status
- `error` (#a3503f / #d1796a): error / destructive status

**Spacing tokens:** `space-1` to `space-8` (4px to 64px)

**Radius tokens:** `radius-sm` to `radius-pill` (4px to 999px)

**Motion:** `duration-fast` (150ms), `easing-standard` (ease)

### Missing tokens
- **Shadows:** Design brief says "soft borders instead of heavy shadows" — no shadow tokens defined. Use `border-subtle` for soft outlines; a drop shadow might use CSS `box-shadow: 0 2px 4px rgba(0,0,0,0.1)` or similar without a token.
- **Toast / inverse surface:** No dedicated token. Options:
  - Use `surface-raised` (elevated surface) with `success` text for a success toast, or `error` text for an error toast
  - Create `surface-inverse` or `surface-toast` token (requires updating tokens.json and regenerating tokens.css)
  - Use a hardcoded overlay with rgba opacity (but violates token-only rule)
- **Switch colors:** No switch-specific color tokens yet (switch component doesn't exist; can be deferred). When built, could use `accent` and `surface-sunken` (unchecked) and `success` (checked, if it's an enabled/availability switch).

### Contrast check (lesson REQ-004-2, gotcha G33)
- The requirement mentions "contrast pairs are checked against tokens (lesson REQ-004-2, gotcha G33)."
- **Implication:** Color combinations used (e.g., `success` text on `surface-raised` background) must meet WCAG AA contrast. The `success` color (#5f7a56 light, #93b188 dark) on the page/raised backgrounds should be checked; a lighter/darker pair might be needed if contrast is insufficient.
- **Action for architect:** Verify in Figma or with a contrast checker that the toast / success message colors pass.

---

## 8. Backend: PUT /api/me endpoints and tests

### Endpoints and MeController
- **File:** `packages/backend/src/api/controllers/MeController.ts`
- **Routes (MeRoutes.ts):**
  - `GET /` → `getMe(userId)` → `MyProfileRow`
  - `PUT /` → `updateMe(userId, body)` → `MyProfileRow` (status 200)
  - `PUT /password` → `changeMyPassword(userId, body)` → `204 No Content`

### UserManager.updateMe (PUT /api/me)
- **File:** `packages/backend/src/businessLogic/src/UserManager.ts` lines 195–219
- **Logic:**
  1. Fetch current profile (abort if not found, 404)
  2. Validate user basics (name, photo_url, university)
  3. If alumni: validate alumni fields (department, graduation_year, current_company, job_title, experience, bio, linkedin_url)
  4. If student (no alumni row): validate student fields (same fields, but expected_graduation_year instead of graduation_year)
  5. Handle email change (requires current password check)
  6. Call `UserQuery.updateMyProfile()`
  7. Return updated profile
- **Error handling:** 404 if user not found, 409 if email already in use.

### UserQuery.updateMyProfile (transaction)
- **File:** `packages/backend/src/dal/query/UserQuery.ts` lines 146–208
- **Photo URL handling (line 159):** 
  ```ts
  UPDATE users SET … photo_url=$2 … WHERE id=$5
  // Parameter: basics.photo_url ?? null
  ```
  - **If photo_url is omitted (undefined) in the request:** `basics.photo_url` is undefined, `?? null` converts it to null, the column is cleared.
  - **If photo_url is sent (even empty string):** It is stored as-is.
  - **Requirement assumption (§90) STATUS:** "the form must send the stored `photo_url` back unchanged or Save would erase it" — **CONFIRMED**: the form must always include the current photo_url from GET /api/me in the PUT request, or it will be cleared. The frontend must do this; the API provides no "omit to keep current" logic.

### UserManager.changeMyPassword (PUT /api/me/password)
- **Lines 222–230:** Validates new password (8–72 UTF-8 bytes, different from current), checks current password, updates hash.
- **Error:** 400 if current password is wrong (not 401, so client doesn't treat it as an expired session).

### Tests for MeController and updateMe
- **UserManager.test.ts:** No specific tests for `updateMe` or `changeMyPassword` yet. Tests exist for login, registration, user creation/deletion, but the update endpoints are untested at the unit level.
- **Implication:** REQ-010's architect should plan tests for the profile update form and the server error handling paths (invalid year, wrong password, email in use, etc.).

---

## 9. Shared types (MyProfile, UpdateMyProfileInput, ChangePasswordInput)

### Exported types
- **File:** `packages/shared/src/types/alumni.types.ts`
- **Exports (in index.ts):** All types from alumni.types.ts are re-exported.

### MyProfile (GET /api/me response)
- **Lines 35–58:** Full profile including role, alumni_id, student_id, profile flags, and all optional fields.
- **Structure:**
  ```ts
  interface MyProfile {
    user_id: number;
    name: string;
    email: string;
    photo_url?: string;
    role: "alumni" | "student" | "admin";
    university?: string;
    alumni_id: number | null;  // null if no alumni row
    has_alumni_profile: boolean;
    student_id: number | null;  // null if no student row
    has_student_profile: boolean;
    // Role-dependent fields (empty when profile doesn't exist):
    department?: string;
    expected_graduation_year?: string;  // students only
    graduation_year?: string;  // alumni only
    current_company?: string;
    job_title?: string;
    experience?: string;
    bio?: string;
    linkedin_url?: string;
    created_at?: Date;
    login_at?: Date;
    updated_at?: Date;
  }
  ```

### UpdateMyProfileInput (PUT /api/me request)
- **Lines 65–79:**
  ```ts
  interface UpdateMyProfileInput {
    name: string;  // required
    email?: string;  // omitted email is kept
    current_password?: string;  // required if email changes
    photo_url?: string;  // omitted = null (clears URL)
    university?: string;
    department?: string;
    expected_graduation_year?: string;  // students only
    graduation_year?: string;  // alumni only
    current_company?: string;
    job_title?: string;
    experience?: string;
    bio?: string;
    linkedin_url?: string;
  }
  ```
- **Comment (lines 60–64):** "PUT /api/me replaces all of these; omitted optional fields are cleared (an omitted email is kept)."

### ChangePasswordInput (PUT /api/me/password request)
- **Lines 82–85:**
  ```ts
  interface ChangePasswordInput {
    current_password: string;  // required
    new_password: string;  // 8–72 UTF-8 bytes, different from current
  }
  ```

### Confirmation
- ✓ Types are already exported and ready to use on the frontend.
- ✓ Comments describe the API contract clearly.

---

## Gaps and decisions needed

1. **Toast component:** Build custom (fits codebase) or add third-party library (faster)?
2. **Textarea:** Build custom wrapper (consistent with Input) or use native with light styling?
3. **Toast/inverse surface token:** Add to tokens.json and regenerate, or use existing colors and hardcode CSS?
4. **Phone top bar layout:** Is there a `BackLink` or title pattern to follow from the profile page (REQ-008)?
5. **Link icon to profile from avatar menu:** "View profile" should link to `/alumni/:alumni_id`. Only shown if `has_alumni_profile` is true.
6. **My Profile nav icon:** Which icon for "My Profile" in phone tabs? (Person, Profile, or other?)
7. **Error mapping for PUT /api/me:** When the server returns a 400 with a field-specific error (e.g., "Email already in use" on the email field), the frontend must parse it and show it next to the field. AuthErrors.ts only handles login/register; will need a profile-specific mapper.

---

## Related files (read-only)

- `/packages/frontend/src/app/router.tsx` — lazy route structure
- `/packages/frontend/src/app/lazyRoutes.test.ts` — LAZY_FEATURES array and enforcement
- `/packages/frontend/src/app/AppShell/` — navigation components
- `/packages/frontend/src/features/auth/RegisterPage.tsx` — form pattern example
- `/packages/frontend/src/features/auth/validation.ts` — client-side validation rules
- `/packages/frontend/src/features/auth/authErrors.ts` — server error mapping
- `/packages/frontend/src/services/authApi.ts` — API call example
- `/packages/frontend/src/app/queryClient.ts` — TanStack Query setup
- `/packages/shared/src/types/alumni.types.ts` — MyProfile, UpdateMyProfileInput, ChangePasswordInput
- `/packages/backend/src/api/controllers/MeController.ts` — Me endpoints
- `/packages/backend/src/businessLogic/src/UserManager.ts` — updateMe, changeMyPassword logic
- `/packages/backend/src/dal/query/UserQuery.ts` — updateMyProfile (photo_url handling confirmed)
- `/docs/design/design-system/tokens.json` — design tokens (no shadow or toast-specific tokens)

---

