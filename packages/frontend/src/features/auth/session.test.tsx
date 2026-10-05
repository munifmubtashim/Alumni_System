import type { MyProfile, RegisterInput } from '@alumni/shared';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { createStore } from 'jotai';
import { StrictMode, type ReactNode } from 'react';
import { createMemoryRouter, Outlet, type InitialEntry, type RouteObject } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '@/app/providers';
import { createQueryClient } from '@/app/queryClient';
import { routes as appRoutes } from '@/app/router';
import { getToken, setToken, TOKEN_STORAGE_KEY } from '@/services/authToken';
import { httpClient, setUnauthorizedHandler } from '@/services/httpClient';
import { sessionNoticeAtom } from '@/store/sessionNoticeAtom';
import { GuestOnly, RequireAuth } from './guards';
import { SessionBridge } from './SessionBridge';
import { CURRENT_USER_QUERY_KEY, useCurrentUser } from './useCurrentUser';
import { useLogin } from './useLogin';
import { useLogout } from './useLogout';
import { useRegister } from './useRegister';

// ---- tokens and a fake API (axios adapter mock, per the test policy) ----

function base64url(value: object): string {
  return window
    .btoa(JSON.stringify(value))
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

let tokenSerial = 0;

/** A JWT-shaped token expiring `seconds` from now (negative = already expired). */
function makeToken(seconds = 3600): string {
  tokenSerial += 1;
  const exp = Math.floor(Date.now() / 1000) + seconds;
  return `${base64url({ alg: 'HS256' })}.${base64url({ sub: tokenSerial, exp })}.sig`;
}

type Responder = (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>;

function ok(data: unknown, status = 200): Responder {
  return (config) => Promise.resolve({ data, status, statusText: 'OK', headers: {}, config });
}

function httpError(config: InternalAxiosRequestConfig, status: number): AxiosError {
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, {
    data: { message: 'nope' },
    status,
    statusText: String(status),
    headers: {},
    config,
  });
}

function fail(status: number): Responder {
  return (config) => Promise.reject(httpError(config, status));
}

function profile(name: string): MyProfile {
  return {
    user_id: 1,
    name,
    email: `${name.toLowerCase()}@example.com`,
    role: 'student',
    alumni_id: null,
    has_alumni_profile: false,
    student_id: 1,
    has_student_profile: true,
  };
}

const originalAdapter = httpClient.defaults.adapter;
const apiCalls: string[] = [];

/** Routes requests by "METHOD /url"; an unmocked request fails the test loudly. */
function mockApi(handlers: Record<string, Responder>): void {
  const adapter: AxiosAdapter = (config) => {
    const key = `${(config.method ?? 'get').toUpperCase()} ${config.url ?? ''}`;
    apiCalls.push(key);
    const handler = handlers[key];
    if (!handler) return Promise.reject(new Error(`Unmocked request: ${key}`));
    return handler(config);
  };
  httpClient.defaults.adapter = adapter;
}

/** Fires an authed request whose 401 goes through the real interceptor. */
async function request401(): Promise<void> {
  await act(async () => {
    await httpClient.get('/posts').catch(() => undefined);
  });
}

// ---- a small app: the real bridge and guards, probe pages ----

function SignedInPage({ title }: { title: string }) {
  const { data } = useCurrentUser();
  const logout = useLogout();
  return (
    <section>
      <h1>{title}</h1>
      <p>Signed in as {data?.name}</p>
      <button type="button" onClick={logout}>
        Log out
      </button>
    </section>
  );
}

type Settled = { ok: true; value: unknown } | { ok: false; error: unknown };

// Each submit's outcome, captured so a rejection is never left unhandled.
const submissions: Promise<Settled>[] = [];

function track(promise: Promise<unknown>): void {
  submissions.push(
    promise.then(
      (value) => ({ ok: true, value }),
      (error: unknown) => ({ ok: false, error }),
    ),
  );
}

function LoginProbe() {
  const login = useLogin();
  return (
    <section>
      <h1>Login</h1>
      <p>login: {login.status}</p>
      <button
        type="button"
        onClick={() => {
          track(login.mutateAsync({ email: 'a@b.co', password: 'pw' }));
        }}
      >
        Log in
      </button>
    </section>
  );
}

const REGISTER_INPUT: RegisterInput = {
  role: 'alumni',
  name: 'Amina',
  email: 'amina@example.com',
  password: 'correct horse',
  university: 'Dhaka University',
};

function RegisterProbe() {
  const register = useRegister();
  return (
    <section>
      <h1>Register</h1>
      <button
        type="button"
        onClick={() => {
          track(register.mutateAsync(REGISTER_INPUT));
        }}
      >
        Sign up
      </button>
    </section>
  );
}

const testRoutes: RouteObject[] = [
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
          { path: 'login', element: <LoginProbe /> },
          { path: 'register', element: <RegisterProbe /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          { index: true, element: <SignedInPage title="Home" /> },
          { path: 'page', element: <SignedInPage title="Page" /> },
          { path: 'other', element: <SignedInPage title="Other" /> },
        ],
      },
    ],
  },
];

