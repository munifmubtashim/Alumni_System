import { beforeEach, describe, expect, it, vi } from 'vitest';
import pool from '../config/db.js';
import { PostQuery } from './PostQuery';

// pool is the fake from src/test/setup.ts; these tests check the SQL we send it.
const poolQuery = vi.mocked(pool.query) as unknown as ReturnType<typeof vi.fn>;

describe('PostQuery', () => {
  beforeEach(() => {
    poolQuery.mockReset();
  });

  it('findPostById selects one post by id', async () => {
    const row = { id: 42, user_id: 7 };
    poolQuery.mockResolvedValue({ rows: [row] });

    await expect(new PostQuery().findPostById(42)).resolves.toEqual(row);

    const [sql, params] = poolQuery.mock.calls[0]!;
    expect(sql).toMatch(/SELECT \* FROM posts WHERE id = \$1/);
    expect(params).toEqual([42]);
  });

  it('findPostById returns undefined when no row matches', async () => {
    poolQuery.mockResolvedValue({ rows: [] });
    await expect(new PostQuery().findPostById(999)).resolves.toBeUndefined();
  });

  it('getAllPosts orders newest first with an id tie-break, so offset paging is stable', async () => {
    poolQuery.mockResolvedValue({ rows: [] });

    await new PostQuery().getAllPosts(20, 40);

    const [sql, params] = poolQuery.mock.calls[0]!;
    expect(sql).toMatch(/ORDER BY posts\.created_at DESC, posts\.id DESC\s+LIMIT \$1 OFFSET \$2/);
    expect(params).toEqual([20, 40]);
  });

  // author_alumni_id: the author's alumni.id for the /alumni/:id link. A scalar subquery
  // (lowest id, as findAlumniByUserId) gives null for a user with no alumni row and can
  // never duplicate a post when a user has two alumni rows (a JOIN could).
  const ALUMNI_ID_SUBQUERY =
    /\(SELECT MIN\(a\.id\) FROM alumni a WHERE a\.user_id = posts\.user_id\) AS author_alumni_id/;

  it('getAllPosts returns author_alumni_id through a scalar subquery, not a join on alumni', async () => {
    const rows = [
      { id: 2, user_id: 7, author_alumni_id: 3 },
      { id: 1, user_id: 8, author_alumni_id: null },
    ];
    poolQuery.mockResolvedValue({ rows });

    await expect(new PostQuery().getAllPosts(20, 0)).resolves.toEqual(rows);

    const [sql] = poolQuery.mock.calls[0]!;
    expect(sql).toMatch(ALUMNI_ID_SUBQUERY);
    expect(sql).not.toMatch(/JOIN alumni/i);
  });

  it('getPostsByUserId returns author_alumni_id the same way', async () => {
    poolQuery.mockResolvedValue({ rows: [] });

    await new PostQuery().getPostsByUserId(7);

    const [sql, params] = poolQuery.mock.calls[0]!;
    expect(sql).toMatch(ALUMNI_ID_SUBQUERY);
    expect(sql).not.toMatch(/JOIN alumni/i);
    expect(params).toEqual([7]);
  });

  describe('updatePost', () => {
    it('sets both fields, then updated_at, and never user_id', async () => {
      poolQuery.mockResolvedValue({ rows: [{ id: 42 }] });

      await expect(
        new PostQuery().updatePost(42, { caption: 'caption', media_url: 'https://x.test/a.png' }),
      ).resolves.toEqual({ id: 42 });

      const [sql, params] = poolQuery.mock.calls[0]!;
      expect(sql).toMatch(/UPDATE posts SET caption=\$1, media_url=\$2, updated_at=NOW\(\)\s+WHERE id=\$3 RETURNING \*/);
      expect(sql).not.toMatch(/user_id/i);
      expect(params).toEqual(['caption', 'https://x.test/a.png', 42]);
    });

    it('sets only media_url when caption is omitted', async () => {
      poolQuery.mockResolvedValue({ rows: [{}] });

      await new PostQuery().updatePost(42, { media_url: 'https://x.test/b.png' });

      const [sql, params] = poolQuery.mock.calls[0]!;
      expect(sql).toMatch(/SET media_url=\$1, updated_at=NOW\(\)\s+WHERE id=\$2/);
      expect(sql).not.toMatch(/caption/);
      expect(params).toEqual(['https://x.test/b.png', 42]);
    });

    it('passes null as a parameter to clear a field', async () => {
      poolQuery.mockResolvedValue({ rows: [{}] });

      await new PostQuery().updatePost(42, { caption: null });

      const [sql, params] = poolQuery.mock.calls[0]!;
      expect(sql).toMatch(/SET caption=\$1, updated_at=NOW\(\)\s+WHERE id=\$2/);
      expect(sql).not.toMatch(/media_url/);
      expect(params).toEqual([null, 42]);
    });

    it('ignores keys outside the allowlist and never interpolates values', async () => {
      poolQuery.mockResolvedValue({ rows: [{}] });
      const patch = { caption: "x'; DROP TABLE posts; --", user_id: 99 } as unknown as { caption: string };

      await new PostQuery().updatePost(42, patch);

      const [sql, params] = poolQuery.mock.calls[0]!;
      expect(sql).not.toMatch(/user_id|DROP/i);
      expect(params).toEqual(["x'; DROP TABLE posts; --", 42]);
    });
  });
});
