import { beforeEach, describe, expect, it, vi } from 'vitest';
import pool from '../config/db.js';
import { AdminQuery } from './AdminQuery';

// The pool is replaced by src/test/setup.ts; we record the SQL each method sends.
const query = vi.mocked(pool.query);
const connect = vi.mocked(pool.connect);
const clientQuery = vi.fn();
const release = vi.fn();

const statements = () => clientQuery.mock.calls.map(([sql]) => String(sql).replace(/\s+/g, ' ').trim());

// Answers each client.query by matching its SQL, so a test only states what differs.
function answer(overrides: { affected?: number[]; deletedRows?: number; alumniRows?: number; failOn?: RegExp }) {
  clientQuery.mockImplementation(async (sql: string) => {
    if (overrides.failOn?.test(sql)) throw Object.assign(new Error('boom'), { code: '23503' });
    if (/SELECT DISTINCT c\.post_id/.test(sql)) {
      return { rows: (overrides.affected ?? []).map((post_id) => ({ post_id })), rowCount: 0 };
    }
    if (/DELETE FROM users/.test(sql)) return { rows: [], rowCount: overrides.deletedRows ?? 1 };
    if (/UPDATE alumni/.test(sql)) {
      const n = overrides.alumniRows ?? 1;
      return { rows: n ? [{ user_id: 42 }] : [], rowCount: n };
    }
    return { rows: [], rowCount: 0 };
  });
}

beforeEach(() => {
  clientQuery.mockReset();
  release.mockReset();
  connect.mockResolvedValue({ query: clientQuery, release } as never);
});

describe('AdminQuery.countStats', () => {
  it('sends one query with the four counts, mentors filtered on mentorship_available = true', async () => {
    query.mockResolvedValue({ rows: [{ alumni: 3, students: 2, posts: 9, mentors: 1 }] } as never);

    const stats = await new AdminQuery().countStats();

    expect(query).toHaveBeenCalledTimes(1);
    const sql = String(query.mock.calls[0]?.[0]);
    expect(sql).toMatch(/\(SELECT COUNT\(\*\) FROM alumni\)::int AS alumni/);
    expect(sql).toMatch(/\(SELECT COUNT\(\*\) FROM students\)::int AS students/);
    expect(sql).toMatch(/\(SELECT COUNT\(\*\) FROM posts\)::int AS posts/);
    expect(sql).toMatch(/FROM alumni WHERE mentorship_available = true\)::int AS mentors/);
    expect(stats).toEqual({ alumni: 3, students: 2, posts: 9, mentors: 1 });
  });
});

