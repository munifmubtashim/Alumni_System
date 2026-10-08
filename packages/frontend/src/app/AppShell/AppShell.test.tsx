import type { Alumni, AlumniListItem, MyProfile } from '@alumni/shared';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
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
import { RequireAdmin, RequireAuth, SESSION_EXPIRED_MESSAGE } from '@/features/auth';
import { clearToken, getToken, setToken, TOKEN_STORAGE_KEY } from '@/services/authToken';
import { httpClient, setUnauthorizedHandler } from '@/services/httpClient';
import { setPrefersDark } from '@/test/setup';
import { AppProviders } from '../providers';
import { createQueryClient } from '../queryClient';
import {
  ADMIN_ROUTE,
  createRoutes,
  DIRECTORY_ROUTE,
  FEED_ROUTE,
  ME_ROUTE,
  PROFILE_ROUTE,
  routes,
} from '../router';

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

// Same name, so the avatar button reads the same; only the role changes.
const AMINA_ADMIN: MyProfile = {
  ...AMINA,
  role: 'admin',
  alumni_id: null,
  has_alumni_profile: false,
};

const AMINA_STUDENT: MyProfile = {
  ...AMINA,
  role: 'student',
  alumni_id: null,
  has_alumni_profile: false,
  student_id: 7,
  has_student_profile: true,
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
  await screen.findByRole('heading', { name: 'Welcome back, Amina' });
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
    renderAt('/does-not-exist');

    expect(screen.getByRole('banner')).toHaveTextContent('Alma');
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

    expect(screen.getByRole('banner')).toHaveTextContent('Alma');
    expect(screen.getByRole('main')).toBeEmptyDOMElement();
    expect(screen.queryByText('Something went wrong.')).not.toBeInTheDocument();
  });

  it('shows the route error inside the shell when a page throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    renderAt('/boom', createRoutes([{ path: 'boom', element: <Boom /> }]));

    expect(screen.getByRole('banner')).toHaveTextContent('Alma');
    const main = screen.getByRole('main');
    expect(
      within(main).getByRole('heading', { name: 'Something went wrong.' }),
    ).toBeInTheDocument();
    expect(within(main).getByRole('link', { name: 'Go to the home page' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  // REQ-004 AC7 kept S1's nav links out until their pages exist. REQ-006 AC2
  // adds Directory, REQ-009 Feed, REQ-016 Home (REQ-012 keeps /me out of it): a guest's banner has only the
  // "Account" nav from HeaderAuth; a signed-in user's has only the "Main" nav.
  it('shows the guest only the Account nav, and a signed-in user only the Main nav', async () => {
    renderAt('/does-not-exist');

    let banner = screen.getByRole('banner');
    expect(
      within(banner)
        .getAllByRole('navigation')
        .map((nav) => nav.ariaLabel),
    ).toEqual(['Account']);
    expect(
      within(banner)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Alma', 'Log in', 'Sign up']);
    expect(within(banner).getByRole('link', { name: 'Alma' })).toHaveAttribute('href', '/');
    cleanup();

    await renderSignedIn();

    banner = screen.getByRole('banner');
    expect(
      within(banner)
        .getAllByRole('navigation')
        .map((nav) => nav.ariaLabel),
    ).toEqual(['Main']);
    expect(
      within(banner)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Alma', 'Home', 'Directory', 'Feed']);
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

// These tests pass their own stand-in pages to createRoutes, so the nav is
// checked without the real (lazy) directory page; that page is covered below.
function HomeStub() {
  return <h1>Home stub</h1>;
}

function DirectoryStub() {
  return <h1>Directory stub</h1>;
}

function FeedStub() {
  return <h1>Feed stub</h1>;
}

function MeStub() {
  return <h1>Me stub</h1>;
}

function ProfileStub() {
  return <h1>Profile stub</h1>;
}

function OtherStub() {
  return <h1>Other stub</h1>;
}

function AdminStub() {
  return <h1>Admin stub</h1>;
}

const NAV_TEST_ROUTES: RouteObject[] = [
  { index: true, element: <HomeStub /> },
  { path: 'directory/*', element: <DirectoryStub /> },
  { path: 'feed', element: <FeedStub /> },
  { path: 'me', element: <MeStub /> },
  { path: 'alumni/:id', element: <ProfileStub /> },
  { path: 'other', element: <OtherStub /> },
  { path: 'admin', element: <AdminStub /> },
];

function renderNavAt(path: string) {
  setToken(makeToken());
  return renderAt(path, createRoutes(NAV_TEST_ROUTES));
}

function mainNav() {
  return within(screen.getByRole('banner')).getByRole('navigation', { name: 'Main' });
}

describe('Header main nav', () => {
  it('is hidden from a guest', () => {
    // The stand-in pages are not behind RequireAuth, so a guest sees the shell.
    renderAt('/directory', createRoutes(NAV_TEST_ROUTES));

    const banner = screen.getByRole('banner');
    expect(within(banner).queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument();
    expect(within(banner).queryByRole('link', { name: 'Directory' })).not.toBeInTheDocument();
  });

  it('links to /directory', async () => {
    renderNavAt('/other');
    await screen.findByRole('heading', { name: 'Other stub' });

    expect(within(mainNav()).getByRole('link', { name: 'Directory' })).toHaveAttribute(
      'href',
      '/directory',
    );
  });

  it('is not marked current on another page', async () => {
    renderNavAt('/other');
    await screen.findByRole('heading', { name: 'Other stub' });

    expect(within(mainNav()).getByRole('link', { name: 'Directory' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it.each(['/directory', '/directory?q=ana&page=2', '/directory/42'])(
    'is marked current at %s',
    async (path) => {
      renderNavAt(path);
      await screen.findByRole('heading', { name: 'Directory stub' });

      expect(within(mainNav()).getByRole('link', { name: 'Directory' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    },
  );

  // REQ-016: Home leads the nav and, with `end`, is current on `/` only.
  it('lists Home, Directory, Feed in order, with Home linking to / and current there only', async () => {
    renderNavAt('/');
    await screen.findByRole('heading', { name: 'Home stub' });

    const links = within(mainNav()).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Home', 'Directory', 'Feed']);
    const home = within(mainNav()).getByRole('link', { name: 'Home' });
    expect(home).toHaveAttribute('href', '/');
    expect(home).toHaveAttribute('aria-current', 'page');
    for (const link of links.slice(1)) {
      expect(link).not.toHaveAttribute('aria-current');
    }
  });

  it.each([
    ['/directory', 'Directory stub'],
    ['/feed', 'Feed stub'],
    ['/alumni/1', 'Profile stub'],
    ['/me', 'Me stub'],
    ['/other', 'Other stub'],
  ])('does not mark Home current at %s', async (path, heading) => {
    renderNavAt(path);
    await screen.findByRole('heading', { name: heading });

    expect(within(mainNav()).getByRole('link', { name: 'Home' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('links to /feed and marks only Feed current there', async () => {
    renderNavAt('/feed');
    await screen.findByRole('heading', { name: 'Feed stub' });

    const feed = within(mainNav()).getByRole('link', { name: 'Feed' });
    expect(feed).toHaveAttribute('href', '/feed');
    expect(feed).toHaveAttribute('aria-current', 'page');
    expect(within(mainNav()).getByRole('link', { name: 'Directory' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  // REQ-012 AC1: Account settings is reached from the avatar menu, not the header nav.
  it('has no link to /me, and marks nothing current there', async () => {
    renderNavAt('/me');
    await screen.findByRole('heading', { name: 'Me stub' });

    const links = within(mainNav()).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/', '/directory', '/feed']);
    for (const link of links) {
      expect(link).not.toHaveAttribute('aria-current');
    }
  });

  // REQ-015: Admin shows to admins only, last, and is marked current on /admin.
  it('adds Admin for an admin, marked current at /admin', async () => {
    mockApi({ 'GET /me': ok(AMINA_ADMIN) });
    renderNavAt('/admin');
    await screen.findByRole('heading', { name: 'Admin stub' });

    const admin = await within(mainNav()).findByRole('link', { name: 'Admin' });
    expect(admin).toHaveAttribute('href', '/admin');
    expect(admin).toHaveAttribute('aria-current', 'page');
    expect(
      within(mainNav())
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Home', 'Directory', 'Feed', 'Admin']);
  });

  it.each([
    ['an alumni user', AMINA],
    ['a student', AMINA_STUDENT],
  ])('has no Admin link for %s', async (_who, me) => {
    mockApi({ 'GET /me': ok(me) });
    renderNavAt('/other');
    await screen.findByRole('heading', { name: 'Other stub' });
    await within(screen.getByRole('banner')).findByRole('button', {
      name: 'Account menu for Amina',
    });

    expect(
      within(mainNav())
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Home', 'Directory', 'Feed']);
  });

  it('goes to the directory on click and becomes current', async () => {
    const user = userEvent.setup();
    const { router } = renderNavAt('/other');
    await screen.findByRole('heading', { name: 'Other stub' });

    await user.click(within(mainNav()).getByRole('link', { name: 'Directory' }));

    expect(await screen.findByRole('heading', { name: 'Directory stub' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/directory');
    expect(within(mainNav()).getByRole('link', { name: 'Directory' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('is reachable by keyboard after the brand link', async () => {
    const user = userEvent.setup();
    renderNavAt('/other');
    await screen.findByRole('heading', { name: 'Other stub' });

    within(screen.getByRole('banner')).getByRole('link', { name: 'Alma' }).focus();
    await user.tab();

    expect(within(mainNav()).getByRole('link', { name: 'Home' })).toHaveFocus();
  });

  it('disappears when the session ends', async () => {
    renderNavAt('/other');
    await screen.findByRole('heading', { name: 'Other stub' });
    expect(mainNav()).toBeInTheDocument();

    // /other is not behind RequireAuth, so the header stays and must drop the nav.
    act(() => {
      clearToken();
    });

    const banner = screen.getByRole('banner');
    expect(within(banner).queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument();
    expect(within(banner).getByRole('link', { name: 'Log in' })).toBeInTheDocument();
  });
});

describe('Bottom tab bar (phone)', () => {
  function tabs() {
    return screen.getByRole('navigation', { name: 'Main tabs' });
  }

  /** Waits for ['me'], which the Profile tab's link depends on. */
  async function waitForProfile() {
    await within(screen.getByRole('banner')).findByRole('button', {
      name: 'Account menu for Amina',
    });
  }

  it('is hidden from a guest', () => {
    renderAt('/directory', createRoutes(NAV_TEST_ROUTES));

    expect(screen.queryByRole('navigation', { name: 'Main tabs' })).not.toBeInTheDocument();
  });

  // REQ-016: Profile (the user's own public profile) replaced the Account tab.
  it("lists the header nav's pages plus Profile, and no Account tab", async () => {
    renderNavAt('/other');
    await screen.findByRole('heading', { name: 'Other stub' });
    await waitForProfile();

    const labels = within(tabs())
      .getAllByRole('link')
      .map((link) => link.textContent);
    expect(labels).toEqual(['Home', 'Directory', 'Feed', 'Profile']);
    expect(labels.slice(0, -1)).toEqual(
      within(mainNav())
        .getAllByRole('link')
        .map((link) => link.textContent),
    );
    expect(within(tabs()).getByRole('link', { name: 'Directory' })).toHaveAttribute(
      'href',
      '/directory',
    );
    expect(within(tabs()).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(within(tabs()).getByRole('link', { name: 'Feed' })).toHaveAttribute('href', '/feed');
    expect(within(tabs()).getByRole('link', { name: 'Profile' })).toHaveAttribute(
      'href',
      '/alumni/1',
    );
    expect(within(tabs()).queryByRole('link', { name: 'Account' })).not.toBeInTheDocument();
  });

  it('gives every tab a decorative icon above its label', async () => {
    renderNavAt('/other');
    await screen.findByRole('heading', { name: 'Other stub' });

    for (const link of within(tabs()).getAllByRole('link')) {
      expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('marks Home current at / only', async () => {
    renderNavAt('/');
    await screen.findByRole('heading', { name: 'Home stub' });

    expect(within(tabs()).getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    cleanup();

    renderNavAt('/feed');
    await screen.findByRole('heading', { name: 'Feed stub' });
    expect(within(tabs()).getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it("marks the Profile tab current on the user's own profile only", async () => {
    mockApi({ 'GET /me': ok({ ...AMINA, alumni_id: 42 }) });
    renderNavAt('/alumni/42');
    await screen.findByRole('heading', { name: 'Profile stub' });

    const profile = await within(tabs()).findByRole('link', { name: 'Profile' });
    await waitFor(() => {
      expect(profile).toHaveAttribute('href', '/alumni/42');
    });
    expect(profile).toHaveAttribute('aria-current', 'page');
    cleanup();

    renderNavAt('/alumni/7');
    await screen.findByRole('heading', { name: 'Profile stub' });
    await waitForProfile();
    expect(within(tabs()).getByRole('link', { name: 'Profile' })).toHaveAttribute(
      'href',
      '/alumni/42',
    );
    expect(within(tabs()).getByRole('link', { name: 'Profile' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  // REQ-016 A1: with no alumni profile there is no public page, so Profile opens /me.
  it.each([
    ['a student', AMINA_STUDENT],
    ['an admin with no alumni profile', AMINA_ADMIN],
  ])('sends the Profile tab to /me for %s, current there', async (_who, me) => {
    mockApi({ 'GET /me': ok(me) });
    renderNavAt('/me');
    await screen.findByRole('heading', { name: 'Me stub' });
    await waitForProfile();

    const profile = within(tabs()).getByRole('link', { name: 'Profile' });
    expect(profile).toHaveAttribute('href', '/me');
    expect(profile).toHaveAttribute('aria-current', 'page');
  });

  it('sits outside the header, after the page', async () => {
    renderNavAt('/other');
    await screen.findByRole('heading', { name: 'Other stub' });

    expect(
      within(screen.getByRole('banner')).queryByRole('navigation', { name: 'Main tabs' }),
    ).toBeNull();
    expect(
      screen.getByRole('main').compareDocumentPosition(tabs()) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('marks the current page, with a decorative icon above the label', async () => {
    renderNavAt('/directory?page=2');
    await screen.findByRole('heading', { name: 'Directory stub' });

    const link = within(tabs()).getByRole('link', { name: 'Directory' });
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('marks the Feed tab current at /feed, with its own decorative icon', async () => {
    renderNavAt('/feed');
    await screen.findByRole('heading', { name: 'Feed stub' });

    const link = within(tabs()).getByRole('link', { name: 'Feed' });
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(within(tabs()).getByRole('link', { name: 'Directory' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('marks no tab current at /me for an alumni user (Profile is their public page)', async () => {
    renderNavAt('/me');
    await screen.findByRole('heading', { name: 'Me stub' });
    await waitForProfile();

    for (const link of within(tabs()).getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current');
    }
  });

  it('adds an Admin tab last for an admin, current at /admin with its own icon', async () => {
    mockApi({ 'GET /me': ok(AMINA_ADMIN) });
    renderNavAt('/admin');
    await screen.findByRole('heading', { name: 'Admin stub' });

    const link = await within(tabs()).findByRole('link', { name: 'Admin' });
    expect(link).toHaveAttribute('href', '/admin');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(
      within(tabs())
        .getAllByRole('link')
        .map((tab) => tab.textContent),
    ).toEqual(['Home', 'Directory', 'Feed', 'Profile', 'Admin']);
  });

  it('has no Admin tab for a student', async () => {
    mockApi({ 'GET /me': ok(AMINA_STUDENT) });
    renderNavAt('/other');
    await screen.findByRole('heading', { name: 'Other stub' });
    await within(screen.getByRole('banner')).findByRole('button', {
      name: 'Account menu for Amina',
    });

    expect(
      within(tabs())
        .getAllByRole('link')
        .map((tab) => tab.textContent),
    ).toEqual(['Home', 'Directory', 'Feed', 'Profile']);
  });

  it('is not marked current on another page', async () => {
    renderNavAt('/other');
    await screen.findByRole('heading', { name: 'Other stub' });

    for (const link of within(tabs()).getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current');
    }
  });
});

describe('Header auth area', () => {
  it('shows Log in and Sign up links to a guest', () => {
    renderAt('/does-not-exist');

    const banner = screen.getByRole('banner');
    expect(within(banner).getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(within(banner).getByRole('link', { name: 'Sign up' })).toHaveAttribute(
      'href',
      '/register',
    );
    expect(
      within(banner).queryByRole('button', { name: 'Account menu for Amina' }),
    ).not.toBeInTheDocument();
  });

  it('shows an avatar menu with the name and email to a signed-in user', async () => {
    const user = userEvent.setup();
    await renderSignedIn();

    const banner = screen.getByRole('banner');
    expect(within(banner).queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
    const trigger = within(banner).getByRole('button', { name: 'Account menu for Amina' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');

    await user.click(trigger);

    const menu = await screen.findByRole('menu');
    expect(within(menu).getByText('Amina')).toBeInTheDocument();
    expect(within(menu).getByText('amina@example.com')).toBeInTheDocument();
    expect(within(menu).queryByText('Alumni')).not.toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Log out' })).toBeInTheDocument();
  });

  it('opens the user menu from the keyboard', async () => {
    const user = userEvent.setup();
    await renderSignedIn();

    screen.getByRole('button', { name: 'Account menu for Amina' }).focus();
    await user.keyboard('{Enter}');

    // Base UI moves focus to the first item a tick after it appears, so wait for it.
    const first = await screen.findByRole('menuitem', { name: 'View profile' });
    await waitFor(() => {
      expect(first).toHaveFocus();
    });
  });

  it('shows initials in the avatar button, named for the user', async () => {
    await renderSignedIn();

    const trigger = within(screen.getByRole('banner')).getByRole('button', {
      name: 'Account menu for Amina',
    });
    expect(trigger).toHaveTextContent('A');
    expect(trigger.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('offers View profile, Account settings and Log out to an alumni user (no Admin settings)', async () => {
    const user = userEvent.setup();
    await renderSignedIn();

    await user.click(screen.getByRole('button', { name: 'Account menu for Amina' }));

    const items = within(await screen.findByRole('menu')).getAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'View profile',
      'Account settings',
      'Log out',
    ]);
  });

  it('hides View profile from a user without an alumni profile', async () => {
    mockApi({
      'GET /me': ok({
        ...AMINA,
        role: 'student',
        alumni_id: null,
        has_alumni_profile: false,
        student_id: 7,
        has_student_profile: true,
      }),
    });
    const user = userEvent.setup();
    await renderSignedIn();

    await user.click(screen.getByRole('button', { name: 'Account menu for Amina' }));

    const items = within(await screen.findByRole('menu')).getAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual(['Account settings', 'Log out']);
  });

  it('offers Admin settings after Account settings to an admin, which opens /admin', async () => {
    mockApi({ 'GET /me': ok(AMINA_ADMIN) });
    const user = userEvent.setup();
    const { router } = await renderSignedIn();

    await user.click(screen.getByRole('button', { name: 'Account menu for Amina' }));

    const menu = await screen.findByRole('menu');
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Account settings', 'Admin settings', 'Log out']);
    await user.click(within(menu).getByRole('menuitem', { name: 'Admin settings' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/admin');
    });
  });

  it('View profile opens the public profile for the alumni id', async () => {
    mockApi({ 'GET /me': ok({ ...AMINA, alumni_id: 42 }) });
    const user = userEvent.setup();
    const { router } = renderNavAt('/other');

    await user.click(await screen.findByRole('button', { name: 'Account menu for Amina' }));
    await user.click(await screen.findByRole('menuitem', { name: 'View profile' }));

    expect(await screen.findByRole('heading', { name: 'Profile stub' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/alumni/42');
    expect(getToken()).not.toBeNull();
  });

  it('Account settings opens /me, which no nav item marks current for an alumni user', async () => {
    const user = userEvent.setup();
    const { router } = renderNavAt('/other');

    await user.click(await screen.findByRole('button', { name: 'Account menu for Amina' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Account settings' }));

    expect(await screen.findByRole('heading', { name: 'Me stub' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/me');
    const tabLinks = within(screen.getByRole('navigation', { name: 'Main tabs' })).getAllByRole(
      'link',
    );
    for (const link of [...tabLinks, ...within(mainNav()).getAllByRole('link')]) {
      expect(link).not.toHaveAttribute('aria-current');
    }
  });

  it('closes the avatar menu on Escape and returns focus to the button', async () => {
    const user = userEvent.setup();
    await renderSignedIn();
    const trigger = screen.getByRole('button', { name: 'Account menu for Amina' });

    await user.click(trigger);
    await screen.findByRole('menu');
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });

  it('closes the avatar menu on an outside click', async () => {
    const user = userEvent.setup();
    await renderSignedIn();

    await user.click(screen.getByRole('button', { name: 'Account menu for Amina' }));
    await screen.findByRole('menu');
    await user.click(screen.getByRole('heading', { name: 'Welcome back, Amina' }));

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
    expect(getToken()).not.toBeNull();
  });

  it('Log out clears the token and goes to /login', async () => {
    const user = userEvent.setup();
    const { router, visits } = await renderSignedIn();

    await user.click(screen.getByRole('button', { name: 'Account menu for Amina' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Log out' }));

    expect(await screen.findByRole('button', { name: 'Log in' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(visits).toEqual(['/login']);
    expect(getToken()).toBeNull();
    expect(screen.queryByText(SESSION_EXPIRED_MESSAGE)).not.toBeInTheDocument();
    // Log out lands on the login page, which has no app header.
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });

  it('reads "Account menu" and still offers Account settings and Log out while /me has failed', async () => {
    mockApi({ 'GET /me': fail(404) });
    setToken(makeToken());
    const user = userEvent.setup();
    const { router } = renderAt('/');

    await screen.findByRole('alert');
    // Never an empty circle while the profile is missing.
    expect(
      within(screen.getByRole('banner')).getByRole('button', { name: 'Account menu' }),
    ).toHaveTextContent('?');
    await user.click(
      within(screen.getByRole('banner')).getByRole('button', { name: 'Account menu' }),
    );
    const items = within(await screen.findByRole('menu')).getAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual(['Account settings', 'Log out']);
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

    expect(await screen.findByRole('heading', { name: 'Welcome back, Amina' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
    expect(screen.getByText("Here's what's happening in your alumni network.")).toBeInTheDocument();
    expect(getToken()).toBe(token);
    expect(screen.getByRole('button', { name: 'Account menu for Amina' })).toBeInTheDocument();
  });

  it('sends a signed-in user from /login to /', async () => {
    setToken(makeToken());
    const { router } = renderAt('/login');

    expect(await screen.findByRole('heading', { name: 'Welcome back, Amina' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  it('sends a signed-in user from /register to /', async () => {
    setToken(makeToken());
    const { router } = renderAt('/register');

    expect(await screen.findByRole('heading', { name: 'Welcome back, Amina' })).toBeInTheDocument();
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

// ---- the lazy /directory route (ADR-08) ----

const ARVID: AlumniListItem = {
  id: 7,
  user_id: 7,
  name: 'Arvid Lund',
  graduation_year: 2015,
  department: 'Physics',
};

/** A route tree whose directory route is `DIRECTORY_ROUTE` with another `lazy`. */
function directoryRoutesWith(lazy: RouteObject['lazy']): RouteObject[] {
  return createRoutes([{ element: <RequireAuth />, children: [{ ...DIRECTORY_ROUTE, lazy }] }]);
}

/** A promise plus the function that resolves it. */
function gate() {
  let open: () => void = () => undefined;
  const opened = new Promise<void>((resolve) => {
    open = resolve;
  });
  return { opened, open };
}

describe('Directory route', () => {
  beforeEach(() => {
    mockApi({ 'GET /me': ok(AMINA), 'GET /alumni': ok({ items: [ARVID], total: 1 }) });
  });

  it('renders the directory page for a signed-in visit, with Directory current', async () => {
    setToken(makeToken());
    renderAt('/directory');

    expect(await screen.findByRole('heading', { name: 'Alumni Directory' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Arvid Lund/ })).toBeInTheDocument();
    expect(within(mainNav()).getByRole('link', { name: 'Directory' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('sends a guest to /login, then back to /directory after logging in', async () => {
    const token = makeToken();
    mockApi({
      'POST /auth/login': ok({ token }),
      'GET /me': ok(AMINA),
      'GET /alumni': ok({ items: [ARVID], total: 1 }),
    });
    const user = userEvent.setup();
    const { router } = renderAt('/directory');

    expect(await screen.findByRole('textbox', { name: 'Email' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(apiCalls).not.toContain('GET /alumni');

    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'amina@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-horse');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('heading', { name: 'Alumni Directory' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/directory');
  });

  // ADV-003: the fallback sits on the directory route itself, so the header
  // stays and "Loading…" shows inside <main> until the chunk arrives.
  it('keeps the shell and shows Loading… in main while the page code loads', async () => {
    const chunk = gate();
    setToken(makeToken());
    renderAt(
      '/directory',
      directoryRoutesWith(async () => {
        await chunk.opened;
        return { Component: () => <h1>Directory loaded</h1> };
      }),
    );

    // Wait out RequireAuth's own "Loading…" (the ['me'] query) first.
    const banner = screen.getByRole('banner');
    expect(
      await within(banner).findByRole('button', { name: 'Account menu for Amina' }),
    ).toBeInTheDocument();
    const main = screen.getByRole('main');
    expect(within(main).getByRole('status')).toHaveTextContent('Loading…');
    expect(within(banner).getByRole('link', { name: 'Alma' })).toBeInTheDocument();

    await act(async () => {
      chunk.open();
      await chunk.opened;
    });

    expect(await screen.findByRole('heading', { name: 'Directory loaded' })).toBeInTheDocument();
    expect(within(main).queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows the route error inside the shell when the page code fails to load', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    setToken(makeToken());
    renderAt(
      '/directory',
      directoryRoutesWith(() => Promise.reject(new Error('chunk failed'))),
    );

    const main = screen.getByRole('main');
    expect(
      await within(main).findByRole('heading', { name: 'Something went wrong.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('banner')).toHaveTextContent('Alma');
    expect(errorSpy).toHaveBeenCalledWith(expect.objectContaining({ message: 'chunk failed' }));
  });
});

// ---- the lazy /alumni/:id route (ADR-08, REQ-008) ----

const LINNEA: Alumni = { id: 3, user_id: 30, name: 'Linnea Berg', graduation_year: 2019 };

/** A route tree whose profile route is `PROFILE_ROUTE` with another `lazy`. */
function profileRoutesWith(lazy: RouteObject['lazy']): RouteObject[] {
  return createRoutes([{ element: <RequireAuth />, children: [{ ...PROFILE_ROUTE, lazy }] }]);
}

describe('Profile route', () => {
  beforeEach(() => {
    mockApi({
      'GET /me': ok(AMINA),
      'GET /alumni/3': ok(LINNEA),
      'GET /posts/user/30': ok([]),
    });
  });

  it('renders the profile page inside the shell for a signed-in visit', async () => {
    setToken(makeToken());
    renderAt('/alumni/3');

    const main = screen.getByRole('main');
    expect(
      await within(main).findByRole('heading', { level: 1, name: 'Linnea Berg' }),
    ).toBeInTheDocument();
    // The shell's header (the page's own <header> also counts as a banner here).
    expect(screen.getByRole('button', { name: 'Account menu for Amina' })).toBeInTheDocument();
  });

  it('sends a guest to /login, then back to /alumni/3 after logging in', async () => {
    const token = makeToken();
    mockApi({
      'POST /auth/login': ok({ token }),
      'GET /me': ok(AMINA),
      'GET /alumni/3': ok(LINNEA),
      'GET /posts/user/30': ok([]),
    });
    const user = userEvent.setup();
    const { router } = renderAt('/alumni/3');

    expect(await screen.findByRole('textbox', { name: 'Email' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(apiCalls).not.toContain('GET /alumni/3');

    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'amina@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-horse');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Linnea Berg' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/alumni/3');
  });

  it('keeps the shell and shows Loading… in main while the page code loads', async () => {
    const chunk = gate();
    setToken(makeToken());
    renderAt(
      '/alumni/3',
      profileRoutesWith(async () => {
        await chunk.opened;
        return { Component: () => <h1>Profile loaded</h1> };
      }),
    );

    const banner = screen.getByRole('banner');
    expect(
      await within(banner).findByRole('button', { name: 'Account menu for Amina' }),
    ).toBeInTheDocument();
    const main = screen.getByRole('main');
    expect(within(main).getByRole('status')).toHaveTextContent('Loading…');

    await act(async () => {
      chunk.open();
      await chunk.opened;
    });

    expect(await screen.findByRole('heading', { name: 'Profile loaded' })).toBeInTheDocument();
  });

  it('shows the route error inside the shell when the page code fails to load', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    setToken(makeToken());
    renderAt(
      '/alumni/3',
      profileRoutesWith(() => Promise.reject(new Error('chunk failed'))),
    );

    const main = screen.getByRole('main');
    expect(
      await within(main).findByRole('heading', { name: 'Something went wrong.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('banner')).toHaveTextContent('Alma');
    expect(errorSpy).toHaveBeenCalledWith(expect.objectContaining({ message: 'chunk failed' }));
  });
});

// ---- the lazy /feed route (ADR-08, REQ-009) ----

/** A route tree whose feed route is `FEED_ROUTE` with another `lazy`. */
function feedRoutesWith(lazy: RouteObject['lazy']): RouteObject[] {
  return createRoutes([{ element: <RequireAuth />, children: [{ ...FEED_ROUTE, lazy }] }]);
}

describe('Feed route', () => {
  beforeEach(() => {
    mockApi({ 'GET /me': ok(AMINA), 'GET /posts': ok([]) });
  });

  it('renders the feed page for a signed-in visit, with Feed current', async () => {
    setToken(makeToken());
    renderAt('/feed');

    const main = screen.getByRole('main');
    expect(
      await within(main).findByRole('heading', { level: 1, name: 'Feed' }),
    ).toBeInTheDocument();
    expect(within(mainNav()).getByRole('link', { name: 'Feed' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('sends a guest to /login without loading posts', async () => {
    const { router } = renderAt('/feed');

    expect(await screen.findByRole('textbox', { name: 'Email' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(apiCalls).not.toContain('GET /posts');
  });

  it('keeps the shell and shows Loading… in main while the page code loads', async () => {
    const chunk = gate();
    setToken(makeToken());
    renderAt(
      '/feed',
      feedRoutesWith(async () => {
        await chunk.opened;
        return { Component: () => <h1>Feed loaded</h1> };
      }),
    );

    const banner = screen.getByRole('banner');
    expect(
      await within(banner).findByRole('button', { name: 'Account menu for Amina' }),
    ).toBeInTheDocument();
    const main = screen.getByRole('main');
    expect(within(main).getByRole('status')).toHaveTextContent('Loading…');

    await act(async () => {
      chunk.open();
      await chunk.opened;
    });

    expect(await screen.findByRole('heading', { name: 'Feed loaded' })).toBeInTheDocument();
  });
});

// ---- the lazy /me route (ADR-08, REQ-010) ----

/** A route tree whose /me route is `ME_ROUTE` with another `lazy`. */
function meRoutesWith(lazy: RouteObject['lazy']): RouteObject[] {
  return createRoutes([{ element: <RequireAuth />, children: [{ ...ME_ROUTE, lazy }] }]);
}

describe('Account settings route', () => {
  beforeEach(() => {
    mockApi({ 'GET /me': ok(AMINA) });
  });

  it('renders the Account settings page for a signed-in visit', async () => {
    setToken(makeToken());
    renderAt('/me');

    const main = screen.getByRole('main');
    expect(
      await within(main).findByRole('heading', { level: 1, name: 'Account settings' }),
    ).toBeInTheDocument();
  });

  it('sends a guest to /login without loading the profile', async () => {
    const { router } = renderAt('/me');

    expect(await screen.findByRole('textbox', { name: 'Email' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(apiCalls).not.toContain('GET /me');
  });

  it('keeps the shell and shows Loading… in main while the page code loads', async () => {
    const chunk = gate();
    setToken(makeToken());
    renderAt(
      '/me',
      meRoutesWith(async () => {
        await chunk.opened;
        return { Component: () => <h1>Account settings loaded</h1> };
      }),
    );

    const banner = screen.getByRole('banner');
    expect(
      await within(banner).findByRole('button', { name: 'Account menu for Amina' }),
    ).toBeInTheDocument();
    const main = screen.getByRole('main');
    expect(within(main).getByRole('status')).toHaveTextContent('Loading…');

    await act(async () => {
      chunk.open();
      await chunk.opened;
    });

    expect(
      await screen.findByRole('heading', { name: 'Account settings loaded' }),
    ).toBeInTheDocument();
  });
});

function adminRoutesWith(lazy: RouteObject['lazy']): RouteObject[] {
  return createRoutes([
    {
      element: <RequireAuth />,
      children: [{ element: <RequireAdmin />, children: [{ ...ADMIN_ROUTE, lazy }] }],
    },
  ]);
}

describe('Admin route', () => {
  it('renders the admin page for an admin, with Admin current', async () => {
    mockApi({ 'GET /me': ok(AMINA_ADMIN) });
    setToken(makeToken());
    renderAt('/admin');

    const main = screen.getByRole('main');
    expect(
      await within(main).findByRole('heading', { level: 1, name: 'Admin' }),
    ).toBeInTheDocument();
    expect(within(mainNav()).getByRole('link', { name: 'Admin' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it.each([
    ['an alumni user', AMINA],
    ['a student', AMINA_STUDENT],
  ])('shows %s the 403 page inside the shell, with no admin request', async (_who, me) => {
    mockApi({ 'GET /me': ok(me) });
    setToken(makeToken());
    renderAt('/admin');

    const main = screen.getByRole('main');
    expect(
      await within(main).findByRole('heading', {
        level: 1,
        name: "You don't have access to this page",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('banner')).toHaveTextContent('Alma');
    expect(apiCalls.filter((call) => call.includes(' /admin'))).toEqual([]);
    expect(getToken()).not.toBeNull();
  });

  it('sends a guest to /login without any request', async () => {
    const { router } = renderAt('/admin');

    expect(await screen.findByRole('textbox', { name: 'Email' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(apiCalls).toEqual([]);
  });

  it('keeps the shell and shows Loading… in main while the page code loads', async () => {
    mockApi({ 'GET /me': ok(AMINA_ADMIN) });
    const chunk = gate();
    setToken(makeToken());
    renderAt(
      '/admin',
      adminRoutesWith(async () => {
        await chunk.opened;
        return { Component: () => <h1>Admin loaded</h1> };
      }),
    );

    const banner = screen.getByRole('banner');
    expect(
      await within(banner).findByRole('button', { name: 'Account menu for Amina' }),
    ).toBeInTheDocument();
    const main = screen.getByRole('main');
    expect(within(main).getByRole('status')).toHaveTextContent('Loading…');

    await act(async () => {
      chunk.open();
      await chunk.opened;
    });

    expect(await screen.findByRole('heading', { name: 'Admin loaded' })).toBeInTheDocument();
  });
});
