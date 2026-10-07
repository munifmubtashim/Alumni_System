import { beforeEach, describe, expect, it, vi } from 'vitest';
import pool from '../config/db.js';
import { AlumniDTO } from '../dto/AlumniDTO.js';
import { AlumniQuery, escapeLike } from './AlumniQuery';

// The pool is replaced by src/test/setup.ts; we only record the SQL each method sends.
const query = vi.mocked(pool.query);
const sqlOfLastCall = () => String(query.mock.calls.at(-1)?.[0]);
const paramsOfLastCall = () => (query.mock.calls.at(-1)?.[1] ?? []) as unknown[];

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

describe('escapeLike', () => {
  it('prefixes backslash, percent and underscore with a backslash and leaves other text alone', () => {
    expect(escapeLike('100%')).toBe('100\\%');
    expect(escapeLike('a_b')).toBe('a\\_b');
    expect(escapeLike('c:\\dir')).toBe('c:\\\\dir');
    expect(escapeLike("O'Brien")).toBe("O'Brien");
  });
});

describe('AlumniQuery.searchAlumni (GET /api/alumni)', () => {
  const alumniQuery = new AlumniQuery();
  const paging = { limit: 20, offset: 40 };

  // Find each call by its SQL, not its position, so reordering the two queries can't swap them.
  const call = (isCount: boolean) => {
    const c = query.mock.calls.findLast(([sql]) => /COUNT\(/.test(String(sql)) === isCount);
    return { sql: String(c?.[0]), params: (c?.[1] ?? []) as unknown[] };
  };
  const items = () => call(false);
  const count = () => call(true);

  beforeEach(() => {
    query.mockImplementation(((sql: string) =>
      Promise.resolve(
        /COUNT\(\*\)/.test(sql) ? { rows: [{ total: 0 }] } : { rows: [] },
      )) as never);
  });

  it('with no filters sends no WHERE, orders by name then id, and binds only limit and offset', async () => {
    await alumniQuery.searchAlumni({}, paging);

    expect(query).toHaveBeenCalledTimes(2);
    expect(items().sql).not.toMatch(/WHERE/i);
    expect(items().sql).toMatch(/FROM alumni a JOIN users u ON a\.user_id = u\.id/);
    expect(items().sql).toMatch(/ORDER BY u\.name, a\.id LIMIT \$1 OFFSET \$2$/);
    expect(items().params).toEqual([20, 40]);
    expect(count().sql).toMatch(/^SELECT COUNT\(\*\)::int AS total FROM alumni a JOIN users u ON a\.user_id = u\.id\s*$/);
    expect(count().params).toEqual([]);
  });

  it('keeps the public list columns (no email, no password)', async () => {
    await alumniQuery.searchAlumni({}, paging);

    expect(items().sql).toMatch(/^SELECT a\.\*, u\.name, u\.photo_url, u\.university FROM/);
    expect(items().sql).not.toMatch(/email|password/i);
  });

  it('q searches name, company and job title with one reused, wrapped parameter', async () => {
    await alumniQuery.searchAlumni({ q: 'ann' }, paging);

    expect(items().sql).toContain(
      'WHERE (u.name ILIKE $1 OR a.current_company ILIKE $1 OR a.job_title ILIKE $1)',
    );
    expect(items().params).toEqual(['%ann%', 20, 40]);
  });

  it('department matches case-insensitively on a.department', async () => {
    await alumniQuery.searchAlumni({ department: 'CSE' }, paging);

    expect(items().sql).toContain('WHERE lower(a.department) = lower($1)');
    expect(items().params).toEqual(['CSE', 20, 40]);
  });

  it('university matches case-insensitively on u.university', async () => {
    await alumniQuery.searchAlumni({ university: 'BUET' }, paging);

    expect(items().sql).toContain('WHERE lower(u.university) = lower($1)');
    expect(items().params).toEqual(['BUET', 20, 40]);
  });

  it('graduationYear matches exactly on a.graduation_year', async () => {
    await alumniQuery.searchAlumni({ graduationYear: 2020 }, paging);

    expect(items().sql).toContain('WHERE a.graduation_year = $1');
    expect(items().params).toEqual([2020, 20, 40]);
  });

  it('all four filters join with AND and number their parameters in order, paging last', async () => {
    await alumniQuery.searchAlumni(
      { q: 'dev', department: 'CSE', university: 'BUET', graduationYear: 2019 },
      paging,
    );

    expect(items().sql).toContain(
      'WHERE (u.name ILIKE $1 OR a.current_company ILIKE $1 OR a.job_title ILIKE $1)' +
        ' AND lower(a.department) = lower($2)' +
        ' AND lower(u.university) = lower($3)' +
        ' AND a.graduation_year = $4 ',
    );
    expect(items().sql).toMatch(/LIMIT \$5 OFFSET \$6$/);
    expect(items().params).toEqual(['%dev%', 'CSE', 'BUET', 2019, 20, 40]);
  });

  it('the count query shares the WHERE and params, minus limit and offset', async () => {
    await alumniQuery.searchAlumni(
      { q: 'dev', department: 'CSE', university: 'BUET', graduationYear: 2019 },
      paging,
    );

    const where = /WHERE .*?(?= ORDER BY)/.exec(items().sql)?.[0];
    expect(where).toBeDefined();
    expect(count().sql.trimEnd().endsWith(String(where))).toBe(true);
    expect(count().sql).not.toMatch(/LIMIT|OFFSET|ORDER BY/);
    expect(count().params).toEqual(['%dev%', 'CSE', 'BUET', 2019]);
  });

  it('sends no ESCAPE clause and escapes %, _ and \\ in q with a backslash (ADV-001)', async () => {
    await alumniQuery.searchAlumni({ q: '50%_off\\now' }, paging);

    expect(items().sql).not.toMatch(/ESCAPE/i);
    expect(count().sql).not.toMatch(/ESCAPE/i);
    expect(items().params[0]).toBe('%50\\%\\_off\\\\now%');
    expect(count().params[0]).toBe('%50\\%\\_off\\\\now%');
  });

  it('never puts input text in the SQL string, only in params', async () => {
    const q = "x'); DROP TABLE users; --";
    await alumniQuery.searchAlumni(
      { q, department: q, university: q, graduationYear: 2020 },
      paging,
    );

    for (const c of [items(), count()]) {
      expect(c.sql).not.toContain('DROP TABLE');
      expect(c.sql).not.toContain("x')");
      expect(c.sql).not.toContain('--');
      expect(c.params).toContain(q);
    }
    expect(items().params[0]).toBe(`%${q}%`);
  });

  it('returns the item rows and the total from the two results', async () => {
    const rows = [{ id: 1, name: 'Ann' }, { id: 2, name: 'Bo' }];
    query.mockImplementation(((sql: string) =>
      Promise.resolve(
        /COUNT\(\*\)/.test(sql) ? { rows: [{ total: 57 }] } : { rows },
      )) as never);

    await expect(alumniQuery.searchAlumni({}, paging)).resolves.toEqual({ items: rows, total: 57 });
  });

  it('keeps total on a page past the end, where there are no item rows (AC5)', async () => {
    query.mockImplementation(((sql: string) =>
      Promise.resolve(
        /COUNT\(\*\)/.test(sql) ? { rows: [{ total: 3 }] } : { rows: [] },
      )) as never);

    await expect(
      alumniQuery.searchAlumni({}, { limit: 20, offset: 200 }),
    ).resolves.toEqual({ items: [], total: 3 });
  });
});

// Pairs each column in the SQL with the parameter bound to it, so a column/parameter slip fails.
const columnsOf = (sql: string, re: RegExp) =>
  (re.exec(sql)?.[1] ?? '').split(',').map((c) => c.trim()).filter(Boolean);

describe('AlumniQuery.createAlumni (POST /api/alumni)', () => {
  const alumniQuery = new AlumniQuery();

  beforeEach(() => {
    query.mockResolvedValue({ rows: [{ id: 3 }] } as never);
  });

  it('inserts the five profile fields (REQ-011) with each column bound to its own value', async () => {
    const dto = new AlumniDTO({
      user_id: 42,
      department: 'CSE',
      graduation_year: 2017,
      headline: 'Designer',
      location: 'Oslo',
      degree: 'B.Sc.',
      start_year: 2013,
      mentorship_available: true,
    });

    await expect(alumniQuery.createAlumni(dto)).resolves.toEqual({ id: 3 });

    const sql = sqlOfLastCall();
    const columns = columnsOf(sql, /INSERT INTO alumni\s*\(([^)]*)\)/i);
    const params = paramsOfLastCall();
    expect(columnsOf(sql, /VALUES\s*\(([^)]*)\)/i)).toEqual(columns.map((_c, i) => `$${i + 1}`));
    expect(Object.fromEntries(columns.map((c, i) => [c, params[i]]))).toEqual({
      user_id: 42,
      department: 'CSE',
      graduation_year: 2017,
      current_company: undefined,
      job_title: undefined,
      experience: undefined,
      bio: undefined,
      linkedin_url: undefined,
      headline: 'Designer',
      location: 'Oslo',
      degree: 'B.Sc.',
      start_year: 2013,
      mentorship_available: true,
    });
    expect(sql).toMatch(/RETURNING \*$/);
  });

  it('binds null for missing text fields and false (never null) for a missing mentorship flag', async () => {
    await alumniQuery.createAlumni(new AlumniDTO({ user_id: 42 }));

    const params = paramsOfLastCall();
    expect(params.slice(8)).toEqual([null, null, null, null, false]);
  });
});

