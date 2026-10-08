import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AlumniManager,
  AppError,
  CommentManager,
  PostManager,
  UserManager,
} from '@alumni/businesslogic';
import app from '../app';
import { requireRole } from '../Middleware/roleMiddleware';
import { badSignatureToken, bearer, expiredToken, tokenFor } from '../test/authHelpers';
import { guardedRoutes, toRequest, type RouteMethod } from '../test/routeList';

// Managers become fakes: every async method is a vi.fn(), while the pure validate* methods
// stay real so controllers that validate before calling the manager behave as in production.
// AppError is the real class, so `instanceof AppError` in the controllers still works.
vi.mock('@alumni/businesslogic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@alumni/businesslogic')>();
  function fake<T extends { prototype: object }>(Real: T): T {
    class Fake {}
    for (const name of Object.getOwnPropertyNames(Real.prototype)) {
      if (name === 'constructor') continue;
      const real = (Real.prototype as Record<string, unknown>)[name];
      (Fake.prototype as Record<string, unknown>)[name] = name.startsWith('validate')
        ? real
        : vi.fn();
    }
    return Fake as unknown as T;
  }
  return {
    ...actual,
    UserManager: fake(actual.UserManager),
    AlumniManager: fake(actual.AlumniManager),
    PostManager: fake(actual.PostManager),
    CommentManager: fake(actual.CommentManager),
  };
});

type Method = RouteMethod;
interface Route {
  method: Method;
  path: string;
}

const STUDENT = { sub: 7, role: 'student' };
const ALUMNI = { sub: 8, role: 'alumni' };
const ADMIN = { sub: 1, role: 'admin' };

// A user row shaped like UserQuery's PUBLIC_USER_COLUMNS (no password).
const PUBLIC_USER = {
  id: 7,
  name: 'Sam Student',
  email: 'sam@example.com',
  role: 'student',
  photo_url: null,
  university: null,
  created_at: '2026-10-05T00:00:00.000Z',
};

// Every route outside the public allowlist, read from the app itself (../test/routeList.ts),
// so a new route is covered here without editing a list. Path params are filled with 1.
const PROTECTED: Route[] = guardedRoutes(app).map((r) => {
  const { method, url } = toRequest(r);
  return { method, path: url };
});

const REMOVED: Route[] = [
  { method: 'get', path: '/api/users/email/sam@example.com' },
  { method: 'put', path: '/api/users/1/login' },
  { method: 'put', path: '/api/users/1/logout' },
  { method: 'get', path: '/api/alumni/email/sam@example.com' },
];

function call(route: Route, token?: string, body: object = {}) {
  const req = request(app)[route.method](route.path);
  if (token) req.set('Authorization', bearer(token));
  return route.method === 'get' || route.method === 'delete' ? req : req.send(body);
}

const label = (r: Route) => `${r.method.toUpperCase()} ${r.path}`;

beforeEach(() => {
  // Every test starts with fresh fakes: no return values or calls left over from another test.
  vi.resetAllMocks();
});

// "No token → 401" for every route is routeGuard.test.ts's job; this block covers bad tokens.
describe('AC2: every non-public route needs a valid token', () => {
  it('derives the protected routes from the app', () => {
    expect(PROTECTED.length).toBeGreaterThanOrEqual(20);
    expect(PROTECTED).toContainEqual({ method: 'put', path: '/api/me/password' });
    expect(PROTECTED).not.toContainEqual({ method: 'get', path: '/api/health' });
  });

  describe.each(PROTECTED.map((r) => [label(r), r] as const))('%s', (_name, route) => {
    it('expired token → 401', async () => {
      expect((await call(route, expiredToken())).status).toBe(401);
    });

    it('bad signature → 401', async () => {
      expect((await call(route, badSignatureToken())).status).toBe(401);
    });

    it('header without a token → 401', async () => {
      const res = await request(app)[route.method](route.path).set('Authorization', 'Bearer');
      expect(res.status).toBe(401);
    });
  });
});

