import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { PostManager } from '@alumni/businesslogic';
import app from './app';
import { bearer, tokenFor } from './test/authHelpers';

// Automock: every manager method becomes a vi.fn() returning undefined.
vi.mock('@alumni/businesslogic');

describe('backend test harness', () => {
  it('GET /api/health answers 200 OK with no database', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'OK' });
  });

  it('routes reach the mocked manager, not the real one', async () => {
    const getAllPosts = vi.mocked(PostManager.prototype.getAllPosts);
    getAllPosts.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/posts')
      .set('Authorization', bearer(tokenFor({ sub: 1, role: 'student' })));

    expect(getAllPosts).toHaveBeenCalledWith(50, 0);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
