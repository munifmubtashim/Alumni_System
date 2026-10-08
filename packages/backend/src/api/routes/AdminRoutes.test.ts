import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminManager, AppError } from '@alumni/businesslogic';
import app from '../app';
import { bearer, tokenFor } from '../test/authHelpers';
import { listRoutes, toRequest } from '../test/routeList';

// AdminManager becomes a fake (every method a vi.fn()); AppError stays the real class so the
// controllers' sendError still maps it. Rules themselves are tested in AdminManager.test.ts.
vi.mock('@alumni/businesslogic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@alumni/businesslogic')>();
  class FakeAdminManager {}
  for (const name of Object.getOwnPropertyNames(actual.AdminManager.prototype)) {
    if (name === 'constructor') continue;
    (FakeAdminManager.prototype as Record<string, unknown>)[name] = vi.fn();
  }
  return { ...actual, AdminManager: FakeAdminManager };
});

const ADMIN = { sub: 1, role: 'admin' };
const ALUMNI = { sub: 8, role: 'alumni' };
const STUDENT = { sub: 7, role: 'student' };
const ROW = { id: 30, user_id: 12, name: 'Al Alumnus' };

const manager = {
  getStats: vi.mocked(AdminManager.prototype.getStats),
  createAlumni: vi.mocked(AdminManager.prototype.createAlumni),
  updateAlumni: vi.mocked(AdminManager.prototype.updateAlumni),
  deleteAlumni: vi.mocked(AdminManager.prototype.deleteAlumni),
};

const ADMIN_ROUTES = [
  { route: 'GET /api/admin/stats', status: 200 },
  { route: 'POST /api/admin/alumni', status: 201 },
  { route: 'PUT /api/admin/alumni/:id', status: 200 },
  { route: 'DELETE /api/admin/alumni/:id', status: 200 },
];

function call(route: string, claims?: { sub: number; role: string }, body: object = {}) {
  const { method, url } = toRequest(route);
  const req = request(app)[method](url);
  if (claims) req.set('Authorization', bearer(tokenFor(claims)));
  return method === 'get' || method === 'delete' ? req : req.send(body);
}

beforeEach(() => {
  vi.resetAllMocks();
  manager.getStats.mockResolvedValue({ alumni: 3, students: 2, posts: 9, mentors: 1 });
  manager.createAlumni.mockResolvedValue(ROW as never);
  manager.updateAlumni.mockResolvedValue(ROW as never);
  manager.deleteAlumni.mockResolvedValue(undefined);
});

describe('/api/admin is mounted with exactly the four routes', () => {
  it('lists them on the app', () => {
    expect(listRoutes(app).filter((r) => r.includes('/api/admin')).sort()).toEqual(
      ADMIN_ROUTES.map((r) => r.route).sort(),
    );
  });
});

describe.each(ADMIN_ROUTES)('$route', ({ route, status }) => {
  it('no token → 401', async () => {
    expect((await call(route)).status).toBe(401);
  });

  it.each([['alumni', ALUMNI], ['student', STUDENT]])('%s token → 403, manager not called', async (_role, claims) => {
    const res = await call(route, claims);
    expect(res.status).toBe(403);
    for (const fn of Object.values(manager)) expect(fn).not.toHaveBeenCalled();
  });

  it(`admin token → ${status}`, async () => {
    expect((await call(route, ADMIN)).status).toBe(status);
  });
});

describe('what reaches the manager', () => {
  it('GET /stats answers the counts', async () => {
    const res = await call('GET /api/admin/stats', ADMIN);
    expect(res.body).toEqual({ alumni: 3, students: 2, posts: 9, mentors: 1 });
  });

  it('POST /alumni passes the body and answers the new row', async () => {
    const body = { name: 'Al', email: 'al@x.io', password: 'temporary1' };
    const res = await call('POST /api/admin/alumni', ADMIN, body);
    expect(manager.createAlumni).toHaveBeenCalledWith(body);
    expect(res.body).toEqual(ROW);
  });

  it('PUT /alumni/:id passes the id and the body', async () => {
    const res = await request(app)
      .put('/api/admin/alumni/30')
      .set('Authorization', bearer(tokenFor(ADMIN)))
      .send({ name: 'New' });
    expect(manager.updateAlumni).toHaveBeenCalledWith('30', { name: 'New' });
    expect(res.body).toEqual(ROW);
  });

  it('DELETE /alumni/:id passes the admin’s user id from the token, never from the body', async () => {
    const res = await request(app)
      .delete('/api/admin/alumni/30')
      .set('Authorization', bearer(tokenFor({ sub: 5, role: 'admin' })))
      .send({ sub: 99 });
    expect(manager.deleteAlumni).toHaveBeenCalledWith(5, '30');
    expect(res.body).toEqual({ message: 'Alumni deleted' });
  });
});

describe('errors use sendError: AppError status + { message }, anything else a plain 500', () => {
  it.each([
    [400, 'Name is required'],
    [404, 'Alumni not found'],
    [409, 'An account with this email already exists'],
  ])('AppError %i', async (status, message) => {
    manager.createAlumni.mockRejectedValue(new AppError(status, message));
    const res = await call('POST /api/admin/alumni', ADMIN);
    expect(res.status).toBe(status);
    expect(res.body).toEqual({ message });
  });

  it('403 self-delete passes through', async () => {
    manager.deleteAlumni.mockRejectedValue(new AppError(403, "You can't delete your own account"));
    const res = await call('DELETE /api/admin/alumni/:id', ADMIN);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "You can't delete your own account" });
  });

  it('a raw error never leaks its text', async () => {
    manager.getStats.mockRejectedValue(new Error('relation "alumni" does not exist'));
    const res = await call('GET /api/admin/stats', ADMIN);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: 'Something went wrong' });
  });
});