describe('AC1: public routes work without a token', () => {
  it('GET /api/health → 200', async () => {
    expect((await request(app).get('/api/health')).status).toBe(200);
  });

  it('POST /api/auth/login → 200 with a token', async () => {
    vi.mocked(UserManager.prototype.verifyLogin).mockResolvedValue(PUBLIC_USER as never);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: PUBLIC_USER.email, password: 'correct horse' });

    expect(res.status).toBe(200);
    expect(Object.keys(res.body)).toEqual(['token']);
    expect(typeof res.body.token).toBe('string');
  });

  it('POST /api/auth/login with a wrong email or password → 401 "Invalid"', async () => {
    vi.mocked(UserManager.prototype.verifyLogin).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: PUBLIC_USER.email, password: 'wrong horse' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: 'Invalid' });
  });

  it('POST /api/auth/login when the database fails → 500 without the raw error text', async () => {
    vi.mocked(UserManager.prototype.verifyLogin).mockRejectedValue(
      new Error('pg: connection refused'),
    );

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: PUBLIC_USER.email, password: 'correct horse' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: 'Something went wrong' });
    expect(res.text).not.toContain('pg');
  });

  it('POST /api/auth/register → 201', async () => {
    vi.mocked(UserManager.prototype.register).mockResolvedValue(PUBLIC_USER as never);

    const res = await request(app).post('/api/auth/register').send({
      name: 'Sam Student',
      email: 'sam@example.com',
      password: 'a-long-enough-password-1',
      role: 'alumni',
      university: 'Example University',
    });

    expect(res.status).toBe(201);
    expect(res.body.user).not.toHaveProperty('password');
  });
});

describe('AC3: admin-only routes', () => {
  const VALID_NEW_USER = {
    name: 'New Admin',
    email: 'new-admin@example.com',
    password: 'a-long-enough-password-1',
    role: 'admin',
  };
  const ADMIN_ONLY: Array<[string, Route, object]> = [
    ['GET /api/users', { method: 'get', path: '/api/users' }, {}],
    ['POST /api/users', { method: 'post', path: '/api/users' }, VALID_NEW_USER],
    ['DELETE /api/users/1', { method: 'delete', path: '/api/users/1' }, {}],
  ];

  beforeEach(() => {
    vi.mocked(UserManager.prototype.getAllUsers).mockResolvedValue([PUBLIC_USER] as never);
    vi.mocked(UserManager.prototype.createUser).mockResolvedValue(PUBLIC_USER as never);
    vi.mocked(UserManager.prototype.deleteUser).mockResolvedValue(undefined as never);
  });

  describe.each(ADMIN_ONLY)('%s', (_name, route, body) => {
    it('student → 403', async () => {
      expect((await call(route, tokenFor(STUDENT), body)).status).toBe(403);
    });

    it('alumni → 403', async () => {
      expect((await call(route, tokenFor(ALUMNI), body)).status).toBe(403);
    });

    it('admin → 2xx', async () => {
      const res = await call(route, tokenFor(ADMIN), body);
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(300);
    });
  });

  it('a 403 from requireRole never reaches the manager', async () => {
    await call({ method: 'delete', path: '/api/users/1' }, tokenFor(STUDENT));
    expect(UserManager.prototype.deleteUser).not.toHaveBeenCalled();
  });

  it('AC8b: POST /api/users with a bad role → 400 for an admin', async () => {
    const res = await call(
      { method: 'post', path: '/api/users' },
      tokenFor(ADMIN),
      { ...VALID_NEW_USER, role: 'superuser' },
    );
    expect(res.status).toBe(400);
    expect(UserManager.prototype.createUser).not.toHaveBeenCalled();
  });
});