function testQueryClient() {
  const client = createQueryClient();
  client.setDefaultOptions({
    ...client.getDefaultOptions(),
    queries: { ...client.getDefaultOptions().queries, retryDelay: 0 },
  });
  return client;
}

function renderApp(entry: InitialEntry, { strict = false } = {}) {
  const queryClient = testQueryClient();
  const store = createStore();
  const router = createMemoryRouter(testRoutes, { initialEntries: [entry] });

  // Every location change after the first render, as path + search + hash.
  const visits: string[] = [];
  let lastKey = router.state.location.key;
  router.subscribe(({ location }) => {
    if (location.key === lastKey) return;
    lastKey = location.key;
    visits.push(location.pathname + location.search + location.hash);
  });

  const app = (
    <AppProviders queryClient={queryClient} store={store}>
      <RouterProvider router={router} />
    </AppProviders>
  );
  const { unmount } = render(strict ? <StrictMode>{app}</StrictMode> : app);
  return { router, queryClient, store, visits, unmount };
}

/** Signs in with a live token and waits until the page shows the user. */
async function renderSignedIn(path = '/page', options?: { strict?: boolean }) {
  const token = makeToken();
  setToken(token);
  const rendered = renderApp(path, options);
  await screen.findByText('Signed in as Amina');
  return { ...rendered, token };
}

beforeEach(() => {
  apiCalls.length = 0;
  submissions.length = 0;
  mockApi({ 'GET /me': ok(profile('Amina')), 'GET /posts': fail(401) });
});

afterEach(() => {
  httpClient.defaults.adapter = originalAdapter;
  setUnauthorizedHandler(null);
});

// ---- tests ----

describe('useCurrentUser', () => {
  function wrapper({ children }: { children: ReactNode }) {
    return (
      <AppProviders queryClient={testQueryClient()} store={createStore()}>
        {children}
      </AppProviders>
    );
  }

  it('does not fetch without a live token, then loads /me once one appears', async () => {
    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(apiCalls).toEqual([]);

    act(() => {
      setToken(makeToken());
    });

    await waitFor(() => {
      expect(result.current.data?.name).toBe('Amina');
    });
    expect(apiCalls).toEqual(['GET /me']);
  });

  it('does not fetch with an expired token', () => {
    setToken(makeToken(-60));
    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(apiCalls).toEqual([]);
  });
});

