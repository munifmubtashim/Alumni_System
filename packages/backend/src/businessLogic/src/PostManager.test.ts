import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PostManager } from './PostManager';
import { expectAppError } from '../../test/expectAppError';

// A fake PostQuery: every PostManager gets this same object. The real PostDTO is kept.
const query = vi.hoisted(() => ({
  findPostById: vi.fn(),
  createPost: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
  getPostsByUserId: vi.fn(),
}));

vi.mock('@alumni/dal', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@alumni/dal')>()),
  PostQuery: class {
    constructor() {
      return query;
    }
  },
}));

const AUTHOR = { id: 7, role: 'alumni' };
const ADMIN = { id: 1, role: 'admin' };
const OTHER = { id: 8, role: 'student' };
const STORED_POST = { id: 42, user_id: 7, caption: 'old', media_url: null, comment_count: 3 };

describe('PostManager', () => {
  let manager: PostManager;

  beforeEach(() => {
    Object.values(query).forEach((fn) => fn.mockReset());
    query.findPostById.mockResolvedValue({ ...STORED_POST });
    query.updatePost.mockImplementation(async (id, patch) => ({ ...STORED_POST, ...patch, id }));
    manager = new PostManager();
  });

  describe('createNewPost', () => {
    it('makes the signed-in user the author and ignores body.user_id', async () => {
      query.createPost.mockImplementation(async (post) => post);

      await manager.createNewPost(7, { user_id: 99, caption: 'hello', media_url: 'https://x.test/a.png' });

      const stored = query.createPost.mock.calls[0]![0];
      expect(stored.user_id).toBe(7);
      expect(stored.caption).toBe('hello');
      expect(stored.media_url).toBe('https://x.test/a.png');
      expect(stored.comment_count).toBe(0);
    });

    // BUG-001: create validates like update, then trims; blank becomes null.
    it('trims caption and media, and stores a blank one as null', async () => {
      query.createPost.mockImplementation(async (post) => post);

      await manager.createNewPost(7, { caption: '  hello  ', media_url: '   ' });

      const stored = query.createPost.mock.calls[0]![0];
      expect(stored.caption).toBe('hello');
      expect(stored.media_url).toBeNull();
    });

    it('stores a post with media and no caption, caption as null', async () => {
      query.createPost.mockImplementation(async (post) => post);

      await manager.createNewPost(7, { caption: null, media_url: ' https://x.test/a.png ' });

      const stored = query.createPost.mock.calls[0]![0];
      expect(stored.caption).toBeNull();
      expect(stored.media_url).toBe('https://x.test/a.png');
    });

    it.each([
      ['caption', 5, 'Caption must be text or null'],
      ['caption', { a: 1 }, 'Caption must be text or null'],
      ['caption', true, 'Caption must be text or null'],
      ['media_url', 0, 'Media URL must be text or null'],
      ['media_url', ['x'], 'Media URL must be text or null'],
    ])('returns 400 when %s is %j', async (key, value, message) => {
      const error = await expectAppError(manager.createNewPost(7, { caption: 'ok', [key]: value }), 400);
      expect(error.message).toBe(message);
      expect(query.createPost).not.toHaveBeenCalled();
    });

    it.each([{}, { caption: null }, { caption: '' }, { caption: '   ', media_url: ' ' }, { caption: null, media_url: null }])(
      'returns 400 "A post needs a caption or media" for %j',
      async (body) => {
        const error = await expectAppError(manager.createNewPost(7, body), 400);
        expect(error.message).toBe('A post needs a caption or media');
        expect(query.createPost).not.toHaveBeenCalled();
      },
    );
  });

  describe('updatePost', () => {
    it('lets the author edit their post', async () => {
      const updated = await manager.updatePost(AUTHOR, '42', { caption: 'new', media_url: 'https://x.test/b.png' });

      expect(query.findPostById).toHaveBeenCalledWith(42);
      expect(query.updatePost).toHaveBeenCalledWith(42, { caption: 'new', media_url: 'https://x.test/b.png' });
      expect(updated).toMatchObject({ id: 42, user_id: 7, caption: 'new' });
    });

    it("lets an admin edit someone else's post without changing its author", async () => {
      await manager.updatePost(ADMIN, 42, { caption: 'moderated', user_id: 1 });

      expect(query.updatePost).toHaveBeenCalledWith(42, { caption: 'moderated' });
    });

    // AC14: only the fields sent change.
    it('keeps an omitted field: sends only the keys present', async () => {
      await manager.updatePost(AUTHOR, 42, { media_url: 'https://x.test/c.png' });
      expect(query.updatePost).toHaveBeenCalledWith(42, { media_url: 'https://x.test/c.png' });
    });

    it('clears a field sent as null', async () => {
      query.findPostById.mockResolvedValue({ ...STORED_POST, media_url: 'https://x.test/a.png' });
      await manager.updatePost(AUTHOR, 42, { caption: null });
      expect(query.updatePost).toHaveBeenCalledWith(42, { caption: null });
    });

    // BUG-001: the patch merged onto the stored row must keep a caption or media.
    it.each([{ caption: null }, { caption: '  ' }, { caption: '', media_url: null }])(
      'returns 400 "A post needs a caption or media" when %j leaves neither',
      async (body) => {
        const error = await expectAppError(manager.updatePost(AUTHOR, 42, body), 400);
        expect(error.message).toBe('A post needs a caption or media');
        expect(query.updatePost).not.toHaveBeenCalled();
      },
    );

    it('stores text as sent (no trimming)', async () => {
      await manager.updatePost(AUTHOR, 42, { caption: '  hi  ', media_url: '' });
      expect(query.updatePost).toHaveBeenCalledWith(42, { caption: '  hi  ', media_url: '' });
    });

    it.each([
      ['caption', 5],
      ['caption', { a: 1 }],
      ['caption', true],
      ['media_url', 0],
      ['media_url', ['x']],
      ['media_url', false],
    ])('returns 400 when %s is %j', async (key, value) => {
      await expectAppError(manager.updatePost(AUTHOR, 42, { [key]: value }), 400);
      expect(query.updatePost).not.toHaveBeenCalled();
    });

    it.each([{}, { user_id: 1 }])('returns 400 "Nothing to update" for %j', async (body) => {
      const error = await expectAppError(manager.updatePost(AUTHOR, 42, body), 400);
      expect(error.message).toBe('Nothing to update');
      expect(query.updatePost).not.toHaveBeenCalled();
    });

    it('checks 404 before validating the body', async () => {
      query.findPostById.mockResolvedValue(undefined);
      await expectAppError(manager.updatePost(AUTHOR, 999, { caption: 5 }), 404);
    });

    it('checks 403 before validating the body', async () => {
      await expectAppError(manager.updatePost(OTHER, 42, {}), 403);
      await expectAppError(manager.updatePost(OTHER, 42, { caption: 5 }), 403);
    });

    it('returns 403 for another user and does not update', async () => {
      await expectAppError(manager.updatePost(OTHER, 42, { caption: 'hijack' }), 403);
      expect(query.updatePost).not.toHaveBeenCalled();
    });

    it('returns 404 for a missing post', async () => {
      query.findPostById.mockResolvedValue(undefined);

      await expectAppError(manager.updatePost(AUTHOR, 999, { caption: 'x' }), 404);
      expect(query.updatePost).not.toHaveBeenCalled();
    });

    // requireId treats a malformed id as "not found" (404), same as comments.
    it.each(['abc', '0', '-1', '1.5', undefined])('rejects bad id %s without a lookup', async (id) => {
      await expectAppError(manager.updatePost(AUTHOR, id, { caption: 'x' }), 404);
      expect(query.findPostById).not.toHaveBeenCalled();
      expect(query.updatePost).not.toHaveBeenCalled();
    });
  });

  describe('deletePost', () => {
    it('lets the author delete their post', async () => {
      await manager.deletePost(AUTHOR, '42');
      expect(query.deletePost).toHaveBeenCalledWith(42);
    });

    it("lets an admin delete someone else's post", async () => {
      await manager.deletePost(ADMIN, 42);
      expect(query.deletePost).toHaveBeenCalledWith(42);
    });

    it('returns 403 for another user and does not delete', async () => {
      await expectAppError(manager.deletePost(OTHER, 42), 403);
      expect(query.deletePost).not.toHaveBeenCalled();
    });

    it('returns 404 for a missing post', async () => {
      query.findPostById.mockResolvedValue(undefined);

      await expectAppError(manager.deletePost(AUTHOR, 999), 404);
      expect(query.deletePost).not.toHaveBeenCalled();
    });

    it('rejects a bad id without a lookup', async () => {
      await expectAppError(manager.deletePost(AUTHOR, 'abc'), 404);
      expect(query.findPostById).not.toHaveBeenCalled();
      expect(query.deletePost).not.toHaveBeenCalled();
    });
  });

  describe('getPostsByUserId', () => {
    it('passes a plain numeric id to the query', async () => {
      query.getPostsByUserId.mockResolvedValue([]);

      await expect(manager.getPostsByUserId('7')).resolves.toEqual([]);
      expect(query.getPostsByUserId).toHaveBeenCalledWith(7);
    });

    it('rejects a bad id', async () => {
      await expectAppError(manager.getPostsByUserId('abc'), 404);
      expect(query.getPostsByUserId).not.toHaveBeenCalled();
    });
  });
});
