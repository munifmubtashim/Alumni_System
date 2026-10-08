# BUG-001 — Review Packet

`Packet: 59KB · round 2 · 3 files`

## Round 2 — what changed since round 1

| ID | Disposition | Fix |
|---|---|---|
| m1 | fixed | one readText helper: update trims and stores blank as null like create |
| m2 | fixed | caption required on create and on the merged update result → 400 "A post needs a caption"; media-only refused |
| m3, m4 | your call | follow-up / wrap-up |

## Diff with full context (uncommitted vs HEAD)

```diff
diff --git a/packages/backend/src/api/routes/routes.test.ts b/packages/backend/src/api/routes/routes.test.ts
index 65cc03ef..40185633 100644
--- a/packages/backend/src/api/routes/routes.test.ts
+++ b/packages/backend/src/api/routes/routes.test.ts
@@ -1,723 +1,732 @@
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
 
-describe('BUG-001: POST /api/posts refuses an empty post', () => {
+describe('BUG-001: POST /api/posts refuses a post without a caption', () => {
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
 
-  it.each([{}, { caption: '   ' }, { caption: null, media_url: '' }])('%j → 400 and nothing is stored', async (body) => {
+  it.each([{}, { caption: '   ' }, { caption: null, media_url: '' }, { media_url: 'https://x.test/a.png' }])('%j → 400 and nothing is stored', async (body) => {
     const res = await call({ method: 'post', path: '/api/posts' }, tokenFor(STUDENT), body);
     expect(res.status).toBe(400);
-    expect(res.body).toEqual({ message: 'A post needs a caption or media' });
+    expect(res.body).toEqual({ message: 'A post needs a caption' });
     expect(postQuery.createPost).not.toHaveBeenCalled();
   });
 
   it('a caption alone → 201', async () => {
     const res = await call({ method: 'post', path: '/api/posts' }, tokenFor(STUDENT), { caption: 'hi' });
     expect(res.status).toBe(201);
     expect(postQuery.createPost).toHaveBeenCalledTimes(1);
   });
+
+  it('a caption with media → 201', async () => {
+    const res = await call({ method: 'post', path: '/api/posts' }, tokenFor(STUDENT), {
+      caption: 'hi',
+      media_url: 'https://x.test/a.png',
+    });
+    expect(res.status).toBe(201);
+    expect(postQuery.createPost).toHaveBeenCalledTimes(1);
+  });
 });
diff --git a/packages/backend/src/businessLogic/src/PostManager.test.ts b/packages/backend/src/businessLogic/src/PostManager.test.ts
index 77e85e4f..cf99386a 100644
--- a/packages/backend/src/businessLogic/src/PostManager.test.ts
+++ b/packages/backend/src/businessLogic/src/PostManager.test.ts
@@ -1,227 +1,253 @@
 import { beforeEach, describe, expect, it, vi } from 'vitest';
 import { PostManager } from './PostManager';
 import { expectAppError } from '../../test/expectAppError';
 
 // A fake PostQuery: every PostManager gets this same object. The real PostDTO is kept.
 const query = vi.hoisted(() => ({
   findPostById: vi.fn(),
   createPost: vi.fn(),
   updatePost: vi.fn(),
   deletePost: vi.fn(),
   getPostsByUserId: vi.fn(),
 }));
 
 vi.mock('@alumni/dal', async (importOriginal) => ({
   ...(await importOriginal<typeof import('@alumni/dal')>()),
   PostQuery: class {
     constructor() {
       return query;
     }
   },
 }));
 
 const AUTHOR = { id: 7, role: 'alumni' };
 const ADMIN = { id: 1, role: 'admin' };
 const OTHER = { id: 8, role: 'student' };
 const STORED_POST = { id: 42, user_id: 7, caption: 'old', media_url: null, comment_count: 3 };
 
 describe('PostManager', () => {
   let manager: PostManager;
 
   beforeEach(() => {
     Object.values(query).forEach((fn) => fn.mockReset());
     query.findPostById.mockResolvedValue({ ...STORED_POST });
     query.updatePost.mockImplementation(async (id, patch) => ({ ...STORED_POST, ...patch, id }));
     manager = new PostManager();
   });
 
   describe('createNewPost', () => {
     it('makes the signed-in user the author and ignores body.user_id', async () => {
       query.createPost.mockImplementation(async (post) => post);
 
       await manager.createNewPost(7, { user_id: 99, caption: 'hello', media_url: 'https://x.test/a.png' });
 
       const stored = query.createPost.mock.calls[0]![0];
       expect(stored.user_id).toBe(7);
       expect(stored.caption).toBe('hello');
       expect(stored.media_url).toBe('https://x.test/a.png');
       expect(stored.comment_count).toBe(0);
     });
 
     // BUG-001: create validates like update, then trims; blank becomes null.
     it('trims caption and media, and stores a blank one as null', async () => {
       query.createPost.mockImplementation(async (post) => post);
 
       await manager.createNewPost(7, { caption: '  hello  ', media_url: '   ' });
 
       const stored = query.createPost.mock.calls[0]![0];
       expect(stored.caption).toBe('hello');
       expect(stored.media_url).toBeNull();
     });
 
-    it('stores a post with media and no caption, caption as null', async () => {
+    it('stores a caption with media, both trimmed', async () => {
       query.createPost.mockImplementation(async (post) => post);
 
-      await manager.createNewPost(7, { caption: null, media_url: ' https://x.test/a.png ' });
+      await manager.createNewPost(7, { caption: ' hi ', media_url: ' https://x.test/a.png ' });
 
       const stored = query.createPost.mock.calls[0]![0];
-      expect(stored.caption).toBeNull();
+      expect(stored.caption).toBe('hi');
       expect(stored.media_url).toBe('https://x.test/a.png');
     });
 
+    it('stores a caption alone, media as null', async () => {
+      query.createPost.mockImplementation(async (post) => post);
+
+      await manager.createNewPost(7, { caption: 'hi' });
+
+      const stored = query.createPost.mock.calls[0]![0];
+      expect(stored.media_url).toBeNull();
+    });
+
     it.each([
       ['caption', 5, 'Caption must be text or null'],
       ['caption', { a: 1 }, 'Caption must be text or null'],
       ['caption', true, 'Caption must be text or null'],
       ['media_url', 0, 'Media URL must be text or null'],
       ['media_url', ['x'], 'Media URL must be text or null'],
     ])('returns 400 when %s is %j', async (key, value, message) => {
       const error = await expectAppError(manager.createNewPost(7, { caption: 'ok', [key]: value }), 400);
       expect(error.message).toBe(message);
       expect(query.createPost).not.toHaveBeenCalled();
     });
 
-    it.each([{}, { caption: null }, { caption: '' }, { caption: '   ', media_url: ' ' }, { caption: null, media_url: null }])(
-      'returns 400 "A post needs a caption or media" for %j',
+    // BUG-001 review: no screen shows media yet, so every post needs a caption.
+    it.each([
+      {},
+      { caption: null },
+      { caption: '' },
+      { caption: '   ', media_url: ' ' },
+      { caption: null, media_url: null },
+      { media_url: 'x' },
+      { caption: '  ', media_url: 'https://x.test/a.png' },
+    ])(
+      'returns 400 "A post needs a caption" for %j',
       async (body) => {
         const error = await expectAppError(manager.createNewPost(7, body), 400);
-        expect(error.message).toBe('A post needs a caption or media');
+        expect(error.message).toBe('A post needs a caption');
         expect(query.createPost).not.toHaveBeenCalled();
       },
     );
   });
 
   describe('updatePost', () => {
     it('lets the author edit their post', async () => {
       const updated = await manager.updatePost(AUTHOR, '42', { caption: 'new', media_url: 'https://x.test/b.png' });
 
       expect(query.findPostById).toHaveBeenCalledWith(42);
       expect(query.updatePost).toHaveBeenCalledWith(42, { caption: 'new', media_url: 'https://x.test/b.png' });
       expect(updated).toMatchObject({ id: 42, user_id: 7, caption: 'new' });
     });
 
     it("lets an admin edit someone else's post without changing its author", async () => {
       await manager.updatePost(ADMIN, 42, { caption: 'moderated', user_id: 1 });
 
       expect(query.updatePost).toHaveBeenCalledWith(42, { caption: 'moderated' });
     });
 
     // AC14: only the fields sent change.
     it('keeps an omitted field: sends only the keys present', async () => {
       await manager.updatePost(AUTHOR, 42, { media_url: 'https://x.test/c.png' });
       expect(query.updatePost).toHaveBeenCalledWith(42, { media_url: 'https://x.test/c.png' });
     });
 
     it('clears a field sent as null', async () => {
       query.findPostById.mockResolvedValue({ ...STORED_POST, media_url: 'https://x.test/a.png' });
-      await manager.updatePost(AUTHOR, 42, { caption: null });
-      expect(query.updatePost).toHaveBeenCalledWith(42, { caption: null });
+      await manager.updatePost(AUTHOR, 42, { media_url: null });
+      expect(query.updatePost).toHaveBeenCalledWith(42, { media_url: null });
     });
 
-    // BUG-001: the patch merged onto the stored row must keep a caption or media.
-    it.each([{ caption: null }, { caption: '  ' }, { caption: '', media_url: null }])(
-      'returns 400 "A post needs a caption or media" when %j leaves neither',
+    // BUG-001: the patch merged onto the stored row must keep a caption, media or not.
+    it.each([{ caption: null }, { caption: '  ' }, { caption: '', media_url: null }, { caption: null, media_url: 'x' }])(
+      'returns 400 "A post needs a caption" when %j leaves none',
       async (body) => {
+        query.findPostById.mockResolvedValue({ ...STORED_POST, media_url: 'https://x.test/a.png' });
         const error = await expectAppError(manager.updatePost(AUTHOR, 42, body), 400);
-        expect(error.message).toBe('A post needs a caption or media');
+        expect(error.message).toBe('A post needs a caption');
         expect(query.updatePost).not.toHaveBeenCalled();
       },
     );
 
-    it('stores text as sent (no trimming)', async () => {
-      await manager.updatePost(AUTHOR, 42, { caption: '  hi  ', media_url: '' });
-      expect(query.updatePost).toHaveBeenCalledWith(42, { caption: '  hi  ', media_url: '' });
+    it('refuses a media-only edit of an old post that has no caption', async () => {
+      query.findPostById.mockResolvedValue({ ...STORED_POST, caption: null });
+      const error = await expectAppError(manager.updatePost(AUTHOR, 42, { media_url: 'x' }), 400);
+      expect(error.message).toBe('A post needs a caption');
+    });
+
+    // BUG-001 review (m1): update normalizes text exactly like create.
+    it('trims text and stores a blank one as null, like create', async () => {
+      await manager.updatePost(AUTHOR, 42, { caption: '  hi  ', media_url: '   ' });
+      expect(query.updatePost).toHaveBeenCalledWith(42, { caption: 'hi', media_url: null });
     });
 
     it.each([
       ['caption', 5],
       ['caption', { a: 1 }],
       ['caption', true],
       ['media_url', 0],
       ['media_url', ['x']],
       ['media_url', false],
     ])('returns 400 when %s is %j', async (key, value) => {
       await expectAppError(manager.updatePost(AUTHOR, 42, { [key]: value }), 400);
       expect(query.updatePost).not.toHaveBeenCalled();
     });
 
     it.each([{}, { user_id: 1 }])('returns 400 "Nothing to update" for %j', async (body) => {
       const error = await expectAppError(manager.updatePost(AUTHOR, 42, body), 400);
       expect(error.message).toBe('Nothing to update');
       expect(query.updatePost).not.toHaveBeenCalled();
     });
 
     it('checks 404 before validating the body', async () => {
       query.findPostById.mockResolvedValue(undefined);
       await expectAppError(manager.updatePost(AUTHOR, 999, { caption: 5 }), 404);
     });
 
     it('checks 403 before validating the body', async () => {
       await expectAppError(manager.updatePost(OTHER, 42, {}), 403);
       await expectAppError(manager.updatePost(OTHER, 42, { caption: 5 }), 403);
     });
 
     it('returns 403 for another user and does not update', async () => {
       await expectAppError(manager.updatePost(OTHER, 42, { caption: 'hijack' }), 403);
       expect(query.updatePost).not.toHaveBeenCalled();
     });
 
     it('returns 404 for a missing post', async () => {
       query.findPostById.mockResolvedValue(undefined);
 
       await expectAppError(manager.updatePost(AUTHOR, 999, { caption: 'x' }), 404);
       expect(query.updatePost).not.toHaveBeenCalled();
     });
 
     // requireId treats a malformed id as "not found" (404), same as comments.
     it.each(['abc', '0', '-1', '1.5', undefined])('rejects bad id %s without a lookup', async (id) => {
       await expectAppError(manager.updatePost(AUTHOR, id, { caption: 'x' }), 404);
       expect(query.findPostById).not.toHaveBeenCalled();
       expect(query.updatePost).not.toHaveBeenCalled();
     });
   });
 
   describe('deletePost', () => {
     it('lets the author delete their post', async () => {
       await manager.deletePost(AUTHOR, '42');
       expect(query.deletePost).toHaveBeenCalledWith(42);
     });
 
     it("lets an admin delete someone else's post", async () => {
       await manager.deletePost(ADMIN, 42);
       expect(query.deletePost).toHaveBeenCalledWith(42);
     });
 
     it('returns 403 for another user and does not delete', async () => {
       await expectAppError(manager.deletePost(OTHER, 42), 403);
       expect(query.deletePost).not.toHaveBeenCalled();
     });
 
     it('returns 404 for a missing post', async () => {
       query.findPostById.mockResolvedValue(undefined);
 
       await expectAppError(manager.deletePost(AUTHOR, 999), 404);
       expect(query.deletePost).not.toHaveBeenCalled();
     });
 
     it('rejects a bad id without a lookup', async () => {
       await expectAppError(manager.deletePost(AUTHOR, 'abc'), 404);
       expect(query.findPostById).not.toHaveBeenCalled();
       expect(query.deletePost).not.toHaveBeenCalled();
     });
   });
 
   describe('getPostsByUserId', () => {
     it('passes a plain numeric id to the query', async () => {
       query.getPostsByUserId.mockResolvedValue([]);
 
       await expect(manager.getPostsByUserId('7')).resolves.toEqual([]);
       expect(query.getPostsByUserId).toHaveBeenCalledWith(7);
     });
 
     it('rejects a bad id', async () => {
       await expectAppError(manager.getPostsByUserId('abc'), 404);
       expect(query.getPostsByUserId).not.toHaveBeenCalled();
     });
   });
 });
diff --git a/packages/backend/src/businessLogic/src/PostManager.ts b/packages/backend/src/businessLogic/src/PostManager.ts
index 0657b5f9..0b130bea 100644
--- a/packages/backend/src/businessLogic/src/PostManager.ts
+++ b/packages/backend/src/businessLogic/src/PostManager.ts
@@ -1,92 +1,87 @@
 import { PostDTO, PostQuery } from "@alumni/dal";
 import { AppError } from "./errors.js";
 import { requireId } from "./validation.js";
 
 type Requester = { id: number; role: string };
 
 export class PostManager {
   postQuery: PostQuery;
 
   constructor() {
     this.postQuery = new PostQuery();
   }
 
   // The author is always the authenticated user; a user_id in the body is never read.
   // Caption and media are text or null (400 otherwise), trimmed, blank stored as null.
-  // A post needs one of them (BUG-001: an empty post crashed the feed).
+  // A post needs a caption (BUG-001: an empty post crashed the feed). Media stays
+  // optional, but no screen shows media yet, so a media-only post would look empty.
   public async createNewPost(userId: number, body: Record<string, unknown>) {
-    const caption = blankToNull(readText(body, "caption"));
-    const mediaUrl = blankToNull(readText(body, "media_url"));
-    requireContent(caption, mediaUrl);
+    const caption = readText(body, "caption") ?? null;
+    const mediaUrl = readText(body, "media_url") ?? null;
+    requireCaption(caption);
     const post = new PostDTO(userId, 0, caption, mediaUrl);
     return this.postQuery.createPost(post);
   }
 
   // Only the post's author or an admin may edit it. The author stays the same.
   // Ownership is checked before the body, so a non-owner never sees validation errors.
-  // Only the fields sent change (AC14): omitted keeps, null clears, text is stored as sent.
-  // The edit may not leave the post with neither caption nor media.
+  // Only the fields sent change (AC14): omitted keeps, null clears. Text is normalized
+  // like create (trimmed, blank as null). The edit may not leave the post without a caption.
   public async updatePost(requester: Requester, postId: unknown, body: Record<string, unknown>) {
     const existing = await this.findOwnedPost(requester, postId);
     const patch: { caption?: string | null; media_url?: string | null } = {};
     for (const key of ["caption", "media_url"] as const) {
       const value = readText(body, key);
       if (value !== undefined) patch[key] = value;
     }
     if (Object.keys(patch).length === 0) throw new AppError(400, "Nothing to update");
     const merged = { ...existing, ...patch };
-    requireContent(merged.caption, merged.media_url);
+    requireCaption(merged.caption);
     return this.postQuery.updatePost(existing.id, patch);
   }
 
   // Only the post's author or an admin may delete it.
   public async deletePost(requester: Requester, postId: unknown) {
     const existing = await this.findOwnedPost(requester, postId);
     await this.postQuery.deletePost(existing.id);
   }
 
   public async getAllPosts(limit?: number, offset?: number) {
     return this.postQuery.getAllPosts(limit, offset);
   }
 
   public async getPostsByUserId(userId: unknown) {
     return this.postQuery.getPostsByUserId(requireId(userId, "User"));
   }
 
   public async updateCommentCount(post: PostDTO) {
     return this.postQuery.updateCommentCount(post.id, post.comment_count);
   }
 
   private async findOwnedPost(requester: Requester, postId: unknown): Promise<PostDTO> {
     const id = requireId(postId, "Post");
     const post = await this.postQuery.findPostById(id);
     if (!post) throw new AppError(404, "Post not found");
     if (post.user_id !== requester.id && requester.role !== "admin") {
       throw new AppError(403, "You can only change your own posts");
     }
     return post;
   }
 }
 
-// undefined when the key is absent; text or null when sent; anything else is a 400.
+// undefined when the key is absent; otherwise the text trimmed, with blank or null as null.
+// Anything that is not text or null is a 400. Create and update both read through this.
 function readText(body: Record<string, unknown>, key: "caption" | "media_url"): string | null | undefined {
   if (!Object.prototype.hasOwnProperty.call(body, key)) return undefined;
   const value = body[key];
   if (value !== null && typeof value !== "string") {
     throw new AppError(400, `${key === "caption" ? "Caption" : "Media URL"} must be text or null`);
   }
-  return value;
-}
-
-function blankToNull(value: string | null | undefined): string | null {
   const trimmed = value?.trim();
   return trimmed ? trimmed : null;
 }
 
-function hasText(value: string | null | undefined): boolean {
-  return typeof value === "string" && value.trim() !== "";
-}
-
-function requireContent(caption: string | null | undefined, mediaUrl: string | null | undefined) {
-  if (!hasText(caption) && !hasText(mediaUrl)) throw new AppError(400, "A post needs a caption or media");
+// A stored row may predate the trim, so whitespace-only counts as no caption.
+function requireCaption(caption: string | null | undefined) {
+  if (typeof caption !== "string" || caption.trim() === "") throw new AppError(400, "A post needs a caption");
 }
```

