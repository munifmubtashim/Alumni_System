import type { Comment, CreateCommentInput, Post } from '@alumni/shared';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth';
import { getLiveToken } from '@/services/authToken';
import { isNotFoundError } from '@/services/httpErrors';
import {
  createComment,
  createPost,
  deleteComment,
  deletePost,
  updateComment,
  updatePost,
} from '@/services/postsApi';
import {
  addComment,
  addPost,
  bumpCommentCount,
  commentWithReplies,
  findPost,
  insertComments,
  insertPost,
  removeComment,
  removePost,
  replaceComment,
  replacePost,
  type CommentAt,
  type FeedComment,
  type FeedPost,
  type PostPosition,
  type PostsData,
} from './cacheEdits';
import {
  commentMutationKey,
  commentsMutationKey,
  commentsQueryKey,
  FEED_MUTATION_KEY,
  POSTS_QUERY_KEY,
  postMutationKey,
} from './constants';
import { feedErrorMessage } from './feedErrors';

/*
 * Optimistic writes for the feed, the ADR-09 way:
 * - onMutate cancels reads of the exact key, then edits the cache;
 * - onError applies the inverse edit (never a snapshot restore, so two
 *   overlapping writes cannot undo each other), unless no live token is left:
 *   after a 401 SessionBridge has cleared the cache and is leaving the page;
 * - onSettled refetches a key only when this is the last running mutation on it,
 *   so a refetch cannot drop another write's pending row.
 * Mutations are not retried (ADR-02). Each hook adds `errorMessage`, the text to
 * show for a failure.
 */

let tempSerial = 0;

/** A negative id for a pending create and a client key that outlives it. */
function nextTemp(): { id: number; clientKey: string } {
  tempSerial += 1;
  return { id: -tempSerial, clientKey: `temp-${String(tempSerial)}` };
}

function editPosts(
  client: QueryClient,
  edit: (data: PostsData | undefined) => PostsData | undefined,
) {
  client.setQueryData<PostsData>(POSTS_QUERY_KEY, edit);
}

function editComments(
  client: QueryClient,
  postId: number,
  edit: (list: FeedComment[] | undefined) => FeedComment[] | undefined,
) {
  client.setQueryData<FeedComment[]>(commentsQueryKey(postId), edit);
}

/** Rollback runs only while a live token remains (ADR-09). */
function canRollBack(): boolean {
  return getLiveToken() !== null;
}

/** Refetches the post list when no other feed write is still running. */
async function settlePosts(client: QueryClient) {
  if (client.isMutating({ mutationKey: FEED_MUTATION_KEY }) === 1) {
    await client.invalidateQueries({ queryKey: POSTS_QUERY_KEY, exact: true });
  }
}

/** Refetches a thread when no other write on it is still running. */
async function settleComments(client: QueryClient, postId: number) {
  if (client.isMutating({ mutationKey: commentsMutationKey(postId) }) === 1) {
    await client.invalidateQueries({ queryKey: commentsQueryKey(postId), exact: true });
  }
}

function withMessage<T extends { error: unknown }>(
  mutation: T,
): T & { errorMessage: string | null } {
  return {
    ...mutation,
    errorMessage: mutation.error === null ? null : feedErrorMessage(mutation.error),
  };
}

// ---- posts ----

export interface CreatePostVars {
  caption: string;
}

/** New post: shows at the top at once with the signed-in user as author. */
export function useCreatePost() {
  const client = useQueryClient();
  const { data: me } = useCurrentUser();
  const mutation = useMutation({
    mutationKey: postMutationKey('create'),
    mutationFn: ({ caption }: CreatePostVars) => createPost({ caption: caption.trim() }),
    onMutate: async ({ caption }: CreatePostVars) => {
      if (!me) return undefined;
      await client.cancelQueries({ queryKey: POSTS_QUERY_KEY, exact: true });
      const temp = nextTemp();
      const post: FeedPost = {
        ...temp,
        user_id: me.user_id,
        caption: caption.trim(),
        comment_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
        author_name: me.name,
        author_photo: me.photo_url,
        author_alumni_id: me.alumni_id,
      };
      editPosts(client, (data) => addPost(data, post));
      return temp;
    },
    onSuccess: (saved: Post, _vars, temp) => {
      // The API answers with the bare row: keep the author fields of the temp post.
      if (temp)
        editPosts(client, (data) =>
          replacePost(data, temp.id, { ...saved, clientKey: temp.clientKey }),
        );
    },
    onError: (_error, _vars, temp) => {
      if (temp && canRollBack()) editPosts(client, (data) => removePost(data, temp.id));
    },
    onSettled: () => settlePosts(client),
  });
  return withMessage(mutation);
}

