# REQ-012-account-settings-nav-labels — Review Packet

`Packet: 81KB · uncommitted working tree vs HEAD (redesign tip) · markdown docs at 5 lines of context, code with full context`

Base is `redesign`; REQ-011 (separate branch) is NOT in this tree. Tests and docs: read `git diff HEAD -- <path>` yourself if you need more (required reading, not a packet gap).

## Source diff, full context

```diff
diff --git a/packages/frontend/src/app/AppShell/BottomTabs.tsx b/packages/frontend/src/app/AppShell/BottomTabs.tsx
index baa25b05..31afb8bd 100644
--- a/packages/frontend/src/app/AppShell/BottomTabs.tsx
+++ b/packages/frontend/src/app/AppShell/BottomTabs.tsx
@@ -1,30 +1,30 @@
 import { NavLink } from 'react-router';
 import { cx } from '@/components/ui/cx';
 import { useHasSession } from '@/features/auth';
 import styles from './BottomTabs.module.css';
-import { NAV_ITEMS } from './navItems';
+import { TAB_NAV_ITEMS } from './navItems';
 
 /**
- * The phone's bottom tab bar (docs/design/screens/app/S1-Phone-*): the same
- * pages as MainNav, each with an icon above its label, the current one in the
- * accent colour. Signed-in users only; hidden by CSS from 48rem up.
+ * The phone's bottom tab bar (docs/design/screens/app/S1-Phone-*): MainNav's
+ * pages plus Account (/me), each with an icon above its label, the current one
+ * in the accent colour. Signed-in users only; hidden by CSS from 48rem up.
  */
 export function BottomTabs() {
   const hasSession = useHasSession();
   if (!hasSession) return null;
 
   return (
     <nav aria-label="Main tabs" className={styles.tabs}>
-      {NAV_ITEMS.map((item) => (
+      {TAB_NAV_ITEMS.map((item) => (
         <NavLink
           key={item.to}
           to={item.to}
           className={({ isActive }) => cx(styles.tab, isActive && styles.active)}
         >
           {item.icon}
           {item.label}
         </NavLink>
       ))}
     </nav>
   );
 }
diff --git a/packages/frontend/src/app/AppShell/HeaderAuth.tsx b/packages/frontend/src/app/AppShell/HeaderAuth.tsx
index da741f41..e6e773ba 100644
--- a/packages/frontend/src/app/AppShell/HeaderAuth.tsx
+++ b/packages/frontend/src/app/AppShell/HeaderAuth.tsx
@@ -1,91 +1,92 @@
 import { useNavigate } from 'react-router';
 import { ButtonLink } from '@/components/ui/Button';
 import { Avatar } from '@/components/ui/Avatar';
 import { Menu, MenuItem, MenuLabel, MenuSeparator } from '@/components/ui/Menu';
 import { profilePath } from '@/config/directoryReturn';
 import { ME_PATH } from '@/config/mePath';
 import { useCurrentUser, useHasSession, useLogout } from '@/features/auth';
 import styles from './AppShell.module.css';
 
 /**
  * The header's auth area. Guests get Log in and Sign up links. A signed-in
  * user gets an avatar menu (initials, chevron): their name and email, View
  * profile (their public /alumni/:id page, only with an alumni row, so never
- * for a student), My Profile (/me), then Log out. While ['me'] is loading or
- * has failed the button reads "Account menu" and still offers My Profile and
- * Log out (ADV-006). Admin settings join it when that page exists.
+ * for a student), Account settings (/me), then Log out. While ['me'] is loading or
+ * has failed the button reads "Account menu" and still offers Account settings
+ * and Log out (ADV-006). On desktop this menu and the Home card are the only
+ * ways to /me (the header nav leaves it out, REQ-012). Admin settings join it when that page exists.
  */
 export function HeaderAuth() {
   const hasSession = useHasSession();
 
   if (!hasSession) {
     return (
       <nav aria-label="Account" className={styles.authLinks}>
         <ButtonLink to="/login" variant="ghost">
           Log in
         </ButtonLink>
         <ButtonLink to="/register" variant="primary">
           Sign up
         </ButtonLink>
       </nav>
     );
   }
   return <UserMenu />;
 }
 
 function UserMenu() {
   const { data: user } = useCurrentUser();
   const logout = useLogout();
   const navigate = useNavigate();
   const alumniId = user?.alumni_id ?? null;
   const trimmed = user?.name.trim() ?? '';
   const avatarName = trimmed.length > 0 ? trimmed : '?';
 
   return (
     <Menu
       label={user?.name ? `Account menu for ${user.name}` : 'Account menu'}
       trigger={
         <>
           {/* "?" until the profile loads, so the button is never an empty circle. */}
           <Avatar name={avatarName} size="xs" className={styles.avatar} />
           <ChevronIcon />
         </>
       }
       align="end"
       className={styles.accountButton}
     >
       {user && (
         <>
           <MenuLabel>
             <span className={styles.menuName}>{user.name}</span>
             <span className={styles.menuEmail}>{user.email}</span>
           </MenuLabel>
           {alumniId !== null && (
             <MenuItem onSelect={() => void navigate(profilePath(alumniId))}>View profile</MenuItem>
           )}
         </>
       )}
-      <MenuItem onSelect={() => void navigate(ME_PATH)}>My Profile</MenuItem>
+      <MenuItem onSelect={() => void navigate(ME_PATH)}>Account settings</MenuItem>
       <MenuSeparator />
       <MenuItem onSelect={logout}>Log out</MenuItem>
     </Menu>
   );
 }
 
 function ChevronIcon() {
   return (
     <svg
       className={styles.chevron}
       viewBox="0 0 24 24"
       fill="none"
       stroke="currentColor"
       strokeWidth={2}
       strokeLinecap="round"
       strokeLinejoin="round"
       aria-hidden="true"
       focusable="false"
     >
       <polyline points="6 9 12 15 18 9" />
     </svg>
   );
 }
diff --git a/packages/frontend/src/app/AppShell/MainNav.tsx b/packages/frontend/src/app/AppShell/MainNav.tsx
index cbe918cd..68b9283b 100644
--- a/packages/frontend/src/app/AppShell/MainNav.tsx
+++ b/packages/frontend/src/app/AppShell/MainNav.tsx
@@ -1,30 +1,30 @@
 import { NavLink } from 'react-router';
 import { cx } from '@/components/ui/cx';
 import { useHasSession } from '@/features/auth';
 import styles from './MainNav.module.css';
-import { NAV_ITEMS } from './navItems';
+import { HEADER_NAV_ITEMS } from './navItems';
 
 /**
  * The header's main nav (docs/design/screens/app/S1-Desktop-*), shown only to
  * a signed-in user because every section is behind sign-in. NavLink marks the
  * link `aria-current="page"` on its path and below (e.g. /directory?page=2).
  * Hidden by CSS below 48rem, where BottomTabs takes over.
  */
 export function MainNav() {
   const hasSession = useHasSession();
   if (!hasSession) return null;
 
   return (
     <nav aria-label="Main" className={styles.nav}>
-      {NAV_ITEMS.map((item) => (
+      {HEADER_NAV_ITEMS.map((item) => (
         <NavLink
           key={item.to}
           to={item.to}
           className={({ isActive }) => cx(styles.link, isActive && styles.active)}
         >
           {item.label}
         </NavLink>
       ))}
     </nav>
   );
 }
diff --git a/packages/frontend/src/app/AppShell/navItems.tsx b/packages/frontend/src/app/AppShell/navItems.tsx
index b7dc956f..fb588bba 100644
--- a/packages/frontend/src/app/AppShell/navItems.tsx
+++ b/packages/frontend/src/app/AppShell/navItems.tsx
@@ -1,23 +1,33 @@
 import type { ReactNode } from 'react';
 import { DIRECTORY_PATH } from '@/config/directoryReturn';
 import { FEED_PATH } from '@/config/feedPath';
 import { ME_PATH } from '@/config/mePath';
 import { ChatBubbleIcon, GridIcon, PersonIcon } from './NavIcons';
 
 export interface NavItem {
   to: string;
   label: string;
   /** Tab-bar icon (decorative; the label names the link). */
   icon: ReactNode;
 }
 
 /**
- * The app's sections, shared by the header nav (desktop) and the bottom tab
- * bar (phone), in S1's order. Only pages that exist are listed: add Admin
- * here when its page is built (S1 shows all four).
+ * The header nav (desktop), in S1's order. Only pages that exist are listed:
+ * add Admin here when its page is built (S1 shows all four). Account settings
+ * (/me) is deliberately left out: on desktop it is reached from the avatar
+ * menu and the Home card (REQ-012, a deviation from S1, which draws it here).
  */
-export const NAV_ITEMS: readonly NavItem[] = [
+export const HEADER_NAV_ITEMS: readonly NavItem[] = [
   { to: DIRECTORY_PATH, label: 'Directory', icon: <GridIcon /> },
   { to: FEED_PATH, label: 'Feed', icon: <ChatBubbleIcon /> },
-  { to: ME_PATH, label: 'My Profile', icon: <PersonIcon /> },
+];
+
+/**
+ * The bottom tab bar (phone): the header's pages plus Account (/me), since a
+ * phone has no other one-tap way there. "Account settings" is too long for a
+ * tab, so the tab reads "Account" (S1's phone bar draws "Profile").
+ */
+export const TAB_NAV_ITEMS: readonly NavItem[] = [
+  ...HEADER_NAV_ITEMS,
+  { to: ME_PATH, label: 'Account', icon: <PersonIcon /> },
 ];
diff --git a/packages/frontend/src/app/router.tsx b/packages/frontend/src/app/router.tsx
index 23f419f7..473bfeb7 100644
--- a/packages/frontend/src/app/router.tsx
+++ b/packages/frontend/src/app/router.tsx
@@ -1,134 +1,134 @@
 import { createBrowserRouter, type DOMRouterOpts, type RouteObject } from 'react-router';
 import { GuestOnly, LoginPage, RegisterPage, RequireAuth } from '@/features/auth';
 import { HomePage } from '@/features/home';
 import { AppShell } from './AppShell';
 import { AuthShell } from './AuthShell';
 import { HydrateFallback } from './HydrateFallback';
 import { RootLayout } from './RootLayout';
 import { RouteError } from './RouteError';
 
 /**
  * Guests may open /login and /register; signed-in users are sent on from
  * there. These render in AuthShell, without the app header.
  */
 const AUTH_ROUTES: RouteObject[] = [
   {
     element: <GuestOnly />,
     children: [
       { path: 'login', element: <LoginPage /> },
       { path: 'register', element: <RegisterPage /> },
     ],
   },
 ];
 
 /**
  * The directory page loads in its own chunk (ADR-08). Only this dynamic
  * import may reference `features/directory`; `lazyRoutes.test.ts` fails on a
  * static import of it anywhere in `src/`. `HydrateFallback` sits on this route
  * object itself, so a direct visit keeps the shell and shows "Loading…" in
  * `<main>` until the chunk arrives. A failed chunk load shows RouteError.
  */
 export const DIRECTORY_ROUTE: RouteObject = {
   path: 'directory',
   HydrateFallback,
   lazy: async () => {
     const { DirectoryPage } = await import('@/features/directory/DirectoryPage');
     return { Component: DirectoryPage };
   },
 };
 
 /**
  * The alumni profile page, the second lazy page (ADR-08), built the same way
  * as `DIRECTORY_ROUTE`: only this dynamic import may reference
  * `features/profile`, and `HydrateFallback` sits on this route object.
  */
 export const PROFILE_ROUTE: RouteObject = {
   path: 'alumni/:id',
   HydrateFallback,
   lazy: async () => {
     const { ProfilePage } = await import('@/features/profile/ProfilePage');
     return { Component: ProfilePage };
   },
 };
 
 /**
  * The post feed, the third lazy page (ADR-08), built the same way as
  * `DIRECTORY_ROUTE`: only this dynamic import may reference `features/feed`,
  * and `HydrateFallback` sits on this route object.
  */
 export const FEED_ROUTE: RouteObject = {
   path: 'feed',
   HydrateFallback,
   lazy: async () => {
     const { FeedPage } = await import('@/features/feed/FeedPage');
     return { Component: FeedPage };
   },
 };
 
 /**
  * The signed-in user's own profile form, the fourth lazy page (ADR-08,
  * REQ-010), built the same way as `DIRECTORY_ROUTE`: only this dynamic import
  * may reference `features/me`, and `HydrateFallback` sits on this route object.
  */
 export const ME_ROUTE: RouteObject = {
   path: 'me',
   HydrateFallback,
   lazy: async () => {
     const { MePage } = await import('@/features/me/MePage');
     return { Component: MePage };
   },
 };
 
 /**
  * Pages inside AppShell (header). Home is the first signed-in page; the
- * directory, the profile, the feed and My Profile are lazy. Any unknown path
+ * directory, the profile, the feed and Account settings (/me) are lazy. Any unknown path
  * shows the empty shell.
  */
 const DEFAULT_PAGE_ROUTES: RouteObject[] = [
   {
     element: <RequireAuth />,
     children: [
       { index: true, element: <HomePage /> },
       DIRECTORY_ROUTE,
       PROFILE_ROUTE,
       FEED_ROUTE,
       ME_ROUTE,
     ],
   },
   { path: '*', element: null },
 ];
 
 /**
  * Builds the route tree. RootLayout (theme + SessionBridge, once for every
  * page) holds two shells: AuthShell for the guest pages, AppShell for the
  * rest. Two error layers on each branch: the outer `errorElement` catches a
  * crash in a shell (no shell then); each shell's path-less inner route shows
  * page errors inside its `<main>`. Tests pass extra pages, which go under
  * AppShell.
  */
 export function createRoutes(pageRoutes: RouteObject[] = DEFAULT_PAGE_ROUTES): RouteObject[] {
   return [
     {
       path: '/',
       element: <RootLayout />,
       errorElement: <RouteError />,
       children: [
         {
           element: <AuthShell />,
           children: [{ errorElement: <RouteError />, children: AUTH_ROUTES }],
         },
         {
           element: <AppShell />,
           children: [{ errorElement: <RouteError />, children: pageRoutes }],
         },
       ],
     },
   ];
 }
 
 export const routes: RouteObject[] = createRoutes();
 
 /** The app's browser router. Tests use `createMemoryRouter(routes)` instead. */
 export function createAppRouter(opts?: DOMRouterOpts) {
   return createBrowserRouter(routes, opts);
 }
diff --git a/packages/frontend/src/features/home/HomePage.tsx b/packages/frontend/src/features/home/HomePage.tsx
index 76862323..856bccf7 100644
--- a/packages/frontend/src/features/home/HomePage.tsx
+++ b/packages/frontend/src/features/home/HomePage.tsx
@@ -1,70 +1,70 @@
 import { Link } from 'react-router';
 import { DIRECTORY_PATH } from '@/config/directoryReturn';
 import { FEED_PATH } from '@/config/feedPath';
 import { ME_PATH } from '@/config/mePath';
 import { useCurrentUser } from '@/features/auth';
 import styles from './HomePage.module.css';
 
 interface QuickLink {
   to: string;
   title: string;
   description: string;
 }
 
 /**
  * The cards under the greeting (docs/design/screens/app/S1-*). Only pages
  * that exist are listed; add the admin card when that page is built.
  */
 const QUICK_LINKS: readonly QuickLink[] = [
   {
     to: DIRECTORY_PATH,
     title: 'Browse the directory',
     description: 'Find classmates by year, department or field',
   },
   {
     to: FEED_PATH,
     title: 'Catch up on the feed',
     description: 'See what alumni and students are sharing',
   },
   {
     to: ME_PATH,
-    title: 'My Profile',
+    title: 'Account settings',
     description: 'Keep your details current so classmates can find you',
   },
 ];
 
 /** "Amina Rao" -> "Amina". A blank name gives "" (the greeting then has no name). */
 function firstNameOf(name: string): string {
   return name.trim().split(/\s+/)[0] ?? '';
 }
 
 /**
  * The signed-in home. Rendered under RequireAuth, which waits for ['me'], so
  * the profile is already in the cache here.
  */
 export function HomePage() {
   const { data: user } = useCurrentUser();
   if (!user) return null;
   const firstName = firstNameOf(user.name);
 
   return (
     <section className={styles.home} aria-labelledby="home-title">
       <div className={styles.intro}>
         <h1 id="home-title" className={styles.title}>
           {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
         </h1>
         <p className={styles.subtitle}>Here&apos;s what&apos;s happening in your alumni network.</p>
       </div>
       <ul className={styles.cards}>
         {QUICK_LINKS.map((link) => (
           <li key={link.to} className={styles.item}>
             <Link to={link.to} className={styles.card}>
               <span className={styles.cardTitle}>{link.title}</span>
               <span className={styles.cardText}>{link.description}</span>
             </Link>
           </li>
         ))}
       </ul>
     </section>
   );
 }
diff --git a/packages/frontend/src/features/me/MePage.module.css b/packages/frontend/src/features/me/MePage.module.css
index eb0eb075..13a4ee15 100644
--- a/packages/frontend/src/features/me/MePage.module.css
+++ b/packages/frontend/src/features/me/MePage.module.css
@@ -1,121 +1,121 @@
 /* Design: docs/design/screens/app/S5-Desktop-Light and S5-Phone-Light. A
    680px column (42.5rem, so it scales with zoom), centred; the shell's <main>
    gives S5's outer padding. Gaps 16px phone (space-4), 24px from 48rem
    (space-5). The h1 is text-heading-md (20px), the nearest token for S5's
    22px.
    Phone (below 48rem): S5's bar is a slim row at the top of the page, under
    the shell's own header (as on the profile page): a 20px chevron and the
-   "My Profile" title (14px semibold), 10px apart (space-2 + space-1 / 2),
+   "Account settings" title (14px semibold), 10px apart (space-2 + space-1 / 2),
    both inside the link. The h1 is clipped there, never display:none (G18),
    so it stays the heading and the focus target. From 48rem the row goes and
    the h1 shows. */
 
 .page {
   display: flex;
   flex-direction: column;
   gap: var(--space-4);
   width: min(100%, 42.5rem);
   min-width: 0;
   margin-inline: auto;
 }
 
 .phoneBar {
   display: flex;
   align-items: center;
 }
 
 .back {
   display: inline-flex;
   align-items: center;
   gap: calc(var(--space-2) + var(--space-1) / 2);
   padding: var(--space-1);
   margin: calc(var(--space-1) * -1);
   color: var(--ink-primary);
   font-size: var(--text-body-sm-size);
   font-weight: var(--text-heading-sm-weight);
   line-height: var(--text-body-sm-line);
   text-decoration: none;
   border-radius: var(--radius-sm);
 }
 
 .backIcon {
   flex: none;
   inline-size: 1.25rem;
   block-size: 1.25rem;
   fill: none;
   stroke: currentcolor;
   stroke-width: 2;
   stroke-linecap: round;
   stroke-linejoin: round;
 }
 
 .heading {
   margin: 0;
   font: var(--text-heading-md);
 }
 
 .heading:focus {
   outline: none;
 }
 
 .error {
   display: flex;
   flex-direction: column;
   gap: var(--space-4);
 }
 
 .retry {
   align-self: flex-start;
 }
 
 .skeleton {
   display: flex;
   flex-direction: column;
   gap: var(--space-4);
 }
 
 .skeletonCard {
   display: flex;
   flex-direction: column;
   gap: var(--space-3);
   padding: var(--space-4);
   background: var(--surface-raised);
   border: 1px solid var(--border-subtle);
   border-radius: var(--radius-lg);
 }
 
 .skeletonHeading {
   inline-size: 30%;
   block-size: var(--text-heading-sm-line);
 }
 
 .skeletonField {
   block-size: 2.75rem;
 }
 
 @media (width < 48rem) {
   .heading {
     position: absolute;
     width: 1px;
     height: 1px;
     padding: 0;
     overflow: hidden;
     clip-path: inset(50%);
     white-space: nowrap;
     border: 0;
   }
 }
 
 @media (width >= 48rem) {
   .page {
     gap: var(--space-5);
   }
 
   .phoneBar {
     display: none;
   }
 
   .skeleton {
     gap: var(--space-5);
   }
 }
diff --git a/packages/frontend/src/features/me/MePage.tsx b/packages/frontend/src/features/me/MePage.tsx
index fea0afeb..7d3e070c 100644
--- a/packages/frontend/src/features/me/MePage.tsx
+++ b/packages/frontend/src/features/me/MePage.tsx
@@ -1,101 +1,101 @@
 import { useEffect, useRef } from 'react';
 import { Link } from 'react-router';
 import { Alert } from '@/components/ui/Alert';
 import { Button } from '@/components/ui/Button';
 import { Skeleton } from '@/components/ui/Skeleton';
 import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
 import { BRAND_NAME } from '@/config/brand';
 import { useCurrentUser } from '@/features/auth';
 import { ProfileForm } from './ProfileForm';
 import styles from './MePage.module.css';
 
-export const ME_HEADING = 'My Profile';
+export const ME_HEADING = 'Account settings';
 export const LOAD_ERROR_TEXT = "We couldn't load your profile. Try again in a moment.";
 
 type View = 'loading' | 'error' | 'form';
 
 /**
  * /me (S5): the signed-in user's own profile editor, from the ['me'] query
  * that the header already uses. Loading shows skeleton cards, a failed first
  * load an error with Retry; once the profile is there the form stays, even if
  * a background refetch fails. ProfileForm is keyed on `user_id` only, so a
  * refetch or the save's own cache write never remounts it (ADV-004).
  *
  * Below 48rem the page starts with S5's phone bar (a back arrow home and the
- * "My Profile" title, both one link named "Back to home"); the h1 is then
+ * "Account settings" title, both one link named "Back to home"); the h1 is then
  * visually hidden but still the page's heading. From 48rem the bar goes and
  * the h1 shows. Focus moves to the h1 when the view changes only if focus was
  * lost (LESSON-REQ-008-2).
  */
 export function MePage() {
   const me = useCurrentUser();
   const headingRef = useRef<HTMLHeadingElement>(null);
 
   let view: View;
   if (me.data !== undefined) view = 'form';
   else if (me.isError) view = 'error';
   else view = 'loading';
 
   useEffect(() => {
     const active = document.activeElement;
     if (active === null || active === document.body || !active.isConnected) {
       headingRef.current?.focus();
     }
   }, [view]);
 
   return (
     <div className={styles.page}>
       <title>{`${ME_HEADING} · ${BRAND_NAME}`}</title>
       <div className={styles.phoneBar}>
         <Link to="/" className={styles.back}>
           <svg className={styles.backIcon} viewBox="0 0 24 24" aria-hidden="true" focusable={false}>
             <polyline points="15 18 9 12 15 6" />
           </svg>
           <VisuallyHidden>Back to home</VisuallyHidden>
           <span aria-hidden="true">{ME_HEADING}</span>
         </Link>
       </div>
       <h1 ref={headingRef} tabIndex={-1} className={styles.heading}>
         {ME_HEADING}
       </h1>
       {view === 'loading' && <MeSkeleton />}
       {view === 'error' && (
         <div className={styles.error}>
           <Alert tone="error">{LOAD_ERROR_TEXT}</Alert>
           <Button
             className={styles.retry}
             loading={me.isFetching}
             onClick={() => {
               void me.refetch();
             }}
           >
             Retry
           </Button>
         </div>
       )}
       {me.data !== undefined && (
         <ProfileForm key={me.data.user_id} profile={me.data} headingRef={headingRef} />
       )}
     </div>
   );
 }
 
 /** Loading: a polite status line and decorative card skeletons (aria-busy only on them, G30). */
 function MeSkeleton() {
   return (
     <>
       <VisuallyHidden as="p" role="status">
         Loading your profile…
       </VisuallyHidden>
       <div className={styles.skeleton} aria-hidden="true" aria-busy="true">
         {[0, 1, 2].map((card) => (
           <div key={card} className={styles.skeletonCard}>
             <Skeleton className={styles.skeletonHeading} />
             <Skeleton className={styles.skeletonField} shape="block" />
             <Skeleton className={styles.skeletonField} shape="block" />
           </div>
         ))}
       </div>
     </>
   );
 }
diff --git a/packages/frontend/src/features/me/useLeaveGuard.ts b/packages/frontend/src/features/me/useLeaveGuard.ts
index 4395e416..cefd56a9 100644
--- a/packages/frontend/src/features/me/useLeaveGuard.ts
+++ b/packages/frontend/src/features/me/useLeaveGuard.ts
@@ -1,54 +1,55 @@
 import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
 import { useBlocker, type Blocker, type BlockerFunction } from 'react-router';
 import { getLiveToken } from '@/services/authToken';
 
 /** Where SessionBridge and logout send a user whose session ended. */
 const LOGIN_PATH = '/login';
 
 /**
  * Warns before leaving a page with unsaved work while `active` is true (the
  * form is dirty, or a save is still in flight: ADV-008).
  *
  * - In-app links and Back: React Router's `useBlocker`. The caller shows a
  *   prompt while `blocker.state === 'blocked'` and calls `proceed()` or
  *   `reset()`.
  * - Reload and tab close: a `beforeunload` listener, registered only while
  *   active, so a clean page never asks.
  *
  * Never blocks when the session is gone or the target is /login (ADV-002): a
  * 401 logout clears the token and then navigates, so `shouldBlock` reads the
  * token synchronously at navigation time, and `active` from a ref so the one
- * stable blocker function always sees the latest value. A
- * navigation that stays on the same path (e.g. the nav's own "My Profile"
- * link) is not blocked either: it does not leave the form.
+ * stable blocker function always sees the latest value. A navigation that
+ * stays on the same path (e.g. the phone tab bar's own "Account" tab, or the
+ * avatar menu's "Account settings") is not blocked either: it does not leave
+ * the form.
  */
 export function useLeaveGuard(active: boolean): Blocker {
   const activeRef = useRef(active);
   useLayoutEffect(() => {
     activeRef.current = active;
   });
 
   const shouldBlock = useCallback<BlockerFunction>(
     ({ currentLocation, nextLocation }) =>
       activeRef.current &&
       getLiveToken() !== null &&
       nextLocation.pathname !== LOGIN_PATH &&
       nextLocation.pathname !== currentLocation.pathname,
     [],
   );
   const blocker = useBlocker(shouldBlock);
 
   useEffect(() => {
     if (!active) return;
     const warn = (event: BeforeUnloadEvent) => {
       // preventDefault is what asks for the browser's own "Leave site?" prompt.
       event.preventDefault();
     };
     window.addEventListener('beforeunload', warn);
     return () => {
       window.removeEventListener('beforeunload', warn);
     };
   }, [active]);
 
   return blocker;
 }
```