## Bug report

# BUG-001 — /feed crashes for every viewer when a post has no caption

| Field | Value |
|---|---|
| Status | verifying |
| Severity | major |
| Repo | alumni-system |
| Touched repos | alumni-system |
| Reported | 2026-10-08 |
| Reporter | munifmubtashim (found by the REQ-015 UI re-review, UI-003) |
| Related REQ | REQ-015 (follow-up n1), REQ-009 (feed) |

## Symptom

If any post in the feed has a null caption, `/feed` shows the route error page instead of the feed, for every signed-in user. One bad row takes the whole page down.

## Reproduction

1. Run the API and Vite (`npm run dev`), sign in as any seed user.
2. Create a post with no caption, e.g. `POST /api/posts` with body `{ "media_url": "x" }` or `{}` (the API answers 201), or `UPDATE posts SET caption = NULL WHERE id = <id>` in the dev DB.
3. Open `/feed`.

**Expected:** the feed renders; the caption-less post shows without a text paragraph (or the API refuses an empty post with a 400).

**Actual:** the route error page; console shows `TypeError: Cannot read properties of null (reading 'trim')` at `packages/frontend/src/features/feed/PostCard.tsx:155`.

## Environment

| Field | Value |
|---|---|
| Branch / commit | redesign @ cee4f3ae |
| OS / browser / runtime | any browser; seen in headless Brave (Chromium) |
| Reproduction rate | always (whenever a null-caption post is on the loaded page) |

