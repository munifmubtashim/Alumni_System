/*
 * Test-only helpers for the feed's component tests (imported by *.test.tsx
 * here, never by app code). One copy for the five feed component tests: the
 * token builder and adapter switch are otherwise repeated per file (G26;
 * the app-wide src/test/ helper is the open follow-up QUAL-002).
 */
import type { Comment, MyProfile, Post } from '@alumni/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { createElement, type ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { CURRENT_USER_QUERY_KEY } from '@/features/auth';
import { setToken } from '@/services/authToken';
import { httpClient } from '@/services/httpClient';

function base64url(value: object): string {
  return window
    .btoa(JSON.stringify(value))
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/** Stores a JWT-shaped token that expires in an hour (rollback needs a live token). */
export function signIn(): void {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  setToken(`${base64url({ alg: 'HS256' })}.${base64url({ sub: 1, exp })}.sig`);
}

export const ME: MyProfile = {
  user_id: 1,
  name: 'Sophia Martins',
  email: 'sophia@example.com',
  role: 'alumni',
  alumni_id: 11,
  has_alumni_profile: true,
  student_id: null,
  has_student_profile: false,
};

export const ADMIN: MyProfile = { ...ME, user_id: 2, name: 'Ada Admin', role: 'admin' };

const HOUR = 3_600_000;

export function makePost(id: number, extra: Partial<Post> = {}): Post {
  const created = new Date(Date.now() - 3 * 24 * HOUR).toISOString();
  return {
    id,
    user_id: 70,
    caption: `Post ${String(id)}`,
    comment_count: 0,
    author_name: 'Amira Mendes',
    author_alumni_id: 7,
    created_at: created as unknown as Date,
    updated_at: created as unknown as Date,
    ...extra,
  };
}

export function makeComment(id: number, extra: Partial<Comment> = {}): Comment {
  const created = new Date(Date.now() - 2 * 24 * HOUR).toISOString();
  return {
    id,
    user_id: 80,
    post_id: 1,
    parent_id: null,
    content: `Comment ${String(id)}`,
    author_name: 'Jonas Kessler',
    author_alumni_id: 8,
    created_at: created as unknown as Date,
    updated_at: created as unknown as Date,
    ...extra,
  };
}

type Reply = { ok: unknown } | { fail: number; message?: string };

interface Held {
  key: string;
  config: InternalAxiosRequestConfig;
  ok: (data?: unknown) => void;
  fail: (status: number, message?: string) => void;
}

function respond(config: InternalAxiosRequestConfig, reply: Reply): Promise<AxiosResponse> {
  if ('ok' in reply) {
    return Promise.resolve({ data: reply.ok, status: 200, statusText: 'OK', headers: {}, config });
  }
  // A custom adapter must reject non-2xx itself (G26).
  return Promise.reject(
    new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, {
      data: { message: reply.message ?? 'nope' },
      status: reply.fail,
      statusText: String(reply.fail),
      headers: {},
      config,
    }),
  );
}

/**
 * A fake API at the axios adapter. `on('get /posts', reply...)` answers in
 * order and repeats the last reply; `hold('post /posts')` makes the next such
 * request wait until the test answers it. Unknown requests fail with 500.
 */
export function fakeApi() {
  const replies = new Map<string, Reply[]>();
  const holds = new Set<string>();
  const held: Held[] = [];
  const calls: InternalAxiosRequestConfig[] = [];

  httpClient.defaults.adapter = (config) => {
    calls.push(config);
    const key = `${config.method ?? 'get'} ${config.url ?? ''}`;
    if (holds.has(key)) {
      holds.delete(key);
      return new Promise<AxiosResponse>((resolve, reject) => {
        held.push({
          key,
          config,
          ok: (data) => {
            respond(config, { ok: data }).then(resolve, reject);
          },
          fail: (status, message) => {
            respond(config, { fail: status, message }).then(resolve, reject);
          },
        });
      });
    }
    const queue = replies.get(key);
    const reply = queue && queue.length > 1 ? queue.shift() : queue?.[0];
    return respond(config, reply ?? { fail: 500 });
  };

  return {
    calls,
    on(key: string, ...answers: Reply[]) {
      replies.set(key, answers);
    },
    hold(key: string) {
      holds.add(key);
    },
    /** The held request for `key`, once it has been sent. */
    held(key: string): Held | undefined {
      return held.find((h) => h.key === key);
    },
    /** How many requests went to `key`. */
    count(key: string): number {
      return calls.filter((c) => `${c.method ?? 'get'} ${c.url ?? ''}` === key).length;
    },
  };
}

export const originalAdapter = httpClient.defaults.adapter;

/** A query client for tests: no retries; `['me']` seeded (unless null) so it never refetches. */
export function testClient(me: MyProfile | null = ME): QueryClient {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  });
  if (me) client.setQueryData(CURRENT_USER_QUERY_KEY, me);
  return client;
}

/** Renders `ui` with a query client and a memory router. */
export function renderWith(ui: ReactElement, client: QueryClient) {
  return render(
    createElement(QueryClientProvider, { client }, createElement(MemoryRouter, null, ui)),
  );
}