describe('AdminQuery.deleteAlumniAccount', () => {
  it('runs BEGIN → affected posts → DELETE FROM users → recount → COMMIT, then releases', async () => {
    answer({ affected: [5, 9] });

    expect(await new AdminQuery().deleteAlumniAccount(42)).toBe(true);

    const sql = statements();
    expect(sql).toHaveLength(5);
    expect(sql[0]).toBe('BEGIN');
    expect(sql[1]).toMatch(/^SELECT DISTINCT c\.post_id FROM comments c/);
    expect(sql[2]).toBe('DELETE FROM users WHERE id = $1');
    expect(sql[3]).toMatch(/^UPDATE posts SET comment_count = \(SELECT COUNT\(\*\) FROM comments WHERE post_id = posts\.id\) WHERE id = ANY\(\$1\)$/);
    expect(sql[4]).toBe('COMMIT');
    expect(clientQuery.mock.calls[1]?.[1]).toEqual([42]);
    expect(clientQuery.mock.calls[2]?.[1]).toEqual([42]);
    expect(clientQuery.mock.calls[3]?.[1]).toEqual([[5, 9]]);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('looks for posts that lose a comment or a reply to one, excluding the user’s own posts', async () => {
    answer({});

    await new AdminQuery().deleteAlumniAccount(42);

    const affected = statements()[1];
    expect(affected).toContain('c.user_id = $1');
    expect(affected).toContain('c.parent_id IN (SELECT id FROM comments WHERE user_id = $1)');
    expect(affected).toContain('c.post_id NOT IN (SELECT id FROM posts WHERE user_id = $1)');
  });

  it('skips the recount when no other post lost a comment', async () => {
    answer({ affected: [] });

    expect(await new AdminQuery().deleteAlumniAccount(42)).toBe(true);

    expect(statements()).toEqual([
      'BEGIN',
      expect.stringMatching(/^SELECT DISTINCT/),
      'DELETE FROM users WHERE id = $1',
      'COMMIT',
    ]);
  });

  it('rolls back and returns false when no user had that id', async () => {
    answer({ affected: [5], deletedRows: 0 });

    expect(await new AdminQuery().deleteAlumniAccount(42)).toBe(false);

    const sql = statements();
    expect(sql.at(-1)).toBe('ROLLBACK');
    expect(sql).not.toContain('COMMIT');
    expect(sql.some((s) => s.startsWith('UPDATE posts'))).toBe(false);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it.each([/DELETE FROM users/, /UPDATE posts/])('rolls back, releases and rethrows when %s fails', async (failOn) => {
    answer({ affected: [5], failOn });

    await expect(new AdminQuery().deleteAlumniAccount(42)).rejects.toMatchObject({ code: '23503' });

    const sql = statements();
    expect(sql.at(-1)).toBe('ROLLBACK');
    expect(sql).not.toContain('COMMIT');
    expect(release).toHaveBeenCalledTimes(1);
  });
});

describe('AdminQuery.updateAlumniAccount', () => {
  const fields = {
    name: 'Ada',
    university: 'MIT',
    graduation_year: '2015',
    department: 'CS',
    job_title: 'Engineer',
    current_company: 'Acme',
  };

  it('updates the four alumni columns, then name and university on the owning user, in one transaction', async () => {
    answer({});

    expect(await new AdminQuery().updateAlumniAccount(7, fields)).toBe(true);

    const sql = statements();
    expect(sql[0]).toBe('BEGIN');
    expect(sql[1]).toMatch(/^UPDATE alumni SET department=\$1, graduation_year=\$2, job_title=\$3, current_company=\$4, updated_at=NOW\(\) WHERE id=\$5 RETURNING user_id$/);
    expect(clientQuery.mock.calls[1]?.[1]).toEqual(['CS', 2015, 'Engineer', 'Acme', 7]);
    expect(sql[2]).toBe('UPDATE users SET name=$1, university=$2, updated_at=NOW() WHERE id=$3');
    expect(clientQuery.mock.calls[2]?.[1]).toEqual(['Ada', 'MIT', 42]);
    expect(sql[3]).toBe('COMMIT');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('never writes email, password, role, user_id or the REQ-011 and other profile columns', async () => {
    answer({});

    await new AdminQuery().updateAlumniAccount(7, fields);

    // Column names assigned in each SET clause.
    const setColumns = statements()
      .filter((s) => s.startsWith('UPDATE'))
      .map((s) => [...(/ SET (.*) WHERE /.exec(s)?.[1] ?? '').matchAll(/(\w+)=/g)].map((m) => m[1]));
    expect(setColumns).toEqual([
      ['department', 'graduation_year', 'job_title', 'current_company', 'updated_at'],
      ['name', 'university', 'updated_at'],
    ]);
  });

  it('stores omitted optional fields as NULL', async () => {
    answer({});

    await new AdminQuery().updateAlumniAccount(7, { name: 'Ada' });

    expect(clientQuery.mock.calls[1]?.[1]).toEqual([null, null, null, null, 7]);
    expect(clientQuery.mock.calls[2]?.[1]).toEqual(['Ada', null, 42]);
  });

  it('rolls back and returns false when the alumni row is gone, without touching users', async () => {
    answer({ alumniRows: 0 });

    expect(await new AdminQuery().updateAlumniAccount(7, fields)).toBe(false);

    const sql = statements();
    expect(sql.at(-1)).toBe('ROLLBACK');
    expect(sql.some((s) => s.startsWith('UPDATE users'))).toBe(false);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('rolls back, releases and rethrows on an error', async () => {
    answer({ failOn: /UPDATE users/ });

    await expect(new AdminQuery().updateAlumniAccount(7, fields)).rejects.toThrow('boom');

    expect(statements().at(-1)).toBe('ROLLBACK');
    expect(release).toHaveBeenCalledTimes(1);
  });
});