describe('login and sign-up', () => {
  it('stores the token, clears the notice, and GuestOnly goes straight to `from`', async () => {
    const token = makeToken();
    mockApi({ 'POST /auth/login': ok({ token }), 'GET /me': ok(profile('Amina')) });
    const user = userEvent.setup();
    const { router, store, visits } = renderApp({
      pathname: '/login',
      state: { from: { pathname: '/page', search: '?tab=2', hash: '#top' } },
    });
    act(() => {
      store.set(sessionNoticeAtom, 'expired');
    });

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('heading', { name: 'Page' })).toBeInTheDocument();
    expect(getToken()).toBe(token);
    expect(store.get(sessionNoticeAtom)).toBeNull();
    expect(router.state.location.pathname + router.state.location.search).toBe('/page?tab=2');
    expect(router.state.location.hash).toBe('#top');
    // Exactly one navigation, and never a flash of Home on the way.
    expect(visits).toEqual(['/page?tab=2#top']);
    await expect(submissions[0]).resolves.toEqual({ ok: true, value: { token } });
  });

  it('goes home after login when there is no `from`', async () => {
    mockApi({ 'POST /auth/login': ok({ token: makeToken() }), 'GET /me': ok(profile('Amina')) });
    const user = userEvent.setup();
    const { visits } = renderApp('/login');

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument();
    expect(visits).toEqual(['/']);
  });

  it('does not fetch /me inside the mutation', async () => {
    let releaseMe!: () => void;
    mockApi({
      'POST /auth/login': ok({ token: makeToken() }),
      'GET /me': (config) =>
        new Promise((resolve) => {
          releaseMe = () => {
            resolve({ data: profile('Amina'), status: 200, statusText: 'OK', headers: {}, config });
          };
        }),
    });
    const user = userEvent.setup();
    renderApp('/login');

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    // The mutation settles while /me is still pending; RequireAuth shows loading.
    await expect(submissions[0]).resolves.toMatchObject({ ok: true });
    expect(await screen.findByRole('status')).toHaveTextContent('Loading…');
    act(() => {
      releaseMe();
    });
    expect(await screen.findByText('Signed in as Amina')).toBeInTheDocument();
  });

  it('a wrong-password 401 fails the mutation without the session-expired path', async () => {
    mockApi({ 'POST /auth/login': fail(401) });
    const user = userEvent.setup();
    const { router, store, visits } = renderApp('/login');

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('login: error')).toBeInTheDocument();
    await expect(submissions[0]).resolves.toMatchObject({ ok: false, error: { status: 401 } });
    expect(getToken()).toBeNull();
    expect(store.get(sessionNoticeAtom)).toBeNull();
    expect(router.state.location.pathname).toBe('/login');
    expect(visits).toEqual([]);
  });

  it('a /me failure after sign-up leaves the user signed in, with no form error', async () => {
    const token = makeToken();
    mockApi({
      'POST /auth/register': ok({ token, user: { id: 1, name: 'Amina' } }, 201),
      'GET /me': fail(500),
    });
    const user = userEvent.setup();
    renderApp('/register');

    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    await expect(submissions[0]).resolves.toEqual({
      ok: true,
      value: { token, user: { id: 1, name: 'Amina' } },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load your account");
    expect(getToken()).toBe(token);
  });

  it("a sign-up 401 doesn't trigger the session-expired path", async () => {
    mockApi({ 'POST /auth/register': fail(401) });
    const user = userEvent.setup();
    const { store } = renderApp('/register');

    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    await expect(submissions[0]).resolves.toMatchObject({ ok: false, error: { status: 401 } });
    expect(store.get(sessionNoticeAtom)).toBeNull();
    expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
  });
});

