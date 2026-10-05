import { beforeEach, describe, expect, it, vi } from 'vitest';
import pool from '../config/db';
import { PostDTO } from '../dto/PostDTO';
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

  it('updatePost never writes user_id', async () => {
    poolQuery.mockResolvedValue({ rows: [{}] });
    const post = new PostDTO(99, 0, 'caption', 'https://x.test/a.png');
    post.id = 42;

    await new PostQuery().updatePost(post);

    const [sql, params] = poolQuery.mock.calls[0]!;
    expect(sql).not.toMatch(/user_id/i);
    expect(params).toEqual(['caption', 'https://x.test/a.png', 42]);
    expect(params).not.toContain(99);
  });
});
