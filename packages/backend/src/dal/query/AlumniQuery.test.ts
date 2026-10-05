import { beforeEach, describe, expect, it, vi } from 'vitest';
import pool from '../config/db.js';
import { AlumniQuery } from './AlumniQuery';

// The pool is replaced by src/test/setup.ts; we only record the SQL each method sends.
const query = vi.mocked(pool.query);
const sqlOfLastCall = () => String(query.mock.calls.at(-1)?.[0]);

describe('AlumniQuery.findAlumniByUserId (the 409 check on POST /api/alumni)', () => {
  const alumniQuery = new AlumniQuery();

  beforeEach(() => {
    query.mockResolvedValue({ rows: [] } as never);
  });

  it('selects from alumni by user_id, not by id, with the user id as the only parameter', async () => {
    await alumniQuery.findAlumniByUserId(42);

    expect(sqlOfLastCall()).toMatch(/FROM alumni\s+WHERE user_id = \$1/i);
    expect(sqlOfLastCall()).not.toMatch(/WHERE\s+(a\.)?id\s*=/i);
    expect(query.mock.calls.at(-1)?.[1]).toEqual([42]);
  });

  it('returns the first row when the user has a profile', async () => {
    const row = { id: 3, user_id: 42, department: 'CSE' };
    query.mockResolvedValue({ rows: [row] } as never);

    await expect(alumniQuery.findAlumniByUserId(42)).resolves.toBe(row);
  });

  it('returns undefined when the user has no profile', async () => {
    await expect(alumniQuery.findAlumniByUserId(42)).resolves.toBeUndefined();
  });
});
