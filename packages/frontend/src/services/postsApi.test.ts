import type { Comment, Post } from '@alumni/shared';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import { httpClient } from './httpClient';
import {
  createComment,
  createPost,
  deleteComment,
  deletePost,
  listComments,
  listPosts,
  updateComment,
  updatePost,
} from './postsApi';

const originalAdapter = httpClient.defaults.adapter;

const post: Post = { id: 11, user_id: 7, caption: 'Hello', author_name: 'Ada Lovelace' };
const comment: Comment = { id: 5, user_id: 7, post_id: 11, content: 'Nice', author_name: 'Ada' };

// The fake adapter answers every request with `data` and keeps the config it got.
function respondWith(data: unknown): () => InternalAxiosRequestConfig {
  let captured: InternalAxiosRequestConfig | undefined;
  httpClient.defaults.adapter = (config) => {
    captured = config;
    return Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });
  };
  return () => {
    if (!captured) throw new Error('adapter was not called');
    return captured;
  };
}

// A custom adapter must reject non-2xx itself (G26).
function failWith(status: number): void {
  httpClient.defaults.adapter = (config) =>
    Promise.reject(
      new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, {
        data: { message: 'nope' },
        status,
        statusText: String(status),
        headers: {},
        config,
      }),
    );
}

// The JSON body axios actually sends (it is serialized before the adapter).
function bodyOf(config: InternalAxiosRequestConfig): unknown {
  return typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
}

interface Case {
  name: string;
  call: () => Promise<unknown>;
  method: string;
  url: string;
  body?: unknown;
  reply: unknown;
  returns: unknown;
}

const cases: Case[] = [
  {
    name: 'createPost',
    call: () => createPost({ caption: 'Hello' }),
    method: 'post',
    url: '/posts',
    body: { caption: 'Hello' },
    reply: post,
    returns: post,
  },
  {
    name: 'updatePost',
    call: () => updatePost(11, { caption: 'Edited' }),
    method: 'put',
    url: '/posts/11',
    body: { caption: 'Edited' },
    reply: post,
    returns: post,
  },
  {
    name: 'deletePost',
    call: () => deletePost(11),
    method: 'delete',
    url: '/posts/11',
    reply: { message: 'Post deleted successfully' },
    returns: undefined,
  },
  {
    name: 'listComments',
    call: () => listComments(11),
    method: 'get',
    url: '/posts/11/comments',
    reply: [comment],
    returns: [comment],
  },
  {
    name: 'createComment',
    call: () => createComment(11, { content: 'Nice' }),
    method: 'post',
    url: '/posts/11/comments',
    body: { content: 'Nice' },
    reply: comment,
    returns: comment,
  },
  {
    name: 'createComment (reply)',
    call: () => createComment(11, { content: 'Thanks', parent_id: 5 }),
    method: 'post',
    url: '/posts/11/comments',
    body: { content: 'Thanks', parent_id: 5 },
    reply: comment,
    returns: comment,
  },
  {
    name: 'updateComment',
    call: () => updateComment(5, { content: 'Edited' }),
    method: 'put',
    url: '/comments/5',
    body: { content: 'Edited' },
    reply: comment,
    returns: comment,
  },
  {
    name: 'deleteComment',
    call: () => deleteComment(5),
    method: 'delete',
    url: '/comments/5',
    reply: { message: 'Comment deleted successfully' },
    returns: undefined,
  },
];

describe('postsApi', () => {
  afterEach(() => {
    httpClient.defaults.adapter = originalAdapter;
  });

  it('listPosts gets /posts with limit and offset in the query string', async () => {
    const sent = respondWith([post]);

    await expect(listPosts({ limit: 20, offset: 40 })).resolves.toEqual([post]);

    const config = sent();
    expect(config.method).toBe('get');
    expect(config.url).toBe('/posts');
    const query = new URL(httpClient.getUri(config), 'http://localhost').searchParams;
    expect(Object.fromEntries(query)).toEqual({ limit: '20', offset: '40' });
  });

  it.each(cases)('$name sends $method $url and returns the answer', async (c) => {
    const sent = respondWith(c.reply);

    await expect(c.call()).resolves.toEqual(c.returns);

    const config = sent();
    expect(config.method).toBe(c.method);
    expect(config.url).toBe(c.url);
    if (c.body === undefined) expect(config.data).toBeUndefined();
    else expect(bodyOf(config)).toEqual(c.body);
  });

  it.each([{ name: 'listPosts', call: () => listPosts({ limit: 20, offset: 0 }) }, ...cases])(
    '$name rejects with the axios error on a non-2xx answer',
    async (c) => {
      failWith(403);

      const error: unknown = await c.call().catch((e: unknown) => e);

      expect(error).toBeInstanceOf(AxiosError);
      expect((error as AxiosError).response?.status).toBe(403);
    },
  );
});
