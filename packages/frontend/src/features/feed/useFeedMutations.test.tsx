import type { Comment, MyProfile, Post } from '@alumni/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CURRENT_USER_QUERY_KEY } from '@/features/auth';
import { clearToken, setToken } from '@/services/authToken';
import { httpClient } from '@/services/httpClient';
import { feedPosts, type FeedComment, type FeedPost, type PostsData } from './cacheEdits';
import { commentsQueryKey, POSTS_QUERY_KEY } from './constants';
import {
  useCreateComment,
  useCreatePost,
  useDeleteComment,
  useDeletePost,
  useUpdateComment,
  useUpdatePost,
} from './useFeedMutations';

// ---- a live token (the rollback checks for one) and a held-open fake API ----

function base64url(value: object): string {
  return window
    .btoa(JSON.stringify(value))
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function liveToken(): string {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${base64url({ alg: 'HS256' })}.${base64url({ sub: 1, exp })}.sig`;
}

interface Held {
  config: InternalAxiosRequestConfig;
  ok: (data?: unknown) => void;
  fail: (status: number, message?: string) => void;
}

let held: Held[] = [];
const originalAdapter = httpClient.defaults.adapter;

// Every request waits until the test answers it, so overlapping writes can be ordered.
function holdRequests(): void {
  httpClient.defaults.adapter = (config) =>
    new Promise<AxiosResponse>((resolve, reject) => {
      held.push({
        config,
        ok: (data) => {
          resolve({ data, status: 200, statusText: 'OK', headers: {}, config });
        },
        // A custom adapter must reject non-2xx itself (G26).
        fail: (status, message = 'nope') => {
          reject(
            new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, {
              data: { message },
              status,
              statusText: String(status),
              headers: {},
              config,
            }),
          );
        },
      });
    });
}

async function take(method: string, url: string): Promise<Held> {
  let found: Held | undefined;
  await waitFor(() => {
    found = held.find((h) => h.config.method === method && h.config.url === url);
    expect(found).toBeDefined();
  });
  if (!found) throw new Error(`no ${method} ${url}`);
  const request = found;
  held = held.filter((h) => h !== request);
  return request;
}

// ---- cache and hooks ----

const me: MyProfile = {
  user_id: 7,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  photo_url: 'ada.png',
  role: 'alumni',
  alumni_id: 3,
  has_alumni_profile: true,
  student_id: null,
  has_student_profile: false,
};

function post(id: number, extra: Partial<Post> = {}): Post {
  return {
    id,
    user_id: 9,
    caption: `Post ${String(id)}`,
    comment_count: 0,
    author_name: 'Bo',
    ...extra,
  };
}

function comment(id: number, extra: Partial<Comment> = {}): Comment {
  return {
    id,
    user_id: 9,
    post_id: 1,
    content: `Comment ${String(id)}`,
    author_name: 'Bo',
    ...extra,
  };
}

let client: QueryClient;

function seedPosts(...posts: Post[]): void {
  const data: PostsData = { pages: [{ posts, fetched: posts.length }], pageParams: [0] };
  client.setQueryData(POSTS_QUERY_KEY, data);
}

function posts(): FeedPost[] {
  const data = client.getQueryData<PostsData>(POSTS_QUERY_KEY);
  return data ? feedPosts(data) : [];
}

function countOf(id: number): number | undefined {
  return posts().find((p) => p.id === id)?.comment_count;
}

function thread(postId = 1): FeedComment[] | undefined {
  return client.getQueryData<FeedComment[]>(commentsQueryKey(postId));
}

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function feedRefetches(spy: { mock: { calls: unknown[][] } }): unknown[] {
  return spy.mock.calls.map((call) => call[0]);
}

beforeEach(() => {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  });
  client.setQueryData(CURRENT_USER_QUERY_KEY, me);
  setToken(liveToken());
  held = [];
  holdRequests();
});

afterEach(() => {
  httpClient.defaults.adapter = originalAdapter;
  client.clear();
});

describe('useCreatePost', () => {
  it('shows the post at once as the signed-in user, then takes the server id', async () => {
    seedPosts(post(1));
    const { result } = renderHook(() => useCreatePost(), { wrapper });

    act(() => {
      result.current.mutate({ caption: '  Hello  ' });
    });
    await waitFor(() => {
      expect(posts()).toHaveLength(2);
    });
    const temp = posts()[0];
    expect(temp).toMatchObject({
      user_id: 7,
      caption: 'Hello',
      author_name: 'Ada Lovelace',
      author_alumni_id: 3,
      author_photo: 'ada.png',
    });
    expect(temp?.id).toBeLessThan(0);
    const clientKey = temp?.clientKey;
    expect(clientKey).toEqual(expect.any(String));

    const request = await take('post', '/posts');
    expect(JSON.parse(String(request.config.data))).toEqual({ caption: 'Hello' });
    request.ok({ id: 50, user_id: 7, caption: 'Hello', comment_count: 0 });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(posts()[0]).toMatchObject({
      id: 50,
      clientKey,
      author_name: 'Ada Lovelace',
      author_alumni_id: 3,
    });
    expect(result.current.errorMessage).toBeNull();
  });

  it('removes the post and shows the API message when the server refuses', async () => {
    seedPosts(post(1));
    const { result } = renderHook(() => useCreatePost(), { wrapper });
    act(() => {
      result.current.mutate({ caption: 'Hello' });
    });
    (await take('post', '/posts')).fail(400, 'Caption must be text or null');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(posts().map((p) => p.id)).toEqual([1]);
    expect(result.current.errorMessage).toBe('Caption must be text or null');
  });

  it('two overlapping creates: the failed one goes, the other stays, one refetch at the end', async () => {
    seedPosts(post(1));
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const first = renderHook(() => useCreatePost(), { wrapper });
    const second = renderHook(() => useCreatePost(), { wrapper });

    act(() => {
      first.result.current.mutate({ caption: 'A' });
    });
    const a = await take('post', '/posts');
    act(() => {
      second.result.current.mutate({ caption: 'B' });
    });
    const b = await take('post', '/posts');
    expect(posts().map((p) => p.caption)).toEqual(['B', 'A', 'Post 1']);

    a.fail(500);
    await waitFor(() => {
      expect(first.result.current.isError).toBe(true);
    });
    expect(posts().map((p) => p.caption)).toEqual(['B', 'Post 1']);
    // B is still running, so A's settle must not refetch and drop B's pending row.
    expect(feedRefetches(invalidate)).toEqual([]);

    b.ok({ id: 60, user_id: 7, caption: 'B' });
    await waitFor(() => {
      expect(second.result.current.isSuccess).toBe(true);
    });
    expect(posts().map((p) => p.id)).toEqual([60, 1]);
    expect(feedRefetches(invalidate)).toEqual([{ queryKey: POSTS_QUERY_KEY, exact: true }]);
  });

  it('does not roll back after a 401 left no live token (ADR-09)', async () => {
    seedPosts(post(1));
    const { result } = renderHook(() => useCreatePost(), { wrapper });
    act(() => {
      result.current.mutate({ caption: 'Hello' });
    });
    const request = await take('post', '/posts');
    clearToken();
    request.fail(401);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(posts()).toHaveLength(2);
  });
});

describe('useUpdatePost', () => {
  it('shows the new text at once and keeps the server answer', async () => {
    seedPosts(post(1, { user_id: 7 }));
    const { result } = renderHook(() => useUpdatePost(), { wrapper });
    act(() => {
      result.current.mutate({ id: 1, caption: ' New ' });
    });
    await waitFor(() => {
      expect(posts()[0]?.caption).toBe('New');
    });
    const request = await take('put', '/posts/1');
    request.ok({ id: 1, user_id: 7, caption: 'New' });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(posts()[0]).toMatchObject({ caption: 'New', author_name: 'Bo' });
  });

  it('puts the old text back and shows a 403 message as is', async () => {
    seedPosts(post(1));
    const { result } = renderHook(() => useUpdatePost(), { wrapper });
    act(() => {
      result.current.mutate({ id: 1, caption: 'New' });
    });
    (await take('put', '/posts/1')).fail(403, 'You can only change your own posts');
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(posts()[0]?.caption).toBe('Post 1');
    expect(result.current.errorMessage).toBe('You can only change your own posts');
  });
});

describe('useDeletePost', () => {
  it('removes the post at once and drops its thread on success', async () => {
    seedPosts(post(2), post(1));
    client.setQueryData(commentsQueryKey(1), [comment(1)]);
    const { result } = renderHook(() => useDeletePost(), { wrapper });
    act(() => {
      result.current.mutate({ id: 1 });
    });
    await waitFor(() => {
      expect(posts().map((p) => p.id)).toEqual([2]);
    });
    (await take('delete', '/posts/1')).ok({ message: 'Post deleted' });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(thread()).toBeUndefined();
  });

  it('treats a 404 as success: the post stays removed and the feed refetches', async () => {
    seedPosts(post(2), post(1));
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useDeletePost(), { wrapper });
    act(() => {
      result.current.mutate({ id: 1 });
    });
    (await take('delete', '/posts/1')).fail(404, 'Post not found');
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(posts().map((p) => p.id)).toEqual([2]);
    expect(feedRefetches(invalidate)).toEqual([{ queryKey: POSTS_QUERY_KEY, exact: true }]);
  });

  it('puts the post back where it was on failure', async () => {
    seedPosts(post(3), post(2), post(1));
    const { result } = renderHook(() => useDeletePost(), { wrapper });
    act(() => {
      result.current.mutate({ id: 2 });
    });
    (await take('delete', '/posts/2')).fail(403, 'You can only change your own posts');
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(posts().map((p) => p.id)).toEqual([3, 2, 1]);
  });
});

describe('useCreateComment', () => {
  it('adds the comment at once, counts it, then takes the server row', async () => {
    seedPosts(post(1, { comment_count: 2 }));
    client.setQueryData(commentsQueryKey(1), [comment(1), comment(2)]);
    const { result } = renderHook(() => useCreateComment(1), { wrapper });
    act(() => {
      result.current.mutate({ content: 'Nice', parent_id: 1 });
    });
    await waitFor(() => {
      expect(thread()).toHaveLength(3);
    });
    expect(thread()?.[2]).toMatchObject({
      parent_id: 1,
      content: 'Nice',
      user_id: 7,
      author_name: 'Ada Lovelace',
    });
    expect(countOf(1)).toBe(3);

    const request = await take('post', '/posts/1/comments');
    expect(JSON.parse(String(request.config.data))).toEqual({ content: 'Nice', parent_id: 1 });
    request.ok(
      comment(30, { user_id: 7, parent_id: 1, content: 'Nice', author_name: 'Ada Lovelace' }),
    );
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(thread()?.map((c) => c.id)).toEqual([1, 2, 30]);
    expect(countOf(1)).toBe(3);
  });

  it('rolls back the comment and the count on failure', async () => {
    seedPosts(post(1, { comment_count: 2 }));
    client.setQueryData(commentsQueryKey(1), [comment(1), comment(2)]);
    const { result } = renderHook(() => useCreateComment(1), { wrapper });
    act(() => {
      result.current.mutate({ content: 'Nice' });
    });
    (await take('post', '/posts/1/comments')).fail(404, 'Post not found');
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(thread()?.map((c) => c.id)).toEqual([1, 2]);
    expect(countOf(1)).toBe(2);
    expect(result.current.errorMessage).toBe('Post not found');
  });

  it('counts a comment on a closed thread without creating the thread cache', async () => {
    seedPosts(post(1, { comment_count: 0 }));
    const { result } = renderHook(() => useCreateComment(1), { wrapper });
    act(() => {
      result.current.mutate({ content: 'Nice' });
    });
    await waitFor(() => {
      expect(countOf(1)).toBe(1);
    });
    (await take('post', '/posts/1/comments')).fail(500);
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(countOf(1)).toBe(0);
    expect(thread()).toBeUndefined();
  });
});

describe('useUpdateComment', () => {
  it('shows the new text at once and puts the old one back on failure', async () => {
    client.setQueryData(commentsQueryKey(1), [comment(1), comment(2)]);
    const { result } = renderHook(() => useUpdateComment(1), { wrapper });
    act(() => {
      result.current.mutate({ id: 2, content: 'Edited' });
    });
    await waitFor(() => {
      expect(thread()?.[1]?.content).toBe('Edited');
    });
    (await take('put', '/comments/2')).fail(403, 'You can only change your own comments');
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(thread()?.[1]?.content).toBe('Comment 2');
    expect(result.current.errorMessage).toBe('You can only change your own comments');
  });

  it('keeps the server row on success', async () => {
    client.setQueryData(commentsQueryKey(1), [comment(1)]);
    const { result } = renderHook(() => useUpdateComment(1), { wrapper });
    act(() => {
      result.current.mutate({ id: 1, content: 'Edited' });
    });
    (await take('put', '/comments/1')).ok(comment(1, { content: 'Edited' }));
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(thread()?.[0]?.content).toBe('Edited');
  });
});

describe('useDeleteComment', () => {
  const withReplies = [
    comment(1),
    comment(2, { parent_id: 1 }),
    comment(3),
    comment(4, { parent_id: 1 }),
  ];

  it('removes the comment and its replies and drops the count by as many', async () => {
    seedPosts(post(1, { comment_count: 4 }));
    client.setQueryData(commentsQueryKey(1), withReplies);
    const { result } = renderHook(() => useDeleteComment(1), { wrapper });
    act(() => {
      result.current.mutate({ id: 1 });
    });
    await waitFor(() => {
      expect(thread()?.map((c) => c.id)).toEqual([3]);
    });
    expect(countOf(1)).toBe(1);
    (await take('delete', '/comments/1')).ok({ message: 'Comment deleted' });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(countOf(1)).toBe(1);
  });

  it('puts the comments and the count back on failure', async () => {
    seedPosts(post(1, { comment_count: 4 }));
    client.setQueryData(commentsQueryKey(1), withReplies);
    const { result } = renderHook(() => useDeleteComment(1), { wrapper });
    act(() => {
      result.current.mutate({ id: 1 });
    });
    (await take('delete', '/comments/1')).fail(403, 'You can only change your own comments');
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(thread()?.map((c) => c.id)).toEqual([1, 2, 3, 4]);
    expect(countOf(1)).toBe(4);
  });

  it('restores only what the count really lost when it was already low', async () => {
    seedPosts(post(1, { comment_count: 1 }));
    client.setQueryData(commentsQueryKey(1), withReplies);
    const { result } = renderHook(() => useDeleteComment(1), { wrapper });
    act(() => {
      result.current.mutate({ id: 1 });
    });
    await waitFor(() => {
      expect(countOf(1)).toBe(0);
    });
    (await take('delete', '/comments/1')).fail(500);
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(countOf(1)).toBe(1);
  });

  it('treats a 404 as success and refetches the thread and the feed', async () => {
    seedPosts(post(1, { comment_count: 4 }));
    client.setQueryData(commentsQueryKey(1), withReplies);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteComment(1), { wrapper });
    act(() => {
      result.current.mutate({ id: 3 });
    });
    (await take('delete', '/comments/3')).fail(404, 'Comment not found');
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(thread()?.map((c) => c.id)).toEqual([1, 2, 4]);
    expect(countOf(1)).toBe(3);
    expect(feedRefetches(invalidate)).toEqual([
      { queryKey: commentsQueryKey(1), exact: true },
      { queryKey: POSTS_QUERY_KEY, exact: true },
    ]);
  });
});
