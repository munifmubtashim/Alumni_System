import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../app';
import { guardedRoutes, listRoutes, PUBLIC_ROUTES, toRequest, topLevelStack } from '../test/routeList';

// AC12: list every route registered on the Express app and prove that each one outside
// the public allowlist rejects a request with no token. The walker lives in
// ../test/routeList.ts; the count and known-route checks make an Express upgrade fail loudly.

// Top-level middleware app.ts installs on purpose. Anything else at the top level
// (a new app.use(handler), express.static, a sub-app) can't be probed, so it fails.
const KNOWN_TOP_LEVEL_MIDDLEWARE = new Set(['query', 'expressInit', 'corsMiddleware', 'jsonParser']);

const ALL_ROUTES = listRoutes(app);
const GUARDED = guardedRoutes(app);

describe('route guard', () => {
  it('finds every route (walker sanity check)', () => {
    expect(ALL_ROUTES.length).toBeGreaterThanOrEqual(23);
    expect(ALL_ROUTES).toContain('DELETE /api/comments/:id');
    expect(ALL_ROUTES).toContain('PUT /api/comments/:id');
    expect(ALL_ROUTES).toContain('GET /api/alumni/suggestions');
    for (const route of PUBLIC_ROUTES) expect(ALL_ROUTES).toContain(route);
  });

  it('has only known middleware, routes and mounted routers at the top level', () => {
    const unknown = topLevelStack(app)
      .filter((l) => !l.route && l.name !== 'router' && !KNOWN_TOP_LEVEL_MIDDLEWARE.has(l.name))
      .map((l) => l.name);
    expect(unknown).toEqual([]);
  });

  it.each(GUARDED)('%s → 401 without a token', async (route) => {
    const { method, url } = toRequest(route);
    const res = await request(app)[method](url);
    expect(res.status).toBe(401);
  });
});
