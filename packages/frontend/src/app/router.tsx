import { createBrowserRouter, type DOMRouterOpts, type RouteObject } from 'react-router';
import { GuestOnly, LoginPage, RegisterPage, RequireAuth } from '@/features/auth';
import { HomePage } from '@/features/home';
import { AppShell } from './AppShell';
import { RouteError } from './RouteError';

/**
 * Guests may open /login and /register; signed-in users are sent on from
 * there. Home is the first signed-in page. Any unknown path shows the empty
 * shell.
 */
const DEFAULT_PAGE_ROUTES: RouteObject[] = [
  {
    element: <GuestOnly />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [{ index: true, element: <HomePage /> }],
  },
  { path: '*', element: null },
];

/**
 * Builds the route tree. Two error layers: the outer `errorElement` catches a
 * crash in the shell itself (no header then); the path-less inner route keeps
 * the header and shows page errors inside `<main>`. Tests pass extra pages.
 */
export function createRoutes(pageRoutes: RouteObject[] = DEFAULT_PAGE_ROUTES): RouteObject[] {
  return [
    {
      path: '/',
      element: <AppShell />,
      errorElement: <RouteError />,
      children: [{ errorElement: <RouteError />, children: pageRoutes }],
    },
  ];
}

export const routes: RouteObject[] = createRoutes();

/** The app's browser router. Tests use `createMemoryRouter(routes)` instead. */
export function createAppRouter(opts?: DOMRouterOpts) {
  return createBrowserRouter(routes, opts);
}
