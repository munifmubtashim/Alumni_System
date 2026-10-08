import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminQuery, AlumniQuery, UserQuery } from '@alumni/dal';
import type { AlumniDTO } from '@alumni/dal';
import { AdminManager } from './AdminManager.js';
import { UserManager } from './UserManager.js';
import { expectAppError } from '../../test/expectAppError';

vi.mock('@alumni/dal');

const ADMIN_ID = 1;
const ROW = { id: 30, user_id: 12, name: 'Al Alumnus', department: 'CS' } as AlumniDTO;
const validCreate = {
  name: 'Al Alumnus',
  email: 'al@example.com',
  password: 'temporary1',
  university: 'MIT',
  graduation_year: '2015',
  department: 'CS',
  job_title: 'Engineer',
  current_company: 'Acme',
};

const createAlumniUser = () => vi.mocked(UserQuery.prototype.createAlumniUser);
const findAlumniById = () => vi.mocked(AlumniQuery.prototype.findAlumniById);
const findAlumniByUserId = () => vi.mocked(AlumniQuery.prototype.findAlumniByUserId);
const updateAlumniAccount = () => vi.mocked(AdminQuery.prototype.updateAlumniAccount);
const deleteAlumniAccount = () => vi.mocked(AdminQuery.prototype.deleteAlumniAccount);

let manager: AdminManager;

beforeEach(() => {
  vi.resetAllMocks();
  manager = new AdminManager();
});

describe('AdminManager.getStats', () => {
  it('passes the four counts through', async () => {
    const stats = { alumni: 3, students: 2, posts: 9, mentors: 1 };
    vi.mocked(AdminQuery.prototype.countStats).mockResolvedValue(stats);

    expect(await manager.getStats()).toEqual(stats);
  });
});

describe('AdminManager.createAlumni', () => {
  beforeEach(() => {
    createAlumniUser().mockResolvedValue({ id: 12, name: 'Al Alumnus', email: 'al@example.com', role: 'alumni', created_at: new Date() });
    findAlumniByUserId().mockResolvedValue({ id: 30, user_id: 12 } as AlumniDTO);
    findAlumniById().mockResolvedValue(ROW);
  });

  it('creates the account through UserManager.createAlumniAccount with the plain temporary password', async () => {
    const createAlumniAccount = vi.spyOn(UserManager.prototype, 'createAlumniAccount');

    await manager.createAlumni(validCreate);

    expect(createAlumniAccount).toHaveBeenCalledWith(
      { name: 'Al Alumnus', email: 'al@example.com', password: 'temporary1', university: 'MIT' },
      { department: 'CS', graduation_year: '2015', job_title: 'Engineer', current_company: 'Acme' },
    );
    createAlumniAccount.mockRestore();
  });

  it('stores a hash of the temporary password, never the plain text', async () => {
    await manager.createAlumni(validCreate);

    const [user, profile] = createAlumniUser().mock.calls[0];
    expect(user).toMatchObject({ name: 'Al Alumnus', email: 'al@example.com', university: 'MIT' });
    expect(user.password).not.toBe('temporary1');
    expect(await bcrypt.compare('temporary1', user.password)).toBe(true);
    expect(profile).toEqual({ department: 'CS', graduation_year: '2015', job_title: 'Engineer', current_company: 'Acme' });
  });

  it('returns the alumni row (id = alumni id, joined name), looked up by the new user id', async () => {
    const row = await manager.createAlumni(validCreate);

    expect(findAlumniByUserId()).toHaveBeenCalledWith(12);
    expect(findAlumniById()).toHaveBeenCalledWith(30);
    expect(row).toEqual(ROW);
  });

  it('needs only name, email and temporary password', async () => {
    await manager.createAlumni({ name: 'Al', email: 'al@example.com', password: 'temporary1' });

    const [user, profile] = createAlumniUser().mock.calls[0];
    expect(user.university).toBeUndefined();
    expect(profile).toEqual({ department: undefined, graduation_year: undefined, job_title: undefined, current_company: undefined });
  });

  it('ignores role, user_id and other keys in the body', async () => {
    await manager.createAlumni({ ...validCreate, role: 'admin', user_id: 99, headline: 'x' });

    const [user, profile] = createAlumniUser().mock.calls[0];
    expect(user).not.toHaveProperty('role');
    expect(profile).not.toHaveProperty('user_id');
    expect(profile).not.toHaveProperty('headline');
  });

  it.each([
    ['missing name', { ...validCreate, name: ' ' }, 'Name is required'],
    ['missing email', { ...validCreate, email: undefined }, 'Email is required'],
    ['bad email', { ...validCreate, email: 'nope' }, 'Email is not valid'],
    ['missing password', { ...validCreate, password: undefined }, 'Temporary password must be at least 8 characters'],
    ['short password', { ...validCreate, password: 'short' }, 'Temporary password must be at least 8 characters'],
    ['long password', { ...validCreate, password: 'x'.repeat(73) }, 'Temporary password is too long'],
    ['bad year', { ...validCreate, graduation_year: '15' }, 'Graduation year is not valid'],
    ['long university', { ...validCreate, university: 'x'.repeat(151) }, 'University must be at most 150 characters'],
    ['long department', { ...validCreate, department: 'x'.repeat(101) }, 'Department must be at most 100 characters'],
    ['long job title', { ...validCreate, job_title: 'x'.repeat(101) }, 'Job title must be at most 100 characters'],
    ['long company', { ...validCreate, current_company: 'x'.repeat(101) }, 'Company must be at most 100 characters'],
    ['NUL in name', { ...validCreate, name: 'A\u0000' }, 'Name contains an invalid character'],
  ])('rejects %s with 400 and writes nothing', async (_label, body, message) => {
    const error = await expectAppError(manager.createAlumni(body), 400);
    expect(error.message).toBe(message);
    expect(createAlumniUser()).not.toHaveBeenCalled();
  });

  it('turns a taken email into 409', async () => {
    createAlumniUser().mockRejectedValue(Object.assign(new Error('dup'), { code: '23505' }));

    const error = await expectAppError(manager.createAlumni(validCreate), 409);
    expect(error.message).toBe('An account with this email already exists');
  });

  it('passes other database errors through', async () => {
    createAlumniUser().mockRejectedValue(new Error('down'));

    await expect(manager.createAlumni(validCreate)).rejects.toThrow('down');
  });
});

