import { describe, expect, it } from 'vitest';
import type { FeedComment } from './cacheEdits';
import { POST_MAX_LENGTH } from './constants';
import {
  authorProfilePath,
  commentToggleLabel,
  composerPlaceholder,
  deletePostQuestion,
  firstName,
  groupThread,
  isEdited,
  isoDate,
  itemKey,
  postRemaining,
} from './feedFormat';

function c(id: number, parent_id: number | null = null): FeedComment {
  return { id, user_id: 1, post_id: 1, parent_id, content: `c${String(id)}` };
}

describe('isoDate', () => {
  it('gives ISO text for a date or string and undefined for missing or invalid', () => {
    expect(isoDate('2026-10-01T10:00:00.000Z')).toBe('2026-10-01T10:00:00.000Z');
    expect(isoDate(new Date('2026-10-01T10:00:00.000Z'))).toBe('2026-10-01T10:00:00.000Z');
    expect(isoDate(undefined)).toBeUndefined();
    expect(isoDate('not a date')).toBeUndefined();
  });
});

describe('isEdited', () => {
  const created = '2026-10-01T10:00:00.000Z';
  it('is true only when saved more than a second after the create', () => {
    expect(isEdited(created, '2026-10-01T10:00:01.000Z')).toBe(false);
    expect(isEdited(created, '2026-10-01T10:00:01.001Z')).toBe(true);
    expect(isEdited(created, created)).toBe(false);
  });
  it('is false when either date is missing or invalid', () => {
    expect(isEdited(undefined, created)).toBe(false);
    expect(isEdited(created, undefined)).toBe(false);
    expect(isEdited(created, 'bad')).toBe(false);
  });
});

describe('commentToggleLabel', () => {
  it('reads Comment for none, singular and plural counts, Hide comments when open', () => {
    expect(commentToggleLabel(0, false)).toBe('Comment');
    expect(commentToggleLabel(1, false)).toBe('1 comment');
    expect(commentToggleLabel(14, false)).toBe('14 comments');
    expect(commentToggleLabel(0, true)).toBe('Hide comments');
    expect(commentToggleLabel(3, true)).toBe('Hide comments');
  });
});

describe('deletePostQuestion', () => {
  it('names the number of comments that go with the post', () => {
    expect(deletePostQuestion(1)).toBe('Delete this post and its 1 comment?');
    expect(deletePostQuestion(4)).toBe('Delete this post and its 4 comments?');
  });
});

describe('firstName and composerPlaceholder', () => {
  it('uses the first word of the name', () => {
    expect(firstName('  Sophia  Martins ')).toBe('Sophia');
    expect(firstName('')).toBeUndefined();
    expect(firstName(undefined)).toBeUndefined();
    expect(composerPlaceholder('Sophia Martins')).toBe("What's on your mind, Sophia?");
    expect(composerPlaceholder(undefined)).toBe("What's on your mind?");
  });
});

describe('postRemaining', () => {
  it('shows the count only near the limit', () => {
    expect(postRemaining('hi')).toEqual({ left: POST_MAX_LENGTH - 2, show: false });
    expect(postRemaining('x'.repeat(POST_MAX_LENGTH - 200))).toEqual({ left: 200, show: true });
    expect(postRemaining('x'.repeat(POST_MAX_LENGTH))).toEqual({ left: 0, show: true });
  });
});

describe('authorProfilePath', () => {
  it('links by the alumni id and gives nothing without one', () => {
    expect(authorProfilePath(7)).toBe('/alumni/7');
    expect(authorProfilePath(null)).toBeUndefined();
    expect(authorProfilePath(undefined)).toBeUndefined();
  });
});

describe('groupThread', () => {
  it('puts replies under their parent in order', () => {
    const out = groupThread([c(1), c(2), c(3, 1), c(4, 2), c(5, 1)]);
    expect(out.map((e) => [e.comment.id, e.replies.map((r) => r.id)])).toEqual([
      [1, [3, 5]],
      [2, [4]],
    ]);
  });
  it('shows a reply on its own when its parent is missing or is itself a reply', () => {
    const out = groupThread([c(1), c(2, 1), c(3, 2), c(4, 99)]);
    expect(out.map((e) => e.comment.id)).toEqual([1, 3, 4]);
    expect(out[0]?.replies.map((r) => r.id)).toEqual([2]);
  });
  it('gives an empty list for an empty thread', () => {
    expect(groupThread([])).toEqual([]);
  });
});

describe('itemKey', () => {
  it('prefers the stable client key', () => {
    expect(itemKey({ id: 12, clientKey: 'temp-1' })).toBe('temp-1');
    expect(itemKey({ id: 12 })).toBe('12');
  });
});