## Investigation log

Append-only. Each entry dated.

### 2026-10-08 — initial triage

`PostCard.tsx:154-155` guards with `post.caption !== undefined && post.caption.trim() !== ''`. The DB returns SQL `NULL` as JSON `null`, which passes `!== undefined`, so `.trim()` throws during render. The shared type says `caption?: string` (never null), so TypeScript allowed the incomplete guard. Root cause and the API side to be confirmed in Phase 2.

### 2026-10-08 — root cause

- **Crash:** `packages/frontend/src/features/feed/PostCard.tsx:154-155` guards with `post.caption !== undefined`. `posts.caption` is a nullable `text` column, so the API sends JSON `null`, which passes that check, and `.trim()` throws during render. The route error boundary then replaces the whole feed.
- **Why TypeScript allowed it:** `packages/shared/src/types/post.types.ts:4` declares `caption?: string` (never `null`), so the guard looked complete.
- **How the row gets in:** `PostManager.createNewPost` (`businessLogic/src/PostManager.ts:16-18`) casts `body.caption` without validating it, so `POST /api/posts` with no caption (or a non-string) is stored and answers 201. `updatePost` already accepts `{ caption: null }` (by design, test `PostManager.test.ts:73-76`), so a post can also become caption-less through an edit.
- **Other reads are safe:** feed `PostCard.tsx:141` (edit initial value, `??`), profile `features/profile/PostCard.tsx:27` (`present()`), optimistic cache edits (store, don't read).

### 2026-10-08 — fix verified

- Regression tests: feed `PostCard.test.tsx` (caption null / missing / '' / '   ') and `FeedPage.test.tsx` (one null-caption post among normal ones). With the old guard restored by hand, both failed with `TypeError: Cannot read properties of null (reading 'trim')`; with the fix they pass. File restored byte-for-byte (`cmp`).
- Original repro: `POST /api/posts {}` on the running API → 400 "A post needs a caption or media". A null-caption row inserted directly in the dev DB → `/feed` rendered all 11 posts in headless Brave, no error page; row deleted afterwards (0 null captions left).
- Suites: backend 621, frontend 1555; typecheck, lint, format clean.
- Note: create trims caption/media; update still stores text as sent (unchanged behaviour). Possible follow-up.

## Fix approach

- **Frontend:** in the feed `PostCard`, render the caption through the shared `present()` helper (`config/text.ts`, already null-safe and used by the profile card). No paragraph for null, missing, empty or whitespace-only captions. Change the shared type to `caption?: string | null`, so TypeScript flags any future unguarded read.
- **Backend:** `createNewPost` validates `caption` and `media_url` the way `updatePost` already does (text or null, trimmed, blank → null). It refuses a post with neither caption nor media: 400 "A post needs a caption or media". `updatePost` refuses an edit that would leave the post with neither, with the same 400. This closes the hole the UI re-review fell into.
- **Regression tests:** a feed `PostCard` test rendering `caption: null`, `undefined`, `''` and `'   '` (null fails before the fix). A feed page test where one null-caption post sits among normal posts and the feed still renders. `PostManager` tests for the create validation and the 400. Routes test: `POST /api/posts` with `{}` → 400.

## Acceptance

- [x] A post with a null, missing, empty or whitespace-only caption renders in the feed without a text paragraph; the rest of the feed renders
- [x] Regression test that fails before the fix (null caption crashes PostCard) and passes after
- [x] Other caption reads checked: profile "Recent posts" PostCard, feed edit form initial value, optimistic create
- [x] Decide and test whether `POST /api/posts` / `PUT /api/posts/:id` should refuse a post with neither caption nor media (400)

## Lessons / gotchas captured

_(Phase 5)_ — candidate: nullable DB columns must be `| null` in shared types — see [[knowledge/lessons/LESSON-REQ-015-4-optional-in-type-means-null-safe|L-REQ-015-4]].

## Related

- Gotchas: [[knowledge/gotchas#^g34|G34]] (feed test traps)
- Lessons: [[knowledge/lessons/LESSON-REQ-015-4-optional-in-type-means-null-safe|L-REQ-015-4]]
- Concepts: [[concepts/optimistic-cache-edits]]
- Components: [[knowledge/components/frontend]]


## Investigation

# BUG-001 Investigation

| Field | Value |
|---|---|
| Status | investigation complete |
| Reported | 2026-10-08 |
| Investigator | codebase-explorer |

## Root cause: type contract vs. database nullability

The shared type `post.types.ts:4` declares `caption?: string` (TypeScript: `string | undefined`), but the database schema stores caption as `text` (nullable). When a row has `caption = NULL`, the JSON response is `null`, which passes the guard `post.caption !== undefined` (since `null !== undefined`), then `.trim()` crashes.

## Code paths for caption reads (frontend → backend → DB)

### Frontend reads of caption

**UNSAFE reads (unguarded or incomplete guards):**
- `packages/frontend/src/features/feed/PostCard.tsx:154–155` — **THE BUG** — guard `post.caption !== undefined && post.caption.trim() !== ''` fails on `null`

**SAFE reads:**
- `packages/frontend/src/features/feed/PostCard.tsx:141` — `initial={post.caption ?? ''}` (nullish coalesce)
- `packages/frontend/src/features/profile/PostCard.tsx:27` — `const caption = present(post.caption)` (helper)
- `packages/frontend/src/config/text.ts` — `present()` uses optional chaining: `value?.trim()` (handles `null`)
- `packages/frontend/src/features/feed/useFeedMutations.ts:181,190,197` — cache edits read caption for storage/comparison only, no display or method calls

### Backend caption rules

**Create (`POST /api/posts`):**
- `PostController.ts:10` → `PostManager.createNewPost(userId, body)` → accepts `body.caption as string | undefined` (no type check or trim)
- `PostQuery.ts:17–28` → SQL `INSERT ... caption` accepts undefined (becomes NULL in DB)
- No validation: captions can be null, empty string, or any text

**Update (`PUT /api/posts/:id`):**
- `PostController.ts:39–48` → `PostManager.updatePost(requester, postId, body)` → checks type only (lines 30–32: must be text or null, or 400)
- `PostQuery.ts:65–81` → SQL `UPDATE posts SET caption=…` (partial update: omitted field keeps old value)
- Example test: `PostManager.test.ts:73–76` shows `{ caption: null }` is accepted and stored

**Database schema:**
- `db/backups/pre_bolt20_20261003_220745.sql` — `caption text,` (no NOT NULL, so nullable)

### API response shape

`packages/shared/src/types/post.types.ts:4` — `caption?: string` (TypeScript treats as `string | undefined`, not `string | null`)

`packages/frontend/src/services/postsApi.ts:24–28` — `listPosts()` types response as `Post[]` per the shared type

## Existing tests

**Frontend:**
- `features/feed/PostCard.test.tsx` — 11 tests, none for null/empty caption
- `features/feed/testKit.ts` — `makePost()` helper always sets `caption: Post ${id}`
- No existing test fails on null caption

**Backend:**
- `businessLogic/src/PostManager.test.ts:73–76` — one test explicitly accepts `{ caption: null }` on update
- `dal/query/PostQuery.test.ts` — not read (QueryDTO tests usually mock the DB)

## Vault knowledge

- **L-REQ-015-4** ("optional in type means null-safe") — already captured; names this exact trap
- **G34** (feed test traps) — lists test setup issues, doesn't cover null caption fixtures
- **Conventions (CLAUDE.md)** — No explicit rule on "if backend can store NULL, shared type must allow it"

## Decisions needed (Phase 2+)

1. **Type contract fix:** Should `caption?: string` change to `caption?: string | null` in shared types?
2. **API contract:** Should `POST /api/posts` refuse a post with neither caption nor media (400)?
3. **Trim on create:** Should `PostManager.createNewPost` trim caption (like `useFeedMutations.ts:132` does on the client)?