## Tests and docs diff, 4 lines of context

```diff
diff --git a/.adlc/knowledge/components/frontend.md b/.adlc/knowledge/components/frontend.md
index 4e0afc6c..7b9fbbf1 100644
--- a/.adlc/knowledge/components/frontend.md
+++ b/.adlc/knowledge/components/frontend.md
@@ -5,9 +5,9 @@
 | Path | `packages/frontend` |
 | Owner | munifmubtashim |
 | Status | current as of REQ-010 (2026-10-07) |
 
-React 19 + Vite 8 + TypeScript 6 SPA, rebuilt from scratch in [[REQ-001]]. Since [[REQ-002]] it has log in (`/login`), sign up (`/register`) and a signed-in home (`/`), behind route guards. Since [[REQ-004]] it is branded **Alma**: login and sign-up are full-page split layouts without the app header (compact icon theme toggle top-right, pinned brand panel, borderless 380px form); signed-in pages keep the S1 header (logo, `MainNav` with "Directory", "Feed" and "My Profile" links, a user menu with name and email, View profile (alumni only), My Profile and Log out, compact theme toggle). Since [[REQ-006]] there is an alumni directory at `/directory` (lazy-loaded, search and filters in the URL, built on the REQ-005 API). Since [[REQ-008]] there is an alumni profile at `/alumni/:id` (the second lazy page; header, About, Education, Employment, Recent posts, a Back link that restores the directory search; [[knowledge/concepts/detail-page-pattern]]). Since [[REQ-009]] there is a post feed at `/feed` (the third lazy page). Since [[REQ-010]] there is My Profile at `/me` (the fourth lazy page): the signed-in user edits their own details and password, with a save bar, a leave prompt and a success toast. Headline, location, degree, start year, mentorship and photo upload are not built (no API for them).
+React 19 + Vite 8 + TypeScript 6 SPA, rebuilt from scratch in [[REQ-001]]. Since [[REQ-002]] it has log in (`/login`), sign up (`/register`) and a signed-in home (`/`), behind route guards. Since [[REQ-004]] it is branded **Alma**: login and sign-up are full-page split layouts without the app header (compact icon theme toggle top-right, pinned brand panel, borderless 380px form); signed-in pages keep the S1 header (logo, `MainNav` with "Directory" and "Feed" links, a user menu with name and email, View profile (alumni only), Account settings and Log out, compact theme toggle). Since [[REQ-006]] there is an alumni directory at `/directory` (lazy-loaded, search and filters in the URL, built on the REQ-005 API). Since [[REQ-008]] there is an alumni profile at `/alumni/:id` (the second lazy page; header, About, Education, Employment, Recent posts, a Back link that restores the directory search; [[knowledge/concepts/detail-page-pattern]]). Since [[REQ-009]] there is a post feed at `/feed` (the third lazy page). Since [[REQ-010]] there is Account settings at `/me` (the fourth lazy page; called My Profile until [[REQ-012]], which also took it out of the header nav and named its phone tab "Account"): the signed-in user edits their own details and password, with a save bar, a leave prompt and a success toast. Headline, location, degree, start year, mentorship and photo upload are not built (no API for them).
 
 ## Structure
 
 - `src/app/` — `App` (`RouterProvider` from `react-router/dom`, [[knowledge/gotchas#^g08|G08]]), providers (TanStack Query + Jotai), `router.tsx` (the `directory`, `alumni/:id`, `feed` and `me` routes are `lazy`, each with its own `HydrateFallback`, [[architecture/adr-08-route-code-splitting-and-url-list-state|ADR-08]]; `createRoutes`: path-less `RootLayout` (mounts `SessionBridge` + `useApplyTheme`) → `AuthShell` (`GuestOnly` pages) and `AppShell` (header + `HeaderAuth`; `RequireAuth`, `*`, test pages), each with its own inner error layer — [[knowledge/concepts/route-layout]]), `RouteError`, `queryClient.ts`
@@ -41,5 +41,6 @@ React 19 + Vite 8 + TypeScript 6 SPA, rebuilt from scratch in [[REQ-001]]. Since
 - [[REQ-006]] — alumni directory page (`/directory`), lazy route, `MainNav`, Avatar/Chip/Skeleton/SearchField/Popover/VisuallyHidden, `alumniApi`
 - [[REQ-007]] — S1 shell: `BottomTabs`, `navItems` (`NAV_ITEMS`), avatar menu in the header, compact ThemeToggle in the header, Menu `label` / `MenuSeparator`, Avatar `xs`, Home quick-link cards
 - [[REQ-008]] — alumni profile page (`/alumni/:id`), second lazy route, `features/profile`, `config/directoryReturn`, `httpErrors`, Avatar `lg`, per-feature lazy bans
 - [[REQ-009]] — post feed page (`/feed`), third lazy route, `features/feed` (composer, posts, comment threads, owner-or-admin edit and delete), `services/postsApi`, `config/relativeTime` + `feedPath`, Menu `tone="danger"`, Feed in nav, tab bar and Home; optimistic writes ([[architecture/adr-09-optimistic-updates-by-cache-edit|ADR-09]])
-- [[REQ-010]] — My Profile page (`/me`), fourth lazy route, `features/me` (form, save bar, leave prompt, toast), `config/mePath`, Textarea and Toast primitives, `authApi` `updateMyProfile`/`changePassword`, My Profile in nav, tab bar, avatar menu (with View profile) and Home, `--tab-bar-height` on `AppShell`
+- [[REQ-010]] — My Profile page (`/me`, renamed Account settings in REQ-012), fourth lazy route, `features/me` (form, save bar, leave prompt, toast), `config/mePath`, Textarea and Toast primitives, `authApi` `updateMyProfile`/`changePassword`, My Profile in nav, tab bar, avatar menu (with View profile) and Home, `--tab-bar-height` on `AppShell`
+- [[REQ-012]] — My Profile renamed Account settings (heading, tab title, avatar menu, Home card); `/me` dropped from the header nav; `NAV_ITEMS` split into `HEADER_NAV_ITEMS` and `TAB_NAV_ITEMS` (phone tab "Account")
diff --git a/CLAUDE.md b/CLAUDE.md
index 5e216040..eb3b8cf9 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -86,15 +86,15 @@ Each backend sub-package is its own workspace with its own `package.json`/`tscon
 - **Import boundaries** are lint-enforced (with a test per boundary): `components/ui/` may not import services, store, features, config, app, axios or TanStack Query (brand text reaches `Logo` as a prop); `services/` may not import React, components, store, features or app; `store/` may not import services, features or app; `config/` is a leaf (may not import app, features, components, store or services); nothing in `features/`, `store/`, `services/` or `components/` imports `app/` (only `main.tsx` does; test files may import `app/` providers).
 - **HTTP:** one axios instance, `services/httpClient.ts` (`baseURL: '/api'`). Its single request interceptor adds `Authorization: Bearer <token>` from `services/authToken.ts` (`localStorage['token']`, the only home of the token). Call sites never build auth headers. Endpoint functions live in `services/` (`authApi.ts`: `login`, `register`, `getMe`, `updateMyProfile`, `changePassword`; `alumniApi.ts`: `searchAlumni`, `getAlumniProfile`, `getPostsByUser`; `postsApi.ts`: `listPosts`, `createPost`, `updatePost`, `deletePost`, `listComments`, `createComment`, `updateComment`, `deleteComment`; `httpErrors.ts`: `isNotFoundError`).
 - **Session and 401s (ADR-03):** `authToken.ts` is subscribable (`subscribe`, also fires on another tab's `storage` change) and has `isTokenExpired` / pure `getLiveToken`. `httpClient`'s response interceptor calls the one handler registered with `setUnauthorizedHandler(fn)` on a 401 from a request that carried a token (not `/auth/login`/`/auth/register`), passing that token; `services/` never imports app code. `features/auth/SessionBridge` (mounted once in `app/RootLayout`, above both shells) registers it and acts only if the token still matches: clear token, set `sessionNoticeAtom`, go to `/login`. It also drops an expired token on load and clears the query cache on any token change. Current user is the `['me']` query (`useCurrentUser`); login/register mutations only store the token. `App.tsx` must import `RouterProvider` from `react-router/dom` (flushSync, one redirect).
 - **State (ADR-02):** server data goes through TanStack Query (shared `QueryClient` in `app/queryClient.ts`); Jotai atoms in `store/` hold client-only state (e.g. `themePreferenceAtom`, persisted under `localStorage['alumni.theme']`). Optimistic writes edit the query cache (ADR-09): `onMutate` writes the expected result, `onError` applies the inverse edit, `onSettled` invalidates only when the last mutation on that key settles.
-- **UI (ADR-01):** no third-party component library. Primitives are our own components styled with CSS Modules that may use only design tokens (`var(--…)`), enforced by Stylelint and ESLint. Base UI (headless) supplies behavior where needed: `Menu`, `SegmentedControl` (which `ThemeToggle` is built on), the Tooltip on icon-only segments and `Popover`. `ThemeToggle` has `variant` `full` (words) and `compact` (icons named Light / Dark / System, with a tooltip; used by both `AuthShell` and the `AppShell` header). Forms (ADR-04) use controlled state, pure validators in `features/<x>/validation.ts` and `useMutation`; no form library (My Profile, the largest form at up to 12 fields, stayed with controlled state; revisit for dynamic field arrays, ADR-04). Tokens are generated from `docs/design/design-system/tokens.json` by `npm run tokens`. `public/favicon.svg` is the one design asset with raw hex (the browser can't apply tokens to it; copied from `docs/design/brand/`).
-- **Routing:** React Router 8 data router (`react-router`). The path-less `RootLayout` at `/` applies the theme and mounts `SessionBridge` once for every page, and holds two shells: `AuthShell` (no header, only a compact top-right theme toggle) for `GuestOnly` → `/login`, `/register` (a signed-in user is sent on), and `AppShell` (header, and a bottom tab bar on phones) for `RequireAuth` → `/` (Home; a guest goes to `/login`), `/directory`, `/alumni/:id`, `/feed`, `/me`, `*` and test pages. Two `errorElement` layers on each branch: the outer one on `/` catches shell crashes; an inner pathless route in each shell shows `RouteError` inside its `<main>` for page errors. Redirect-back after login uses only `location.state.from` (never a URL parameter), checked by `resolveFrom`. The `AppShell` header shows the `Logo` (linking home), Log in / Sign up for guests, and when signed in `MainNav` (`<nav aria-label="Main">`, desktop only, "Directory", "Feed" and "My Profile" links, each marked current on its path and below with an accent underline), the compact icon-only `ThemeToggle`, and an avatar Menu (initials, name, email, View profile (only with an alumni row), My Profile, Log out). Below 48rem `BottomTabs` (`<nav aria-label="Main tabs">`, sticky) replaces `MainNav`; both read `NAV_ITEMS` in `app/AppShell/navItems.tsx`, which lists only pages that exist (REQ-007, after `docs/design/screens/app/S1-*`). `main` is full width; each page caps its own width. Home (`features/home`) greets "Welcome back, <first name>" and shows a quick-link card per existing page (`QUICK_LINKS`: "Browse the directory", "Catch up on the feed" and "My Profile"). Log-in and sign-up have no header and share `features/auth/AuthLayout` (full-height 45/55 split from 60rem: brand panel with logo, headline, points and ©; the form, no card, with the heading and its prompt line on top; below 60rem only the panel's logo row); "Forgot password?" shows a support mailto message, no reset flow.
+- **UI (ADR-01):** no third-party component library. Primitives are our own components styled with CSS Modules that may use only design tokens (`var(--…)`), enforced by Stylelint and ESLint. Base UI (headless) supplies behavior where needed: `Menu`, `SegmentedControl` (which `ThemeToggle` is built on), the Tooltip on icon-only segments and `Popover`. `ThemeToggle` has `variant` `full` (words) and `compact` (icons named Light / Dark / System, with a tooltip; used by both `AuthShell` and the `AppShell` header). Forms (ADR-04) use controlled state, pure validators in `features/<x>/validation.ts` and `useMutation`; no form library (Account settings, the largest form at up to 12 fields, stayed with controlled state; revisit for dynamic field arrays, ADR-04). Tokens are generated from `docs/design/design-system/tokens.json` by `npm run tokens`. `public/favicon.svg` is the one design asset with raw hex (the browser can't apply tokens to it; copied from `docs/design/brand/`).
+- **Routing:** React Router 8 data router (`react-router`). The path-less `RootLayout` at `/` applies the theme and mounts `SessionBridge` once for every page, and holds two shells: `AuthShell` (no header, only a compact top-right theme toggle) for `GuestOnly` → `/login`, `/register` (a signed-in user is sent on), and `AppShell` (header, and a bottom tab bar on phones) for `RequireAuth` → `/` (Home; a guest goes to `/login`), `/directory`, `/alumni/:id`, `/feed`, `/me`, `*` and test pages. Two `errorElement` layers on each branch: the outer one on `/` catches shell crashes; an inner pathless route in each shell shows `RouteError` inside its `<main>` for page errors. Redirect-back after login uses only `location.state.from` (never a URL parameter), checked by `resolveFrom`. The `AppShell` header shows the `Logo` (linking home), Log in / Sign up for guests, and when signed in `MainNav` (`<nav aria-label="Main">`, desktop only, "Directory" and "Feed" links, each marked current on its path and below with an accent underline), the compact icon-only `ThemeToggle`, and an avatar Menu (initials, name, email, View profile (only with an alumni row), Account settings, Log out). Below 48rem `BottomTabs` (`<nav aria-label="Main tabs">`, sticky) replaces `MainNav`; `MainNav` reads `HEADER_NAV_ITEMS` and `BottomTabs` `TAB_NAV_ITEMS` (the same plus "Account" → `/me`), both in `app/AppShell/navItems.tsx`, listing only pages that exist (REQ-007, after `docs/design/screens/app/S1-*`; leaving `/me` out of the header nav and naming it Account settings is a deliberate deviation from S1, REQ-012). `main` is full width; each page caps its own width. Home (`features/home`) greets "Welcome back, <first name>" and shows a quick-link card per existing page (`QUICK_LINKS`: "Browse the directory", "Catch up on the feed" and "Account settings"). Log-in and sign-up have no header and share `features/auth/AuthLayout` (full-height 45/55 split from 60rem: brand panel with logo, headline, points and ©; the form, no card, with the heading and its prompt line on top; below 60rem only the panel's logo row); "Forgot password?" shows a support mailto message, no reset flow.
 - **Lazy routes (ADR-08):** large pages load with the route's `lazy`, so each is its own chunk; Home stays eager. Four lazy pages: `DIRECTORY_ROUTE` (`/directory`, `import('@/features/directory/DirectoryPage')`), `PROFILE_ROUTE` (`/alumni/:id`, `import('@/features/profile/ProfilePage')`), `FEED_ROUTE` (`/feed`, `import('@/features/feed/FeedPage')`) and `ME_ROUTE` (`/me`, `import('@/features/me/MePage')`) in `app/router.tsx`. Nothing else in `src/` may import any of them statically, not even another lazy feature (none has an `index.ts`; an ESLint rule bans each outside its own folder and tests, `import type` excepted, and `app/lazyRoutes.test.ts` reads every non-test file and fails on one; both run one check per feature from the `LAZY_FEATURES` list). `HydrateFallback` ("Loading…" in `<main>`) must be a static property of the lazy route object itself: the router stops rendering at the nearest route with a fallback, so on the root it would hide the shell. A chunk that fails to load shows the inner `RouteError`. Check with `npm run build` that the page is a separate chunk in `dist/assets`.
 - **Directory (REQ-006):** `features/directory` lists alumni from `GET /api/alumni`, 12 per page. Search text, filters and page live in the URL query string (ADR-08), parsed by the pure `params.ts`, which ignores any value the API would reject; filters and pages push history, typed search replaces the URL after 300 ms. `useAlumniSearch` is the TanStack Query hook. States: skeletons, error with Retry, no matches with Clear filters, no alumni yet, page past the end.
 - **Profile (REQ-008):** `features/profile` shows `/alumni/:id` from `GET /api/alumni/:id` and `GET /api/posts/user/:userId` (newest 5): header, About, Education, Employment, Recent posts; a section with no data is hidden, a posts failure keeps the profile. 404 (unknown or malformed id) shows "Profile not found". "Back to directory" restores the directory search through router state, whose shape only `config/directoryReturn` knows (lazy features never import each other).
 - **Feed (REQ-009):** `features/feed` shows `/feed` from `GET /api/posts` (20 per page, Load more): a composer, post cards with comment threads (one level of replies), and edit/delete for the author or an admin (the API stays the judge; a refused write shows its message). New posts and comments appear before the server answers and roll back on failure (ADR-09). A post with comments asks inline before it is deleted. The author name links to `/alumni/<author_alumni_id>` only when that is set. Details: `packages/frontend/src/features/feed/README.md`.
-- **My Profile (REQ-010):** `features/me` is the signed-in user's own editor at `/me` (design `docs/design/screens/app/S5-*`), reached from the nav, the tab bar, the avatar menu and Home. It reads the `['me']` query and saves with `PUT /api/me` (a full replace, so the stored `photo_url` is sent back unchanged), then `PUT /api/me/password` when a password was typed. Sections: Personal, Education, Career, Password; the account's kind (alumni, student, or no profile row) decides which fields show. Errors follow the API's rules, shown when a field is left or Save is tried. A save bar ("Unsaved changes", Discard, Save) shows only while something changed; leaving with unsaved changes or a save in flight asks first (`useBlocker` plus the browser's leave prompt). A save shows a toast and, while nothing is unsaved, the caption "All sections saved — no unsaved changes." The save is not optimistic and a refetch never remounts the form. On phones the bar sits above the tab bar through `--tab-bar-height` (set on `AppShell`). **Not built:** headline, location, degree, start year, mentorship and photo upload, though S5 shows them, because the API has no column or endpoint for any of them; each needs its own REQ. Email is never shown or sent. Details: `packages/frontend/src/features/me/README.md`.
+- **Account settings (REQ-010, renamed in REQ-012):** `features/me` is the signed-in user's own editor at `/me` (design `docs/design/screens/app/S5-*`, which calls it My Profile), reached from the avatar menu, Home and, on phones, the "Account" tab (not the desktop header nav). It reads the `['me']` query and saves with `PUT /api/me` (a full replace, so the stored `photo_url` is sent back unchanged), then `PUT /api/me/password` when a password was typed. Sections: Personal, Education, Career, Password; the account's kind (alumni, student, or no profile row) decides which fields show. Errors follow the API's rules, shown when a field is left or Save is tried. A save bar ("Unsaved changes", Discard, Save) shows only while something changed; leaving with unsaved changes or a save in flight asks first (`useBlocker` plus the browser's leave prompt). A save shows a toast and, while nothing is unsaved, the caption "All sections saved — no unsaved changes." The save is not optimistic and a refetch never remounts the form. On phones the bar sits above the tab bar through `--tab-bar-height` (set on `AppShell`). **Not built:** headline, location, degree, start year, mentorship and photo upload, though S5 shows them, because the API has no column or endpoint for any of them; each needs its own REQ. Email is never shown or sent. Details: `packages/frontend/src/features/me/README.md`.
 - **Dev proxy:** `vite.config.ts` proxies `/api` to `http://localhost:<PORT>` (`PORT` read from the root `.env`, default 3000; nothing else from that file reaches the client). Run the API alongside Vite (root `npm run dev`).
 
 ## Conventions (redesign)
 
diff --git a/packages/frontend/README.md b/packages/frontend/README.md
index 615f3c79..d2347364 100644
--- a/packages/frontend/README.md
+++ b/packages/frontend/README.md
@@ -1,7 +1,7 @@
 # @alumni/frontend
 
-Alma, the alumni network web app: React 19 + Vite 8 + TypeScript 6. It has a shell (header with the Alma logo and name, log-in/sign-up links or a user menu, and a theme toggle), log-in and sign-up pages (a brand panel beside the form on wide screens), a signed-in Home page, the alumni Directory (search, filters, pages), an alumni Profile page, the post Feed and My Profile (edit your own profile), on top of the design system.
+Alma, the alumni network web app: React 19 + Vite 8 + TypeScript 6. It has a shell (header with the Alma logo and name, log-in/sign-up links or a user menu, and a theme toggle), log-in and sign-up pages (a brand panel beside the form on wide screens), a signed-in Home page, the alumni Directory (search, filters, pages), an alumni Profile page, the post Feed and Account settings (edit your own profile), on top of the design system.
 
 ## Stack
 
 | Concern       | Choice                                                                    | Why / note                                                                   |
@@ -61,9 +61,9 @@ packages/frontend/
                       supportMailto), directoryReturn.ts (DIRECTORY_PATH, profilePath, the directory-to-profile
                       router-state handover), feedPath.ts (FEED_PATH), mePath.ts (ME_PATH), relativeTime.ts
     features/         one folder per domain: theme/, auth/ (session, guards, pages), home/,
                       directory/, profile/, feed/ and me/ (lazy-loaded directory, alumni profile,
-                      post feed and My Profile pages)
+                      post feed and Account settings pages)
     components/ui/    design-system primitives: Button, ButtonLink, Input, PasswordInput, Logo,
                       Textarea, Card, Tag, Alert, Menu, SegmentedControl, ThemeToggle, Avatar,
                       Chip, Skeleton, SearchField, Popover, Toast
     store/            Jotai atoms for client-only state (themeAtom, sessionNoticeAtom)
@@ -113,13 +113,13 @@ ADR-03. Log in, sign up (student or alumni), stay signed in across reloads, log
 ## Directory and lazy routes
 
 REQ-006, ADR-08. `/directory` (signed in; the header's "Directory" link) lists alumni from `GET /api/alumni`, 12 per page.
 
-- **Lazy routes:** `app/router.tsx` loads the directory (`import('@/features/directory/DirectoryPage')`), the profile at `/alumni/:id` (`import('@/features/profile/ProfilePage')`) the feed at `/feed` (`FEED_ROUTE`, `import('@/features/feed/FeedPage')`) and My Profile at `/me` (`ME_ROUTE`, `import('@/features/me/MePage')`) with the route's `lazy`, so each is a separate chunk in `dist/assets`. Nothing else may import any of them statically, not even another lazy feature: ESLint rejects it (tests and `import type` excepted), and `src/app/lazyRoutes.test.ts` reads every non-test file in `src/` and fails if one does. Both checks run once per feature and leave out only that feature's own folder. New large pages follow the same pattern (add them to `LAZY_FEATURES` in `eslint.config.js` and in the test); Home stays eager.
+- **Lazy routes:** `app/router.tsx` loads the directory (`import('@/features/directory/DirectoryPage')`), the profile at `/alumni/:id` (`import('@/features/profile/ProfilePage')`) the feed at `/feed` (`FEED_ROUTE`, `import('@/features/feed/FeedPage')`) and Account settings at `/me` (`ME_ROUTE`, `import('@/features/me/MePage')`) with the route's `lazy`, so each is a separate chunk in `dist/assets`. Nothing else may import any of them statically, not even another lazy feature: ESLint rejects it (tests and `import type` excepted), and `src/app/lazyRoutes.test.ts` reads every non-test file in `src/` and fails if one does. Both checks run once per feature and leave out only that feature's own folder. New large pages follow the same pattern (add them to `LAZY_FEATURES` in `eslint.config.js` and in the test); Home stays eager.
 - **`HydrateFallback`** ("Loading…" in `<main>`) is a static property of each lazy route object itself. The router stops rendering at the nearest route with a fallback, so on the root it would hide the shell. A click from another page shows no fallback; a chunk that fails to load shows `RouteError` inside the shell.
 - **URL is the state:** search text, department, university, graduation year and page live in the query string, so a reload, a shared link and back/forward all work. `features/directory/params.ts` parses it (pure, tested) and ignores any value the API would reject. Filters and page changes push a history entry; typed search replaces the URL after 300 ms, and an outside change (Back, Clear all) cancels a pending write.
 - **States:** skeleton cards while loading, an error with Retry, "no matches" with Clear filters, "No alumni yet", and a page past the end with a way back to page 1. The count line ("Showing 1–12 of 40 alumni", "40 alumni" on phones) is a polite live region.
-- **Header:** after S1. `MainNav` (desktop) shows the Directory, Feed and My Profile links (`NAV_ITEMS`) to signed-in users only, each marked current on its path and below with an accent underline. On phones a sticky bottom tab bar (`BottomTabs`) replaces it. The compact `ThemeToggle` and the avatar menu (name and email, View profile for alumni only, My Profile, Log out) sit on the right.
+- **Header:** after S1. `MainNav` (desktop) shows the Directory and Feed links (`HEADER_NAV_ITEMS`) to signed-in users only, each marked current on its path and below with an accent underline. On phones a sticky bottom tab bar (`BottomTabs`, `TAB_NAV_ITEMS`) replaces it and adds an Account tab for `/me`. The compact `ThemeToggle` and the avatar menu (name and email, View profile for alumni only, Account settings, Log out) sit on the right. Unlike S1, `/me` is not in the header nav (REQ-012; see `src/app/README.md`).
 
 ## Profile page
 
 REQ-008. `/alumni/:id` (signed in; every directory card links to it) shows one alumnus from `GET /api/alumni/:id` and their newest 5 posts from `GET /api/posts/user/:userId` (the profile's `user_id`), after the S3 designs.
@@ -138,11 +138,11 @@ REQ-009, ADR-09. `/feed` (signed in; the header's "Feed" link, the Feed tab on p
 - **Optimistic writes (ADR-09):** new posts and comments, edits and deletes show at once and are undone if the API refuses. `onMutate` edits the cache with a pure function from `cacheEdits.ts`, `onError` applies the inverse edit (no whole-cache snapshot), `onSettled` invalidates only when it is the last mutation on that key. Keys are `['feed','posts']` and `['feed','comments',postId]`. A pending item (negative id) has no menu, Reply or thread toggle.
 - **Author link:** the name links to `/alumni/<author_alumni_id>` (the alumni id, not the user id) and is plain text when the author has no alumni profile.
 - More: `src/features/feed/README.md`.
 
-## My Profile
+## Account settings
 
-REQ-010. `/me` (signed in; the header's "My Profile" link, the My Profile tab on phones and the avatar menu) lets the signed-in user edit their own details and change their password, after the S5 designs.
+REQ-010, renamed from My Profile in REQ-012. `/me` (signed in; the avatar menu's "Account settings", the Home card and, on phones, the Account tab) lets the signed-in user edit their own details and change their password, after the S5 designs.
 
 - **Saving:** one Save sends `PUT /api/me` when a profile field changed, then `PUT /api/me/password` when a password was typed. A save bar shows while there are unsaved changes, a prompt asks before leaving with them, and a toast confirms a save. Not optimistic.
 - **Sections:** which ones show depends on the account (alumni, student, or no profile row). Email is never shown or sent; headline, location, degree, start year, mentorship and photo upload are not built (no API for them).
 - More: `src/features/me/README.md`.
@@ -155,9 +155,9 @@ ADR-04: no form library for now.
 - Pure, tested validators in `features/<x>/validation.ts` (`validateLogin`, `validateRegister(values, now)`) return a field → message map. Rules and messages mirror the backend (password at least 8 characters and at most 72 UTF-8 bytes, length limits, expected year from this year to this year + 8).
 - On submit with errors: show them per field (`Input error`) and focus the first invalid field. Otherwise call the `useMutation`. The submit button gets `loading` (disabled, `aria-busy`), so it can't be pressed twice.
 - Server errors go through a pure mapper (`features/auth/authErrors.ts`): login 401 → form Alert "Email or password is incorrect"; sign-up 409 → email field error with a "Log in instead" link; 400 → its message; network or 5xx → "Couldn't reach the server, try again".
 - Fields hidden by the role switch keep their values but are not validated or sent (`toRegisterInput`).
-- **Revisit** when a form needs dynamic field arrays, or when the field rules move into `@alumni/shared`. My Profile (up to 12 fields, REQ-010) reached the old 8-field mark and stayed with controlled state (ADR-04).
+- **Revisit** when a form needs dynamic field arrays, or when the field rules move into `@alumni/shared`. Account settings (up to 12 fields, REQ-010) reached the old 8-field mark and stayed with controlled state (ADR-04).
 
 ## Primitives added in REQ-002
 
 - `Input` `error` prop: `aria-invalid`, error text linked by `aria-describedby`, error border.
diff --git a/packages/frontend/src/app/AppShell/AppShell.test.tsx b/packages/frontend/src/app/AppShell/AppShell.test.tsx
index 3d5eac5b..3ca249fa 100644
--- a/packages/frontend/src/app/AppShell/AppShell.test.tsx
+++ b/packages/frontend/src/app/AppShell/AppShell.test.tsx
@@ -198,10 +198,10 @@ describe('AppShell', () => {
     );
   });
 
   // REQ-004 AC7 kept S1's nav links out until their pages exist. REQ-006 AC2
-  // adds Directory, REQ-009 Feed, REQ-010 My Profile: a guest's banner has only the "Account" nav from
-  // HeaderAuth; a signed-in user's has only the "Main" nav.
+  // adds Directory, REQ-009 Feed (REQ-012 keeps /me out of it): a guest's banner has only the
+  // "Account" nav from HeaderAuth; a signed-in user's has only the "Main" nav.
   it('shows the guest only the Account nav, and a signed-in user only the Main nav', async () => {
     renderAt('/does-not-exist');
 
     let banner = screen.getByRole('banner');
@@ -229,9 +229,9 @@ describe('AppShell', () => {
     expect(
       within(banner)
         .getAllByRole('link')
         .map((link) => link.textContent),
-    ).toEqual(['Alma', 'Directory', 'Feed', 'My Profile']);
+    ).toEqual(['Alma', 'Directory', 'Feed']);
   });
 
   it('shows the route error without the shell when the shell itself throws', () => {
     const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
@@ -341,17 +341,17 @@ describe('Header main nav', () => {
       'aria-current',
     );
   });
 
-  it('links to /me and marks only My Profile current there', async () => {
+  // REQ-012 AC1: Account settings is reached from the avatar menu, not the header nav.
+  it('has no link to /me, and marks nothing current there', async () => {
     renderNavAt('/me');
     await screen.findByRole('heading', { name: 'Me stub' });
 
-    const me = within(mainNav()).getByRole('link', { name: 'My Profile' });
-    expect(me).toHaveAttribute('href', '/me');
-    expect(me).toHaveAttribute('aria-current', 'page');
-    for (const name of ['Directory', 'Feed']) {
-      expect(within(mainNav()).getByRole('link', { name })).not.toHaveAttribute('aria-current');
+    const links = within(mainNav()).getAllByRole('link');
+    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/directory', '/feed']);
+    for (const link of links) {
+      expect(link).not.toHaveAttribute('aria-current');
     }
   });
 
   it('goes to the directory on click and becomes current', async () => {
@@ -406,17 +406,17 @@ describe('Bottom tab bar (phone)', () => {
 
     expect(screen.queryByRole('navigation', { name: 'Main tabs' })).not.toBeInTheDocument();
   });
 
-  it('lists the same pages as the header nav, and only those that exist', async () => {
+  it("lists the header nav's pages plus Account, and only pages that exist", async () => {
     renderNavAt('/other');
     await screen.findByRole('heading', { name: 'Other stub' });
 
     const labels = within(tabs())
       .getAllByRole('link')
       .map((link) => link.textContent);
-    expect(labels).toEqual(['Directory', 'Feed', 'My Profile']);
-    expect(labels).toEqual(
+    expect(labels).toEqual(['Directory', 'Feed', 'Account']);
+    expect(labels.slice(0, -1)).toEqual(
       within(mainNav())
         .getAllByRole('link')
         .map((link) => link.textContent),
     );
@@ -424,9 +424,9 @@ describe('Bottom tab bar (phone)', () => {
       'href',
       '/directory',
     );
     expect(within(tabs()).getByRole('link', { name: 'Feed' })).toHaveAttribute('href', '/feed');
-    expect(within(tabs()).getByRole('link', { name: 'My Profile' })).toHaveAttribute('href', '/me');
+    expect(within(tabs()).getByRole('link', { name: 'Account' })).toHaveAttribute('href', '/me');
   });
 
   it('sits outside the header, after the page', async () => {
     renderNavAt('/other');
@@ -460,13 +460,13 @@ describe('Bottom tab bar (phone)', () => {
       'aria-current',
     );
   });
 
-  it('marks the My Profile tab current at /me, with its own decorative icon', async () => {
+  it('marks the Account tab current at /me, with its own decorative icon', async () => {
     renderNavAt('/me');
     await screen.findByRole('heading', { name: 'Me stub' });
 
-    const link = within(tabs()).getByRole('link', { name: 'My Profile' });
+    const link = within(tabs()).getByRole('link', { name: 'Account' });
     expect(link).toHaveAttribute('aria-current', 'page');
     expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
     expect(within(tabs()).getByRole('link', { name: 'Feed' })).not.toHaveAttribute('aria-current');
   });
@@ -537,18 +537,18 @@ describe('Header auth area', () => {
     expect(trigger).toHaveTextContent('A');
     expect(trigger.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
   });
 
-  it('offers View profile, My Profile and Log out to an alumni user (no Admin settings)', async () => {
+  it('offers View profile, Account settings and Log out to an alumni user (no Admin settings)', async () => {
     const user = userEvent.setup();
     await renderSignedIn();
 
     await user.click(screen.getByRole('button', { name: 'Account menu for Amina' }));
 
     const items = within(await screen.findByRole('menu')).getAllByRole('menuitem');
     expect(items.map((item) => item.textContent)).toEqual([
       'View profile',
-      'My Profile',
+      'Account settings',
       'Log out',
     ]);
   });
 
@@ -568,9 +568,9 @@ describe('Header auth area', () => {
 
     await user.click(screen.getByRole('button', { name: 'Account menu for Amina' }));
 
     const items = within(await screen.findByRole('menu')).getAllByRole('menuitem');
-    expect(items.map((item) => item.textContent)).toEqual(['My Profile', 'Log out']);
+    expect(items.map((item) => item.textContent)).toEqual(['Account settings', 'Log out']);
   });
 
   it('View profile opens the public profile for the alumni id', async () => {
     mockApi({ 'GET /me': ok({ ...AMINA, alumni_id: 42 }) });
@@ -584,21 +584,25 @@ describe('Header auth area', () => {
     expect(router.state.location.pathname).toBe('/alumni/42');
     expect(getToken()).not.toBeNull();
   });
 
-  it('My Profile opens /me and marks it current in the nav', async () => {
+  it('Account settings opens /me and marks the Account tab current', async () => {
     const user = userEvent.setup();
     const { router } = renderNavAt('/other');
 
     await user.click(await screen.findByRole('button', { name: 'Account menu for Amina' }));
-    await user.click(await screen.findByRole('menuitem', { name: 'My Profile' }));
+    await user.click(await screen.findByRole('menuitem', { name: 'Account settings' }));
 
     expect(await screen.findByRole('heading', { name: 'Me stub' })).toBeInTheDocument();
     expect(router.state.location.pathname).toBe('/me');
-    expect(within(mainNav()).getByRole('link', { name: 'My Profile' })).toHaveAttribute(
-      'aria-current',
-      'page',
-    );
+    expect(
+      within(screen.getByRole('navigation', { name: 'Main tabs' })).getByRole('link', {
+        name: 'Account',
+      }),
+    ).toHaveAttribute('aria-current', 'page');
+    for (const link of within(mainNav()).getAllByRole('link')) {
+      expect(link).not.toHaveAttribute('aria-current');
+    }
   });
 
   it('closes the avatar menu on Escape and returns focus to the button', async () => {
     const user = userEvent.setup();
@@ -644,9 +648,9 @@ describe('Header auth area', () => {
     // Log out lands on the login page, which has no app header.
     expect(screen.queryByRole('banner')).not.toBeInTheDocument();
   });
 
-  it('reads "Account menu" and still offers My Profile and Log out while /me has failed', async () => {
+  it('reads "Account menu" and still offers Account settings and Log out while /me has failed', async () => {
     mockApi({ 'GET /me': fail(404) });
     setToken(makeToken());
     const user = userEvent.setup();
     const { router } = renderAt('/');
@@ -659,9 +663,9 @@ describe('Header auth area', () => {
     await user.click(
       within(screen.getByRole('banner')).getByRole('button', { name: 'Account menu' }),
     );
     const items = within(await screen.findByRole('menu')).getAllByRole('menuitem');
-    expect(items.map((item) => item.textContent)).toEqual(['My Profile', 'Log out']);
+    expect(items.map((item) => item.textContent)).toEqual(['Account settings', 'Log out']);
     await user.click(await screen.findByRole('menuitem', { name: 'Log out' }));
 
     await waitFor(() => {
       expect(router.state.location.pathname).toBe('/login');
@@ -1016,20 +1020,20 @@ describe('Feed route', () => {
 function meRoutesWith(lazy: RouteObject['lazy']): RouteObject[] {
   return createRoutes([{ element: <RequireAuth />, children: [{ ...ME_ROUTE, lazy }] }]);
 }
 
-describe('My Profile route', () => {
+describe('Account settings route', () => {
   beforeEach(() => {
     mockApi({ 'GET /me': ok(AMINA) });
   });
 
-  it('renders the My Profile page for a signed-in visit', async () => {
+  it('renders the Account settings page for a signed-in visit', async () => {
     setToken(makeToken());
     renderAt('/me');
 
     const main = screen.getByRole('main');
     expect(
-      await within(main).findByRole('heading', { level: 1, name: 'My Profile' }),
+      await within(main).findByRole('heading', { level: 1, name: 'Account settings' }),
     ).toBeInTheDocument();
   });
 
   it('sends a guest to /login without loading the profile', async () => {
@@ -1046,9 +1050,9 @@ describe('My Profile route', () => {
     renderAt(
       '/me',
       meRoutesWith(async () => {
         await chunk.opened;
-        return { Component: () => <h1>My Profile loaded</h1> };
+        return { Component: () => <h1>Account settings loaded</h1> };
       }),
     );
 
     const banner = screen.getByRole('banner');
@@ -1062,7 +1066,9 @@ describe('My Profile route', () => {
       chunk.open();
       await chunk.opened;
     });
 
-    expect(await screen.findByRole('heading', { name: 'My Profile loaded' })).toBeInTheDocument();
+    expect(
+      await screen.findByRole('heading', { name: 'Account settings loaded' }),
+    ).toBeInTheDocument();
   });
 });
diff --git a/packages/frontend/src/app/README.md b/packages/frontend/src/app/README.md
index 93ea6641..1d7943d0 100644
--- a/packages/frontend/src/app/README.md
+++ b/packages/frontend/src/app/README.md
@@ -8,9 +8,9 @@
 - Lazy routes (ADR-08): `/directory` (`DIRECTORY_ROUTE`), `/alumni/:id` (`PROFILE_ROUTE`) `/feed` (`FEED_ROUTE`, REQ-009) and `/me` (`ME_ROUTE`, REQ-010) are loaded with the route's `lazy`, so each page is its own chunk. Only the route's dynamic `import()` may reference `features/directory`, `features/profile`, `features/feed` or `features/me`; an ESLint rule (`@typescript-eslint/no-restricted-imports` in `eslint.config.js`; `import type` is allowed) rejects a static import of any of them anywhere else in `src/` except tests, and `lazyRoutes.test.ts` scans every non-test file in `src/` as a second check. Both checks run once per feature, leaving out only that feature's own folder, so the lazy features cannot import each other. A new large page is added to the `LAZY_FEATURES` list in both places.
 - `HydrateFallback`: the "Loading…" line shown in `<main>` while a lazy page's code loads on a direct visit. Set it as a static property of the lazy route object itself, never on the root or on what `lazy` returns: the router stops rendering at the nearest route that has one, so anywhere higher hides the shell. A client-side click to a lazy page shows no fallback (the old page stays until the code arrives). A chunk that fails to load shows the inner `RouteError`.
 - `RootLayout`: applies the theme and mounts `SessionBridge` once for every page, auth pages included. Don't mount it in a shell.
 - The `AuthShell` layout: no header, only the `ThemeToggle` in the top-right corner, and `<main id="main">`.
-- The `AppShell` layout: the header holds the `Logo` (with `BRAND_NAME` from `@/config/brand`, linking home), `MainNav` (`<nav aria-label="Main">`, desktop only), the compact icon-only `ThemeToggle` (the one the login page uses) and `HeaderAuth` (Log in / Sign up for guests; for a signed-in user an avatar menu with their name and email, View profile (alumni only), My Profile and Log out). On phones (< 48rem) the nav is `BottomTabs` (`<nav aria-label="Main tabs">`, sticky at the bottom). Both read one `NAV_ITEMS` list (`navItems.tsx`), which holds only pages that exist (Directory, Feed and My Profile): add Admin there when built. The shell follows `docs/design/screens/app/S1-*`; `main` is full width with S1 gutters and each page caps its own width (Home 65rem, Directory 72rem centred, Feed 40rem).
+- The `AppShell` layout: the header holds the `Logo` (with `BRAND_NAME` from `@/config/brand`, linking home), `MainNav` (`<nav aria-label="Main">`, desktop only), the compact icon-only `ThemeToggle` (the one the login page uses) and `HeaderAuth` (Log in / Sign up for guests; for a signed-in user an avatar menu with their name and email, View profile (alumni only), Account settings and Log out). On phones (< 48rem) the nav is `BottomTabs` (`<nav aria-label="Main tabs">`, sticky at the bottom). Each reads its own list in `navItems.tsx`, which hold only pages that exist: `HEADER_NAV_ITEMS` (Directory, Feed) for `MainNav`, and `TAB_NAV_ITEMS` (Directory, Feed, Account → `/me`) for `BottomTabs`; add Admin there when built. **Deliberate deviation from the design (REQ-012):** S1/S2/S3/S5 draw "My Profile" in the header nav and "Profile" in the phone tab bar; here `/me` is called Account settings, is left out of the header nav (reached from the avatar menu and the Home card), and its phone tab reads "Account" ("Account settings" is too long for a tab). The shell follows `docs/design/screens/app/S1-*`; `main` is full width with S1 gutters and each page caps its own width (Home 65rem, Directory 72rem centred, Feed 40rem).
 - The route error element.
 
 **May import:** anything in `src/` (`@/config/**`, `@/features/**` except `features/directory`, `features/profile`, `features/feed` and `features/me`, which only their lazy route's dynamic import reaches, `@/components/ui/**`, `@/store/**`, `@/services/**`, `@/styles/**`).
 
diff --git a/packages/frontend/src/features/README.md b/packages/frontend/src/features/README.md
index 0a71217b..765dd8d3 100644
--- a/packages/frontend/src/features/README.md
+++ b/packages/frontend/src/features/README.md
@@ -5,13 +5,13 @@
 **Features today:**
 
 - `theme/` — applies the light/dark/system preference to the page.
 - `auth/` — session (token, current user, 401 handling via `SessionBridge`), route guards (`RequireAuth`, `GuestOnly`), login and sign-up pages in a shared `AuthLayout` (full-height page with no app header: brand panel beside the form from 60rem, only its logo row above the form below that), and `ForgotPasswordHelp` (support mailto message).
-- `home/` — the signed-in home page: greeting and a quick-link card per existing page (the directory and the feed).
+- `home/` — the signed-in home page: greeting and a quick-link card per existing page (the directory, the feed and Account settings).
 - `directory/` — the alumni directory page at `/directory` (REQ-006): search, filters and page live in the URL query string (`params.ts` parses it and ignores anything the API would reject; `useDirectoryParams` writes it back, filters and pages push history, typed search replaces it after 300 ms), `useAlumniSearch` (TanStack Query over `services/alumniApi`), and the page's own pieces (`AlumniCard`, `ResultsGrid`, `FilterBar`, `Pagination`, `DirectoryStates`). It has no `index.ts`: the page is loaded lazily, so nothing outside this folder may import it statically (ADR-08, enforced by ESLint and by `app/lazyRoutes.test.ts`).
 - `profile/` — the alumni profile page at `/alumni/:id` (REQ-008): header, About, Education, Employment and Recent posts from `GET /api/alumni/:id` and `GET /api/posts/user/:userId`, with a "Back to directory" link that restores the directory search through `config/directoryReturn`. Lazy like `directory/` and also without an `index.ts` (ADR-08).
 - `feed/` — the post feed at `/feed` (REQ-009): composer, posts with Load more, comment threads with one level of replies, edit and delete for the author or an admin, and optimistic writes that edit the query cache and undo on failure (ADR-09). Lazy and without an `index.ts`, like `directory/` and `profile/` (ADR-08). Details in its own README.
-- `me/` — the signed-in user's own profile form at `/me` (REQ-010): section cards from the `['me']` query, a sticky save bar while the form has unsaved changes, a leave warning and a success toast; Save sends `PUT /api/me` and, if a new password was typed, `PUT /api/me/password`. Lazy and without an `index.ts`, like the other three (ADR-08). Details in its own README.
+- `me/` — the signed-in user's Account settings page at `/me` (REQ-010; named in REQ-012): section cards from the `['me']` query, a sticky save bar while the form has unsaved changes, a leave warning and a success toast; Save sends `PUT /api/me` and, if a new password was typed, `PUT /api/me/password`. Lazy and without an `index.ts`, like the other three (ADR-08). Details in its own README.
 
 **May import:** `@/components/ui/**`, `@/config/**`, `@/store/**`, `@/services/**`, `@/styles/**`, and types from `@alumni/shared`. Not `@/app/**`.
 
 **Imported by:** `app/` and other features. Exception: the lazy features `directory/`, `profile/`, `feed/` and `me/` are reached only through their route's dynamic import in `app/router.tsx`. No other file may import them statically, and that includes each other: they meet only through `config/` (e.g. `relativeTime.ts`, which profile and feed both use).
diff --git a/packages/frontend/src/features/home/HomePage.test.tsx b/packages/frontend/src/features/home/HomePage.test.tsx
index 5fc3603e..e9eb9d50 100644
--- a/packages/frontend/src/features/home/HomePage.test.tsx
+++ b/packages/frontend/src/features/home/HomePage.test.tsx
@@ -55,9 +55,9 @@ describe('HomePage', () => {
 
     expect(screen.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeInTheDocument();
   });
 
-  it('shows only the cards for pages that exist: the directory, the feed and My Profile', () => {
+  it('shows only the cards for pages that exist: the directory, the feed and Account settings', () => {
     renderWith(profile('Amina', 'alumni'));
 
     const links = screen.getAllByRole('link');
     expect(links).toHaveLength(3);
@@ -67,9 +67,9 @@ describe('HomePage', () => {
     expect(links[1]).toHaveAttribute('href', '/feed');
     expect(links[1]).toHaveTextContent('Catch up on the feed');
     expect(links[1]).toHaveTextContent('See what alumni and students are sharing');
     expect(links[2]).toHaveAttribute('href', '/me');
-    expect(links[2]).toHaveTextContent('My Profile');
+    expect(links[2]).toHaveTextContent('Account settings');
     expect(links[2]).toHaveTextContent('Keep your details current so classmates can find you');
     expect(screen.queryByText('Update your profile')).not.toBeInTheDocument();
   });
 
diff --git a/packages/frontend/src/features/me/MePage.test.tsx b/packages/frontend/src/features/me/MePage.test.tsx
index 77a93813..c3d8cdfb 100644
--- a/packages/frontend/src/features/me/MePage.test.tsx
+++ b/packages/frontend/src/features/me/MePage.test.tsx
@@ -224,11 +224,13 @@ describe('/me through the real route (RequireAuth)', () => {
     act(() => {
       me.release();
     });
     expect(await findForm()).toHaveValue('Sophia Martins');
-    expect(within(main).getByRole('heading', { level: 1, name: 'My Profile' })).toBeInTheDocument();
+    expect(
+      within(main).getByRole('heading', { level: 1, name: 'Account settings' }),
+    ).toBeInTheDocument();
     await waitFor(() => {
-      expect(document.title).toBe('My Profile · Alma');
+      expect(document.title).toBe('Account settings · Alma');
     });
   });
 
   it("shows the guard's error with Retry when GET /me fails, and Retry loads the form", async () => {
@@ -256,14 +258,14 @@ describe('MePage loading and error views', () => {
     renderAt('/me', undefined, UNGUARDED_ME);
 
     const main = screen.getByRole('main');
     expect(
-      await within(main).findByRole('heading', { level: 1, name: 'My Profile' }),
+      await within(main).findByRole('heading', { level: 1, name: 'Account settings' }),
     ).toBeInTheDocument();
     expect(within(main).getByRole('status')).toHaveTextContent('Loading your profile…');
     expect(main.querySelector('[aria-busy="true"]')).not.toBeNull();
     await waitFor(() => {
-      expect(document.title).toBe('My Profile · Alma');
+      expect(document.title).toBe('Account settings · Alma');
     });
 
     act(() => {
       me.release();
diff --git a/packages/frontend/src/features/me/ProfileForm.test.tsx b/packages/frontend/src/features/me/ProfileForm.test.tsx
index 0de53114..2aa8c74a 100644
--- a/packages/frontend/src/features/me/ProfileForm.test.tsx
+++ b/packages/frontend/src/features/me/ProfileForm.test.tsx
@@ -110,9 +110,9 @@ function Page({ profile }: { profile: MyProfile }) {
   const headingRef = useRef<HTMLHeadingElement>(null);
   return (
     <>
       <h1 ref={headingRef} tabIndex={-1}>
-        My Profile
+        Account settings
       </h1>
       <Link to="/elsewhere">Away</Link>
       <ProfileForm profile={profile} headingRef={headingRef} />
     </>
diff --git a/packages/frontend/src/features/me/README.md b/packages/frontend/src/features/me/README.md
index 8360ba11..af2d440d 100644
--- a/packages/frontend/src/features/me/README.md
+++ b/packages/frontend/src/features/me/README.md
@@ -1,11 +1,11 @@
 # features/me/
 
-**Purpose:** the signed-in user's own profile editor at `/me` (REQ-010, design `docs/design/screens/app/S5-*`).
+**Purpose:** Account settings, the signed-in user's own profile editor at `/me` (REQ-010, renamed in REQ-012; design `docs/design/screens/app/S5-*`).
 
 **What is here:**
 
-- `MePage` — reads the `['me']` query (`useCurrentUser`) and shows skeleton cards, a first-load error with Retry, or `ProfileForm`. Tab title "My Profile · Alma". Below 48rem a slim top bar (back arrow and title, one link "Back to home") replaces the visible h1, which stays in the page clipped (never `display: none`). Focus goes to the h1 on a view change only when focus was lost (LESSON-REQ-008-2).
+- `MePage` — reads the `['me']` query (`useCurrentUser`) and shows skeleton cards, a first-load error with Retry, or `ProfileForm`. Heading and tab title "Account settings · Alma" (`ME_HEADING`; REQ-012 renamed it from "My Profile", the S5 design's name). Below 48rem a slim top bar (back arrow and title, one link "Back to home") replaces the visible h1, which stays in the page clipped (never `display: none`). Focus goes to the h1 on a view change only when focus was lost (LESSON-REQ-008-2).
 - `ProfileForm` — the controlled form (ADR-04). Keyed on `user_id` only, so a refetch or the save's own cache write never remounts it (ADV-004): the saved profile, the baseline for "unsaved changes", the toast and the password error live in its state and are replaced from the save's result. Errors show when a field is left or Save is tried; a failed Save focuses the first invalid field after `flushSync`. Discard restores the baseline and clears the password fields. After a save in this visit, and only while nothing is unsaved, a caption under the cards reads "All sections saved — no unsaved changes." (S5-UnsavedToast); the success toast (the `Toast` primitive, always mounted so its status region announces the message) closes after 4 s, paused while hovered or focused, or on Dismiss (focus then goes to the heading).
 - Sections, in S5's order: `PersonalSection`, `EducationSection`, `CareerSection`, `PasswordSection` (labelled regions with an h2; shared `Section.module.css`). The account's kind (`profileKind`: alumni, student, none) decides which show: an account with no profile row gets Personal (name and University) and Password only. Mentorship and "Change photo" are left out by decision (no API for them); email is never shown or sent.
 - `SaveBar` — the fixed "Unsaved changes" region with Discard and Save (the form's submit button), shown only while dirty or while a navigation waits for an answer. `LeavePrompt` takes its place then: "Leave" / "Keep editing" (focus starts on Keep editing). `InfoIcon` is the bar's decorative icon.
 - Hooks: `useUpdateProfile` (one `useMutation`: `PUT /api/me` when a profile field changed, then `PUT /api/me/password` when a password was typed; a password failure is returned, not thrown; on success it writes `['me']` and invalidates `['alumni']` and `['posts']`, unless the session is gone; not optimistic). `useLeaveGuard(active)` (`useBlocker` plus `beforeunload`, only while dirty or saving; never blocks without a live token, to `/login`, or on the same path, so a 401 logout is never held up, ADV-002).
```

## Requirement

---
kind: task
---
# Rename My Profile to Account settings; drop it from the header nav

| Field | Value |
|---|---|
| REQ | REQ-012 |
| Kind | task |
| Created | 2026-10-07 |
| Primary repo | alumni-system |
| Related | [[REQ-010]] (My Profile page, nav entries) · [[REQ-007]] (app shell, S1) · [[knowledge/lessons/LESSON-REQ-010-5-nav-and-menu-changes-touch-every-readme-list\|L-REQ-010-5]] · [[knowledge/lessons/LESSON-REQ-010-3-leave-prompt-needs-its-reason-too\|L-REQ-010-3]] |

## Goal

The signed-in user's own page (`/me`) is called **Account settings** everywhere, and is no longer a link in the desktop header nav: it is reached from the avatar menu, the Home card and, on phones, an "Account" tab.

## Acceptance criteria

- [ ] AC1. The desktop header nav (`<nav aria-label="Main">`) lists only Directory and Feed; no "My Profile" or "Account settings" link there.
- [ ] AC2. The avatar menu item reads "Account settings" and still goes to `/me`; the `/me` page heading, tab title and the Home quick-link card title read "Account settings" (the card still links to `/me`). The phone tab bar's third tab reads "Account", links to `/me`, and is marked current there. No visible "My Profile" text remains in the app (the public "View profile" menu item and the S3 profile page are unchanged).
- [ ] AC3. Tests are updated and pass, and docs that name these labels are corrected (CLAUDE.md, frontend/app/me READMEs, component page).

## Scope / non-goals

- Touches labels, the nav item lists and the tests only. The `/me` route, form, fields and behaviour are unchanged. Route path, `ME_PATH` and the `features/me` folder names stay.
- Deliberate deviation from S1/S2/S3/S5, which draw "My Profile" in the header nav and "Profile" in the phone tab bar. Recorded in the docs.
- No Admin nav/tab (not built).

## Approach

- `app/AppShell/navItems.tsx`: header nav no longer includes `/me`; the tab bar keeps it, labelled "Account" (S1's phone bar has a self tab, and "Account settings" is too long for a tab). Split the single shared `NAV_ITEMS` into the header list (Directory, Feed) and the tab list (Directory, Feed, Account) in the same file; `MainNav` and `BottomTabs` read their own list.
- `HeaderAuth.tsx`: menu item text. `MePage.tsx`: `ME_HEADING`. `HomePage.tsx`: card title (check the card's description still reads right). `ProfileForm.tsx`: `HIDDEN_FIELD_HINT` names the page ("Open Account settings on a wider screen…"). Comments mentioning "My Profile" updated.
- Tests: `AppShell.test.tsx` (nav list, current marking, menu items, route heading, tabs), `HomePage.test.tsx`, `MePage.test.tsx`/`ProfileForm.test.tsx` where they assert the heading or hint. Docs: grep for "My Profile" (CLAUDE.md, `packages/frontend/README.md`, `app/README.md`, `features/me/README.md`, `.adlc/knowledge/components/frontend.md`).
- The leave-prompt comment in `useLeaveGuard.ts` names "the nav's own My Profile" link; reword (that link no longer exists in the header nav).
