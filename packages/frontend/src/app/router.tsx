import { createBrowserRouter, type DOMRouterOpts, type RouteObject } from 'react-router';
import { GuestOnly, LoginPage, RegisterPage, RequireAuth } from '@/features/auth';
import { HomePage } from '@/features/home';
import { AppShell } from './AppShell';
import { AuthShell } from './AuthShell';
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
 * Pages inside AppShell (header). Home is the first signed-in page. Any
 * unknown path shows the empty shell.
 */
const DEFAULT_PAGE_ROUTES: RouteObject[] = [
  {
    element: <RequireAuth />,
    children: [{ index: true, element: <HomePage /> }],
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
