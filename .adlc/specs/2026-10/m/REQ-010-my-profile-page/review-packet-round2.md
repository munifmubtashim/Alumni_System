# REQ-010 — Review packet, round 2 (fixes since the six commits)

Round-1 digest rows being fixed: M1 feed cache keys (CORR-001/QUAL-001/ARCH-001), m2 toast timer pause + focus (UI-001), m3 toast live region always mounted (UI-002), m4 Escape on leave prompt (UI-003). m5 was docs only. Not fixed (your-call or accepted): M2, m1, m6-m10.
Files in this round (uncommitted, vs HEAD):
packages/frontend/README.md
packages/frontend/src/app/README.md
packages/frontend/src/components/ui/Toast/Toast.test.tsx
packages/frontend/src/components/ui/Toast/Toast.tsx
packages/frontend/src/features/feed/README.md
packages/frontend/src/features/me/LeavePrompt.tsx
packages/frontend/src/features/me/ProfileForm.test.tsx
packages/frontend/src/features/me/ProfileForm.tsx
packages/frontend/src/features/me/README.md
packages/frontend/src/features/me/SaveBar.test.tsx
packages/frontend/src/features/me/useUpdateProfile.test.tsx
packages/frontend/src/features/me/useUpdateProfile.ts
packages/frontend/src/features/profile/README.md

Test files are not in the diff: read them directly.

```diff
diff --git a/packages/frontend/README.md b/packages/frontend/README.md
index 8de3211e..dd97d087 100644
--- a/packages/frontend/README.md
+++ b/packages/frontend/README.md
@@ -37,135 +37,143 @@ Run inside `packages/frontend` (or from the repo root with `--workspace=packages
 | `npm test`              | Vitest, single run                                                                         |
 | `npm run test:watch`    | Vitest, watch mode                                                                         |
 | `npm run test:coverage` | Vitest with a v8 coverage report in `coverage/` (git-ignored)                              |
 | `npm run tokens`        | Regenerate `src/styles/tokens.css` from `docs/design/design-system/tokens.json`            |
 | `npm run tokens:check`  | Exit 1 if `tokens.css` is out of date (for CI)                                             |
 
 From the repo root, `npm run dev` starts the API and this dev server together; `npm run dev:frontend` starts this one alone.
 
 ### Dev proxy
 
 API calls use relative paths under `/api` (the axios instance has `baseURL: '/api'`). In dev, `vite.config.ts` proxies `/api` to `http://localhost:<PORT>`, where `PORT` comes from the repo-root `.env` (default 3000). Only `PORT` is read from that file, and only inside the Vite config; nothing else in it reaches the browser. Start the API too, or `/api` calls fail with a proxy error.
 
 ## Folder map
 
 ```
 packages/frontend/
   index.html          <title>Alma</title>, inline no-flash theme script, then /src/main.tsx
   public/             favicon.svg (copied from docs/design/brand/; the one raw-hex design asset)
   scripts/            generate-tokens.ts (+ test), enforcement.test.ts (lint rules self-test)
   src/
     main.tsx          imports the font, tokens.css, global.css (in that order), renders <App/>
     app/              App, providers, router, QueryClient, RootLayout, AuthShell and AppShell layouts,
                       MainNav, BottomTabs, HydrateFallback, RouteError
     config/           app-wide constants and small pure contracts: brand.ts (BRAND_NAME, SUPPORT_EMAIL,
                       supportMailto), directoryReturn.ts (DIRECTORY_PATH, profilePath, the directory-to-profile
                       router-state handover), feedPath.ts (FEED_PATH), mePath.ts (ME_PATH), relativeTime.ts
     features/         one folder per domain: theme/, auth/ (session, guards, pages), home/,
                       directory/, profile/, feed/ and me/ (lazy-loaded directory, alumni profile,
                       post feed and My Profile pages)
     components/ui/    design-system primitives: Button, ButtonLink, Input, PasswordInput, Logo,
-                      Card, Tag, Alert, Menu, SegmentedControl, ThemeToggle, Avatar, Chip,
-                      Skeleton, SearchField, Popover
+                      Textarea, Card, Tag, Alert, Menu, SegmentedControl, ThemeToggle, Avatar,
+                      Chip, Skeleton, SearchField, Popover, Toast
     store/            Jotai atoms for client-only state (themeAtom, sessionNoticeAtom)
     services/         httpClient (axios), authToken (token in localStorage), authApi, alumniApi,
                       postsApi, httpErrors
     styles/           tokens.css (generated), global.css, contrast test
     test/             Vitest setup and harness smoke test
 ```
 
 Each folder's README says what belongs there and what may import it:
 [app](src/app/README.md) · [config](src/config/README.md) · [features](src/features/README.md) · [components/ui](src/components/ui/README.md) · [store](src/store/README.md) · [services](src/services/README.md) · [styles](src/styles/README.md) · [test](src/test/README.md)
 
 **Path alias:** `@/` means `src/` (`import { Button } from '@/components/ui/Button'`). It is declared in `tsconfig.app.json` (`paths`) and in `vite.config.ts` (`resolve.alias`); Vitest reads the Vite config, so the editor, typecheck, build and tests all agree.
 
 **Import boundaries** (enforced by ESLint for both `@/…` and relative paths):
 
 - `components/ui/` must not import `services/`, `store/`, `features/`, `config/`, `app/`, `axios` or `@tanstack/react-query`. Primitives are props in, events out (the brand name reaches `Logo` as a prop).
 - `services/` must not import React, `components/`, `store/`, `features/` or `app/`. Services return data to the caller.
 - `store/` must not import `services/`, `features/` or `app/`. Features wire atoms to services.
 - `config/` is a leaf: it must not import `app/`, `features/`, `components/`, `store/` or `services/`. `app/` and `features/` read it.
 - Nothing in `features/`, `store/`, `services/` or `components/` may import `app/` (in practice only `main.tsx` does). Test files (`*.test.ts(x)`) are exempt from this one ban only, so tests may import `app/` providers to render a component.
 
 **Server state vs client state (ADR-02):** data from the API goes through TanStack Query, using the shared `QueryClient` from `app/queryClient.ts` (30 s stale time, no refetch on window focus, up to 2 retries but never on a 4xx). Jotai atoms in `store/` hold client-only state. The auth token lives only in `services/authToken.ts` (`localStorage['token']`), never in an atom; `httpClient` adds `Authorization: Bearer <token>` in its one request interceptor, so call sites never build auth headers.
 
 **Route errors:** the router has two `errorElement` layers on each branch. The outer one, on the `/` root layout, catches a crash in a shell itself (the shell is gone). The inner one, on a pathless child route inside each shell (`AuthShell`, `AppShell`), catches page errors and shows `RouteError` inside that shell's `<main>`.
 
 ## Auth and session
 
 ADR-03. Log in, sign up (student or alumni), stay signed in across reloads, log out, and get sent to `/login` with a notice when the session ends.
 
 - **Routes** (`app/router.tsx`): `GuestOnly` wraps `/login` and `/register`; `RequireAuth` wraps `/` (Home), `/directory`, `/alumni/:id`, `/feed` and `/me`. An unknown path shows the empty shell. `RootLayout` holds two shells: `AuthShell` (no header, theme toggle top-right) for `/login` and `/register`, `AppShell` (header) for everything else.
