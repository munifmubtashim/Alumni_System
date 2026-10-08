import type { MyProfile } from '@alumni/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useQuery } from '@tanstack/react-query';
import { createStore } from 'jotai';
import { createMemoryRouter, Outlet, type InitialEntry, type RouteObject } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/providers';
import { createQueryClient } from '@/app/queryClient';
import { getAdminStats } from '@/services/adminApi';
import { getToken, setToken, TOKEN_STORAGE_KEY } from '@/services/authToken';
import { httpClient, setUnauthorizedHandler } from '@/services/httpClient';
import { GuestOnly, RequireAdmin, RequireAuth } from './guards';
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

const ADMIN: MyProfile = {
  ...AMINA,
  name: 'Ada',
  role: 'admin',
  alumni_id: null,
  has_alumni_profile: false,
};

const STUDENT: MyProfile = {
  ...AMINA,
  name: 'Sami',
  role: 'student',
  alumni_id: null,
  has_alumni_profile: false,
  student_id: 4,
  has_student_profile: true,
};

type MeResponder = (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>;

const originalAdapter = httpClient.defaults.adapter;
let meCalls = 0;
/** Every URL the app asked for, mocked or not, so a test can prove a request never left. */
const requested: string[] = [];

function mockMe(respond: MeResponder): void {
  const adapter: AxiosAdapter = (config) => {
    requested.push(config.url ?? '');
    if (config.url === '/admin/stats') {
      return Promise.resolve({
        data: { alumni: 1, students: 2, posts: 3, mentors: 0 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
    }
    if (config.url !== '/me') return Promise.reject(new Error(`Unmocked: ${config.url ?? ''}`));
    meCalls += 1;
    return respond(config);
  };
  httpClient.defaults.adapter = adapter;
}

function meReturns(profile: MyProfile): MeResponder {
  return (config) =>
    Promise.resolve({ data: profile, status: 200, statusText: 'OK', headers: {}, config });
}

const meOk: MeResponder = meReturns(AMINA);

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

/** Stands in for the admin page: it calls an admin endpoint as soon as it mounts. */
function AdminProbe() {
  const stats = useQuery({ queryKey: ['admin', 'stats'], queryFn: getAdminStats });
  return <h1>Admin page{stats.data ? ` (${String(stats.data.alumni)} alumni)` : ''}</h1>;
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
          // As in router.tsx: the admin guard nests inside RequireAuth.
          { element: <RequireAdmin />, children: [{ path: 'admin', element: <AdminProbe /> }] },
        ],
      },
      // RequireAdmin on its own, to reach its loading and error states.
      { element: <RequireAdmin />, children: [{ path: 'bare-admin', element: <AdminProbe /> }] },
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
  requested.length = 0;
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

describe('RequireAdmin', () => {
  it('sends a guest to /login, then back to /admin after logging in as an admin', async () => {
    mockMe(meReturns(ADMIN));
    const { router } = renderAt('/admin');

    expect(await screen.findByRole('heading', { name: 'Login page' })).toBeInTheDocument();
    expect(router.state.location.state).toMatchObject({ from: { pathname: '/admin' } });

    setToken(makeToken());

    expect(await screen.findByRole('heading', { name: /^Admin page/ })).toBeInTheDocument();
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/admin');
    });
  });

  it('renders the admin page for an admin, which may then call /admin', async () => {
    mockMe(meReturns(ADMIN));
    setToken(makeToken());
    renderAt('/admin');

    expect(
      await screen.findByRole('heading', { name: 'Admin page (1 alumni)' }),
    ).toBeInTheDocument();
    expect(requested).toContain('/admin/stats');
  });

  it.each([
    ['an alumni user', AMINA],
    ['a student', STUDENT],
  ])('shows %s the 403 page, sends no admin request and keeps the session', async (_who, me) => {
    mockMe(meReturns(me));
    const token = makeToken();
    setToken(token);
    const { router } = renderAt('/admin');

    expect(
      await screen.findByRole('heading', { level: 1, name: "You don't have access to this page" }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('heading', { name: /^Admin page/ })).not.toBeInTheDocument();
    expect(requested.filter((url) => url.startsWith('/admin'))).toEqual([]);
    expect(getToken()).toBe(token);
    expect(router.state.location.pathname).toBe('/admin');
  });

  it('shows the loading line while /me is pending', async () => {
    let release!: () => void;
    mockMe(
      (config) =>
        new Promise((resolve) => {
          release = () => {
            void meReturns(ADMIN)(config).then(resolve);
          };
        }),
    );
    setToken(makeToken());
    renderAt('/bare-admin');

    expect(await screen.findByRole('status')).toHaveTextContent('Loading…');
    expect(requested).not.toContain('/admin/stats');
    release();

    expect(await screen.findByRole('heading', { name: /^Admin page/ })).toBeInTheDocument();
  });

  it('offers Retry, not a 403, when /me fails, and recovers when it succeeds', async () => {
    let failing = true;
    mockMe((config) => (failing ? meFails(404)(config) : meReturns(ADMIN)(config)));
    setToken(makeToken());
    const user = userEvent.setup();
    renderAt('/bare-admin');

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load your account");
    expect(screen.queryByText("You don't have access to this page")).not.toBeInTheDocument();

    failing = false;
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('heading', { name: /^Admin page/ })).toBeInTheDocument();
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
