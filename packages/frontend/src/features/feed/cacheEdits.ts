import type { Comment, Post } from '@alumni/shared';
import type { InfiniteData } from '@tanstack/react-query';

/**
 * Pure edits of the feed's query cache (ADR-09). Each takes the cached value
 * and returns a new one, never changing its input. An edit that finds nothing
 * to change returns the input as is; `undefined` in (nothing cached) gives
 * `undefined` out, which `setQueryData` treats as "leave the cache alone".
 */

/** A post or comment in the cache. A pending create has a negative `id` and a `clientKey`. */
export type FeedPost = Post & { clientKey?: string };
export type FeedComment = Comment & { clientKey?: string };

/**
 * One loaded page. `fetched` is how many posts the server sent for it; it
 * never changes with cache edits, so the next offset and "is there more"
 * stay right after adds and removes.
 */
export interface PostsPage {
  posts: FeedPost[];
  fetched: number;
}

/** The `['feed','posts']` cache: pages keyed by their offset. */
export type PostsData = InfiniteData<PostsPage, number>;

/** Where a post sat, so a removal can be put back exactly. */
export interface PostPosition {
  pageIndex: number;
  index: number;
}

/** A comment and the index it had in its thread. */
export interface CommentAt {
  comment: FeedComment;
  index: number;
}

function mapPages(data: PostsData, edit: (posts: FeedPost[]) => FeedPost[]): PostsData {
  const pages = data.pages.map((page) => {
    const posts = edit(page.posts);
    return posts === page.posts ? page : { ...page, posts };
  });
  return pages.some((page, i) => page !== data.pages[i]) ? { ...data, pages } : data;
}

/** The posts to show: all pages in order, each id once (offset paging can repeat one). */
export function feedPosts(data: PostsData): FeedPost[] {
  const seen = new Set<number>();
  const out: FeedPost[] = [];
  for (const page of data.pages) {
    for (const post of page.posts) {
      if (seen.has(post.id)) continue;
      seen.add(post.id);
      out.push(post);
    }
  }
  return out;
}

/** Puts a new post at the top of the first page. */
export function addPost(data: PostsData | undefined, post: FeedPost): PostsData | undefined {
  if (!data) return data;
  const [first, ...rest] = data.pages;
  if (!first) return { ...data, pages: [{ posts: [post], fetched: 0 }], pageParams: [0] };
  return { ...data, pages: [{ ...first, posts: [post, ...first.posts] }, ...rest] };
}

/** Merges `patch` into the post with `id` (also how a temp post takes its server id). */
export function replacePost(
  data: PostsData | undefined,
  id: number,
  patch: Partial<FeedPost>,
): PostsData | undefined {
  if (!data) return data;
  return mapPages(data, (posts) =>
    posts.some((p) => p.id === id)
      ? posts.map((p) => (p.id === id ? { ...p, ...patch } : p))
      : posts,
  );
}

/** Where the post with `id` is, or undefined. */
export function findPost(
  data: PostsData | undefined,
  id: number,
): (PostPosition & { post: FeedPost }) | undefined {
  if (!data) return undefined;
  for (const [pageIndex, page] of data.pages.entries()) {
    const index = page.posts.findIndex((p) => p.id === id);
    const post = page.posts[index];
    if (post) return { pageIndex, index, post };
  }
  return undefined;
}

/** Removes the post with `id` from every page. */
export function removePost(data: PostsData | undefined, id: number): PostsData | undefined {
  if (!data) return data;
  return mapPages(data, (posts) =>
    posts.some((p) => p.id === id) ? posts.filter((p) => p.id !== id) : posts,
  );
}

/**
 * Puts a removed post back at `at` (clamped to the page). Does nothing if a
 * post with that id is already there, so a refetch that brought it back
 * does not show it twice.
 */
export function insertPost(
  data: PostsData | undefined,
  post: FeedPost,
  at: PostPosition,
): PostsData | undefined {
  if (!data || findPost(data, post.id)) return data;
  const page = data.pages[at.pageIndex];
  if (!page) return addPost(data, post);
  const posts = [...page.posts];
  posts.splice(Math.min(at.index, posts.length), 0, post);
  const pages = data.pages.map((p, i) => (i === at.pageIndex ? { ...p, posts } : p));
  return { ...data, pages };
}

/** Adds `delta` to a post's `comment_count`, never going below 0. */
export function bumpCommentCount(
  data: PostsData | undefined,
  postId: number,
  delta: number,
): PostsData | undefined {
  if (!data) return data;
  return mapPages(data, (posts) =>
    posts.some((p) => p.id === postId)
      ? posts.map((p) =>
          p.id === postId
            ? { ...p, comment_count: Math.max(0, (p.comment_count ?? 0) + delta) }
            : p,
        )
      : posts,
  );
}

/** Adds a comment at the end of a loaded thread (threads are oldest first). */
export function addComment(
  list: FeedComment[] | undefined,
  comment: FeedComment,
): FeedComment[] | undefined {
  if (!list) return list;
  return [...list, comment];
}

/** Merges `patch` into the comment with `id`. */
export function replaceComment(
  list: FeedComment[] | undefined,
  id: number,
  patch: Partial<FeedComment>,
): FeedComment[] | undefined {
  if (!list?.some((c) => c.id === id)) return list;
  return list.map((c) => (c.id === id ? { ...c, ...patch } : c));
}

/**
 * The comment with `id` and its replies, with their indexes: what a delete
 * removes (the API deletes replies with their parent).
 */
export function commentWithReplies(list: FeedComment[] | undefined, id: number): CommentAt[] {
  if (!list) return [];
  const out: CommentAt[] = [];
  list.forEach((comment, index) => {
    if (comment.id === id || comment.parent_id === id) out.push({ comment, index });
  });
  return out;
}

/** Removes the comment with `id` and its replies. */
export function removeComment(
  list: FeedComment[] | undefined,
  id: number,
): FeedComment[] | undefined {
  if (!list?.some((c) => c.id === id || c.parent_id === id)) return list;
  return list.filter((c) => c.id !== id && c.parent_id !== id);
}

/**
 * Puts removed comments back at their old indexes (lowest first), skipping
 * any id already in the list.
 */
export function insertComments(
  list: FeedComment[] | undefined,
  removed: CommentAt[],
): FeedComment[] | undefined {
  if (!list) return list;
  const out = [...list];
  const sorted = [...removed].sort((a, b) => a.index - b.index);
  let changed = false;
  for (const { comment, index } of sorted) {
    if (out.some((c) => c.id === comment.id)) continue;
    out.splice(Math.min(index, out.length), 0, comment);
    changed = true;
  }
  return changed ? out : list;
}
