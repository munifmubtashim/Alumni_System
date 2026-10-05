import type { MyProfile } from '@alumni/shared';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { createStore } from 'jotai';
import { createMemoryRouter, type RouteObject } from 'react-router';
// react-router/dom's RouterProvider wires flushSync, as App.tsx does; the
// session redirects rely on it for a single navigation.
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_EXPIRED_MESSAGE } from '@/features/auth';
import { getToken, setToken, TOKEN_STORAGE_KEY } from '@/services/authToken';
import { httpClient, setUnauthorizedHandler } from '@/services/httpClient';
import { setPrefersDark } from '@/test/setup';
import { AppProviders } from '../providers';
import { createQueryClient } from '../queryClient';
import { createRoutes, routes } from '../router';

// ---- tokens and a fake API at the axios adapter (the REQ-001 test policy) ----

function base64url(value: object): string {
  return window
    .btoa(JSON.stringify(value))
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/** A JWT-shaped token expiring `seconds` from now (negative = already expired). */
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

type Responder = (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>;

function ok(data: unknown): Responder {
  return (config) => Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });
}

function fail(status: number): Responder {
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

const originalAdapter = httpClient.defaults.adapter;
const apiCalls: string[] = [];

/** Routes requests by "METHOD /url"; an unmocked request fails loudly. */
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

function renderAt(path: string, routeTree: RouteObject[] = routes) {
  const router = createMemoryRouter(routeTree, { initialEntries: [path] });

  // Every location change after the first render, as a path.
  const visits: string[] = [];
  let lastKey = router.state.location.key;
  router.subscribe(({ location }) => {
    if (location.key === lastKey) return;
    lastKey = location.key;
    visits.push(location.pathname);
  });

  render(
    <AppProviders queryClient={createQueryClient()} store={createStore()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { router, visits };
}

/** Seeds a live token and renders `/`, waiting for the signed-in home. */
async function renderSignedIn() {
  setToken(makeToken());
  const rendered = renderAt('/');
  await screen.findByRole('heading', { name: 'Welcome, Amina' });
  return rendered;
}

function Boom(): never {
  throw new Error('page failed');
}

function ShellBoom(): never {
  throw new Error('shell failed');
}

beforeEach(() => {
  apiCalls.length = 0;
  mockApi({ 'GET /me': ok(AMINA) });
});

afterEach(() => {
  httpClient.defaults.adapter = originalAdapter;
  setUnauthorizedHandler(null);
  vi.restoreAllMocks();
});

describe('AppShell', () => {
  // Was rendered at `/`; that is now behind RequireAuth, so a guest is shown
  // the shell at /login instead. Same header, toggle, main and skip link.
  it('renders the header, theme toggle, main area and skip link', () => {
    renderAt('/login');

    expect(screen.getByRole('banner')).toHaveTextContent('Alumni Network');
    expect(
      within(screen.getByRole('banner')).getByRole('radiogroup', { name: 'Theme' }),
    ).toBeInTheDocument();
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main');
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
  });

  it('applies and saves Dark when it is selected', async () => {
    const user = userEvent.setup();
    renderAt('/login');

    await user.click(screen.getByRole('radio', { name: 'Dark' }));

    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem('alumni.theme')).toBe('"dark"');
  });

  it('starts in System mode and follows the OS setting', () => {
    renderAt('/login');

    expect(screen.getByRole('radio', { name: 'System' })).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement.dataset.theme).toBe('light');

    act(() => {
      setPrefersDark(true);
    });
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('still renders the empty shell at an unknown path', () => {
    renderAt('/does-not-exist');

    expect(screen.getByRole('banner')).toHaveTextContent('Alumni Network');
    expect(screen.getByRole('main')).toBeEmptyDOMElement();
    expect(screen.queryByText('Something went wrong.')).not.toBeInTheDocument();
  });

  it('shows the route error inside the shell when a page throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    renderAt('/boom', createRoutes([{ path: 'boom', element: <Boom /> }]));

    expect(screen.getByRole('banner')).toHaveTextContent('Alumni Network');
    const main = screen.getByRole('main');
    expect(
      within(main).getByRole('heading', { name: 'Something went wrong.' }),
    ).toBeInTheDocument();
    expect(within(main).getByRole('link', { name: 'Go to the home page' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('shows the route error without the shell when the shell itself throws', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // Same route tree, with only the shell element swapped for one that throws,
    // so the outer errorElement on '/' is the one that must catch it.
    const [root, ...rest] = createRoutes();
    if (!root) throw new Error('createRoutes returned no routes');
    renderAt('/', [{ ...root, element: <ShellBoom /> }, ...rest]);

    expect(screen.getByRole('heading', { name: 'Something went wrong.' })).toBeInTheDocument();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalledWith(expect.objectContaining({ message: 'shell failed' }));
  });
});

describe('Header auth area', () => {
  it('shows Log in and Sign up links to a guest', () => {
    renderAt('/login');

    const banner = screen.getByRole('banner');
    expect(within(banner).getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(within(banner).getByRole('link', { name: 'Sign up' })).toHaveAttribute(
      'href',
      '/register',
    );
    expect(within(banner).queryByRole('button', { name: 'Amina' })).not.toBeInTheDocument();
  });

  it('shows a user menu with the name and role to a signed-in user', async () => {
    const user = userEvent.setup();
    await renderSignedIn();

    const banner = screen.getByRole('banner');
    expect(within(banner).queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
    const trigger = within(banner).getByRole('button', { name: 'Amina' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');

    await user.click(trigger);

    const menu = await screen.findByRole('menu');
    expect(within(menu).getByText('Amina')).toBeInTheDocument();
    expect(within(menu).getByText('Alumni')).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Log out' })).toBeInTheDocument();
  });

  it('opens the user menu from the keyboard', async () => {
    const user = userEvent.setup();
    await renderSignedIn();

    screen.getByRole('button', { name: 'Amina' }).focus();
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('menuitem', { name: 'Log out' })).toHaveFocus();
  });

  it('Log out clears the token and goes to /login', async () => {
    const user = userEvent.setup();
    const { router, visits } = await renderSignedIn();

    await user.click(screen.getByRole('button', { name: 'Amina' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Log out' }));

    expect(await screen.findByRole('button', { name: 'Log in' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(visits).toEqual(['/login']);
    expect(getToken()).toBeNull();
    expect(screen.queryByText(SESSION_EXPIRED_MESSAGE)).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('banner')).getByRole('link', { name: 'Sign up' }),
    ).toBeInTheDocument();
  });

  it('reads "Account" and still offers Log out while /me has failed', async () => {
    mockApi({ 'GET /me': fail(404) });
    setToken(makeToken());
    const user = userEvent.setup();
    const { router } = renderAt('/');

    await screen.findByRole('alert');
    await user.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Account' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Log out' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
    expect(getToken()).toBeNull();
  });
});

describe('App routes', () => {
  it('guest at / → /login → logs in → back at / with the welcome', async () => {
    const token = makeToken();
    mockApi({ 'POST /auth/login': ok({ token }), 'GET /me': ok(AMINA) });
    const user = userEvent.setup();
    const { router } = renderAt('/');

    expect(await screen.findByRole('textbox', { name: 'Email' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');

    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'amina@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-horse');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('heading', { name: 'Welcome, Amina' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
    expect(screen.getByText("You're signed in as an alumnus.")).toBeInTheDocument();
    expect(getToken()).toBe(token);
    expect(screen.getByRole('button', { name: 'Amina' })).toBeInTheDocument();
  });

  it('sends a signed-in user from /login to /', async () => {
    setToken(makeToken());
    const { router } = renderAt('/login');

    expect(await screen.findByRole('heading', { name: 'Welcome, Amina' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  it('sends a signed-in user from /register to /', async () => {
    setToken(makeToken());
    const { router } = renderAt('/register');

    expect(await screen.findByRole('heading', { name: 'Welcome, Amina' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  it('treats an expired token at load as a guest: /login, token dropped, no /me call', async () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, makeToken(-60));
    const { router } = renderAt('/');

    expect(await screen.findByRole('textbox', { name: 'Email' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    await waitFor(() => {
      expect(getToken()).toBeNull();
    });
    expect(apiCalls).not.toContain('GET /me');
    expect(screen.queryByText(SESSION_EXPIRED_MESSAGE)).not.toBeInTheDocument();
  });

  it('two simultaneous 401s end the session with one navigation and the notice', async () => {
    const { router, visits } = await renderSignedIn();
    mockApi({ 'GET /me': ok(AMINA), 'GET /posts': fail(401) });

    await act(async () => {
      await Promise.all([
        httpClient.get('/posts').catch(() => undefined),
        httpClient.get('/posts').catch(() => undefined),
      ]);
    });

    expect(await screen.findByText(SESSION_EXPIRED_MESSAGE)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(visits).toEqual(['/login']);
    expect(getToken()).toBeNull();
  });
});
