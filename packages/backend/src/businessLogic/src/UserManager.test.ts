import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserQuery } from '@alumni/dal';
import { UserManager } from './UserManager.js';
import { expectAppError } from '../../test/expectAppError';

vi.mock('@alumni/dal');

const validBody = { name: 'Ada Admin', email: 'ada@example.com', password: 'longenough', role: 'admin' };

describe('UserManager.validateNewUser (POST /api/users)', () => {
  const manager = new UserManager();

  it.each(['admin', 'alumni', 'student'])('accepts role %s', (role) => {
    expect(manager.validateNewUser({ ...validBody, role })).toEqual({ ...validBody, role });
  });

  it.each([
    ['missing role', { ...validBody, role: undefined }],
    ['unknown role', { ...validBody, role: 'superuser' }],
    ['missing name', { ...validBody, name: '  ' }],
    ['name too long', { ...validBody, name: 'x'.repeat(101) }],
    ['bad email', { ...validBody, email: 'not-an-email' }],
    ['short password', { ...validBody, password: 'short' }],
    ['non-string password', { ...validBody, password: 12345678 }],
  ])('rejects %s with 400', async (_label, body) => {
    await expectAppError(() => manager.validateNewUser(body), 400);
  });
});

describe('UserManager.createUser', () => {
  let manager: UserManager;

  beforeEach(() => {
    manager = new UserManager();
  });

  it('hashes the password itself and never stores the plain text', async () => {
    const createUser = vi.mocked(UserQuery.prototype.createUser);
    createUser.mockResolvedValue({ id: 1, name: 'Ada Admin', email: 'ada@example.com', role: 'admin', created_at: new Date() });

    await manager.createUser({ name: 'Ada Admin', email: 'ada@example.com', password: 'longenough', role: 'admin' });

    const stored = createUser.mock.calls[0][0];
    expect(stored).toMatchObject({ name: 'Ada Admin', email: 'ada@example.com', role: 'admin' });
    expect(stored.password).not.toBe('longenough');
    expect(await bcrypt.compare('longenough', stored.password)).toBe(true);
  });

  it('turns a duplicate email into 409', async () => {
    vi.mocked(UserQuery.prototype.createUser).mockRejectedValue(Object.assign(new Error('dup'), { code: '23505' }));

    await expectAppError(
      manager.createUser({ name: 'A', email: 'a@x.io', password: 'longenough', role: 'student' }),
      409,
    );
  });
});

describe('UserManager.createAlumniAccount (POST /api/admin/alumni)', () => {
  const createAlumniUser = () => vi.mocked(UserQuery.prototype.createAlumniUser);
  const profile = { department: 'CS', graduation_year: '2015' };

  it('hashes the password with 10 bcrypt rounds and passes the profile through', async () => {
    createAlumniUser().mockResolvedValue({ id: 2, name: 'Al', email: 'al@x.io', role: 'alumni', created_at: new Date() });

    const created = await new UserManager().createAlumniAccount({ name: 'Al', email: 'al@x.io', password: 'longenough' }, profile);

    const [stored, storedProfile] = createAlumniUser().mock.calls[0];
    expect(stored).toMatchObject({ name: 'Al', email: 'al@x.io' });
    expect(stored.password).not.toBe('longenough');
    expect(await bcrypt.compare('longenough', stored.password)).toBe(true);
    expect(bcrypt.getRounds(stored.password)).toBe(10);
    expect(storedProfile).toEqual(profile);
    expect(created.id).toBe(2);
  });

  it('turns a taken email into 409', async () => {
    createAlumniUser().mockRejectedValue(Object.assign(new Error('dup'), { code: '23505' }));

    const error = await expectAppError(
      new UserManager().createAlumniAccount({ name: 'Al', email: 'al@x.io', password: 'longenough' }, profile),
      409,
    );
    expect(error.message).toBe('An account with this email already exists');
  });

  it('passes other database errors through', async () => {
    createAlumniUser().mockRejectedValue(new Error('down'));

    await expect(
      new UserManager().createAlumniAccount({ name: 'Al', email: 'al@x.io', password: 'longenough' }, profile),
    ).rejects.toThrow('down');
  });
});

describe('UserManager.register', () => {
  it('hashes the password before creating the account', async () => {
    const createAlumniUser = vi.mocked(UserQuery.prototype.createAlumniUser);
    createAlumniUser.mockResolvedValue({ id: 2, name: 'Al', email: 'al@x.io', role: 'alumni', created_at: new Date() });

    await new UserManager().register({ role: 'alumni', name: 'Al', email: 'al@x.io', password: 'longenough', university: 'U' });

    const stored = createAlumniUser.mock.calls[0][0];
    expect(stored.password).not.toBe('longenough');
    expect(await bcrypt.compare('longenough', stored.password)).toBe(true);
  });
});

