import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserQuery } from '@alumni/dal';
import { AppError } from './errors.js';
import { UserManager } from './UserManager.js';

vi.mock('@alumni/dal');

const validBody = { name: 'Ada Admin', email: 'ada@example.com', password: 'longenough', role: 'admin' };

const expectAppError = (fn: () => unknown, status: number) => {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).status).toBe(status);
    return;
  }
  throw new Error('expected an AppError');
};

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
  ])('rejects %s with 400', (_label, body) => {
    expectAppError(() => manager.validateNewUser(body), 400);
  });
});

describe('UserManager.createUser', () => {
  let manager: UserManager;

  beforeEach(() => {
    manager = new UserManager();
  });

  it('stores the given hash, never the plain password', async () => {
    const createUser = vi.mocked(UserQuery.prototype.createUser);
    createUser.mockResolvedValue({ id: 1, name: 'Ada Admin', email: 'ada@example.com', role: 'admin', created_at: new Date() });

    await manager.createUser({ name: 'Ada Admin', email: 'ada@example.com', password: 'longenough', role: 'admin' }, 'bcrypt-hash');

    expect(createUser).toHaveBeenCalledWith({ name: 'Ada Admin', email: 'ada@example.com', password: 'bcrypt-hash', role: 'admin' });
  });

  it('turns a duplicate email into 409', async () => {
    vi.mocked(UserQuery.prototype.createUser).mockRejectedValue(Object.assign(new Error('dup'), { code: '23505' }));

    await expect(
      manager.createUser({ name: 'A', email: 'a@x.io', password: 'longenough', role: 'student' }, 'h'),
    ).rejects.toMatchObject({ status: 409 });
  });
});
