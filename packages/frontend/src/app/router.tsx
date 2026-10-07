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
 * Pages inside AppShell (header). Home is the first signed-in page; the
 * directory, the profile and the feed are lazy. Any unknown path shows the empty shell.
 */
const DEFAULT_PAGE_ROUTES: RouteObject[] = [
  {
    element: <RequireAuth />,
    children: [{ index: true, element: <HomePage /> }, DIRECTORY_ROUTE, PROFILE_ROUTE, FEED_ROUTE],
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