describe('UserManager.findUserById / deleteUser (GET, DELETE /api/users/:id)', () => {
  let manager: UserManager;

  beforeEach(() => {
    manager = new UserManager();
  });

  it('findUserById returns the row for a known id', async () => {
    const row = { id: 7, name: 'Sam', email: 's@x.io', role: 'student', created_at: new Date() };
    vi.mocked(UserQuery.prototype.findUserById).mockResolvedValue(row);
    await expect(manager.findUserById('7')).resolves.toBe(row);
    expect(UserQuery.prototype.findUserById).toHaveBeenCalledWith(7);
  });

  it('findUserById: unknown id → 404', async () => {
    vi.mocked(UserQuery.prototype.findUserById).mockResolvedValue(undefined);
    const error = await expectAppError(manager.findUserById('999'), 404);
    expect(error.message).toBe('User not found');
  });

  it('deleteUser: deleted → resolves', async () => {
    vi.mocked(UserQuery.prototype.deleteUser).mockResolvedValue(true);
    await expect(manager.deleteUser('7')).resolves.toBeUndefined();
    expect(UserQuery.prototype.deleteUser).toHaveBeenCalledWith(7);
  });

  it('deleteUser: unknown id → 404', async () => {
    vi.mocked(UserQuery.prototype.deleteUser).mockResolvedValue(false);
    const error = await expectAppError(manager.deleteUser('999'), 404);
    expect(error.message).toBe('User not found');
  });

  it('deleteUser: user still referenced by posts/comments (FK 23503) → 409', async () => {
    vi.mocked(UserQuery.prototype.deleteUser).mockRejectedValue(Object.assign(new Error('fk'), { code: '23503' }));
    const error = await expectAppError(manager.deleteUser('7'), 409);
    expect(error.message).toBe('This user still has posts or comments');
  });

  it('deleteUser: other database errors pass through unchanged', async () => {
    const boom = new Error('connection lost');
    vi.mocked(UserQuery.prototype.deleteUser).mockRejectedValue(boom);
    await expect(manager.deleteUser('7')).rejects.toBe(boom);
  });

  // requireId answers 404 (not 400) for a malformed id, same as PUT /api/users/:id.
  // 2147483648 is one past the Postgres integer max: treated as malformed, not sent to the DB.
  it.each(['abc', '1.5', '0', '-3', undefined, '2147483648', '99999999999'])('malformed id %s → 404 without touching the DB', async (id) => {
    await expectAppError(manager.findUserById(id), 404);
    await expectAppError(manager.deleteUser(id), 404);
    expect(UserQuery.prototype.findUserById).not.toHaveBeenCalled();
    expect(UserQuery.prototype.deleteUser).not.toHaveBeenCalled();
  });

  // 2147483647 is the Postgres integer max itself: still a valid id, so it reaches the query.
  it('the largest valid id 2147483647 reaches the DB', async () => {
    vi.mocked(UserQuery.prototype.findUserById).mockResolvedValue(undefined);
    vi.mocked(UserQuery.prototype.deleteUser).mockResolvedValue(true);
    await expectAppError(manager.findUserById('2147483647'), 404);
    await expect(manager.deleteUser('2147483647')).resolves.toBeUndefined();
    expect(UserQuery.prototype.findUserById).toHaveBeenCalledWith(2147483647);
    expect(UserQuery.prototype.deleteUser).toHaveBeenCalledWith(2147483647);
  });
});