describe('routes any signed-in user may call', () => {
  const ANY_USER: Route[] = [
    { method: 'get', path: '/api/users/1' },
    { method: 'get', path: '/api/alumni' },
    { method: 'get', path: '/api/alumni/1' },
    { method: 'get', path: '/api/posts' },
    { method: 'post', path: '/api/posts' },
    { method: 'get', path: '/api/posts/user/1' },
    { method: 'get', path: '/api/posts/1/comments' },
    { method: 'post', path: '/api/posts/1/comments' },
    { method: 'get', path: '/api/me' },
    { method: 'put', path: '/api/me' },
    { method: 'put', path: '/api/me/password' },
  ];

  beforeEach(() => {
    vi.mocked(UserManager.prototype.findUserById).mockResolvedValue(PUBLIC_USER as never);
    vi.mocked(AlumniManager.prototype.searchAlumni).mockResolvedValue({ items: [], total: 0 } as never);
    vi.mocked(AlumniManager.prototype.findAlumniById).mockResolvedValue({ id: 1 } as never);
    vi.mocked(PostManager.prototype.getAllPosts).mockResolvedValue([] as never);
    vi.mocked(PostManager.prototype.createNewPost).mockResolvedValue({ id: 1 } as never);
    vi.mocked(PostManager.prototype.getPostsByUserId).mockResolvedValue([] as never);
    vi.mocked(CommentManager.prototype.getCommentsForPost).mockResolvedValue([] as never);
    vi.mocked(CommentManager.prototype.addComment).mockResolvedValue({ id: 1 } as never);
    vi.mocked(UserManager.prototype.getMe).mockResolvedValue({ id: 7 } as never);
    vi.mocked(UserManager.prototype.updateMe).mockResolvedValue({ id: 7 } as never);
    vi.mocked(UserManager.prototype.changeMyPassword).mockResolvedValue(undefined);
  });

  it.each(ANY_USER.map((r) => [label(r), r] as const))('%s → 2xx for a student', async (_n, route) => {
    const res = await call(route, tokenFor(STUDENT));
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
  });

  // Routes that act as the caller must pass the token's sub (7), never an id from the body.
  const BODY = { user_id: 999, id: 999, caption: 'hi', content: 'hi', name: 'Sam' };
  const IDENTITY: Array<[string, Route, () => ReturnType<typeof vi.fn>, unknown[]]> = [
    ['POST /api/posts', { method: 'post', path: '/api/posts' }, () => vi.mocked(PostManager.prototype.createNewPost), [STUDENT.sub, BODY]],
    ['POST /api/posts/1/comments', { method: 'post', path: '/api/posts/1/comments' }, () => vi.mocked(CommentManager.prototype.addComment), [STUDENT.sub, '1', BODY]],
    ['GET /api/me', { method: 'get', path: '/api/me' }, () => vi.mocked(UserManager.prototype.getMe), [STUDENT.sub]],
    ['PUT /api/me', { method: 'put', path: '/api/me' }, () => vi.mocked(UserManager.prototype.updateMe), [STUDENT.sub, BODY]],
    ['PUT /api/me/password', { method: 'put', path: '/api/me/password' }, () => vi.mocked(UserManager.prototype.changeMyPassword), [STUDENT.sub, BODY]],
  ];

  it.each(IDENTITY)('%s hands the manager the token’s user id', async (_n, route, manager, args) => {
    await call(route, tokenFor(STUDENT), BODY);
    expect(manager()).toHaveBeenCalledTimes(1);
    expect(manager()).toHaveBeenCalledWith(...args);
  });
});

describe('GET /api/alumni: search, filters and paging', () => {
  const route: Route = { method: 'get', path: '/api/alumni' };

  it('200 with the manager’s { items, total } as the body', async () => {
    const page = { items: [{ id: 1, name: 'Ana' }], total: 41 };
    vi.mocked(AlumniManager.prototype.searchAlumni).mockResolvedValue(page as never);
    const res = await call(route, tokenFor(STUDENT));
    expect(res.status).toBe(200);
    expect(res.body).toEqual(page);
  });

  it('hands the raw query string to the manager', async () => {
    vi.mocked(AlumniManager.prototype.searchAlumni).mockResolvedValue({ items: [], total: 0 } as never);
    await call({ method: 'get', path: '/api/alumni?q=Ana%20B&department=CSE&page=2&pageSize=10' }, tokenFor(STUDENT));
    expect(AlumniManager.prototype.searchAlumni).toHaveBeenCalledTimes(1);
    expect(AlumniManager.prototype.searchAlumni).toHaveBeenCalledWith({
      q: 'Ana B',
      department: 'CSE',
      page: '2',
      pageSize: '10',
    });
  });

  it('hands sort and order to the manager as they came', async () => {
    vi.mocked(AlumniManager.prototype.searchAlumni).mockResolvedValue({ items: [], total: 0 } as never);
    await call({ method: 'get', path: '/api/alumni?sort=graduationYear&order=desc' }, tokenFor(STUDENT));
    expect(AlumniManager.prototype.searchAlumni).toHaveBeenCalledWith({ sort: 'graduationYear', order: 'desc' });
  });

  it('an invalid sort → 400 { message: "Invalid sort" }', async () => {
    vi.mocked(AlumniManager.prototype.searchAlumni).mockRejectedValue(new AppError(400, 'Invalid sort'));
    const res = await call({ method: 'get', path: '/api/alumni?sort=email' }, tokenFor(STUDENT));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'Invalid sort' });
  });

  it('manager AppError(400) → 400 { message }', async () => {
    vi.mocked(AlumniManager.prototype.searchAlumni).mockRejectedValue(
      new AppError(400, 'pageSize must be a whole number from 1 to 100'),
    );
    const res = await call({ method: 'get', path: '/api/alumni?pageSize=500' }, tokenFor(STUDENT));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'pageSize must be a whole number from 1 to 100' });
  });

  it('no token → 401 without calling the manager', async () => {
    const res = await call(route);
    expect(res.status).toBe(401);
    expect(AlumniManager.prototype.searchAlumni).not.toHaveBeenCalled();
  });
});

