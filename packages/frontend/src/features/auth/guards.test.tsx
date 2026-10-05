import type { MyProfile } from '@alumni/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { createStore } from 'jotai';
import { createMemoryRouter, Outlet, type InitialEntry, type RouteObject } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/providers';
import { createQueryClient } from '@/app/queryClient';
import { getToken, setToken, TOKEN_STORAGE_KEY } from '@/services/authToken';
import { httpClient, setUnauthorizedHandler } from '@/services/httpClient';
import { GuestOnly, RequireAuth } from './guards';
import { resolveFrom } from './redirect';
import { SessionBridge } from './SessionBridge';
import { useCurrentUser } from './useCurrentUser';

function base64url(value: object): string {
  return window
    .btoa(JSON.stringify(value))
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function makeToken(seconds = 3600): string {
  const exp = Math.floor(Date.now() / 1000) + seconds;
  return `${base64url({ alg: 'HS256' })}.${base64url({ sub: 1, exp })}.sig`;
}

const AMINA: MyProfile = {
  user_id: 1,
  name: 'Amina',
  email: 'amina@example.com',
  role: 'alumni',
  alumni_id: 1,
  has_alumni_profile: true,
  student_id: null,
  has_student_profile: false,
};

type MeResponder = (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>;

const originalAdapter = httpClient.defaults.adapter;
let meCalls = 0;

function mockMe(respond: MeResponder): void {
  const adapter: AxiosAdapter = (config) => {
    if (config.url !== '/me') return Promise.reject(new Error(`Unmocked: ${config.url ?? ''}`));
    meCalls += 1;
    return respond(config);
  };
  httpClient.defaults.adapter = adapter;
}

const meOk: MeResponder = (config) =>
  Promise.resolve({ data: AMINA, status: 200, statusText: 'OK', headers: {}, config });

function meFails(status: number): MeResponder {
  return (config) =>
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

function Greeting() {
  const { data } = useCurrentUser();
  return <h1>Welcome, {data?.name}</h1>;
}

// The bridge sits beside the guarded tree, as AppShell will mount it.
const guardRoutes: RouteObject[] = [
  {
    path: '/',
    element: (
      <>
        <SessionBridge />
        <Outlet />
      </>
    ),
    children: [
      {
        element: <GuestOnly />,
        children: [
          { path: 'login', element: <h1>Login page</h1> },
          { path: 'register', element: <h1>Register page</h1> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          { index: true, element: <Greeting /> },
          { path: 'posts', element: <h1>Posts page</h1> },
        ],
      },
    ],
  },
];

function renderAt(entry: InitialEntry) {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({
    ...queryClient.getDefaultOptions(),
    queries: { ...queryClient.getDefaultOptions().queries, retryDelay: 0 },
  });
  const router = createMemoryRouter(guardRoutes, { initialEntries: [entry] });
  render(
    <AppProviders queryClient={queryClient} store={createStore()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { router };
}

beforeEach(() => {
  meCalls = 0;
  mockMe(meOk);
});

afterEach(() => {
  httpClient.defaults.adapter = originalAdapter;
  setUnauthorizedHandler(null);
});

describe('RequireAuth', () => {
  it('sends a guest to /login, remembering the page as `from`', async () => {
    const { router } = renderAt('/posts?page=2');

    expect(await screen.findByRole('heading', { name: 'Login page' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.state).toMatchObject({
      from: { pathname: '/posts', search: '?page=2' },
    });
    expect(meCalls).toBe(0);
  });

  it('treats an expired token as a guest', async () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, makeToken(-60));
    const { router } = renderAt('/');

    expect(await screen.findByRole('heading', { name: 'Login page' })).toBeInTheDocument();
    expect(router.state.location.state).toMatchObject({ from: { pathname: '/' } });
    expect(meCalls).toBe(0);
  });

  it('shows a loading line, then the page once /me has loaded', async () => {
    let release!: () => void;
    mockMe(
      (config) =>
        new Promise((resolve) => {
          release = () => {
            void meOk(config).then(resolve);
          };
        }),
    );
    setToken(makeToken());
    renderAt('/');

    expect(await screen.findByRole('status')).toHaveTextContent('Loading…');
    release();

    expect(await screen.findByRole('heading', { name: 'Welcome, Amina' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('offers Retry when /me fails, and recovers when it succeeds', async () => {
    let failing = true;
    mockMe((config) => (failing ? meFails(500)(config) : meOk(config)));
    setToken(makeToken());
    const user = userEvent.setup();
    renderAt('/');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("Couldn't load your account");
    expect(meCalls).toBe(3); // first try + 2 retries for a 5xx

    failing = false;
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('heading', { name: 'Welcome, Amina' })).toBeInTheDocument();
  });

  it('offers Log out when /me keeps failing (e.g. 404), which ends the session', async () => {
    mockMe(meFails(404));
    setToken(makeToken());
    const user = userEvent.setup();
    const { router } = renderAt('/');

    await screen.findByRole('alert');
    expect(meCalls).toBe(1); // 4xx is never retried
    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(await screen.findByRole('heading', { name: 'Login page' })).toBeInTheDocument();
    expect(getToken()).toBeNull();
    expect(router.state.location.state).toBeNull();
  });

  it('shows no error box for a 401; the session ends instead', async () => {
    mockMe(meFails(401));
    setToken(makeToken());
    renderAt('/');

    expect(await screen.findByRole('heading', { name: 'Login page' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(getToken()).toBeNull();
  });
});

describe('GuestOnly', () => {
  it('shows the login and register pages to a guest', async () => {
    renderAt('/login');
    expect(await screen.findByRole('heading', { name: 'Login page' })).toBeInTheDocument();
  });

  it.each(['/login', '/register'])('sends a signed-in user from %s to home', async (path) => {
    setToken(makeToken());
    const { router } = renderAt(path);

    expect(await screen.findByRole('heading', { name: 'Welcome, Amina' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  it('sends a signed-in user to a safe `from`', async () => {
    setToken(makeToken());
    const { router } = renderAt({
      pathname: '/login',
      state: { from: { pathname: '/posts', search: '?page=2', hash: '#c3' } },
    });

    expect(await screen.findByRole('heading', { name: 'Posts page' })).toBeInTheDocument();
    const { pathname, search, hash } = router.state.location;
    expect(pathname + search + hash).toBe('/posts?page=2#c3');
  });

  it.each(['//evil.com', '/\\evil.com', '/login', '/Register/'])(
    'ignores the unsafe `from` %s and goes home',
    async (fromPath) => {
      setToken(makeToken());
      const { router } = renderAt({ pathname: '/login', state: { from: { pathname: fromPath } } });

      expect(await screen.findByRole('heading', { name: 'Welcome, Amina' })).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/');
    },
  );

  it('guest → protected page → login → back to that page', async () => {
    const { router } = renderAt('/posts');
    await screen.findByRole('heading', { name: 'Login page' });

    setToken(makeToken());

    expect(await screen.findByRole('heading', { name: 'Posts page' })).toBeInTheDocument();
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/posts');
    });
  });
});

describe('resolveFrom', () => {
  it('keeps an app path with its search and hash', () => {
    expect(resolveFrom({ from: { pathname: '/posts', search: '?q=1', hash: '#x' } })).toBe(
      '/posts?q=1#x',
    );
    expect(resolveFrom({ from: { pathname: '/' } })).toBe('/');
  });

  it.each([
    ['no state', null],
    ['a string state', '/posts'],
    ['no from', { other: 1 }],
    ['a string from', { from: '/posts' }],
    ['no pathname', { from: { search: '?q' } }],
    ['a relative path', { from: { pathname: 'posts' } }],
    ['a protocol-relative URL', { from: { pathname: '//evil.com' } }],
    ['a backslash host', { from: { pathname: '/\\evil.com' } }],
    ['an absolute URL', { from: { pathname: 'https://evil.com/' } }],
    ['the login page', { from: { pathname: '/login' } }],
    ['the register page', { from: { pathname: '/register' } }],
    ['the login page in other case', { from: { pathname: '/LOGIN' } }],
    ['the login page with a trailing slash', { from: { pathname: '/login/' } }],
    ['a non-string search', { from: { pathname: '/posts', search: 5 } }],
    ['a search without ?', { from: { pathname: '/posts', search: '@evil.com' } }],
    ['a hash without #', { from: { pathname: '/posts', hash: 'x' } }],
  ])('rejects %s', (_label, state) => {
    expect(resolveFrom(state)).toBeNull();
  });
});
