/*
 * Test-only helpers for the admin page's component tests (imported by
 * *.test.tsx here, never by app code). A fake API at the axios adapter (the
 * REQ-001 test policy) and a render with a router and a fresh query client.
 * The page needs no session: the guard and the shell are tested elsewhere
 * (guards.test.tsx, AppShell.test.tsx). The app-wide src/test/ helper is
 * still the open follow-up QUAL-002 (G26).
 */
import type { AdminStats, AlumniListItem, AlumniListResponse } from '@alumni/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { createElement, type ReactElement } from 'react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { httpClient } from '@/services/httpClient';

export type Responder = (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>;

export function ok(data: unknown): Responder {
  return (config) => Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });
}

/** A rejected request, as axios gives one for a non-2xx (an adapter must reject itself, G26). */
export function fail(status: number, message = 'nope'): Responder {
  return (config) =>
    Promise.reject(
      new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, {
        data: { message },
        status,
        statusText: String(status),
        headers: {},
        config,
      }),
    );
}

/** Requests that wait until `release` answers every one of them with `respond`. */
export function held(): { responder: Responder; release: (respond: Responder) => void } {
  const waiting: ((respond: Responder) => void)[] = [];
  return {
    responder: (config) =>
      new Promise((resolve, reject) => {
        waiting.push((respond) => {
          respond(config).then(resolve, reject);
        });
      }),
    release: (respond) => {
      for (const answer of waiting.splice(0)) answer(respond);
    },
  };
}

export const STATS: AdminStats = { alumni: 1842, students: 230, posts: 12045, mentors: 312 };

/** `count` alumni named "<prefix> 1" … "<prefix> count", ids from `firstId`. */
export function alumni(count: number, prefix = 'Alum', firstId = 1): AlumniListItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: firstId + index,
    user_id: firstId + index + 100,
    name: `${prefix} ${String(index + 1)}`,
    graduation_year: 2015,
    department: 'Economics',
    university: 'Oxford',
    mentorship_available: index % 2 === 0,
  }));
}

export function page(items: AlumniListItem[], total: number): AlumniListResponse {
  return { items, total };
}

export interface FakeApi {
  /** Query params of every GET /alumni, in order. */
  searches: Record<string, unknown>[];
  /** Every request as "METHOD /url". */
  calls: string[];
  /** The parsed JSON body of every write handled by `writes`, in order. */
  bodies: unknown[];
}

const originalAdapter = httpClient.defaults.adapter;

/**
 * GET /admin/stats → `stats`, GET /alumni → `alumniHandler`, and any request
 * keyed "METHOD /url" in `writes` (e.g. "POST /admin/alumni") → its responder;
 * anything else rejects.
 */
export function mockApi(
  stats: Responder,
  alumniHandler: Responder,
  writes: Record<string, Responder> = {},
): FakeApi {
  const api: FakeApi = { searches: [], calls: [], bodies: [] };
  const adapter: AxiosAdapter = (config) => {
    const key = `${(config.method ?? 'get').toUpperCase()} ${config.url ?? ''}`;
    api.calls.push(key);
    if (key === 'GET /admin/stats') return stats(config);
    if (key === 'GET /alumni') {
      api.searches.push({ ...(config.params as Record<string, unknown>) });
      return alumniHandler(config);
    }
    const write = writes[key];
    if (write !== undefined) {
      api.bodies.push(
        typeof config.data === 'string' ? (JSON.parse(config.data) as unknown) : config.data,
      );
      return write(config);
    }
    return Promise.reject(new Error(`Unmocked request: ${key}`));
  };
  httpClient.defaults.adapter = adapter;
  return api;
}

export function restoreApi(): void {
  httpClient.defaults.adapter = originalAdapter;
}

/** Answers GET /alumni by the requested page: `pages[n - 1]` for page n, else an empty page. */
export function byPage(pages: AlumniListResponse[]): Responder {
  return (config) => {
    const params = config.params as { page: number };
    const data = pages[params.page - 1] ?? page([], pages[0]?.total ?? 0);
    return ok(data)(config);
  };
}

/** Renders `element` at `path` (under /admin) with a router and a no-retry query client. */
export function renderAt(element: ReactElement, path = '/admin') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
  });
  const router = createMemoryRouter([{ path: '/admin', element }], { initialEntries: [path] });
  render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(RouterProvider, { router }),
    ),
  );
  return { router, queryClient };
}
