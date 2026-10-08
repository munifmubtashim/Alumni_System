import type { Express } from 'express';

// Lists every route registered on the Express app, so tests derive the protected-route list
// from the app instead of keeping one by hand. Relies on Express 4 internals
// (app._router.stack); routeGuard.test.ts has sanity checks that fail loudly on an upgrade.

export const PUBLIC_ROUTES = new Set(['POST /api/auth/login', 'POST /api/auth/register', 'GET /api/health']);

export type RouteMethod = 'get' | 'post' | 'put' | 'delete';

export interface Layer {
  name: string;
  handle: { stack?: Layer[] };
  regexp: RegExp;
  route?: { path: string; methods: Record<string, boolean> };
}

/** '/api/users' from Express 4's mount regexp `^\/api\/users\/?(?=\/|$)`. */
function mountPath(layer: Layer): string {
  const path = layer.regexp.source
    .replace(/^\^/, '')
    .replace('\\/?(?=\\/|$)', '')
    .replace(/\\\//g, '/');
  if (!/^(\/[\w-]+)+$/.test(path)) {
    throw new Error(`Can't read a static mount path from ${layer.regexp.source}`);
  }
  return path;
}

function walk(stack: Layer[], prefix = ''): string[] {
  const routes: string[] = [];
  for (const layer of stack) {
    if (layer.route) {
      for (const method of Object.keys(layer.route.methods)) {
        routes.push(`${method.toUpperCase()} ${prefix}${layer.route.path === '/' && prefix ? '' : layer.route.path}`);
      }
    } else if (layer.name === 'router' && layer.handle.stack) {
      routes.push(...walk(layer.handle.stack, prefix + mountPath(layer)));
    }
  }
  return routes;
}

/** The app's top-level middleware stack. */
export function topLevelStack(app: Express): Layer[] {
  return (app as unknown as { _router: { stack: Layer[] } })._router.stack;
}

/** Every route as 'METHOD /path/:param', e.g. 'DELETE /api/comments/:id'. */
export function listRoutes(app: Express): string[] {
  return walk(topLevelStack(app));
}

/** Every route outside PUBLIC_ROUTES: these must all need a valid token. */
export function guardedRoutes(app: Express): string[] {
  return listRoutes(app).filter((r) => !PUBLIC_ROUTES.has(r));
}

/** 'PUT /api/posts/:id' → { method: 'put', url: '/api/posts/1' }: a callable request target. */
export function toRequest(route: string): { method: RouteMethod; url: string } {
  const [method, path] = route.split(' ');
  return { method: method.toLowerCase() as RouteMethod, url: path.replace(/:[^/]+/g, '1') };
}