export interface UpdatePostVars {
  id: number;
  caption: string;
}

/** Edit a post's text; shown at once, put back on failure. */
export function useUpdatePost() {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationKey: postMutationKey('update'),
    mutationFn: ({ id, caption }: UpdatePostVars) => updatePost(id, { caption: caption.trim() }),
    onMutate: async ({ id, caption }: UpdatePostVars) => {
      await client.cancelQueries({ queryKey: POSTS_QUERY_KEY, exact: true });
      const found = findPost(client.getQueryData<PostsData>(POSTS_QUERY_KEY), id);
      if (!found) return undefined;
      const before = { caption: found.post.caption, updated_at: found.post.updated_at };
      editPosts(client, (data) =>
        replacePost(data, id, { caption: caption.trim(), updated_at: new Date() }),
      );
      return before;
    },
    onSuccess: (saved: Post, { id }) => {
      editPosts(client, (data) =>
        replacePost(data, id, { caption: saved.caption, updated_at: saved.updated_at }),
      );
    },
    onError: (_error, { id }, before) => {
      if (before && canRollBack()) editPosts(client, (data) => replacePost(data, id, before));
    },
    onSettled: () => settlePosts(client),
  });
  return withMessage(mutation);
}

export interface DeletePostVars {
  id: number;
}

/** Delete a post (its comments go with it). A 404 means it is already gone: success. */
export function useDeletePost() {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationKey: postMutationKey('delete'),
    mutationFn: async ({ id }: DeletePostVars) => {
      try {
        await deletePost(id);
      } catch (error) {
        if (!isNotFoundError(error)) throw error;
      }
    },
    onMutate: async ({ id }: DeletePostVars) => {
      await client.cancelQueries({ queryKey: POSTS_QUERY_KEY, exact: true });
      const found = findPost(client.getQueryData<PostsData>(POSTS_QUERY_KEY), id);
      if (!found) return undefined;
      editPosts(client, (data) => removePost(data, id));
      const at: PostPosition = { pageIndex: found.pageIndex, index: found.index };
      return { post: found.post, at };
    },
    onSuccess: (_data, { id }) => {
      client.removeQueries({ queryKey: commentsQueryKey(id), exact: true });
    },
    onError: (_error, _vars, removed) => {
      if (removed && canRollBack())
        editPosts(client, (data) => insertPost(data, removed.post, removed.at));
    },
    onSettled: () => settlePosts(client),
  });
  return withMessage(mutation);
}

// ---- comments ----