describe('owner-or-admin routes pass the manager’s decision through', () => {
  const OWNER: Array<[string, Route, () => ReturnType<typeof vi.fn>]> = [
    ['PUT /api/users/1', { method: 'put', path: '/api/users/1' }, () => vi.mocked(UserManager.prototype.updateOwnUser)],
    ['PUT /api/alumni/1', { method: 'put', path: '/api/alumni/1' }, () => vi.mocked(AlumniManager.prototype.updateOwnAlumni)],
    ['PUT /api/posts/1', { method: 'put', path: '/api/posts/1' }, () => vi.mocked(PostManager.prototype.updatePost)],
    ['DELETE /api/posts/1', { method: 'delete', path: '/api/posts/1' }, () => vi.mocked(PostManager.prototype.deletePost)],
    ['PUT /api/comments/1', { method: 'put', path: '/api/comments/1' }, () => vi.mocked(CommentManager.prototype.updateComment)],
    ['DELETE /api/comments/1', { method: 'delete', path: '/api/comments/1' }, () => vi.mocked(CommentManager.prototype.deleteComment)],
  ];

  describe.each(OWNER)('%s', (_name, route, manager) => {
    it('manager allows → 200', async () => {
      manager().mockResolvedValue({ id: 1 });
      expect((await call(route, tokenFor(STUDENT))).status).toBe(200);
    });

    it('manager says not yours → 403 (never 401)', async () => {
      manager().mockRejectedValue(new AppError(403, 'Forbidden'));
      expect((await call(route, tokenFor(STUDENT))).status).toBe(403);
    });

    it('manager says missing → 404', async () => {
      manager().mockRejectedValue(new AppError(404, 'Not found'));
      expect((await call(route, tokenFor(STUDENT))).status).toBe(404);
    });
  });

  it('PUT /api/comments/:id hands the manager the token’s id and role, the raw id and the body', async () => {
    vi.mocked(CommentManager.prototype.updateComment).mockResolvedValue({ id: 5, content: 'x' } as never);

    const res = await call({ method: 'put', path: '/api/comments/5' }, tokenFor(ADMIN), { content: 'x', user_id: 99 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 5, content: 'x' });
    expect(CommentManager.prototype.updateComment).toHaveBeenCalledWith(
      { id: ADMIN.sub, role: 'admin' },
      '5',
      { content: 'x', user_id: 99 },
    );
  });

  it('AC7: PUT/DELETE /api/posts/:id hand the manager the token’s id and role', async () => {
    vi.mocked(PostManager.prototype.updatePost).mockResolvedValue({ id: 1 } as never);
    vi.mocked(PostManager.prototype.deletePost).mockResolvedValue(undefined as never);

    await call({ method: 'put', path: '/api/posts/5' }, tokenFor(ADMIN), { caption: 'x' });
    await call({ method: 'delete', path: '/api/posts/5' }, tokenFor(STUDENT));

    expect(PostManager.prototype.updatePost).toHaveBeenCalledWith(
      { id: ADMIN.sub, role: 'admin' },
      '5',
      { caption: 'x' },
    );
    expect(PostManager.prototype.deletePost).toHaveBeenCalledWith(
      { id: STUDENT.sub, role: 'student' },
      '5',
    );
  });
});

