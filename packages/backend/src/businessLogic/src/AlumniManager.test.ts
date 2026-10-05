import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AlumniQuery } from '@alumni/dal';
import { AlumniManager } from './AlumniManager.js';
import { expectAppError } from '../../test/expectAppError';

vi.mock('@alumni/dal', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@alumni/dal')>();
  // Keep the real AlumniDTO (a plain class); fake only the query.
  return { ...actual, AlumniQuery: vi.fn(function (this: Record<string, unknown>) {
    this.findAlumniByUserId = vi.fn();
    this.createAlumni = vi.fn();
    this.findAlumniById = vi.fn();
    this.updateAlumni = vi.fn();
    this.getAllAlumni = vi.fn();
  }) };
});

describe('AlumniManager.createAlumni (POST /api/alumni)', () => {
  let manager: AlumniManager;
  let query: { findAlumniByUserId: ReturnType<typeof vi.fn>; createAlumni: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    manager = new AlumniManager();
    query = manager.alumniQuery as unknown as typeof query;
    query.findAlumniByUserId.mockResolvedValue(undefined);
    query.createAlumni.mockImplementation(async (row) => ({ id: 10, ...row }));
  });

  it('creates the profile for the given user id and ignores user_id in the body', async () => {
    await manager.createAlumni(42, { user_id: 99, department: 'CSE', graduation_year: '2020' });

    expect(query.findAlumniByUserId).toHaveBeenCalledWith(42);
    const row = query.createAlumni.mock.calls[0][0];
    expect(row.user_id).toBe(42);
    expect(row.department).toBe('CSE');
    expect(row.graduation_year).toBe('2020');
  });

  it('returns 409 when the user already has a profile, without inserting', async () => {
    query.findAlumniByUserId.mockResolvedValue({ id: 3, user_id: 42 });

    await expectAppError(manager.createAlumni(42, {}), 409);
    expect(query.createAlumni).not.toHaveBeenCalled();
  });

  it('returns 409 when a concurrent create hits the unique user_id', async () => {
    query.createAlumni.mockRejectedValue(Object.assign(new Error('dup'), { code: '23505' }));

    await expectAppError(manager.createAlumni(42, {}), 409);
  });

  it.each([
    ['bad graduation year', { graduation_year: '20x0' }],
    ['non-http LinkedIn URL', { linkedin_url: 'javascript:alert(1)' }],
    ['department too long', { department: 'x'.repeat(101) }],
  ])('returns 400 on %s, without inserting', async (_label, body) => {
    await expectAppError(manager.createAlumni(42, body), 400);
    expect(query.createAlumni).not.toHaveBeenCalled();
  });

  it('lets other database errors through unchanged', async () => {
    const boom = new Error('connection lost');
    query.createAlumni.mockRejectedValue(boom);

    await expect(manager.createAlumni(42, {})).rejects.toBe(boom);
  });
});

describe('AlumniManager.findAlumniById (GET /api/alumni/:id)', () => {
  let manager: AlumniManager;
  let findAlumniById: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    manager = new AlumniManager();
    findAlumniById = (manager.alumniQuery as unknown as { findAlumniById: ReturnType<typeof vi.fn> }).findAlumniById;
  });

  it('returns the row for a known id', async () => {
    findAlumniById.mockResolvedValue({ id: 3 });
    await expect(manager.findAlumniById('3')).resolves.toEqual({ id: 3 });
    expect(findAlumniById).toHaveBeenCalledWith(3);
  });

  it('unknown id → 404', async () => {
    findAlumniById.mockResolvedValue(undefined);
    await expectAppError(manager.findAlumniById('999'), 404);
  });

  it('malformed id → 404 without touching the DB', async () => {
    await expectAppError(manager.findAlumniById('abc'), 404);
    expect(findAlumniById).not.toHaveBeenCalled();
  });
});

describe('AlumniManager.updateOwnAlumni (PUT /api/alumni/:id): owner only', () => {
  type Fn = ReturnType<typeof vi.fn>;
  let manager: AlumniManager;
  let query: { findAlumniById: Fn; updateAlumni: Fn };
  const body = { user_id: 99, department: 'CSE', job_title: 'Engineer' };

  beforeEach(() => {
    manager = new AlumniManager();
    query = manager.alumniQuery as unknown as typeof query;
    query.findAlumniById.mockResolvedValue({ id: 3, user_id: 42 });
    query.updateAlumni.mockImplementation(async (id, fields) => ({ id, user_id: 42, ...fields }));
  });

  it('owner → updates the editable fields; user_id in the body is ignored', async () => {
    await expect(manager.updateOwnAlumni(42, '3', body)).resolves.toMatchObject({ id: 3, user_id: 42 });
    expect(query.findAlumniById).toHaveBeenCalledWith(3);
    const [id, fields] = query.updateAlumni.mock.calls[0];
    expect(id).toBe(3);
    expect(fields).toMatchObject({ department: 'CSE', job_title: 'Engineer' });
    expect(fields).not.toHaveProperty('user_id');
  });

  it('another user → 403 without updating', async () => {
    await expectAppError(manager.updateOwnAlumni(8, '3', body), 403);
    expect(query.updateAlumni).not.toHaveBeenCalled();
  });

  // The manager gets only the requester's id, not their role, so an admin is just another user here.
  it('an admin editing someone else → 403 too', async () => {
    await expectAppError(manager.updateOwnAlumni(1, '3', body), 403);
    expect(query.updateAlumni).not.toHaveBeenCalled();
  });

  it('unknown id → 404 without updating', async () => {
    query.findAlumniById.mockResolvedValue(undefined);
    await expectAppError(manager.updateOwnAlumni(42, '999', body), 404);
    expect(query.updateAlumni).not.toHaveBeenCalled();
  });

  it('malformed id → 404 without touching the DB', async () => {
    await expectAppError(manager.updateOwnAlumni(42, 'abc', body), 404);
    expect(query.findAlumniById).not.toHaveBeenCalled();
  });

  it('owner with a bad field → 400 without updating', async () => {
    await expectAppError(manager.updateOwnAlumni(42, '3', { graduation_year: '20x0' }), 400);
    expect(query.updateAlumni).not.toHaveBeenCalled();
  });
});

describe('AlumniManager.getAllAlumni (GET /api/alumni)', () => {
  it('returns the query rows as they are', async () => {
    const manager = new AlumniManager();
    const rows = [{ id: 1 }, { id: 2 }];
    (manager.alumniQuery as unknown as { getAllAlumni: ReturnType<typeof vi.fn> }).getAllAlumni.mockResolvedValue(rows);
    await expect(manager.getAllAlumni()).resolves.toBe(rows);
  });
});