describe('UserManager.updateOwnUser (PUT /api/users/:id): owner only', () => {
  let manager: UserManager;
  const body = { name: 'Sam Student', university: 'Example U', role: 'admin', email: 'x@y.io' };

  beforeEach(() => {
    manager = new UserManager();
    vi.mocked(UserQuery.prototype.updateMyProfile).mockResolvedValue({ id: 7, name: 'Sam Student' } as never);
  });

  it('owner → updates name/photo/university only', async () => {
    await expect(manager.updateOwnUser(7, '7', body)).resolves.toMatchObject({ id: 7 });
    // Two args only: no alumni/student fields, no email; role and email in the body are ignored.
    expect(UserQuery.prototype.updateMyProfile).toHaveBeenCalledWith(7, {
      name: 'Sam Student',
      photo_url: undefined,
      university: 'Example U',
    });
  });

  it('another user → 403 without touching the DB', async () => {
    await expectAppError(manager.updateOwnUser(8, '7', body), 403);
    expect(UserQuery.prototype.updateMyProfile).not.toHaveBeenCalled();
  });

  // The manager gets only the requester's id, not their role, so an admin is just another user here.
  it('an admin editing someone else → 403 too', async () => {
    await expectAppError(manager.updateOwnUser(1, '7', body), 403);
    expect(UserQuery.prototype.updateMyProfile).not.toHaveBeenCalled();
  });

  it('owner, but the row is gone → 404', async () => {
    vi.mocked(UserQuery.prototype.updateMyProfile).mockResolvedValue(undefined as never);
    await expectAppError(manager.updateOwnUser(7, '7', body), 404);
  });

  it.each(['abc', '0', undefined])('malformed id %s → 404 without touching the DB', async (id) => {
    await expectAppError(manager.updateOwnUser(7, id, body), 404);
    expect(UserQuery.prototype.updateMyProfile).not.toHaveBeenCalled();
  });

  it('owner with a bad body → 400 without touching the DB', async () => {
    await expectAppError(manager.updateOwnUser(7, '7', { name: '  ' }), 400);
    expect(UserQuery.prototype.updateMyProfile).not.toHaveBeenCalled();
  });
});

describe('UserManager.verifyLogin (POST /api/auth/login)', () => {
  const manager = new UserManager();
  const findUserByEmail = vi.mocked(UserQuery.prototype.findUserByEmail);

  beforeEach(async () => {
    findUserByEmail.mockResolvedValue({
      id: 7,
      email: 'sam@example.com',
      role: 'student',
      password: await bcrypt.hash('correct horse', 4),
    } as never);
  });

  it('right password → the user without the password hash', async () => {
    const user = await manager.verifyLogin('sam@example.com', 'correct horse');
    expect(user).toMatchObject({ id: 7, role: 'student' });
    expect(user).not.toHaveProperty('password');
    expect(findUserByEmail).toHaveBeenCalledWith('sam@example.com');
  });

  it('wrong password → null', async () => {
    await expect(manager.verifyLogin('sam@example.com', 'wrong horse')).resolves.toBeNull();
  });

  it('unknown email → null', async () => {
    findUserByEmail.mockResolvedValue(undefined);
    await expect(manager.verifyLogin('nobody@example.com', 'correct horse')).resolves.toBeNull();
  });
});

describe('UserManager.updateMe (PUT /api/me): REQ-011 alumni fields', () => {
  const findMyProfile = vi.mocked(UserQuery.prototype.findMyProfile);
  const updateMyProfile = vi.mocked(UserQuery.prototype.updateMyProfile);
  const extra = {
    headline: ' Designer ',
    location: 'Oslo',
    degree: 'B.Sc.',
    start_year: '2013',
    graduation_year: '2017',
    mentorship_available: true,
  };

  beforeEach(() => {
    updateMyProfile.mockResolvedValue({ user_id: 7 } as never);
  });

  it('alumni user → the five fields reach the query, trimmed', async () => {
    findMyProfile.mockResolvedValue({ user_id: 7, email: 'a@x.io', has_alumni_profile: true, has_student_profile: false } as never);

    await new UserManager().updateMe(7, { name: 'Al', ...extra });

    const alumni = updateMyProfile.mock.calls[0][2];
    expect(alumni).toMatchObject({ ...extra, headline: 'Designer' });
  });

  it('alumni user with start year after graduation → 400, query not called', async () => {
    findMyProfile.mockResolvedValue({ user_id: 7, email: 'a@x.io', has_alumni_profile: true, has_student_profile: false } as never);

    await expectAppError(new UserManager().updateMe(7, { name: 'Al', start_year: '2018', graduation_year: '2017' }), 400);
    expect(updateMyProfile).not.toHaveBeenCalled();
  });

  it('student → junk alumni-only fields are ignored, not validated or passed on', async () => {
    findMyProfile.mockResolvedValue({ user_id: 7, email: 's@x.io', has_alumni_profile: false, has_student_profile: true } as never);
    const year = String(new Date().getFullYear() + 1);

    await new UserManager().updateMe(7, {
      name: 'Sam',
      department: 'CSE',
      expected_graduation_year: year,
      headline: 'x'.repeat(500),
      start_year: 'soon',
      mentorship_available: 'yes',
    });

    const [, , alumni, , student] = updateMyProfile.mock.calls[0];
    expect(alumni).toBeUndefined();
    expect(student).toMatchObject({ department: 'CSE', expected_graduation_year: year });
    for (const key of ['headline', 'start_year', 'mentorship_available']) expect(student).not.toHaveProperty(key);
  });
});