describe('AC6: POST /api/alumni is for alumni users, for themselves', () => {
  const route: Route = { method: 'post', path: '/api/alumni' };

  it('student → 403', async () => {
    expect((await call(route, tokenFor(STUDENT))).status).toBe(403);
  });

  it('admin → 403', async () => {
    expect((await call(route, tokenFor(ADMIN))).status).toBe(403);
  });

  it('alumni → 201', async () => {
    vi.mocked(AlumniManager.prototype.createAlumni).mockResolvedValue({ id: 3 } as never);
    expect((await call(route, tokenFor(ALUMNI))).status).toBe(201);
  });

  it('alumni who already has a profile → 409', async () => {
    vi.mocked(AlumniManager.prototype.createAlumni).mockRejectedValue(
      new AppError(409, 'Profile already exists'),
    );
    expect((await call(route, tokenFor(ALUMNI))).status).toBe(409);
  });
});

describe('AC5/AC6: a user_id in the body is ignored', () => {
  it('POST /api/posts creates the post as the token’s user', async () => {
    vi.mocked(PostManager.prototype.createNewPost).mockResolvedValue({ id: 1 } as never);

    await call({ method: 'post', path: '/api/posts' }, tokenFor(STUDENT), {
      user_id: 999,
      caption: 'hello',
    });

    expect(PostManager.prototype.createNewPost).toHaveBeenCalledTimes(1);
    expect(vi.mocked(PostManager.prototype.createNewPost).mock.calls[0][0]).toBe(STUDENT.sub);
  });

  it('POST /api/alumni creates the profile for the token’s user', async () => {
    vi.mocked(AlumniManager.prototype.createAlumni).mockResolvedValue({ id: 3 } as never);

    await call({ method: 'post', path: '/api/alumni' }, tokenFor(ALUMNI), { user_id: 999 });

    expect(AlumniManager.prototype.createAlumni).toHaveBeenCalledTimes(1);
    expect(vi.mocked(AlumniManager.prototype.createAlumni).mock.calls[0][0]).toBe(ALUMNI.sub);
  });
});

describe('AC4: removed routes', () => {
  describe.each(REMOVED.map((r) => [label(r), r] as const))('%s', (_name, route) => {
    it('signed in → 404', async () => {
      expect((await call(route, tokenFor(ADMIN))).status).toBe(404);
    });

    it('no token → 401 (auth runs before routing)', async () => {
      expect((await call(route)).status).toBe(401);
    });
  });
});

describe('AC8: no password in /api/users responses', () => {
  it('GET /api/users', async () => {
    vi.mocked(UserManager.prototype.getAllUsers).mockResolvedValue([PUBLIC_USER] as never);
    const res = await call({ method: 'get', path: '/api/users' }, tokenFor(ADMIN));
    expect(res.status).toBe(200);
    for (const user of res.body) expect(user).not.toHaveProperty('password');
  });

  it('GET /api/users/:id', async () => {
    vi.mocked(UserManager.prototype.findUserById).mockResolvedValue(PUBLIC_USER as never);
    const res = await call({ method: 'get', path: '/api/users/7' }, tokenFor(STUDENT));
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('password');
  });

  it('POST /api/users does not echo the password or its hash', async () => {
    vi.mocked(UserManager.prototype.createUser).mockResolvedValue(PUBLIC_USER as never);
    const res = await call({ method: 'post', path: '/api/users' }, tokenFor(ADMIN), {
      name: 'Sam Student',
      email: 'sam@example.com',
      password: 'a-long-enough-password-1',
      role: 'student',
    });
    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty('password');
    expect(JSON.stringify(res.body)).not.toContain('a-long-enough-password-1');
  });
});

