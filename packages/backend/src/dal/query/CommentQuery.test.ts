import { beforeEach, describe, expect, it, vi } from 'vitest';
import pool from '../config/db.js';
import { CommentQuery } from './CommentQuery';

// pool is the fake from src/test/setup.ts; these tests check the SQL we send it.
const poolQuery = vi.mocked(pool.query) as unknown as ReturnType<typeof vi.fn>;

describe('CommentQuery.updateComment', () => {
  beforeEach(() => {
    poolQuery.mockReset();
  });

  it('updates text and updated_at and returns the row with author fields in one statement', async () => {
    const row = { id: 42, content: 'new', author_name: 'Ana', author_photo: null };
    poolQuery.mockResolvedValue({ rows: [row] });

    await expect(new CommentQuery().updateComment(42, 'new')).resolves.toEqual(row);

    expect(poolQuery).toHaveBeenCalledTimes(1);
    const [sql, params] = poolQuery.mock.calls[0]!;
    expect(sql).toMatch(/WITH c AS \(\s*UPDATE comments SET content = \$1, updated_at = NOW\(\) WHERE id = \$2 RETURNING \*/);
    expect(sql).toMatch(/u\.name AS author_name, u\.photo_url AS author_photo,/);
    expect(sql).toMatch(/AS author_alumni_id FROM c JOIN users u ON u\.id = c\.user_id/);
    expect(sql).not.toMatch(/user_id\s*=\s*\$|post_id\s*=|parent_id\s*=/);
    expect(params).toEqual(['new', 42]);
  });

  it('returns undefined when no row was updated (comment deleted meanwhile)', async () => {
    poolQuery.mockResolvedValue({ rows: [] });
    await expect(new CommentQuery().updateComment(42, 'new')).resolves.toBeUndefined();
  });
});

// author_alumni_id: the author's alumni.id for the /alumni/:id link. A scalar subquery
// (lowest id, as findAlumniByUserId) gives null for a user with no alumni row and can
// never duplicate a comment when a user has two alumni rows (a JOIN could).
const ALUMNI_ID_SUBQUERY =
  /\(SELECT MIN\(a\.id\) FROM alumni a WHERE a\.user_id = c\.user_id\) AS author_alumni_id/;

describe('CommentQuery author_alumni_id', () => {
  beforeEach(() => {
    poolQuery.mockReset();
  });

  it('getCommentsByPost selects it through a scalar subquery, not a join on alumni', async () => {
    const rows = [
      { id: 1, user_id: 7, author_alumni_id: 3 },
      { id: 2, user_id: 8, author_alumni_id: null },
    ];
    poolQuery.mockResolvedValue({ rows });

    await expect(new CommentQuery().getCommentsByPost(5)).resolves.toEqual(rows);

    const [sql, params] = poolQuery.mock.calls[0]!;
    expect(sql).toMatch(ALUMNI_ID_SUBQUERY);
    expect(sql).not.toMatch(/JOIN alumni/i);
    expect(params).toEqual([5]);
  });

  it('updateComment returns it with the edited row', async () => {
    poolQuery.mockResolvedValue({ rows: [{ id: 42, author_alumni_id: 3 }] });

    await new CommentQuery().updateComment(42, 'new');

    expect(poolQuery.mock.calls[0]![0]).toMatch(ALUMNI_ID_SUBQUERY);
  });

  it('createComment re-selects the new row with it', async () => {
    const created = { id: 9, user_id: 7, post_id: 5, author_alumni_id: null };
    const clientQuery = vi.fn(async (sql: string, _params?: unknown[]) =>
      /^INSERT/.test(sql) ? { rows: [{ id: 9 }] } : /^SELECT/.test(sql) ? { rows: [created] } : { rows: [] },
    );
    vi.mocked(pool.connect).mockResolvedValue({ query: clientQuery, release: vi.fn() } as never);

    await expect(
      new CommentQuery().createComment({ user_id: 7, post_id: 5, parent_id: null, content: 'hi' } as never),
    ).resolves.toEqual(created);

    const select = clientQuery.mock.calls.find(([sql]) => /^SELECT/.test(sql))!;
    expect(select[0]).toMatch(ALUMNI_ID_SUBQUERY);
    expect(select[1]).toEqual([9]);
  });
});