describe('AlumniQuery.updateAlumni (PUT /api/alumni/:id)', () => {
  const alumniQuery = new AlumniQuery();

  beforeEach(() => {
    query.mockResolvedValue({ rows: [{ id: 5 }] } as never);
  });

  it('sets the five profile fields (REQ-011), each column bound to its own value, id last', async () => {
    await alumniQuery.updateAlumni(5, {
      department: 'CSE',
      graduation_year: '2017',
      headline: 'Designer',
      location: 'Oslo',
      degree: 'B.Sc.',
      start_year: '2013',
      mentorship_available: true,
    });

    const sql = sqlOfLastCall();
    const params = paramsOfLastCall();
    const set = Object.fromEntries(
      [...sql.matchAll(/(\w+)=\$(\d+)/g)].map(([, column, n]) => [column, params[Number(n) - 1]]),
    );
    expect(set).toEqual({
      department: 'CSE',
      graduation_year: '2017',
      current_company: undefined,
      job_title: undefined,
      experience: undefined,
      bio: undefined,
      linkedin_url: undefined,
      headline: 'Designer',
      location: 'Oslo',
      degree: 'B.Sc.',
      start_year: '2013',
      mentorship_available: true,
      id: 5,
    });
    expect(sql).toMatch(/updated_at=NOW\(\) WHERE id=\$13 RETURNING \*$/);
  });

  it('clears omitted text fields to null and stores false when the flag is false', async () => {
    await alumniQuery.updateAlumni(5, { mentorship_available: false });

    const params = paramsOfLastCall();
    expect(params.slice(7)).toEqual([null, null, null, null, false, 5]);
  });
});