describe('AdminManager.updateAlumni', () => {
  const body = { name: 'New Name', university: 'MIT', graduation_year: 2016, department: 'Math', job_title: 'Lead', current_company: 'Beta' };

  beforeEach(() => {
    findAlumniById().mockResolvedValue(ROW);
    updateAlumniAccount().mockResolvedValue(true);
  });

  it('updates the six fields and returns the fresh row', async () => {
    const updated = { ...ROW, name: 'New Name' } as AlumniDTO;
    findAlumniById().mockResolvedValueOnce(ROW).mockResolvedValueOnce(updated);

    expect(await manager.updateAlumni('30', body)).toEqual(updated);
    expect(updateAlumniAccount()).toHaveBeenCalledWith(30, {
      name: 'New Name', university: 'MIT', graduation_year: '2016', department: 'Math', job_title: 'Lead', current_company: 'Beta',
    });
  });

  it('ignores email, role, password, user_id and the REQ-011 fields in the body', async () => {
    await manager.updateAlumni(30, {
      ...body, email: 'x@y.io', role: 'admin', password: 'newpassword', user_id: 99, headline: 'h', mentorship_available: true,
    });

    expect(Object.keys(updateAlumniAccount().mock.calls[0][1]).sort()).toEqual(
      ['current_company', 'department', 'graduation_year', 'job_title', 'name', 'university'],
    );
  });

  it.each([['abc'], ['0'], ['-1'], ['1.5']])('a malformed id (%s) is 404 without a query', async (id) => {
    await expectAppError(manager.updateAlumni(id, body), 404);
    expect(findAlumniById()).not.toHaveBeenCalled();
  });

  it('an unknown alumni is 404 and nothing is written', async () => {
    findAlumniById().mockResolvedValue(undefined as unknown as AlumniDTO);

    const error = await expectAppError(manager.updateAlumni(30, body), 404);
    expect(error.message).toBe('Alumni not found');
    expect(updateAlumniAccount()).not.toHaveBeenCalled();
  });

  it('a row deleted between the read and the write is 404', async () => {
    updateAlumniAccount().mockResolvedValue(false);

    await expectAppError(manager.updateAlumni(30, body), 404);
  });

  it('a missing name or a bad value is 400 and nothing is written', async () => {
    await expectAppError(manager.updateAlumni(30, { ...body, name: '' }), 400);
    await expectAppError(manager.updateAlumni(30, { ...body, graduation_year: '1800' }), 400);
    expect(updateAlumniAccount()).not.toHaveBeenCalled();
  });
});

describe('AdminManager.deleteAlumni', () => {
  beforeEach(() => {
    findAlumniById().mockResolvedValue(ROW);
    deleteAlumniAccount().mockResolvedValue(true);
  });

  it('deletes the account of the alumni row’s user (not the alumni id)', async () => {
    await manager.deleteAlumni(ADMIN_ID, '30');

    expect(findAlumniById()).toHaveBeenCalledWith(30);
    expect(deleteAlumniAccount()).toHaveBeenCalledWith(12);
  });

  it('refuses the admin’s own account with 403 and deletes nothing', async () => {
    const error = await expectAppError(manager.deleteAlumni(12, 30), 403);
    expect(error.message).toBe("You can't delete your own account");
    expect(deleteAlumniAccount()).not.toHaveBeenCalled();
  });

  it('a malformed id is 404 without a query', async () => {
    await expectAppError(manager.deleteAlumni(ADMIN_ID, 'x'), 404);
    expect(findAlumniById()).not.toHaveBeenCalled();
  });

  it('an unknown alumni is 404', async () => {
    findAlumniById().mockResolvedValue(undefined as unknown as AlumniDTO);

    await expectAppError(manager.deleteAlumni(ADMIN_ID, 30), 404);
    expect(deleteAlumniAccount()).not.toHaveBeenCalled();
  });

  it('nothing deleted (gone meanwhile) is 404', async () => {
    deleteAlumniAccount().mockResolvedValue(false);

    await expectAppError(manager.deleteAlumni(ADMIN_ID, 30), 404);
  });

  it('a foreign key that does not cascade is 409', async () => {
    deleteAlumniAccount().mockRejectedValue(Object.assign(new Error('fk'), { code: '23503' }));

    const error = await expectAppError(manager.deleteAlumni(ADMIN_ID, 30), 409);
    expect(error.message).toBe('This user still has posts or comments');
  });

  it('passes other database errors through', async () => {
    deleteAlumniAccount().mockRejectedValue(new Error('down'));

    await expect(manager.deleteAlumni(ADMIN_ID, 30)).rejects.toThrow('down');
  });
});