describe('AC9: requireRole without a signed-in user', () => {
  function run(user: Request['user'] | undefined) {
    const res = { status: vi.fn(), json: vi.fn() };
    res.status.mockReturnValue(res);
    const next = vi.fn() as unknown as NextFunction;
    requireRole('admin')({ user } as Request, res as unknown as Response, next);
    return { res, next };
  }

  it('no req.user → 401, does not throw, does not call next', () => {
    const { res, next } = run(undefined);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('wrong role → 403', () => {
    const { res, next } = run({ sub: 7, role: 'student' });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('right role → next()', () => {
    const { res, next } = run({ sub: 1, role: 'admin' });
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('error bodies use { message } and never leak raw error text', () => {
  it('GET /api/users/:id: manager 404 → 404 { message }', async () => {
    vi.mocked(UserManager.prototype.findUserById).mockRejectedValue(new AppError(404, 'User not found'));
    const res = await call({ method: 'get', path: '/api/users/999' }, tokenFor(STUDENT));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: 'User not found' });
  });

  it('DELETE /api/users/:id: manager 404 → 404 { message }', async () => {
    vi.mocked(UserManager.prototype.deleteUser).mockRejectedValue(new AppError(404, 'User not found'));
    const res = await call({ method: 'delete', path: '/api/users/999' }, tokenFor(ADMIN));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: 'User not found' });
  });

  it.each([
    ['GET /api/users', { method: 'get', path: '/api/users' } as Route, () => vi.mocked(UserManager.prototype.getAllUsers), ADMIN],
    ['GET /api/users/1', { method: 'get', path: '/api/users/1' } as Route, () => vi.mocked(UserManager.prototype.findUserById), STUDENT],
    ['GET /api/alumni', { method: 'get', path: '/api/alumni' } as Route, () => vi.mocked(AlumniManager.prototype.searchAlumni), STUDENT],
    ['GET /api/alumni/1', { method: 'get', path: '/api/alumni/1' } as Route, () => vi.mocked(AlumniManager.prototype.findAlumniById), STUDENT],
  ])('%s: DB failure → 500 with a generic message', async (_n, route, manager, user) => {
    manager().mockRejectedValue(new Error('connection terminated unexpectedly'));
    const res = await call(route, tokenFor(user));
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: 'Something went wrong' });
  });
});

// REQ-011: the real managers (validation, owner check) run behind the routes; only their query
// objects are stubbed, so these tests show what reaches the DAL and what comes back to the client.
describe('REQ-011: headline, location, degree, start year and mentorship through the routes', () => {
  const FIELDS = {
    headline: 'Product designer',
    location: 'Oslo, Norway',
    degree: 'B.Sc. Product Design',
    start_year: 2013,
    mentorship_available: true,
  };
  const ALUMNI_ROW = { id: 5, user_id: ALUMNI.sub, name: 'Ana', department: 'CSE', graduation_year: 2017, ...FIELDS };
  const MY_ROW = {
    user_id: ALUMNI.sub, name: 'Ana', email: 'ana@example.com', role: 'alumni',
    alumni_id: 5, has_alumni_profile: true, student_id: null, has_student_profile: false,
    department: 'CSE', graduation_year: 2017, ...FIELDS,
  };
  const BODY = {
    name: 'Ana', department: 'CSE', graduation_year: '2017',
    headline: '  Product designer  ', location: 'Oslo, Norway', degree: 'B.Sc. Product Design',
    start_year: '2013', mentorship_available: true,
  };
  // What validateAlumniFields hands the query for BODY (trimmed text; years stay text).
  const STORED = {
    department: 'CSE', graduation_year: '2017', headline: 'Product designer', location: 'Oslo, Norway',
    degree: 'B.Sc. Product Design', start_year: '2013', mentorship_available: true,
  };

  let alumniQuery: InstanceType<typeof AlumniManager>['alumniQuery'];
  let userQuery: InstanceType<typeof UserManager>['userQuery'];

  beforeEach(async () => {
    const actual = await vi.importActual<typeof import('@alumni/businesslogic')>('@alumni/businesslogic');
    const alumni = new actual.AlumniManager();
    const users = new actual.UserManager();
    alumniQuery = alumni.alumniQuery;
    userQuery = users.userQuery;
    vi.spyOn(alumniQuery, 'findAlumniById').mockResolvedValue(ALUMNI_ROW as never);
    vi.spyOn(alumniQuery, 'findAlumniByUserId').mockResolvedValue(undefined);
    vi.spyOn(alumniQuery, 'createAlumni').mockResolvedValue(ALUMNI_ROW as never);
    vi.spyOn(alumniQuery, 'updateAlumni').mockResolvedValue(ALUMNI_ROW as never);
    vi.spyOn(alumniQuery, 'searchAlumni').mockResolvedValue({ items: [ALUMNI_ROW], total: 1 } as never);
    vi.spyOn(userQuery, 'findMyProfile').mockResolvedValue(MY_ROW as never);
    vi.spyOn(userQuery, 'updateMyProfile').mockResolvedValue(MY_ROW as never);
    // The controllers hold the fake managers; send each call on to the real one.
    for (const name of ['findAlumniById', 'searchAlumni', 'createAlumni', 'updateOwnAlumni'] as const) {
      vi.mocked(AlumniManager.prototype[name]).mockImplementation(
        ((...args: never[]) => (alumni[name] as (...a: never[]) => unknown)(...args)) as never,
      );
    }
    for (const name of ['getMe', 'updateMe'] as const) {
      vi.mocked(UserManager.prototype[name]).mockImplementation(
        ((...args: never[]) => (users[name] as (...a: never[]) => unknown)(...args)) as never,
      );
    }
  });

  describe('AC2: responses carry the five fields, mentorship as a boolean', () => {
    it.each([
      ['GET /api/alumni/5', '/api/alumni/5', (b: Record<string, unknown>) => b],
      ['GET /api/alumni items', '/api/alumni', (b: { items: Record<string, unknown>[] }) => b.items[0]],
      ['GET /api/me', '/api/me', (b: Record<string, unknown>) => b],
    ] as const)('%s', async (_n, path, pick) => {
      const res = await call({ method: 'get', path }, tokenFor(ALUMNI));
      expect(res.status).toBe(200);
      const body = (pick as (b: never) => Record<string, unknown>)(res.body as never);
      expect(body).toMatchObject(FIELDS);
      expect(typeof body.mentorship_available).toBe('boolean');
    });
  });

  describe('AC3: writes pass the validated fields to the query', () => {
    it('PUT /api/me (alumni) → 200 and the alumni update gets the five fields', async () => {
      const res = await call({ method: 'put', path: '/api/me' }, tokenFor(ALUMNI), BODY);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(FIELDS);
      const [userId, , alumniFields, , student] = vi.mocked(userQuery.updateMyProfile).mock.calls[0];
      expect(userId).toBe(ALUMNI.sub);
      expect(alumniFields).toMatchObject(STORED);
      expect(student).toBeUndefined();
    });

    it('PUT /api/me omitting mentorship_available stores false (full replace)', async () => {
      const { mentorship_available: _m, ...rest } = BODY;
      expect((await call({ method: 'put', path: '/api/me' }, tokenFor(ALUMNI), rest)).status).toBe(200);
      expect(vi.mocked(userQuery.updateMyProfile).mock.calls[0][2]?.mentorship_available).toBe(false);
    });

    it('PUT /api/alumni/5 by the owner → 200 with the five fields stored', async () => {
      const res = await call({ method: 'put', path: '/api/alumni/5' }, tokenFor(ALUMNI), BODY);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(FIELDS);
      expect(alumniQuery.updateAlumni).toHaveBeenCalledWith(5, expect.objectContaining(STORED));
    });

    it('POST /api/alumni → 201, with the years as numbers on the DTO', async () => {
      const res = await call({ method: 'post', path: '/api/alumni' }, tokenFor(ALUMNI), { ...BODY, user_id: 999 });
      expect(res.status).toBe(201);
      expect(alumniQuery.createAlumni).toHaveBeenCalledWith(
        expect.objectContaining({ ...STORED, user_id: ALUMNI.sub, graduation_year: 2017, start_year: 2013 }),
      );
    });
  });

  describe('AC3–AC5: bad values → 400 { message } and nothing is written', () => {
    const BAD: Array<[string, Record<string, unknown>, RegExp]> = [
      ['headline over 120', { headline: 'x'.repeat(121) }, /^Headline/],
      ['location over 100', { location: 'x'.repeat(101) }, /^Location/],
      ['degree over 100', { degree: 'x'.repeat(101) }, /^Degree/],
      ['headline not text', { headline: 42 }, /^Headline/],
      ['start year not 4 digits', { start_year: '13' }, /^Start year/],
      ['start after graduation', { start_year: '2018' }, /^Graduation year/],
      ['mentorship as a string', { mentorship_available: 'true' }, /^Mentorship/],
      ['mentorship as a number', { mentorship_available: 1 }, /^Mentorship/],
      ['mentorship null', { mentorship_available: null }, /^Mentorship/],
    ];
    const WRITES: Array<[string, Route, () => unknown]> = [
      ['PUT /api/me', { method: 'put', path: '/api/me' }, () => userQuery.updateMyProfile],
      ['PUT /api/alumni/5', { method: 'put', path: '/api/alumni/5' }, () => alumniQuery.updateAlumni],
      ['POST /api/alumni', { method: 'post', path: '/api/alumni' }, () => alumniQuery.createAlumni],
    ];

    describe.each(WRITES)('%s', (_w, route, write) => {
      it.each(BAD)('%s', async (_b, patch, message) => {
        const res = await call(route, tokenFor(ALUMNI), { ...BODY, ...patch });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(message);
        expect(write()).not.toHaveBeenCalled();
      });
    });
  });

  describe('AC6: only the owner may change the fields on PUT /api/alumni/:id', () => {
    const route: Route = { method: 'put', path: '/api/alumni/5' };

    it.each([
      ['another alumni', { sub: 99, role: 'alumni' }],
      ['a student', STUDENT],
      ['an admin', ADMIN],
    ])('%s → 403, row unchanged', async (_n, user) => {
      const res = await call(route, tokenFor(user), BODY);
      expect(res.status).toBe(403);
      expect(alumniQuery.updateAlumni).not.toHaveBeenCalled();
    });

    it('a guest → 401, row unchanged', async () => {
      expect((await call(route, undefined, BODY)).status).toBe(401);
      expect(alumniQuery.findAlumniById).not.toHaveBeenCalled();
      expect(alumniQuery.updateAlumni).not.toHaveBeenCalled();
    });
  });

  it('PUT /api/me for a student ignores the alumni-only fields, even invalid ones', async () => {
    vi.mocked(userQuery.findMyProfile).mockResolvedValue({
      ...MY_ROW, user_id: STUDENT.sub, role: 'student', alumni_id: null, has_alumni_profile: false,
      student_id: 3, has_student_profile: true,
    } as never);
    const res = await call({ method: 'put', path: '/api/me' }, tokenFor(STUDENT), {
      name: 'Sam', department: 'CSE', expected_graduation_year: '2028',
      headline: 'x'.repeat(500), start_year: 'soon', mentorship_available: 'yes',
    });
    expect(res.status).toBe(200);
    const [, , alumniFields, , student] = vi.mocked(userQuery.updateMyProfile).mock.calls[0];
    expect(alumniFields).toBeUndefined();
    for (const key of Object.keys(FIELDS)) expect(student).not.toHaveProperty(key);
  });
});

describe('BUG-001: POST /api/posts refuses an empty post', () => {
  let postQuery: InstanceType<typeof PostManager>['postQuery'];

  beforeEach(async () => {
    const actual = await vi.importActual<typeof import('@alumni/businesslogic')>('@alumni/businesslogic');
    const posts = new actual.PostManager();
    postQuery = posts.postQuery;
    vi.spyOn(postQuery, 'createPost').mockResolvedValue({ id: 1 } as never);
    // The controller holds the fake manager; send the call on to the real one.
    vi.mocked(PostManager.prototype.createNewPost).mockImplementation(
      (...args) => posts.createNewPost(...args),
    );
  });

  it.each([{}, { caption: '   ' }, { caption: null, media_url: '' }])('%j → 400 and nothing is stored', async (body) => {
    const res = await call({ method: 'post', path: '/api/posts' }, tokenFor(STUDENT), body);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'A post needs a caption or media' });
    expect(postQuery.createPost).not.toHaveBeenCalled();
  });

  it('a caption alone → 201', async () => {
    const res = await call({ method: 'post', path: '/api/posts' }, tokenFor(STUDENT), { caption: 'hi' });
    expect(res.status).toBe(201);
    expect(postQuery.createPost).toHaveBeenCalledTimes(1);
  });
});
