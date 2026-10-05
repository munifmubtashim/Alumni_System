import { createBrowserRouter, type DOMRouterOpts, type RouteObject } from 'react-router';
import { AppShell } from './AppShell';
import { RouteError } from './RouteError';

/** No feature pages yet: the home path and any unknown path show the empty shell. */
const DEFAULT_PAGE_ROUTES: RouteObject[] = [
  { index: true, element: null },
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
