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