-- **Endpoints:** `services/authApi.ts` has `login`, `register` and `getMe` (`GET /me`). They only return data.
+- **Endpoints:** `services/authApi.ts` has `login`, `register`, `getMe` (`GET /me`), `updateMyProfile` (`PUT /me`, a full replace) and `changePassword` (`PUT /me/password`, 204). They only return data.
 - **Token store:** `services/authToken.ts` keeps the token in `localStorage['token']`. `subscribe(listener)` fires on `setToken`/`clearToken` and on another tab's change. `isTokenExpired(token)` decodes the JWT `exp` (10 s leeway; a malformed token counts as expired). `getLiveToken()` returns the token only if it is present and not expired, with no side effects. `features/auth` reads it with `useLiveToken()` / `useHasSession()` (`useSyncExternalStore`).
 - **401s:** `httpClient` has one response interceptor. On a 401 from a request that carried a token (not `/auth/login` or `/auth/register`), it calls the handler registered with `setUnauthorizedHandler(fn)`, passing that request's token, then re-throws. `services/` never imports app or feature code.
 - **SessionBridge** (`features/auth/SessionBridge.tsx`, mounted once in `app/RootLayout`, above both shells, renders nothing):
   1. on load, silently drops a stored token that has expired;
   2. registers the 401 handler, which acts only if the failed request's token is still the current one (so a burst of 401s, or a late 401 after logout, causes one redirect at most): clear the token, set `sessionNoticeAtom` to `'expired'`, go to `/login` with `state.from`;
   3. clears the whole query cache whenever the token changes (login, logout, another tab), so no previous user's data is shown.
 - **Current user:** `useCurrentUser()` is the `['me']` query, enabled only with a live token. There is no atom copy.
 - **Login and sign-up:** `useLogin` / `useRegister` only store the token and clear the notice. They do not fetch `/me` or navigate; `GuestOnly` sees the token and sends the user on.
 - **Guards:** `RequireAuth` sends a guest to `/login` (saving the location as `state.from`), shows "Loading…" while `['me']` loads, and on a non-401 error shows an Alert with Retry and Log out. `GuestOnly` sends a signed-in user to `resolveFrom(location.state) ?? '/'`.
 - **Redirect-back** uses only `location.state.from`, never a URL parameter, so a crafted link can't redirect off-site. `resolveFrom` accepts only an app path (one leading `/`, not `/login` or `/register`).
 - **Logout:** `useLogout()` clears the token first, then goes to `/login`; the bridge clears the cache. The header menu and the RequireAuth error state both offer it.
 - **Session notice:** `LoginPage` shows "Your session has expired, please log in again" and clears it when it unmounts.
 - **`react-router/dom`:** `App.tsx` imports `RouterProvider` from `react-router/dom`, not `react-router`. The bridge and `useLogout` navigate with `flushSync: true`; without the DOM provider, `RequireAuth` fires a second redirect. Tests that check navigation counts must use it too.
 
 ## Directory and lazy routes
 
 REQ-006, ADR-08. `/directory` (signed in; the header's "Directory" link) lists alumni from `GET /api/alumni`, 12 per page.
 
 - **Lazy routes:** `app/router.tsx` loads the directory (`import('@/features/directory/DirectoryPage')`), the profile at `/alumni/:id` (`import('@/features/profile/ProfilePage')`) the feed at `/feed` (`FEED_ROUTE`, `import('@/features/feed/FeedPage')`) and My Profile at `/me` (`ME_ROUTE`, `import('@/features/me/MePage')`) with the route's `lazy`, so each is a separate chunk in `dist/assets`. Nothing else may import any of them statically, not even another lazy feature: ESLint rejects it (tests and `import type` excepted), and `src/app/lazyRoutes.test.ts` reads every non-test file in `src/` and fails if one does. Both checks run once per feature and leave out only that feature's own folder. New large pages follow the same pattern (add them to `LAZY_FEATURES` in `eslint.config.js` and in the test); Home stays eager.
 - **`HydrateFallback`** ("Loading…" in `<main>`) is a static property of each lazy route object itself. The router stops rendering at the nearest route with a fallback, so on the root it would hide the shell. A click from another page shows no fallback; a chunk that fails to load shows `RouteError` inside the shell.
 - **URL is the state:** search text, department, university, graduation year and page live in the query string, so a reload, a shared link and back/forward all work. `features/directory/params.ts` parses it (pure, tested) and ignores any value the API would reject. Filters and page changes push a history entry; typed search replaces the URL after 300 ms, and an outside change (Back, Clear all) cancels a pending write.
 - **States:** skeleton cards while loading, an error with Retry, "no matches" with Clear filters, "No alumni yet", and a page past the end with a way back to page 1. The count line ("Showing 1–12 of 40 alumni", "40 alumni" on phones) is a polite live region.
-- **Header:** after S1. `MainNav` (desktop) shows the Directory and Feed links (`NAV_ITEMS`) to signed-in users only, each marked current on its path and below with an accent underline. On phones a sticky bottom tab bar (`BottomTabs`) replaces it. The compact `ThemeToggle` and the avatar menu (name, email, Log out) sit on the right.
+- **Header:** after S1. `MainNav` (desktop) shows the Directory, Feed and My Profile links (`NAV_ITEMS`) to signed-in users only, each marked current on its path and below with an accent underline. On phones a sticky bottom tab bar (`BottomTabs`) replaces it. The compact `ThemeToggle` and the avatar menu (name and email, View profile for alumni only, My Profile, Log out) sit on the right.
 
 ## Profile page
 
 REQ-008. `/alumni/:id` (signed in; every directory card links to it) shows one alumnus from `GET /api/alumni/:id` and their newest 5 posts from `GET /api/posts/user/:userId` (the profile's `user_id`), after the S3 designs.
 
 - **Sections:** header (avatar, name, "job title at company · Class of YYYY", LinkedIn link when it is an http(s) address), About, Education (university, department, class year), Employment (job title and company, then the free-text experience), Recent posts. A section with no data is not rendered. Location, the mentorship badge, degree, year ranges and job history are not shown: nothing stores them.
 - **States:** loading skeletons, "Profile not found" (unknown or malformed id: the API answers 404), error with Retry; posts have their own loading, error and empty states and never hide the profile. A failed background refetch keeps what is already shown.
 - **Back link:** "Back to directory" restores the search, filters and page the user left (the card passes `location.search` in router state; `config/directoryReturn.ts` owns the contract). A direct visit goes to plain `/directory`. On phones it shows as an arrow and "Profile" under the shell's top bar.
 - **Accessibility:** every state has an `h1` and a tab title; focus moves to the heading only when focus was on the page body or on something that disappeared.
 - More: `src/features/profile/README.md`.
 
 ## Feed
 
 REQ-009, ADR-09. `/feed` (signed in; the header's "Feed" link, the Feed tab on phones and Home's "Catch up on the feed" card) shows posts from `GET /api/posts`, newest first, 20 per page with Load more, after the S4 designs.
 
 - **Writing:** the composer posts trimmed text (Post stays disabled while blank). Comments and one level of replies live in a thread under each card, fetched only when it is opened. The author or an admin sees Edit and Delete (posts in the "Post actions" menu, comments in the "Reply · Edit · Delete" row); the API still decides, and a refused write shows its message. A post with comments asks inline before deletion ("Delete this post and its N comments?").
 - **Optimistic writes (ADR-09):** new posts and comments, edits and deletes show at once and are undone if the API refuses. `onMutate` edits the cache with a pure function from `cacheEdits.ts`, `onError` applies the inverse edit (no whole-cache snapshot), `onSettled` invalidates only when it is the last mutation on that key. Keys are `['feed','posts']` and `['feed','comments',postId]`. A pending item (negative id) has no menu, Reply or thread toggle.
 - **Author link:** the name links to `/alumni/<author_alumni_id>` (the alumni id, not the user id) and is plain text when the author has no alumni profile.
 - More: `src/features/feed/README.md`.
 
+## My Profile
+
+REQ-010. `/me` (signed in; the header's "My Profile" link, the My Profile tab on phones and the avatar menu) lets the signed-in user edit their own details and change their password, after the S5 designs.
+
+- **Saving:** one Save sends `PUT /api/me` when a profile field changed, then `PUT /api/me/password` when a password was typed. A save bar shows while there are unsaved changes, a prompt asks before leaving with them, and a toast confirms a save. Not optimistic.
+- **Sections:** which ones show depends on the account (alumni, student, or no profile row). Email is never shown or sent; headline, location, degree, start year, mentorship and photo upload are not built (no API for them).
+- More: `src/features/me/README.md`.
+
 ## Forms
 
 ADR-04: no form library for now.
 
 - Controlled state in the page component.
 - Pure, tested validators in `features/<x>/validation.ts` (`validateLogin`, `validateRegister(values, now)`) return a field → message map. Rules and messages mirror the backend (password at least 8 characters and at most 72 UTF-8 bytes, length limits, expected year from this year to this year + 8).
 - On submit with errors: show them per field (`Input error`) and focus the first invalid field. Otherwise call the `useMutation`. The submit button gets `loading` (disabled, `aria-busy`), so it can't be pressed twice.
 - Server errors go through a pure mapper (`features/auth/authErrors.ts`): login 401 → form Alert "Email or password is incorrect"; sign-up 409 → email field error with a "Log in instead" link; 400 → its message; network or 5xx → "Couldn't reach the server, try again".
 - Fields hidden by the role switch keep their values but are not validated or sent (`toRegisterInput`).
 - **Revisit** when a form passes about 8 fields or needs dynamic field arrays (likely My Profile): pick React Hook Form + Zod, or move validation into `@alumni/shared`.
 
 ## Primitives added in REQ-002
 
 - `Input` `error` prop: `aria-invalid`, error text linked by `aria-describedby`, error border.
 - `Button` `loading` prop: disabled, `aria-busy`, label kept, pulsing dot. `ButtonLink`: Button styles on a react-router `Link`.
 - `Alert`: `tone="error"` (`role="alert"`) or `"info"` (`role="status"`), optional title.
 - `Menu`, `MenuItem`, `MenuLabel`, `MenuSeparator`: Base UI Menu (`label` names an icon-only trigger); keyboard support; no shadow. `MenuItem tone="danger"` (REQ-009) shows a destructive item, such as "Delete post", in the error color (`--error`).
 - `SegmentedControl<T>`: Base UI RadioGroup; `ThemeToggle` is a thin wrapper over it.
 
 ## Brand and primitives added in REQ-004
 
 - The product is **Alma**. The name, support email and `supportMailto(subject)` live in `src/config/brand.ts`; nothing else in `src/` hardcodes them (`index.html`'s `<title>` is static text).
 - `Logo`: inline-SVG mark coloured by tokens, with optional wordmark. Props `label`, `showWordmark`, `decorative`, `size`. The header shows it as a link home.
 - `PasswordInput`: `Input` with a show/hide button whose `aria-label` flips; focus stays in the field.
 - `Input` gained `endAdornment` (a control inside the field's end edge).
 - Auth pages share `features/auth/AuthLayout`: a brand panel on `--surface-sunken` beside the form card from 60rem up, hidden below. "Forgot password?" on log-in (`ForgotPasswordHelp`) shows a message with a mailto link to support; there is no reset flow yet.
 
 ## Design tokens
 
 `docs/design/design-system/tokens.json` is the single source for colors, spacing, type, radii and motion (`--duration-fast`, `--easing-standard`). `scripts/generate-tokens.ts` turns it into `src/styles/tokens.css`: CSS custom properties for both themes.
diff --git a/packages/frontend/src/app/README.md b/packages/frontend/src/app/README.md
index 0b6a5816..93ea6641 100644
--- a/packages/frontend/src/app/README.md
+++ b/packages/frontend/src/app/README.md
@@ -1,17 +1,17 @@
 # app/
 
 **Purpose:** the application root:
 
 - `App.tsx`: renders `RouterProvider` from `react-router/dom`, not `react-router`, so logout's `flushSync` navigation works (gotcha G08).
 - Providers for TanStack Query and Jotai, and the shared `QueryClient`.
 - The router: the path-less `RootLayout` holds two shells. `AuthShell` wraps `GuestOnly` → `/login`, `/register`; `AppShell` wraps `RequireAuth` → `/` (Home), `/directory`, `/alumni/:id`, `/feed` and `/me`, plus the unknown-path route and test pages. Both guards come from `features/auth`.
 - Lazy routes (ADR-08): `/directory` (`DIRECTORY_ROUTE`), `/alumni/:id` (`PROFILE_ROUTE`) `/feed` (`FEED_ROUTE`, REQ-009) and `/me` (`ME_ROUTE`, REQ-010) are loaded with the route's `lazy`, so each page is its own chunk. Only the route's dynamic `import()` may reference `features/directory`, `features/profile`, `features/feed` or `features/me`; an ESLint rule (`@typescript-eslint/no-restricted-imports` in `eslint.config.js`; `import type` is allowed) rejects a static import of any of them anywhere else in `src/` except tests, and `lazyRoutes.test.ts` scans every non-test file in `src/` as a second check. Both checks run once per feature, leaving out only that feature's own folder, so the lazy features cannot import each other. A new large page is added to the `LAZY_FEATURES` list in both places.
 - `HydrateFallback`: the "Loading…" line shown in `<main>` while a lazy page's code loads on a direct visit. Set it as a static property of the lazy route object itself, never on the root or on what `lazy` returns: the router stops rendering at the nearest route that has one, so anywhere higher hides the shell. A client-side click to a lazy page shows no fallback (the old page stays until the code arrives). A chunk that fails to load shows the inner `RouteError`.
 - `RootLayout`: applies the theme and mounts `SessionBridge` once for every page, auth pages included. Don't mount it in a shell.
 - The `AuthShell` layout: no header, only the `ThemeToggle` in the top-right corner, and `<main id="main">`.
-- The `AppShell` layout: the header holds the `Logo` (with `BRAND_NAME` from `@/config/brand`, linking home), `MainNav` (`<nav aria-label="Main">`, desktop only), the compact icon-only `ThemeToggle` (the one the login page uses) and `HeaderAuth` (Log in / Sign up for guests; for a signed-in user an avatar menu with their name, email and Log out). On phones (< 48rem) the nav is `BottomTabs` (`<nav aria-label="Main tabs">`, sticky at the bottom). Both read one `NAV_ITEMS` list (`navItems.tsx`), which holds only pages that exist (Directory and Feed): add Profile and Admin there when built. The shell follows `docs/design/screens/app/S1-*`; `main` is full width with S1 gutters and each page caps its own width (Home 65rem, Directory 72rem centred, Feed 40rem).
+- The `AppShell` layout: the header holds the `Logo` (with `BRAND_NAME` from `@/config/brand`, linking home), `MainNav` (`<nav aria-label="Main">`, desktop only), the compact icon-only `ThemeToggle` (the one the login page uses) and `HeaderAuth` (Log in / Sign up for guests; for a signed-in user an avatar menu with their name and email, View profile (alumni only), My Profile and Log out). On phones (< 48rem) the nav is `BottomTabs` (`<nav aria-label="Main tabs">`, sticky at the bottom). Both read one `NAV_ITEMS` list (`navItems.tsx`), which holds only pages that exist (Directory, Feed and My Profile): add Admin there when built. The shell follows `docs/design/screens/app/S1-*`; `main` is full width with S1 gutters and each page caps its own width (Home 65rem, Directory 72rem centred, Feed 40rem).
 - The route error element.
 
 **May import:** anything in `src/` (`@/config/**`, `@/features/**` except `features/directory`, `features/profile`, `features/feed` and `features/me`, which only their lazy route's dynamic import reaches, `@/components/ui/**`, `@/store/**`, `@/services/**`, `@/styles/**`).
 
 **Imported by:** only `src/main.tsx`. Nothing else may import from `app/`.
diff --git a/packages/frontend/src/components/ui/Toast/Toast.tsx b/packages/frontend/src/components/ui/Toast/Toast.tsx
index 4a6e0722..95217170 100644
--- a/packages/frontend/src/components/ui/Toast/Toast.tsx
+++ b/packages/frontend/src/components/ui/Toast/Toast.tsx
@@ -1,43 +1,55 @@
 import type { ComponentPropsWithRef, ReactNode } from 'react';
 import { cx } from '../cx';
 import styles from './Toast.module.css';
 
 export interface ToastProps extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'role'> {
-  /** The message, e.g. "Profile updated successfully". */
+  /**
+   * The message, e.g. "Profile updated successfully", or null when no toast
+   * shows. Keep the Toast mounted and pass null to close it, so the status
+   * region is already in the page when the next message is written into it.
+   */
   children: ReactNode;
   /** Called when the dismiss (x) button is pressed. */
   onDismiss: () => void;
   /** Accessible name of the dismiss button, e.g. "Dismiss". */
   dismissLabel: string;
 }
 
 /**
  * A short success message pinned to the top of the screen (top-right from
  * 48rem, full width on a phone), with a decorative check and a dismiss button.
  * Purely presentational: the caller decides when it shows and owns any
- * auto-dismiss timer. Only the message sits in the role="status" region, so
- * the dismiss button's name is not read out with it.
+ * auto-dismiss timer. The role="status" region is always mounted (empty, with
+ * no pill, check or button while closed) so screen readers announce the
+ * message when it is written in; only the message sits in it, so the dismiss
+ * button's name is not read out with it. Other props (className, data-*,
+ * onMouseEnter, onFocus…) go to the outer element.
  */
 export function Toast({ children, onDismiss, dismissLabel, className, ...rest }: ToastProps) {
+  const open = children !== null && children !== undefined && children !== false;
   return (
-    <div {...rest} className={cx(styles.toast, className)}>
-      <svg className={styles.check} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
-        <polyline points="20 6 9 17 4 12" />
-      </svg>
+    <div {...rest} className={cx(open && styles.toast, className)}>
+      {open && (
+        <svg className={styles.check} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
+          <polyline points="20 6 9 17 4 12" />
+        </svg>
+      )}
       <p role="status" className={styles.message}>
-        {children}
+        {open ? children : null}
       </p>
-      <button
-        type="button"
-        className={styles.dismiss}
-        aria-label={dismissLabel}
-        onClick={onDismiss}
-      >
-        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
-          <line x1="18" y1="6" x2="6" y2="18" />
-          <line x1="6" y1="6" x2="18" y2="18" />
-        </svg>
-      </button>
+      {open && (
+        <button
+          type="button"
+          className={styles.dismiss}
+          aria-label={dismissLabel}
+          onClick={onDismiss}
+        >
+          <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
+            <line x1="18" y1="6" x2="6" y2="18" />
+            <line x1="6" y1="6" x2="18" y2="18" />
+          </svg>
+        </button>
+      )}
     </div>
   );
 }
diff --git a/packages/frontend/src/features/feed/README.md b/packages/frontend/src/features/feed/README.md
index 3eb6964f..1dc7cd92 100644
--- a/packages/frontend/src/features/feed/README.md
+++ b/packages/frontend/src/features/feed/README.md
@@ -1,19 +1,19 @@
 # features/feed/
 
 **Purpose:** the post feed at `/feed` (REQ-009, design `docs/design/screens/app/S4-*`): read posts, write one, read and add comments and replies, and edit or delete your own (admins: anyone's).
 
 **What is here:**
 
 - `FeedPage`: `h1` Feed (focus target after a delete), `Composer`, then the posts with Load more, or one state from `FeedStates`. Owns post-delete state: a post with comments asks inline first ("Delete this post and its N comments?", Delete / Cancel); one without goes at once. A refused delete puts the post back and shows the API message.
 - `Composer`: new post (optimistic, trimmed, Post disabled while blank, capped at `POST_MAX_LENGTH` with the characters left shown only near the cap). The avatar shows from 48rem only (S4 phone has none).
 - `PostCard`: author avatar and name, linked to `profilePath(author_alumni_id)` only when the author has an alumni profile (never the user id), time with "· edited", text (`pre-wrap`), the "Post actions" menu (Edit post, Delete post) for the author or an admin, inline edit, the count toggle ("N comments" / "Hide comments", "Comment" at 0) and its `CommentThread`. A pending post (negative id) has no menu and a disabled toggle.
 - `CommentThread`: comments oldest first, replies indented (one level), "<time> · Reply · Edit · Delete", the reply pill. Owns the comment write hooks (a deleted row unmounts before a rollback). A 404 shows "This post is no longer available" and invalidates the feed.
 - `FeedStates`: `FeedSkeleton` (status line outside `aria-busy`, G30), `EmptyFeed` (S4-EmptyFeed), `FeedLoadError`, `LoadMore`.
 - `Byline` (`AuthorAvatar`, `AuthorName`, `Timestamp`), `EditBox` (inline edit, Save / Cancel, Escape cancels).
 - Data (TASK-004): `usePosts`, `useComments`, `useFeedMutations` (ADR-09 optimistic writes), `cacheEdits`, `permissions` (`canModify`), `feedErrors`, `constants`.
 - Pure helpers: `feedFormat.ts` (labels, "edited", thread grouping, author link).
 - `testKit.ts`: test-only helpers (fake API at the axios adapter, a live token, fixtures). Only `*.test.tsx` here import it.
 
-**May import:** `@/components/ui/**`, `@/config/**`, `@/services/**`, `@/features/auth` (current user, error texts), and types from `@alumni/shared`. Not `@/app/**`. Not `@/features/directory/**` or `@/features/profile/**` (lazy features meet only through `config/`).
+**May import:** `@/components/ui/**`, `@/config/**`, `@/services/**`, `@/features/auth` (current user, error texts), and types from `@alumni/shared`. Not `@/app/**`. Not `@/features/directory/**`, `@/features/profile/**` or `@/features/me/**` (lazy features meet only through `config/`).
 
 **Imported by:** only the lazy route's dynamic `import()` in `app/router.tsx` (ADR-08, added in TASK-006). There is no `index.ts`; nothing else may import this folder statically.
diff --git a/packages/frontend/src/features/me/LeavePrompt.tsx b/packages/frontend/src/features/me/LeavePrompt.tsx
index b728dd2a..81889fe0 100644
--- a/packages/frontend/src/features/me/LeavePrompt.tsx
+++ b/packages/frontend/src/features/me/LeavePrompt.tsx
@@ -1,45 +1,57 @@
 import { useEffect, useId, useRef } from 'react';
 import { Button } from '@/components/ui/Button';
 import { InfoIcon } from './InfoIcon';
 import styles from './SaveBar.module.css';
 
 export const LEAVE_PROMPT_TEXT = 'Leave without saving? Your changes will be lost.';
 
 export interface LeavePromptProps {
   /** Keep editing: cancel the blocked navigation. */
   onStay: () => void;
   /** Leave: let the blocked navigation go on; unsaved changes are lost. */
   onLeave: () => void;
 }
 
 /**
  * Shown in the save bar's place when a navigation is blocked by unsaved
  * changes (useLeaveGuard). There is no dialog primitive, so it is a labelled
  * group, not a modal. Focus moves to "Keep editing" when it appears: the user
  * just pressed a link elsewhere, and the safe choice is under their hand.
+ * Escape from either button also keeps editing.
  */
 export function LeavePrompt({ onStay, onLeave }: LeavePromptProps) {
   const labelId = useId();
   const stayRef = useRef<HTMLButtonElement>(null);
 
   useEffect(() => {
     stayRef.current?.focus();
   }, []);
 
   return (
-    <div role="group" aria-labelledby={labelId} className={styles.content}>
+    // Escape keeps editing, like closing a dialog with its safe choice.
+    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the keys come from its buttons
+    <div
+      role="group"
+      aria-labelledby={labelId}
+      className={styles.content}
+      onKeyDown={(event) => {
+        if (event.key !== 'Escape') return;
+        event.preventDefault();
+        onStay();
+      }}
+    >
       <p id={labelId} className={styles.message}>
         <InfoIcon />
         {LEAVE_PROMPT_TEXT}
       </p>
       <div className={styles.actions}>
         <Button variant="secondary" className={styles.action} onClick={onLeave}>
           Leave
         </Button>
         <Button ref={stayRef} variant="primary" className={styles.action} onClick={onStay}>
           Keep editing
         </Button>
       </div>
     </div>
   );
 }
diff --git a/packages/frontend/src/features/me/ProfileForm.tsx b/packages/frontend/src/features/me/ProfileForm.tsx
index 5fc8a9ff..001c84a2 100644
--- a/packages/frontend/src/features/me/ProfileForm.tsx
+++ b/packages/frontend/src/features/me/ProfileForm.tsx
@@ -52,100 +52,120 @@ function focusIsLost(): boolean {
 export interface ProfileFormProps {
   /** The profile from ['me'] when the form mounted. Later refetches are ignored (ADV-004). */
   profile: MyProfile;
   /** The page's h1: focus goes there when the save bar's button unmounts under it. */
   headingRef: RefObject<HTMLHeadingElement | null>;
 }
 
 /**
  * The /me editor. MePage keys it on `user_id` only, so it initialises once;
  * from then on the saved profile (the baseline for "unsaved changes", the
  * photo_url sent back on save) lives in this component's state and is replaced
  * from the mutation's result, never from a refetch (ADV-004). The mutation,
  * the toast and the password error live here too, so a refetch of ['me'] after
  * a save never remounts the form and loses them.
  *
  * Sections follow S5's order: Personal, Education, Career, Password; the
  * account's kind decides which render (Mentorship is left out by decision).
  * Errors show after a field is left or Save is tried; a failed Save focuses
  * the first invalid field after flushSync, so it is read with its message.
  */
 export function ProfileForm({ profile, headingRef }: ProfileFormProps) {
   const [saved, setSaved] = useState(profile);
   const [baseline, setBaseline] = useState<ProfileValues>(() => toValues(profile));
   const [values, setValues] = useState<ProfileValues>(baseline);
   const [password, setPassword] = useState<PasswordValues>(EMPTY_PASSWORD_VALUES);
   const [errors, setErrors] = useState<MeErrors>({});
   const [formError, setFormError] = useState<string | null>(null);
   const [passwordFormError, setPasswordFormError] = useState<string | null>(null);
   const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
   const toastCount = useRef(0);
+  // The id of the toast under the pointer / holding focus. Kept per id, so a
+  // toast that unmounts while hovered (no mouseleave) never pauses the next.
+  const [hoveredToast, setHoveredToast] = useState<number | null>(null);
+  const [focusedToast, setFocusedToast] = useState<number | null>(null);
+  const toastPaused = toast !== null && (hoveredToast === toast.id || focusedToast === toast.id);
   // A save succeeded in this visit: the "all saved" caption may show while clean.
   const [savedOnce, setSavedOnce] = useState(false);
   const formRef = useRef<HTMLFormElement>(null);
   const formErrorRef = useRef<HTMLDivElement>(null);
   const passwordErrorRef = useRef<HTMLDivElement>(null);
 
   const save = useUpdateProfile();
   const kind = profileKind(saved);
   const visibleFields: readonly MeField[] = [...profileFields(kind), ...PASSWORD_FIELDS];
   const dirty = isDirty(values, baseline, kind, password);
   // A save in flight blocks leaving too, so its outcome is never lost unseen (ADV-008).
   const guarding = dirty || save.isPending;
   const blocker = useLeaveGuard(guarding);
 
   // A blocked navigation whose reason is gone (the save it waited for settled
   // with nothing left unsaved, or the edits were typed back): drop the prompt
   // and stay, so the toast is seen; the user can follow the link again.
   useEffect(() => {
     if (blocker.state === 'blocked' && !guarding) blocker.reset();
   }, [blocker, guarding]);
 
+  // Auto-close after TOAST_MS, paused while the toast is hovered or holds
+  // focus (WCAG 2.2.1); leaving it starts a fresh TOAST_MS.
   useEffect(() => {
-    if (toast === null) return;
+    if (toast === null || toastPaused) return;
     const timer = setTimeout(() => {
-      setToast(null);
+      // Same as closeToast (inlined to keep the effect's dependencies honest).
+      flushSync(() => {
+        setToast(null);
+      });
+      if (focusIsLost()) headingRef.current?.focus();
     }, TOAST_MS);
     return () => {
       clearTimeout(timer);
     };
-  }, [toast]);
+  }, [toast, toastPaused, headingRef]);
 
   function focusField(field: MeField) {
     const element = formRef.current?.elements.namedItem(field);
     if (element instanceof HTMLElement) element.focus();
   }
 
   function focusHeadingIfLost() {
     if (focusIsLost()) headingRef.current?.focus();
   }
 
+  // Dismiss unmounts under the pointer or keyboard: focus goes to the heading.
+  // The timer pauses while the toast has focus, but the same rule covers it.
+  function closeToast() {
+    flushSync(() => {
+      setToast(null);
+    });
+    focusHeadingIfLost();
+  }
+
   function showToast(text: string) {
     toastCount.current += 1;
     setToast({ id: toastCount.current, text });
   }
 
   const bind: BindField = (field) => ({
     name: field,
     value: isPasswordField(field) ? password[field] : values[field],
     error: errors[field],
     onChange: (event) => {
       const { value } = event.target;
       if (isPasswordField(field)) {
         setPassword((prev) => ({ ...prev, [field]: value }));
         setPasswordFormError(null);
       } else {
         setValues((prev) => ({ ...prev, [field]: value }));
       }
       setErrors((prev) => ({ ...prev, [field]: undefined }));
     },
     onBlur: () => {
       // Same rules as Save. Only adds a message: leaving a field must not wipe
       // a server error (e.g. "Current password is incorrect") shown on it.
       const message = planSave(values, baseline, kind, password).errors[field];
       if (message !== undefined) setErrors((prev) => ({ ...prev, [field]: message }));
     },
   });
 
   function handleDiscard() {
     flushSync(() => {
       setValues(baseline);
@@ -271,47 +291,53 @@ export function ProfileForm({ profile, headingRef }: ProfileFormProps) {
 
   return (
     <>
       <form
         ref={formRef}
         noValidate
         className={cx(styles.form, showBar && styles.withBar)}
         onSubmit={handleSubmit}
       >
         {formError !== null && (
           <Alert ref={formErrorRef} tabIndex={-1} tone="error">
             {formError}
           </Alert>
         )}
         <PersonalSection
           bind={bind}
           kind={kind}
           savedName={saved.name}
           photoUrl={saved.photo_url}
         />
         <EducationSection bind={bind} kind={kind} />
         <CareerSection bind={bind} kind={kind} />
         <PasswordSection
           bind={bind}
           formError={passwordFormError}
           formErrorRef={passwordErrorRef}
         />
         {savedOnce && !dirty && <p className={styles.allSaved}>{ALL_SAVED_TEXT}</p>}
         {showBar && <SaveBar saving={save.isPending} onDiscard={handleDiscard} prompt={prompt} />}
       </form>
-      {toast !== null && (
-        <Toast
-          key={toast.id}
-          dismissLabel={TOAST_DISMISS_LABEL}
-          onDismiss={() => {
-            flushSync(() => {
-              setToast(null);
-            });
-            focusHeadingIfLost();
-          }}
-        >
-          {toast.text}
-        </Toast>
-      )}
+      {/* Always mounted: its status region must be in the page before the
+          message is written into it, or screen readers may not announce it. */}
+      <Toast
+        dismissLabel={TOAST_DISMISS_LABEL}
+        onDismiss={closeToast}
+        onMouseEnter={() => {
+          if (toast !== null) setHoveredToast(toast.id);
+        }}
+        onMouseLeave={() => {
+          setHoveredToast(null);
+        }}
+        onFocus={() => {
+          if (toast !== null) setFocusedToast(toast.id);
+        }}
+        onBlur={(event) => {
+          if (!event.currentTarget.contains(event.relatedTarget)) setFocusedToast(null);
+        }}
+      >
+        {toast?.text ?? null}
+      </Toast>
     </>
   );
 }
diff --git a/packages/frontend/src/features/me/README.md b/packages/frontend/src/features/me/README.md
index 5b51ce28..8360ba11 100644
--- a/packages/frontend/src/features/me/README.md
+++ b/packages/frontend/src/features/me/README.md
@@ -1,18 +1,18 @@
 # features/me/
 
 **Purpose:** the signed-in user's own profile editor at `/me` (REQ-010, design `docs/design/screens/app/S5-*`).
 
 **What is here:**
 
 - `MePage` — reads the `['me']` query (`useCurrentUser`) and shows skeleton cards, a first-load error with Retry, or `ProfileForm`. Tab title "My Profile · Alma". Below 48rem a slim top bar (back arrow and title, one link "Back to home") replaces the visible h1, which stays in the page clipped (never `display: none`). Focus goes to the h1 on a view change only when focus was lost (LESSON-REQ-008-2).
-- `ProfileForm` — the controlled form (ADR-04). Keyed on `user_id` only, so a refetch or the save's own cache write never remounts it (ADV-004): the saved profile, the baseline for "unsaved changes", the toast and the password error live in its state and are replaced from the save's result. Errors show when a field is left or Save is tried; a failed Save focuses the first invalid field after `flushSync`. Discard restores the baseline and clears the password fields. After a save in this visit, and only while nothing is unsaved, a caption under the cards reads "All sections saved — no unsaved changes." (S5-UnsavedToast); the success toast (the `Toast` primitive) closes after 4 s or on Dismiss.
+- `ProfileForm` — the controlled form (ADR-04). Keyed on `user_id` only, so a refetch or the save's own cache write never remounts it (ADV-004): the saved profile, the baseline for "unsaved changes", the toast and the password error live in its state and are replaced from the save's result. Errors show when a field is left or Save is tried; a failed Save focuses the first invalid field after `flushSync`. Discard restores the baseline and clears the password fields. After a save in this visit, and only while nothing is unsaved, a caption under the cards reads "All sections saved — no unsaved changes." (S5-UnsavedToast); the success toast (the `Toast` primitive, always mounted so its status region announces the message) closes after 4 s, paused while hovered or focused, or on Dismiss (focus then goes to the heading).
 - Sections, in S5's order: `PersonalSection`, `EducationSection`, `CareerSection`, `PasswordSection` (labelled regions with an h2; shared `Section.module.css`). The account's kind (`profileKind`: alumni, student, none) decides which show: an account with no profile row gets Personal (name and University) and Password only. Mentorship and "Change photo" are left out by decision (no API for them); email is never shown or sent.
 - `SaveBar` — the fixed "Unsaved changes" region with Discard and Save (the form's submit button), shown only while dirty or while a navigation waits for an answer. `LeavePrompt` takes its place then: "Leave" / "Keep editing" (focus starts on Keep editing). `InfoIcon` is the bar's decorative icon.
 - Hooks: `useUpdateProfile` (one `useMutation`: `PUT /api/me` when a profile field changed, then `PUT /api/me/password` when a password was typed; a password failure is returned, not thrown; on success it writes `['me']` and invalidates `['alumni']` and `['posts']`, unless the session is gone; not optimistic). `useLeaveGuard(active)` (`useBlocker` plus `beforeunload`, only while dirty or saving; never blocks without a live token, to `/login`, or on the same path, so a 401 logout is never held up, ADV-002).
 - Pure helpers: `validation.ts` (`planSave`, `isDirty`, `toValues`, `toUpdateInput`, `toPasswordInput`, the client copies of the API limits), `profileErrors.ts` (`mapProfileError`: a server message naming a field lands on that field), `fields.ts` (the `BindField` contract the sections use).
 
 **Phone layout:** the save bar sits at `bottom: var(--tab-bar-height)`, a custom property `AppShell` sets on the shell (0 from 48rem) and `BottomTabs` uses as its min height, so the bar never covers the tab bar (ADV-001). An in-flow spacer of `--save-bar-height` and matching scroll margins on the controls keep the last field clear of the bar (LESSON-REQ-007-1).
 
 **May import:** `@/components/ui/**`, `@/config/**`, `@/services/**`, `@/store/**`, `@/styles/**`, `@/features/auth` (its public `index.ts`), and types from `@alumni/shared`. Not `@/app/**` (tests may import its providers). Not another lazy feature (`directory`, `profile`, `feed`).
 
 **Imported by:** only the lazy route's dynamic `import()` in `app/router.tsx` (ADR-08). There is no `index.ts`; nothing else may import this folder statically.
diff --git a/packages/frontend/src/features/me/useUpdateProfile.ts b/packages/frontend/src/features/me/useUpdateProfile.ts
index cb31c17d..8d1f6061 100644
--- a/packages/frontend/src/features/me/useUpdateProfile.ts
+++ b/packages/frontend/src/features/me/useUpdateProfile.ts
@@ -1,57 +1,60 @@
 import type { ChangePasswordInput, MyProfile, UpdateMyProfileInput } from '@alumni/shared';
 import { useMutation, useQueryClient } from '@tanstack/react-query';
 import { CURRENT_USER_QUERY_KEY } from '@/features/auth';
 import { changePassword, updateMyProfile } from '@/services/authApi';
 import { getLiveToken } from '@/services/authToken';
 
 /** One Save: either part may be skipped (planSave decides), never both. */
 export interface SaveRequest {
   /** PUT /api/me body, or null when no profile field changed (ADV-003). */
   profile: UpdateMyProfileInput | null;
   /** PUT /api/me/password body, or null when no password was typed. */
   password: ChangePasswordInput | null;
 }
 
 export interface SaveResult {
   /** The saved profile from PUT /api/me, or null when that call was skipped. */
   profile: MyProfile | null;
   /** True when PUT /api/me/password ran and succeeded. */
   passwordChanged: boolean;
   /** The password call's error, when it failed; the profile part still counts. */
   passwordError: unknown;
 }
 
 // Query keys whose rows carry the user's name, photo or profile fields:
-// ['alumni', ...] (the directory and /alumni/:id) and ['posts', ...] (feed and
-// profile cards show the author's name and photo).
-const STALE_AFTER_PROFILE_SAVE = [['alumni'], ['posts']] as const;
+// ['alumni', ...] (the directory and /alumni/:id), ['posts', ...] (recent posts
+// on /alumni/:id) and ['feed', ...] (the feed's ['feed','posts'] and
+// ['feed','comments',id] show the author's name and photo). 'feed' is a string
+// literal, not features/feed's POSTS_QUERY_KEY: lazy features never import
+// each other (ADR-08), so keep it in step with features/feed/constants.ts.
+const STALE_AFTER_PROFILE_SAVE = [['alumni'], ['posts'], ['feed']] as const;
 
 /**
  * Save for /me: one mutation, two calls (LESSON-REQ-002-3). PUT /api/me runs
  * first when a profile field changed; a failure there throws and nothing else
  * runs. PUT /api/me/password runs next when a password was typed; its failure
  * is returned, not thrown, so a profile that did save is still applied while
  * the error shows on the password section. Not optimistic (architecture: a
  * watched form waits instead of rolling back).
  *
  * The cache work lives here, not in the caller's mutate() callbacks, so it
  * still happens if the user leaves the page while the save is in flight.
  */
 export function useUpdateProfile() {
   const queryClient = useQueryClient();
   return useMutation({
     mutationFn: async (request: SaveRequest): Promise<SaveResult> => {
       const profile = request.profile ? await updateMyProfile(request.profile) : null;
       let passwordChanged = false;
       let passwordError: unknown = null;
       if (request.password) {
         try {
           await changePassword(request.password);
           passwordChanged = true;
         } catch (error: unknown) {
           passwordError = error;
         }
       }
       return { profile, passwordChanged, passwordError };
     },
     onSuccess: ({ profile }) => {
diff --git a/packages/frontend/src/features/profile/README.md b/packages/frontend/src/features/profile/README.md
index 06499ed8..e32f80c9 100644
--- a/packages/frontend/src/features/profile/README.md
+++ b/packages/frontend/src/features/profile/README.md
@@ -1,16 +1,16 @@
 # features/profile/
 
 **Purpose:** the alumni profile page at `/alumni/:id` (REQ-008, design `docs/design/screens/app/S3-*`).
 
 **What is here:**
 
 - `ProfilePage` — reads `:id`, runs `useAlumniProfile` and shows one state: loading (`ProfileSkeleton`), not found (`ProfileNotFound`; the API answers 404 for unknown and malformed ids), load error with Retry (`ProfileLoadError`), or the profile. Every state has its own `h1` (`tabIndex={-1}`) and tab title, and focus moves to the current `h1` when the state or the id changes. A 401 is handled globally (ADR-03).
 - `BackLink` — "Back to directory", restoring the directory's search through router state read by `config/directoryReturn`. Below 48rem the text is visually hidden and an `aria-hidden` "Profile" title sits beside the arrow.
 - `ProfileHeader` — avatar (`size="lg"`, 72px on phone), the name as `h1`, the headline, a LinkedIn link only for a safe http(s) URL, and the tab title. Never shows the email.
 - Sections: `AboutSection`, `EducationSection`, `EmploymentSection` (on a shared `Timeline`) and `RecentPosts` (`PostCard`, `usePostsByUser`, newest 5). Each hides when it has no data; Recent posts owns its loading, error and empty states so a posts failure keeps the profile.
 - Pure helpers: `format.ts` (`present`, `headline`, `educationLine`, `employmentTitle`, `safeLinkedInUrl`, `commentCountText`). `PostCard` takes its time text from `config/relativeTime` (shared with the feed).
 - Hooks: `useAlumniProfile` (`['alumni','profile',id]`, no `placeholderData`), `usePostsByUser` (`['posts','user',userId]`, idle until the profile gives the `user_id`).
 
-**May import:** `@/components/ui/**`, `@/config/**`, `@/services/**`, `@/store/**`, `@/styles/**`, and types from `@alumni/shared`. Not `@/app/**` (tests may import its providers). Not `@/features/directory/**`: the two lazy features meet only through `config/directoryReturn` (ADR-06, ADR-08).
+**May import:** `@/components/ui/**`, `@/config/**`, `@/services/**`, `@/store/**`, `@/styles/**`, and types from `@alumni/shared`. Not `@/app/**` (tests may import its providers). Not another lazy feature (`@/features/directory/**`, `@/features/feed/**`, `@/features/me/**`): lazy features meet only through `config/` (the directory through `config/directoryReturn`; ADR-06, ADR-08).
 
 **Imported by:** only the lazy route's dynamic `import()` in `app/router.tsx` (ADR-08). There is no `index.ts`; nothing else may import this folder statically.

```
