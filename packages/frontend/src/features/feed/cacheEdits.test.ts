import { describe, expect, it } from 'vitest';
import {
  addComment,
  addPost,
  bumpCommentCount,
  commentWithReplies,
  feedPosts,
  findPost,
  insertComments,
  insertPost,
  removeComment,
  removePost,
  replaceComment,
  replacePost,
  type FeedComment,
  type FeedPost,
  type PostsData,
} from './cacheEdits';

// Deep-freezes a value so any edit in place throws: proves the functions never mutate input.
function frozen<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) frozen(child);
  }
  return value;
}

function post(id: number, extra: Partial<FeedPost> = {}): FeedPost {
  return { id, user_id: 7, caption: `Post ${String(id)}`, comment_count: 0, ...extra };
}

function comment(id: number, extra: Partial<FeedComment> = {}): FeedComment {
  return { id, user_id: 7, post_id: 1, content: `Comment ${String(id)}`, ...extra };
}

function data(...pages: FeedPost[][]): PostsData {
  return frozen({
    pages: pages.map((posts) => ({ posts, fetched: posts.length })),
    pageParams: pages.map((_, i) => i * 20),
  });
}

function ids(d: PostsData | undefined): number[][] {
  return (d?.pages ?? []).map((p) => p.posts.map((x) => x.id));
}

describe('feedPosts', () => {
  it('flattens pages in order and keeps the first of a repeated id', () => {
    const d = data([post(3), post(2)], [post(2, { caption: 'again' }), post(1)]);
    const out = feedPosts(d);
    expect(out.map((p) => p.id)).toEqual([3, 2, 1]);
    expect(out[1]?.caption).toBe('Post 2');
  });
});

describe('addPost', () => {
  it('puts the post at the top of the first page and keeps fetched', () => {
    const d = data([post(2), post(1)], [post(0)]);
    const out = addPost(d, post(-1));
    expect(ids(out)).toEqual([[-1, 2, 1], [0]]);
    expect(out?.pages[0]?.fetched).toBe(2);
  });

  it('leaves an empty cache alone', () => {
    expect(addPost(undefined, post(-1))).toBeUndefined();
  });

  it('starts a first page when the cache has none', () => {
    const out = addPost(frozen({ pages: [], pageParams: [] }), post(-1));
    expect(ids(out)).toEqual([[-1]]);
  });
});

describe('replacePost', () => {
  it('merges the patch into the matching post, keeping other fields', () => {
    const d = data([post(-1, { clientKey: 'temp-1', author_name: 'Ada' })]);
    const out = replacePost(d, -1, { id: 9, caption: 'Saved' });
    expect(out?.pages[0]?.posts[0]).toEqual({
      id: 9,
      user_id: 7,
      caption: 'Saved',
      comment_count: 0,
      clientKey: 'temp-1',
      author_name: 'Ada',
    });
  });

  it('returns the same object when no post matches', () => {
    const d = data([post(1)]);
    expect(replacePost(d, 99, { caption: 'x' })).toBe(d);
    expect(replacePost(undefined, 1, {})).toBeUndefined();
  });
});

describe('findPost', () => {
  it('finds the page and index of a post', () => {
    const d = data([post(3)], [post(2), post(1)]);
    expect(findPost(d, 1)).toEqual({ pageIndex: 1, index: 1, post: post(1) });
    expect(findPost(d, 99)).toBeUndefined();
    expect(findPost(undefined, 1)).toBeUndefined();
  });
});

