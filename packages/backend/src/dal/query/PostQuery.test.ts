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
