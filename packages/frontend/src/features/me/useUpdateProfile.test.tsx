import type { MyProfile } from '@alumni/shared';
import { QueryClient, QueryClientProvider, QueryObserver } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { AxiosError, type AxiosResponse } from 'axios';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CURRENT_USER_QUERY_KEY } from '@/features/auth';
import { SUGGESTED_ALUMNI_KEY } from '@/features/people';
import { clearToken, setToken } from '@/services/authToken';
import { httpClient } from '@/services/httpClient';
import { useUpdateProfile } from './useUpdateProfile';

function signIn(): void {
  const encode = (value: object) => window.btoa(JSON.stringify(value)).replace(/=+$/, '');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  setToken(`${encode({ alg: 'HS256' })}.${encode({ sub: 1, exp })}.sig`);
}

const PROFILE: MyProfile = {
  user_id: 1,
  name: 'Sophia Martins',
  email: 'sophia@example.com',
  role: 'alumni',
  alumni_id: 11,
  has_alumni_profile: true,
  student_id: null,
  has_student_profile: false,
};

const originalAdapter = httpClient.defaults.adapter;
let urls: string[] = [];

/** Answers each URL with a status; a status of 300 or more rejects (G26). */
function api(statuses: Record<string, number>, onRequest?: () => void): void {
  httpClient.defaults.adapter = (config) => {
    const url = config.url ?? '';
    urls.push(url);
    onRequest?.();
    const status = statuses[url] ?? 500;
    const data = url === '/me' ? { ...PROFILE, name: 'Saved name' } : undefined;
    const response: AxiosResponse = { data, status, statusText: '', headers: {}, config };
    if (status >= 300) {
      return Promise.reject(
        new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, {
          ...response,
          data: { message: 'Current password is incorrect' },
        }),
      );
    }
    return Promise.resolve(response);
  };
}

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  client.setQueryData(CURRENT_USER_QUERY_KEY, PROFILE);
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useUpdateProfile(), { wrapper });
  return { client, invalidate, result };
}

const PASSWORD = { current_password: 'oldpassword', new_password: 'newpassword1' };

beforeEach(() => {
  urls = [];
  signIn();
});

afterEach(() => {
  httpClient.defaults.adapter = originalAdapter;
  clearToken();
});

describe('useUpdateProfile', () => {
  it('saves the profile, writes ["me"] and refetches every cache that shows the user', async () => {
    api({ '/me': 200 });
    const { client, result } = setup();
    // The keys other features read (they are not imported: lazy features never
    // import each other). Seeded with data and an active observer each, so
    // invalidation shows up as a real refetch, not just a spy call.
    const keys = [
      ['feed', 'posts'],
      ['feed', 'comments', 1],
      ['alumni', 'profile', 11],
      ['alumni', 'search', {}],
      // Home and the Feed sidebar: ranked by the user's own department and
      // university, and the mentors list follows the mentorship switch.
      ['alumni', 'suggestions'],
      ['alumni', 'mentors'],
      ['posts', 'user', 1],
    ] as const;
    const fetches = new Map<string, number>();
    const unsubscribes = keys.map((queryKey) => {
      client.setQueryData(queryKey, []);
      const observer = new QueryObserver(client, {
        queryKey,
        queryFn: () => {
          const id = JSON.stringify(queryKey);
          fetches.set(id, (fetches.get(id) ?? 0) + 1);
          return [];
        },
        staleTime: Infinity,
      });
      return observer.subscribe(() => undefined);
    });

    const saved = await act(() =>
      result.current.mutateAsync({ profile: { name: 'Saved name' }, password: null }),
    );
    expect(urls).toEqual(['/me']);
    expect(saved).toEqual({
      profile: { ...PROFILE, name: 'Saved name' },
      passwordChanged: false,
      passwordError: null,
    });
    expect(client.getQueryData<MyProfile>(CURRENT_USER_QUERY_KEY)?.name).toBe('Saved name');
    await waitFor(() => {
      for (const queryKey of keys) {
        expect(fetches.get(JSON.stringify(queryKey)), JSON.stringify(queryKey)).toBe(1);
      }
    });
    for (const queryKey of keys) {
      expect(client.getQueryState(queryKey)?.status, JSON.stringify(queryKey)).toBe('success');
    }
    // ['me'] holds the saved profile; it is written, not refetched.
    expect(client.getQueryState(CURRENT_USER_QUERY_KEY)?.isInvalidated).toBe(false);
    unsubscribes.forEach((unsubscribe) => {
      unsubscribe();
    });
  });

  it('marks the suggested alumni stale, so Home and the Feed re-rank them (CORR-001)', async () => {
    api({ '/me': 200 });
    const { client, result } = setup();
    // No observer: the card is not on /me, so the entry only goes stale and
    // refetches when Home or the Feed mounts it again.
    client.setQueryData(SUGGESTED_ALUMNI_KEY, []);

    await act(() =>
      result.current.mutateAsync({
        profile: { name: 'Sophia Martins', department: 'Physics' },
        password: null,
      }),
    );

    expect(client.getQueryState(SUGGESTED_ALUMNI_KEY)?.isInvalidated).toBe(true);
  });

  it('skips PUT /api/me when only the password is sent, and leaves the cache alone', async () => {
    api({ '/me/password': 204 });
    const { client, invalidate, result } = setup();
    const saved = await act(() =>
      result.current.mutateAsync({ profile: null, password: PASSWORD }),
    );
    expect(urls).toEqual(['/me/password']);
    expect(saved).toMatchObject({ profile: null, passwordChanged: true, passwordError: null });
    expect(client.getQueryData(CURRENT_USER_QUERY_KEY)).toBe(PROFILE);
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('returns a password failure instead of throwing, after the profile saved', async () => {
    api({ '/me': 200, '/me/password': 400 });
    const { client, result } = setup();
    const saved = await act(() =>
      result.current.mutateAsync({ profile: { name: 'Saved name' }, password: PASSWORD }),
    );
    expect(urls).toEqual(['/me', '/me/password']);
    expect(saved.passwordChanged).toBe(false);
    expect(saved.passwordError).toBeInstanceOf(AxiosError);
    expect(client.getQueryData<MyProfile>(CURRENT_USER_QUERY_KEY)?.name).toBe('Saved name');
  });

  it('throws when PUT /api/me fails, and never sends the password', async () => {
    api({ '/me': 400, '/me/password': 204 });
    const { result } = setup();
    await act(async () => {
      await expect(
        result.current.mutateAsync({ profile: { name: 'x' }, password: PASSWORD }),
      ).rejects.toBeInstanceOf(AxiosError);
    });
    expect(urls).toEqual(['/me']);
  });

  it('does not write ["me"] back once the session is gone', async () => {
    // The token is dropped while the request is out (a 401 logout elsewhere).
    api({ '/me': 200 }, clearToken);
    const { client, invalidate, result } = setup();
    await act(() =>
      result.current.mutateAsync({ profile: { name: 'Saved name' }, password: null }),
    );
    expect(client.getQueryData(CURRENT_USER_QUERY_KEY)).toBe(PROFILE);
    expect(invalidate).not.toHaveBeenCalled();
  });
});