/** New comment or reply on `postId`: shown at once and counted on the post. */
export function useCreateComment(postId: number) {
  const client = useQueryClient();
  const { data: me } = useCurrentUser();
  const mutation = useMutation({
    mutationKey: commentMutationKey(postId, 'create'),
    mutationFn: (input: CreateCommentInput) => createComment(postId, input),
    onMutate: async (input: CreateCommentInput) => {
      await client.cancelQueries({ queryKey: commentsQueryKey(postId), exact: true });
      await client.cancelQueries({ queryKey: POSTS_QUERY_KEY, exact: true });
      const temp = me ? nextTemp() : undefined;
      if (temp && me) {
        const comment: FeedComment = {
          ...temp,
          user_id: me.user_id,
          post_id: postId,
          parent_id: input.parent_id ?? null,
          content: input.content,
          created_at: new Date(),
          updated_at: new Date(),
          author_name: me.name,
          author_photo: me.photo_url,
          author_alumni_id: me.alumni_id,
        };
        editComments(client, postId, (list) => addComment(list, comment));
      }
      editPosts(client, (data) => bumpCommentCount(data, postId, 1));
      return { temp };
    },
    onSuccess: (saved: Comment, _vars, ctx) => {
      const temp = ctx.temp;
      if (temp) {
        editComments(client, postId, (list) =>
          replaceComment(list, temp.id, { ...saved, clientKey: temp.clientKey }),
        );
      }
    },
    onError: (_error, _vars, ctx) => {
      if (!ctx || !canRollBack()) return;
      const temp = ctx.temp;
      if (temp) editComments(client, postId, (list) => removeComment(list, temp.id));
      editPosts(client, (data) => bumpCommentCount(data, postId, -1));
    },
    onSettled: async () => {
      await settleComments(client, postId);
      await settlePosts(client);
    },
  });
  return withMessage(mutation);
}

export interface UpdateCommentVars {
  id: number;
  content: string;
}

/** Edit a comment's text; shown at once, put back on failure. */
export function useUpdateComment(postId: number) {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationKey: commentMutationKey(postId, 'update'),
    mutationFn: ({ id, content }: UpdateCommentVars) => updateComment(id, { content }),
    onMutate: async ({ id, content }: UpdateCommentVars) => {
      await client.cancelQueries({ queryKey: commentsQueryKey(postId), exact: true });
      const list = client.getQueryData<FeedComment[]>(commentsQueryKey(postId));
      const current = list?.find((c) => c.id === id);
      if (!current) return undefined;
      const before = { content: current.content, updated_at: current.updated_at };
      editComments(client, postId, (l) =>
        replaceComment(l, id, { content, updated_at: new Date() }),
      );
      return before;
    },
    onSuccess: (saved: Comment, { id }) => {
      editComments(client, postId, (list) => replaceComment(list, id, saved));
    },
    onError: (_error, { id }, before) => {
      if (before && canRollBack())
        editComments(client, postId, (list) => replaceComment(list, id, before));
    },
    onSettled: () => settleComments(client, postId),
  });
  return withMessage(mutation);
}

export interface DeleteCommentVars {
  id: number;
}

/**
 * Delete a comment and its replies; the post's count drops by as many. A 404
 * means it is already gone: success.
 */
export function useDeleteComment(postId: number) {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationKey: commentMutationKey(postId, 'delete'),
    mutationFn: async ({ id }: DeleteCommentVars) => {
      try {
        await deleteComment(id);
      } catch (error) {
        if (!isNotFoundError(error)) throw error;
      }
    },
    onMutate: async ({ id }: DeleteCommentVars) => {
      await client.cancelQueries({ queryKey: commentsQueryKey(postId), exact: true });
      await client.cancelQueries({ queryKey: POSTS_QUERY_KEY, exact: true });
      const removed: CommentAt[] = commentWithReplies(
        client.getQueryData<FeedComment[]>(commentsQueryKey(postId)),
        id,
      );
      // Thread not loaded: count the one comment we know about. The count
      // never drops below 0, so remember what was really taken off.
      const wanted = Math.max(removed.length, 1);
      const posts = client.getQueryData<PostsData>(POSTS_QUERY_KEY);
      const before = findPost(posts, postId)?.post.comment_count ?? 0;
      const count = Math.min(before, wanted);
      editComments(client, postId, (list) => removeComment(list, id));
      editPosts(client, (data) => bumpCommentCount(data, postId, -wanted));
      return { removed, count };
    },
    onError: (_error, _vars, ctx) => {
      if (!ctx || !canRollBack()) return;
      editComments(client, postId, (list) => insertComments(list, ctx.removed));
      editPosts(client, (data) => bumpCommentCount(data, postId, ctx.count));
    },
    onSettled: async () => {
      await settleComments(client, postId);
      await settlePosts(client);
    },
  });
  return withMessage(mutation);
}
