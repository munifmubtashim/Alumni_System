import type { Post } from '@alumni/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { httpClient } from '@/services/httpClient';
import { FEED_PAGE_SIZE } from './constants';
import { useComments } from './useComments';
import { usePosts } from './usePosts';

const originalAdapter = httpClient.defaults.adapter;
let requests: InternalAxiosRequestConfig[] = [];

function post(id: number): Post {
  return { id, user_id: 9, caption: `Post ${String(id)}` };
}

// Ids from `start` down, `count` of them (newest first, like the API).
function run(start: number, count: number): Post[] {
  return Array.from({ length: count }, (_, i) => post(start - i));
}

// Answers each request with the next reply in order and records its config.
function answer(...replies: unknown[]): void {
  httpClient.defaults.adapter = (config) => {
    requests.push(config);
    const data = replies.shift();
    return Promise.resolve<AxiosResponse>({
      data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });
  };
}

let client: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  requests = [];
});

afterEach(() => {
  httpClient.defaults.adapter = originalAdapter;
  client.clear();
});

describe('usePosts', () => {
  it('asks for 20 at offset 0, then at the sum of the raw page lengths', async () => {
    // Page 2 repeats post 81 (offset paging shifted): shown once.
    answer(run(100, FEED_PAGE_SIZE), [post(81), ...run(80, 5)]);
    const { result } = renderHook(() => usePosts(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(requests[0]?.params).toEqual({ limit: FEED_PAGE_SIZE, offset: 0 });
    expect(result.current.data).toHaveLength(FEED_PAGE_SIZE);
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });
    expect(requests[1]?.params).toEqual({ limit: FEED_PAGE_SIZE, offset: FEED_PAGE_SIZE });
    await waitFor(() => {
      expect(result.current.data?.map((p) => p.id)).toEqual(run(100, 25).map((p) => p.id));
    });
    expect(result.current.hasNextPage).toBe(false);
  });

  it('has no next page after a short first page', async () => {
    answer(run(3, 3));
    const { result } = renderHook(() => usePosts(), { wrapper });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.hasNextPage).toBe(false);
  });
});

describe('useComments', () => {
  it('fetches nothing while the thread is closed, then loads it when opened', async () => {
    answer([{ id: 1, user_id: 9, post_id: 4, content: 'Hi' }]);
    const { result, rerender } = renderHook(({ open }) => useComments(4, open), {
      wrapper,
      initialProps: { open: false },
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(requests).toHaveLength(0);

    rerender({ open: true });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(requests[0]?.url).toBe('/posts/4/comments');
    expect(result.current.data?.map((c) => c.id)).toEqual([1]);
  });
});
