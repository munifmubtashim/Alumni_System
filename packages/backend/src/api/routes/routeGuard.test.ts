import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app';

// AC12: list every route registered on the Express app and prove that each one outside
// the public allowlist rejects a request with no token. Relies on Express 4 internals
// (app._router.stack); the count and known-route checks make an upgrade fail loudly.

const PUBLIC = new Set(['POST /api/auth/login', 'POST /api/auth/register', 'GET /api/health']);

// Top-level middleware app.ts installs on purpose. Anything else at the top level
// (a new app.use(handler), express.static, a sub-app) can't be probed, so it fails.
const KNOWN_TOP_LEVEL_MIDDLEWARE = new Set(['query', 'expressInit', 'corsMiddleware', 'jsonParser']);

interface Layer {
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

function listRoutes(stack: Layer[], prefix = ''): string[] {
  const routes: string[] = [];
  for (const layer of stack) {
    if (layer.route) {
      for (const method of Object.keys(layer.route.methods)) {
        routes.push(`${method.toUpperCase()} ${prefix}${layer.route.path === '/' && prefix ? '' : layer.route.path}`);
      }
    } else if (layer.name === 'router' && layer.handle.stack) {
      routes.push(...listRoutes(layer.handle.stack, prefix + mountPath(layer)));
    }
  }
  return routes;
}

const topLevel = (app as unknown as { _router: { stack: Layer[] } })._router.stack;
const ALL_ROUTES = listRoutes(topLevel);
const GUARDED = ALL_ROUTES.filter((r) => !PUBLIC.has(r));

describe('route guard', () => {
  it('finds every route (walker sanity check)', () => {
    expect(ALL_ROUTES.length).toBeGreaterThanOrEqual(23);
    expect(ALL_ROUTES).toContain('DELETE /api/comments/:id');
    for (const route of PUBLIC) expect(ALL_ROUTES).toContain(route);
  });

  it('has only known middleware, routes and mounted routers at the top level', () => {
    const unknown = topLevel
      .filter((l) => !l.route && l.name !== 'router' && !KNOWN_TOP_LEVEL_MIDDLEWARE.has(l.name))
      .map((l) => l.name);
    expect(unknown).toEqual([]);
  });

  it.each(GUARDED)('%s → 401 without a token', async (route) => {
    const [method, path] = route.split(' ');
    const url = path.replace(/:[^/]+/g, '1');
    const res = await request(app)[method.toLowerCase() as 'get' | 'post' | 'put' | 'delete'](url);
    expect(res.status).toBe(401);
  });
});