describe('logout', () => {
  it('clears the token and the cache and goes to /login without a notice', async () => {
    const user = userEvent.setup();
    const { router, queryClient, store } = await renderSignedIn();

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(getToken()).toBeNull();
    expect(queryClient.getQueryData(CURRENT_USER_QUERY_KEY)).toBeUndefined();
    expect(store.get(sessionNoticeAtom)).toBeNull();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('from the header menu on "/" leaves no `from`, so the next login lands on "/"', async () => {
    mockApi({ 'GET /me': ok(profile('Amina')), 'POST /auth/login': ok({ token: makeToken() }) });
    setToken(makeToken());
    const user = userEvent.setup();
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/'] });
    render(
      <AppProviders queryClient={testQueryClient()} store={createStore()}>
        <RouterProvider router={router} />
      </AppProviders>,
    );
    await screen.findByRole('heading', { name: 'Welcome, Amina' });

    await user.click(screen.getByRole('button', { name: 'Amina' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Log out' }));
    await screen.findByRole('textbox', { name: 'Email' });

    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.state ?? {}).not.toHaveProperty('from');

    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'amina@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-horse');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('heading', { name: 'Welcome, Amina' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });
});

describe('SessionBridge', () => {
  it('a 401 with the current token logs out, empties the cache and sets the notice', async () => {
    const { router, queryClient, store } = await renderSignedIn('/page');
    // Navigate after the bridge mounted: `from` must be the latest page, not the first.
    await act(async () => {
      await router.navigate('/other?x=1');
    });
    await screen.findByRole('heading', { name: 'Other' });

    await request401();

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(getToken()).toBeNull();
    expect(queryClient.getQueryCache().getAll()).toEqual([]);
    expect(store.get(sessionNoticeAtom)).toBe('expired');
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.state).toMatchObject({
      from: { pathname: '/other', search: '?x=1' },
    });
  });

  it('ignores a 401 from an older token when a new login happened meanwhile', async () => {
    const { router, store } = await renderSignedIn('/page');
    const newToken = makeToken();
    mockApi({
      'GET /me': ok(profile('Amina')),
      'GET /posts': (config) => {
        // The request carried the old token; a new login lands before it fails.
        setToken(newToken);
        return fail(401)(config);
      },
    });

    await request401();

    expect(getToken()).toBe(newToken);
    expect(store.get(sessionNoticeAtom)).toBeNull();
    expect(router.state.location.pathname).toBe('/page');
  });

  it('ignores a 401 that arrives after a deliberate logout', async () => {
    const user = userEvent.setup();
    let sent = false;
    let reject401!: () => void;
    mockApi({
      'GET /me': ok(profile('Amina')),
      'GET /posts': (config) =>
        new Promise((_resolve, reject) => {
          sent = true;
          reject401 = () => {
            reject(httpError(config, 401));
          };
        }),
    });
    const token = makeToken();
    setToken(token);
    const { store, visits } = renderApp('/page');
    await screen.findByText('Signed in as Amina');

    const inFlight = httpClient.get('/posts').catch(() => undefined);
    await waitFor(() => {
      expect(sent).toBe(true);
    });
    await user.click(screen.getByRole('button', { name: 'Log out' }));
    await screen.findByRole('heading', { name: 'Login' });
    await act(async () => {
      reject401();
      await inFlight;
    });

    expect(store.get(sessionNoticeAtom)).toBeNull();
    expect(visits.filter((path) => path === '/login')).toHaveLength(1);
  });

  it('two simultaneous 401s cause one navigation', async () => {
    const { visits, store } = await renderSignedIn('/page');

    await act(async () => {
      await Promise.all([
        httpClient.get('/posts').catch(() => undefined),
        httpClient.get('/posts').catch(() => undefined),
      ]);
    });

    await screen.findByRole('heading', { name: 'Login' });
    expect(visits).toEqual(['/login']);
    expect(store.get(sessionNoticeAtom)).toBe('expired');
  });

  it('handles a second expiry later in the same page session', async () => {
    const { router, store } = await renderSignedIn('/page');
    await request401();
    await screen.findByRole('heading', { name: 'Login' });

    // Log in again (GuestOnly returns to /page), then that session expires too.
    act(() => {
      store.set(sessionNoticeAtom, null);
      setToken(makeToken());
    });
    await screen.findByRole('heading', { name: 'Page' });
    await request401();

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(getToken()).toBeNull();
    expect(store.get(sessionNoticeAtom)).toBe('expired');
    expect(router.state.location.pathname).toBe('/login');
  });

  it('keeps working under StrictMode (register, unregister, register)', async () => {
    const { store } = await renderSignedIn('/page', { strict: true });

    await request401();

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(store.get(sessionNoticeAtom)).toBe('expired');
  });

  it('stops handling 401s once unmounted', async () => {
    const { token, unmount } = await renderSignedIn('/page');

    unmount();
    await request401();

    expect(getToken()).toBe(token);
  });

  describe('clears the cache when the token changes', () => {
    let tokenB = '';

    beforeEach(() => {
      // /me answers with the user the request's token belongs to.
      mockApi({
        'GET /me': (config) => {
          const name = config.headers.Authorization === `Bearer ${tokenB}` ? 'Bilal' : 'Amina';
          return ok(profile(name))(config);
        },
      });
    });

    it('on an in-tab switch from one token to another', async () => {
      await renderSignedIn('/page');
      tokenB = makeToken();

      act(() => {
        setToken(tokenB);
      });

      // Without the clear, the fresh (30 s) cached Amina would still show.
      expect(await screen.findByText('Signed in as Bilal')).toBeInTheDocument();
    });

    it("on another tab's login (storage event)", async () => {
      await renderSignedIn('/page');
      tokenB = makeToken();

      act(() => {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, tokenB);
        window.dispatchEvent(
          new StorageEvent('storage', { key: TOKEN_STORAGE_KEY, newValue: tokenB }),
        );
      });

      expect(await screen.findByText('Signed in as Bilal')).toBeInTheDocument();
    });

    it("on another tab's logout (storage event)", async () => {
      const { queryClient, store } = await renderSignedIn('/page');

      act(() => {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        window.dispatchEvent(new StorageEvent('storage', { key: TOKEN_STORAGE_KEY }));
      });

      expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
      expect(queryClient.getQueryData(CURRENT_USER_QUERY_KEY)).toBeUndefined();
      expect(store.get(sessionNoticeAtom)).toBeNull();
    });
  });

  describe('ends the session when the token expires while signed in', () => {
    // Faked before any token is made, so Date.now and the timer share one clock.
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    /** Moves the clock forward by `ms` and runs the timers that fall due. */
    function advance(ms: number): void {
      act(() => {
        vi.advanceTimersByTime(ms);
      });
    }

    // makeToken() expires in 3600 s; the 10 s leeway makes it dead at 3590 s.
    const LIVE_FOR_MS = 3_590_000;

    it('like a 401: clears the token, sets the notice, goes to /login with `from`', async () => {
      const { router, queryClient, store } = await renderSignedIn('/page');

      advance(LIVE_FOR_MS - 5_000);
      expect(screen.getByRole('heading', { name: 'Page' })).toBeInTheDocument();
      advance(5_000);

      expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
      expect(getToken()).toBeNull();
      expect(store.get(sessionNoticeAtom)).toBe('expired');
      expect(queryClient.getQueryCache().getAll()).toEqual([]);
      expect(router.state.location.state).toMatchObject({ from: { pathname: '/page' } });
    });

    it("follows a new token: the old token's expiry no longer ends the session", async () => {
      const { store } = await renderSignedIn('/page');
      advance(1_800_000);
      act(() => {
        setToken(makeToken());
      });
      await screen.findByText('Signed in as Amina');

      advance(LIVE_FOR_MS - 1_800_000);
      expect(screen.getByRole('heading', { name: 'Page' })).toBeInTheDocument();
      expect(store.get(sessionNoticeAtom)).toBeNull();

      advance(1_800_000);
      expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
      expect(store.get(sessionNoticeAtom)).toBe('expired');
    });

    it('does nothing once unmounted', async () => {
      const { store, token, unmount } = await renderSignedIn('/page');
      unmount();

      advance(LIVE_FOR_MS);

      expect(getToken()).toBe(token);
      expect(store.get(sessionNoticeAtom)).toBeNull();
    });
  });

  it('silently clears a token that is already expired at boot', async () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, makeToken(-60));
    const { router, store, visits } = renderApp('/login');

    await waitFor(() => {
      expect(getToken()).toBeNull();
    });
    expect(store.get(sessionNoticeAtom)).toBeNull();
    expect(router.state.location.pathname).toBe('/login');
    expect(visits).toEqual([]);
    expect(apiCalls).toEqual([]);
  });

  it('sends an expired-at-boot visitor of a protected page to /login without a notice', async () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, makeToken(-60));
    const { router, store } = renderApp('/page');

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(getToken()).toBeNull();
    expect(store.get(sessionNoticeAtom)).toBeNull();
    expect(router.state.location.state).toMatchObject({ from: { pathname: '/page' } });
  });
});
