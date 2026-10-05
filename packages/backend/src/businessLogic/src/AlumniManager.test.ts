import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AlumniQuery } from '@alumni/dal';
import { AlumniManager } from './AlumniManager.js';

vi.mock('@alumni/dal', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@alumni/dal')>();
  // Keep the real AlumniDTO (a plain class); fake only the query.
  return { ...actual, AlumniQuery: vi.fn(function (this: Record<string, unknown>) {
    this.findAlumniByUserId = vi.fn();
    this.createAlumni = vi.fn();
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

    await expect(manager.createAlumni(42, {})).rejects.toMatchObject({ status: 409 });
    expect(query.createAlumni).not.toHaveBeenCalled();
  });

  it('returns 409 when a concurrent create hits the unique user_id', async () => {
    query.createAlumni.mockRejectedValue(Object.assign(new Error('dup'), { code: '23505' }));

    await expect(manager.createAlumni(42, {})).rejects.toMatchObject({ status: 409 });
  });

  it.each([
    ['bad graduation year', { graduation_year: '20x0' }],
    ['non-http LinkedIn URL', { linkedin_url: 'javascript:alert(1)' }],
    ['department too long', { department: 'x'.repeat(101) }],
  ])('returns 400 on %s, without inserting', async (_label, body) => {
    await expect(manager.createAlumni(42, body)).rejects.toMatchObject({ status: 400 });
    expect(query.createAlumni).not.toHaveBeenCalled();
  });

  it('lets other database errors through unchanged', async () => {
    const boom = new Error('connection lost');
    query.createAlumni.mockRejectedValue(boom);

    await expect(manager.createAlumni(42, {})).rejects.toBe(boom);
  });
});