describe('removePost and insertPost', () => {
  it('removes a post from every page and puts it back where it was', () => {
    const d = data([post(3)], [post(2), post(1)]);
    const removed = removePost(d, 2);
    expect(ids(removed)).toEqual([[3], [1]]);
    expect(removed?.pages[1]?.fetched).toBe(2);
    const back = insertPost(removed, post(2), { pageIndex: 1, index: 0 });
    expect(ids(back)).toEqual([[3], [2, 1]]);
  });

  it('removePost returns the same object when the post is not cached', () => {
    const d = data([post(1)]);
    expect(removePost(d, 99)).toBe(d);
    expect(removePost(undefined, 1)).toBeUndefined();
  });

  it('insertPost skips a post that is already there (a refetch brought it back)', () => {
    const d = data([post(2), post(1)]);
    expect(insertPost(d, post(2), { pageIndex: 0, index: 0 })).toBe(d);
  });

  it('insertPost clamps the index and falls back to the top when the page is gone', () => {
    const d = data([post(3)]);
    expect(ids(insertPost(d, post(1), { pageIndex: 0, index: 9 }))).toEqual([[3, 1]]);
    expect(ids(insertPost(d, post(1), { pageIndex: 4, index: 0 }))).toEqual([[1, 3]]);
    expect(insertPost(undefined, post(1), { pageIndex: 0, index: 0 })).toBeUndefined();
  });
});

describe('bumpCommentCount', () => {
  it('adds and subtracts, treating a missing count as 0', () => {
    const d = data([post(1, { comment_count: 2 }), post(2, { comment_count: undefined })]);
    expect(bumpCommentCount(d, 1, 1)?.pages[0]?.posts[0]?.comment_count).toBe(3);
    expect(bumpCommentCount(d, 1, -2)?.pages[0]?.posts[0]?.comment_count).toBe(0);
    expect(bumpCommentCount(d, 2, 1)?.pages[0]?.posts[1]?.comment_count).toBe(1);
  });

  it('never goes below 0', () => {
    const d = data([post(1, { comment_count: 1 })]);
    expect(bumpCommentCount(d, 1, -3)?.pages[0]?.posts[0]?.comment_count).toBe(0);
  });

  it('returns the same object for an unknown post or empty cache', () => {
    const d = data([post(1)]);
    expect(bumpCommentCount(d, 99, 1)).toBe(d);
    expect(bumpCommentCount(undefined, 1, 1)).toBeUndefined();
  });
});

describe('comment edits', () => {
  const list = frozen([
    comment(1),
    comment(2, { parent_id: 1 }),
    comment(3),
    comment(4, { parent_id: 1 }),
  ]);

  it('addComment appends to a loaded thread and leaves an unloaded one alone', () => {
    expect(addComment(list, comment(-1))?.map((c) => c.id)).toEqual([1, 2, 3, 4, -1]);
    expect(addComment(undefined, comment(-1))).toBeUndefined();
  });

  it('replaceComment merges into the match (negative id to server id) and keeps clientKey', () => {
    const withTemp = frozen([...list, comment(-1, { clientKey: 'temp-1' })]);
    const out = replaceComment(withTemp, -1, { id: 10, content: 'Saved' });
    expect(out?.[4]).toEqual({ ...comment(10, { clientKey: 'temp-1' }), content: 'Saved' });
    expect(replaceComment(list, 99, { content: 'x' })).toBe(list);
    expect(replaceComment(undefined, 1, {})).toBeUndefined();
  });

  it('commentWithReplies lists the comment and its replies with their indexes', () => {
    expect(commentWithReplies(list, 1).map((x) => [x.comment.id, x.index])).toEqual([
      [1, 0],
      [2, 1],
      [4, 3],
    ]);
    expect(commentWithReplies(list, 3).map((x) => x.comment.id)).toEqual([3]);
    expect(commentWithReplies(undefined, 1)).toEqual([]);
  });

  it('removeComment drops the comment and its replies', () => {
    expect(removeComment(list, 1)?.map((c) => c.id)).toEqual([3]);
    expect(removeComment(list, 2)?.map((c) => c.id)).toEqual([1, 3, 4]);
    expect(removeComment(list, 99)).toBe(list);
    expect(removeComment(undefined, 1)).toBeUndefined();
  });

  it('insertComments puts removed comments back at their indexes', () => {
    const removed = commentWithReplies(list, 1);
    const after = frozen(removeComment(list, 1) ?? []);
    expect(insertComments(after, removed)?.map((c) => c.id)).toEqual([1, 2, 3, 4]);
  });

  it('insertComments skips ids already present and leaves an unloaded thread alone', () => {
    expect(insertComments(list, commentWithReplies(list, 1))).toBe(list);
    expect(insertComments(undefined, [])).toBeUndefined();
  });
});
