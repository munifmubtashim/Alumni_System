import { beforeEach, describe, expect, it, vi } from 'vitest';
import pool from '../config/db.js';
import { UserQuery } from './UserQuery';

// The pool is replaced by src/test/setup.ts; we only record the SQL each method sends.
const query = vi.mocked(pool.query);
const PUBLIC_COLUMNS = ['id', 'name', 'email', 'role', 'photo_url', 'university', 'created_at'];

const sqlOfLastCall = () => String(query.mock.calls.at(-1)?.[0]);
const columnList = (clause: RegExpMatchArray | null) =>
  (clause?.[1] ?? '').split(',').map((c) => c.trim()).filter(Boolean);

describe('UserQuery never returns the password from user reads', () => {
  const userQuery = new UserQuery();

  beforeEach(() => {
    query.mockResolvedValue({ rows: [] } as never);
  });

  it('createUser inserts the hash but RETURNs only the public columns', async () => {
    await userQuery.createUser({ name: 'A', email: 'a@x.io', password: 'hash', role: 'admin' });

    const sql = sqlOfLastCall();
    expect(columnList(sql.match(/INSERT INTO users\s*\(([^)]*)\)/i))).toEqual(['name', 'email', 'password', 'role']);
    expect(columnList(sql.match(/RETURNING\s+([\s\S]*)$/i))).toEqual(PUBLIC_COLUMNS);
  });

  it('findUserById selects only the public columns', async () => {
    await userQuery.findUserById(7);

    expect(columnList(sqlOfLastCall().match(/SELECT\s+([\s\S]*?)\s+FROM users/i))).toEqual(PUBLIC_COLUMNS);
    expect(query.mock.calls.at(-1)?.[1]).toEqual([7]);
  });

  it('getAllUsers selects only the public columns', async () => {
    await userQuery.getAllUsers();

    expect(columnList(sqlOfLastCall().match(/SELECT\s+([\s\S]*?)\s+FROM users/i))).toEqual(PUBLIC_COLUMNS);
  });

  it('findUserByEmail still selects the password, because login needs the hash', async () => {
    query.mockResolvedValue({ rows: [{ id: 1, email: 'a@x.io', password: 'hash', role: 'alumni' }] } as never);

    const user = await userQuery.findUserByEmail('a@x.io');

    expect(sqlOfLastCall()).toMatch(/SELECT \* FROM users WHERE email = \$1/);
    expect(user?.password).toBe('hash');
  });
});

describe('UserQuery /api/me reads and writes the five alumni profile fields (REQ-011)', () => {
  const userQuery = new UserQuery();
  const connect = vi.mocked(pool.connect);
  const clientQuery = vi.fn();

  beforeEach(() => {
    clientQuery.mockReset();
    clientQuery.mockResolvedValue({ rows: [{ user_id: 7 }], rowCount: 1 });
    connect.mockResolvedValue({ query: clientQuery, release: vi.fn() } as never);
    query.mockResolvedValue({ rows: [] } as never);
  });

  const selectList = (sql: string) => /SELECT([\s\S]*?)\bFROM users u/.exec(sql)?.[1] ?? '';

  it('findMyProfile selects the four text fields from the alumni row only and COALESCEs the flag to false', async () => {
    await userQuery.findMyProfile(7);

    const select = selectList(sqlOfLastCall());
    expect(select).toMatch(/\ba\.headline, a\.location, a\.degree, a\.start_year,/);
    expect(select).toContain('COALESCE(a.mentorship_available, false) AS mentorship_available');
    expect(select).not.toMatch(/s\.(headline|location|degree|start_year|mentorship_available)/);
    expect(query.mock.calls.at(-1)?.[1]).toEqual([7]);
  });

  const alumniUpdate = () => {
    const call = clientQuery.mock.calls.find(([sql]) => /UPDATE alumni/.test(String(sql)));
    return { sql: String(call?.[0]), params: (call?.[1] ?? []) as unknown[] };
  };

  it('updateMyProfile sets the five fields on the alumni row, each column bound to its own value', async () => {
    await userQuery.updateMyProfile(7, { name: 'Ann' }, {
      department: 'CSE',
      graduation_year: '2017',
      headline: 'Designer',
      location: 'Oslo',
      degree: 'B.Sc.',
      start_year: '2013',
      mentorship_available: true,
    });

    const { sql, params } = alumniUpdate();
    const set = Object.fromEntries(
      [...sql.matchAll(/(\w+)\s*=\s*\$(\d+)/g)].map(([, column, n]) => [column, params[Number(n) - 1]]),
    );
    expect(set).toEqual({
      department: 'CSE',
      graduation_year: '2017',
      current_company: null,
      job_title: null,
      experience: null,
      bio: null,
      linkedin_url: null,
      headline: 'Designer',
      location: 'Oslo',
      degree: 'B.Sc.',
      start_year: '2013',
      mentorship_available: true,
      user_id: 7,
    });
  });

  it('updateMyProfile clears omitted fields to null and keeps a false flag false', async () => {
    await userQuery.updateMyProfile(7, { name: 'Ann' }, { mentorship_available: false });

    expect(alumniUpdate().params.slice(7)).toEqual([null, null, null, null, false, 7]);
  });

  it('updateMyProfile without alumni fields (a student) never touches the alumni row', async () => {
    await userQuery.updateMyProfile(7, { name: 'Sam' }, undefined, undefined, {
      department: 'CSE',
      expected_graduation_year: '2028',
    });

    expect(clientQuery.mock.calls.some(([sql]) => /UPDATE alumni/.test(String(sql)))).toBe(false);
    expect(clientQuery.mock.calls.some(([sql]) => /UPDATE students/.test(String(sql)))).toBe(true);
  });
});
