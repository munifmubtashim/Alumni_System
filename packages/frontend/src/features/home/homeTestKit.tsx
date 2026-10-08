/*
 * Test-only helpers for the Home tests (imported by *.test.tsx here, never by
 * app code): a fake API at the axios adapter (the REQ-001 test policy), a
 * profile builder and a render helper. One copy for the Home tests (G26; the
 * app-wide src/test/ helper is the open follow-up QUAL-002). No app/ import:
 * this is not a test file to the lint rules, so it builds its own client.
 */
import type { MyProfile } from '@alumni/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { CURRENT_USER_QUERY_KEY } from '@/features/auth';
import { httpClient } from '@/services/httpClient';

export type Responder = (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>;

export const ok =
  (data: unknown): Responder =>
  (config) =>
    Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });

// A custom adapter must reject non-2xx itself (G26). Tests use a 4xx so the
// app's retry policy (5xx only) never delays the error state.
export const fail =
  (status = 400): Responder =>
  (config) =>
    Promise.reject(
      new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE, config, null, {
        data: { message: 'nope' },
        status,
        statusText: String(status),
        headers: {},
        config,
      }),
    );

/** Never answers: the query stays pending. */
export const never: Responder = () => new Promise<AxiosResponse>(() => undefined);

export interface SeenRequest {
  url: string;
  params: unknown;
}

/** Every request the fake API received, in order. */
export const requests: SeenRequest[] = [];
const originalAdapter = httpClient.defaults.adapter;

/**
 * Routes each request by URL. A URL takes its responders in turn and the last
 * one repeats; an unlisted URL never answers (so a section under test is not
 * disturbed by the others).
 */
export function mockApi(routes: Readonly<Record<string, Responder | readonly Responder[]>>): void {
  const calls = new Map<string, number>();
  const adapter: AxiosAdapter = (config) => {
    const url = config.url ?? '';
    requests.push({ url, params: config.params });
    const route = routes[url];
    if (route === undefined) return never(config);
    const list = typeof route === 'function' ? [route] : route;
    const count = (calls.get(url) ?? 0) + 1;
    calls.set(url, count);
    const responder = list[Math.min(count, list.length) - 1];
    return responder === undefined ? never(config) : responder(config);
  };
  httpClient.defaults.adapter = adapter;
}

export function resetApi(): void {
  requests.length = 0;
  httpClient.defaults.adapter = originalAdapter;
}

/** An alumni or student account (or one with neither row) for `['me']`. */
export function profile(
  kind: 'alumni' | 'student' | 'none',
  fields: Partial<MyProfile> = {},
): MyProfile {
  return {
    user_id: 1,
    name: 'Amina Rao',
    email: 'amina@example.com',
    role: kind === 'none' ? 'admin' : kind,
    alumni_id: kind === 'alumni' ? 7 : null,
    has_alumni_profile: kind === 'alumni',
    student_id: kind === 'student' ? 9 : null,
    has_student_profile: kind === 'student',
    ...fields,
  };
}

/**
 * Renders `ui` with a query client, a router and (when given) `['me']` already
 * loaded. Errors end at once (no retry); the app's retry policy is tested in
 * app/queryClient.test.ts.
 */
export function renderHome(ui: ReactNode, user?: MyProfile) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 30_000, refetchOnWindowFocus: false } },
  });
  if (user) queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
  // A wrapper, not a parent element, so `rerender` keeps the providers.
  const result = render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    ),
  });
  return { ...result, queryClient };
}
