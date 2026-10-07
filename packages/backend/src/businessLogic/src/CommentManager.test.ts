import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommentManager } from './CommentManager';
import { expectAppError } from '../../test/expectAppError';

// A fake CommentQuery: every CommentManager gets this same object. The real CommentDTO is kept.
const query = vi.hoisted(() => ({
  findCommentById: vi.fn(),
  updateComment: vi.fn(),
}));

vi.mock('@alumni/dal', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@alumni/dal')>()),
  CommentQuery: class {
    constructor() {
      return query;
    }
  },
}));

const AUTHOR = { id: 7, role: 'alumni' };
const ADMIN = { id: 1, role: 'admin' };
const OTHER = { id: 8, role: 'student' };
const STORED_COMMENT = { id: 42, user_id: 7, post_id: 3, parent_id: 10, content: 'old' };

describe('CommentManager', () => {
  let manager: CommentManager;

  beforeEach(() => {
    Object.values(query).forEach((fn) => fn.mockReset());
    query.findCommentById.mockResolvedValue({ ...STORED_COMMENT });
    query.updateComment.mockImplementation(async (id, content) => ({
      ...STORED_COMMENT,
      id,
      content,
      author_name: 'Ana',
      author_photo: null,
    }));
    manager = new CommentManager();
  });

  describe('updateComment', () => {
    it('lets the author edit their comment and returns the row with author fields', async () => {
      const updated = await manager.updateComment(AUTHOR, '42', { content: 'new text' });

      expect(query.findCommentById).toHaveBeenCalledWith(42);
      expect(query.updateComment).toHaveBeenCalledWith(42, 'new text');
      expect(updated).toMatchObject({ id: 42, user_id: 7, post_id: 3, parent_id: 10, content: 'new text', author_name: 'Ana' });
    });

    it("lets an admin edit someone else's comment", async () => {
      await manager.updateComment(ADMIN, 42, { content: 'moderated' });
      expect(query.updateComment).toHaveBeenCalledWith(42, 'moderated');
    });

    it('trims the text, like create', async () => {
      await manager.updateComment(AUTHOR, 42, { content: '  hi  ' });
      expect(query.updateComment).toHaveBeenCalledWith(42, 'hi');
    });

    it('ignores parent_id, post_id and user_id in the body', async () => {
      await manager.updateComment(AUTHOR, 42, { content: 'x', parent_id: 99, post_id: 98, user_id: 97 });
      expect(query.updateComment).toHaveBeenCalledTimes(1);
      expect(query.updateComment).toHaveBeenCalledWith(42, 'x');
    });

    it('returns 403 for another user and does not update', async () => {
      const error = await expectAppError(manager.updateComment(OTHER, 42, { content: 'hijack' }), 403);
      expect(error.message).toBe('You can only change your own comments');
      expect(query.updateComment).not.toHaveBeenCalled();
    });

    it('returns 404 for a missing comment', async () => {
      query.findCommentById.mockResolvedValue(undefined);

      const error = await expectAppError(manager.updateComment(AUTHOR, 999, { content: 'x' }), 404);
      expect(error.message).toBe('Comment not found');
      expect(query.updateComment).not.toHaveBeenCalled();
    });

    it('returns 404 when the comment is deleted between the lookup and the update', async () => {
      query.updateComment.mockResolvedValue(undefined);
      const error = await expectAppError(manager.updateComment(AUTHOR, 42, { content: 'x' }), 404);
      expect(error.message).toBe('Comment not found');
    });

    it.each([
      ['missing', {}],
      ['empty', { content: '' }],
      ['blank', { content: '   ' }],
      ['null', { content: null }],
      ['not text', { content: 5 }],
      ['over 2000 characters', { content: 'a'.repeat(2001) }],
      ['a NUL byte', { content: 'a\u0000b' }],
    ])('returns 400 when content is %s', async (_label, body) => {
      await expectAppError(manager.updateComment(AUTHOR, 42, body), 400);
      expect(query.updateComment).not.toHaveBeenCalled();
    });

    it('accepts exactly 2000 characters', async () => {
      await manager.updateComment(AUTHOR, 42, { content: 'a'.repeat(2000) });
      expect(query.updateComment).toHaveBeenCalledWith(42, 'a'.repeat(2000));
    });

    it('checks ownership before the body: a non-owner never sees a validation error', async () => {
      await expectAppError(manager.updateComment(OTHER, 42, {}), 403);
      await expectAppError(manager.updateComment(OTHER, 42, { content: 'a'.repeat(2001) }), 403);
    });

    it('checks 404 before the body', async () => {
      query.findCommentById.mockResolvedValue(undefined);
      await expectAppError(manager.updateComment(AUTHOR, 999, { content: '' }), 404);
    });

    // requireId treats a malformed id as "not found" (404).
    it.each(['abc', '0', '-1', '1.5', undefined])('rejects bad id %s without a lookup', async (id) => {
      await expectAppError(manager.updateComment(AUTHOR, id, { content: 'x' }), 404);
      expect(query.findCommentById).not.toHaveBeenCalled();
      expect(query.updateComment).not.toHaveBeenCalled();
    });
  });
});
