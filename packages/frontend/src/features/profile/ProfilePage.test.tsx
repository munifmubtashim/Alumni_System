import type { Alumni, MyProfile, Post } from '@alumni/shared';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { createStore } from 'jotai';
import { createMemoryRouter, type InitialEntry } from 'react-router';
// react-router/dom's RouterProvider wires flushSync, as App.tsx does.
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/providers';
import { createQueryClient } from '@/app/queryClient';
import { createRoutes } from '@/app/router';
import { directoryReturnState } from '@/config/directoryReturn';
import { RequireAuth, SESSION_EXPIRED_MESSAGE } from '@/features/auth';
import { getToken, setToken } from '@/services/authToken';
import { httpClient, setUnauthorizedHandler } from '@/services/httpClient';
import { ProfilePage } from './ProfilePage';
import { LOAD_ERROR_HEADING, LOADING_HEADING, NOT_FOUND_HEADING } from './ProfileStates';

// ---- a fake API at the axios adapter (the REQ-001 test policy) ----
// The token builder repeats the one in DirectoryPage.test.tsx and five other
// files (G26); a shared src/test/ helper is the open follow-up QUAL-002.

function base64url(value: object): string {
  return window
    .btoa(JSON.stringify(value))
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/** A JWT-shaped token that expires in an hour. */
function makeToken(): string {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${base64url({ alg: 'HS256' })}.${base64url({ sub: 1, exp })}.sig`;
}

const ME: MyProfile = {
  user_id: 1,
  name: 'Sam Moreau',
  email: 'sam@example.com',
  role: 'alumni',
  alumni_id: 1,
  has_alumni_profile: true,
  student_id: null,
  has_student_profile: false,
};

const AMIRA: Alumni = {
  id: 7,
  user_id: 70,
  name: 'Amira Mendes',
  email: 'amira@example.com',
  job_title: 'Design Lead',
  current_company: 'Terra Climate',
  graduation_year: 2017,
  department: 'Product Design',
  university: 'University of Toronto',
  bio: 'Design lead focused on climate-tech products.',
  experience: 'Ten years in product design.',
  linkedin_url: 'https://www.linkedin.com/in/amira',
};

const BORIS: Alumni = { id: 8, user_id: 80, name: 'Boris Okafor' };

const POSTS: Post[] = [
  {
    id: 1,
    user_id: 70,
    caption: 'Hiring a product designer.',
    comment_count: 14,
    created_at: new Date().toISOString() as unknown as Date,
  },
];

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

/** A responder that waits until `release()` is called. */
function held(data: unknown) {
  let release: () => void = () => undefined;
  const responder: Responder = (config) =>
    new Promise((resolve) => {
      release = () => {
        resolve({ data, status: 200, statusText: 'OK', headers: {}, config });
      };
    });
  return {
    responder,
    release: () => {
      release();
    },
  };
}

const originalAdapter = httpClient.defaults.adapter;
/** The QueryClient of the latest renderAt, for driving background refetches. */
let currentClient = createQueryClient();
const requests: string[] = [];

interface Api {
  /** Answers per alumni id (`'7'`, `'abc'`); each call takes the next one, the last repeats. */
  profile: Record<string, Responder[]>;
  posts?: Responder;
}

function mockApi({ profile, posts = ok(POSTS) }: Api): void {
  const calls: Record<string, number> = {};
  const adapter: AxiosAdapter = (config) => {
    const url = config.url ?? '';
    requests.push(url);
    if (url === '/me') return ok(ME)(config);
    if (url.startsWith('/posts/user/')) return posts(config);
    const match = /^\/alumni\/([^/]+)$/.exec(url);
    const id = match?.[1] === undefined ? undefined : decodeURIComponent(match[1]);
    const answers = id === undefined ? undefined : profile[id];
    if (id === undefined || answers === undefined) {
      return Promise.reject(new Error(`Unmocked request: ${url}`));
    }
    const n = (calls[id] = (calls[id] ?? 0) + 1);
    const answer = answers[Math.min(n, answers.length) - 1];
    if (answer === undefined) return Promise.reject(new Error(`No answer: ${url}`));
    return answer(config);
  };
  httpClient.defaults.adapter = adapter;
}

const PAGE_ROUTES = [
  {
    element: <RequireAuth />,
    children: [
      { path: 'alumni/:id', element: <ProfilePage /> },
      { path: 'directory', element: <p>Directory stub</p> },
    ],
  },
];

/** Signed in, at `entry`, with the real shells, session bridge and login page. */
function renderAt(entry: InitialEntry) {
  setToken(makeToken());
  const client = createQueryClient();
  // Errors end at once here; the app's retry policy is tested in queryClient.test.ts.
  client.setDefaultOptions({ queries: { ...client.getDefaultOptions().queries, retry: false } });
  currentClient = client;
  const router = createMemoryRouter(createRoutes(PAGE_ROUTES), { initialEntries: [entry] });
  render(
    <AppProviders queryClient={client} store={createStore()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return router;
}

const h1 = (name: string) => screen.findByRole('heading', { level: 1, name });

async function expectFocusAndTitle(name: string, title: string) {
  const heading = await h1(name);
  await waitFor(() => {
    expect(heading).toHaveFocus();
  });
  await waitFor(() => {
    expect(document.title).toBe(title);
  });
}

const backLink = () => screen.getByRole('link', { name: 'Back to directory' });

beforeEach(() => {
  requests.length = 0;
});

afterEach(() => {
  httpClient.defaults.adapter = originalAdapter;
  setUnauthorizedHandler(null);
});

describe('ProfilePage', () => {
  it('shows the profile, focuses its h1 and titles the tab with the name', async () => {
    mockApi({ profile: { '7': [ok(AMIRA)] } });
    renderAt('/alumni/7');

    await expectFocusAndTitle('Amira Mendes', 'Amira Mendes · Alma');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByText('Design Lead at Terra Climate · Class of 2017')).toBeInTheDocument();
    for (const name of ['About', 'Education', 'Employment', 'Recent posts']) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument();
    }
    expect(await screen.findByText('Hiring a product designer.')).toBeInTheDocument();
    expect(requests).toContain('/alumni/7');
    // The posts endpoint takes the profile's user_id, not the alumni id.
    expect(requests).toContain('/posts/user/70');
    expect(screen.getByRole('main')).not.toHaveTextContent('amira@example.com');
  });

  it('shows a focused "Loading profile" h1, a status line and the loading title', async () => {
    const answer = held(AMIRA);
    mockApi({ profile: { '7': [answer.responder] } });
    renderAt('/alumni/7');

    await expectFocusAndTitle(LOADING_HEADING, 'Profile · Alma');
    expect(screen.getByRole('status')).toHaveTextContent('Loading profile…');
    expect(backLink()).toBeInTheDocument();

    act(() => {
      answer.release();
    });
    await expectFocusAndTitle('Amira Mendes', 'Amira Mendes · Alma');
  });

  it.each(['999', 'abc'])('shows "Profile not found" for /alumni/%s (the API 404s)', async (id) => {
    mockApi({ profile: { [id]: [fail(404)] } });
    renderAt(`/alumni/${id}`);

    await expectFocusAndTitle(NOT_FOUND_HEADING, 'Profile not found · Alma');
    expect(backLink()).toHaveAttribute('href', '/directory');
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    expect(requests).toContain(`/alumni/${id}`);
  });

  it('shows the load error on a 500, and Retry loads the profile', async () => {
    mockApi({ profile: { '7': [fail(500), ok(AMIRA)] } });
    const user = userEvent.setup();
    renderAt('/alumni/7');

    await expectFocusAndTitle(LOAD_ERROR_HEADING, "Couldn't load this profile · Alma");
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await expectFocusAndTitle('Amira Mendes', 'Amira Mendes · Alma');
    expect(requests.filter((url) => url === '/alumni/7')).toHaveLength(2);
  });

  it('keeps the profile when a background refetch fails', async () => {
    mockApi({ profile: { '7': [ok(AMIRA), fail(500)] } });
    renderAt('/alumni/7');
    await expectFocusAndTitle('Amira Mendes', 'Amira Mendes · Alma');

    const key = ['alumni', 'profile', '7'];
    await act(() => currentClient.refetchQueries({ queryKey: key }));

    expect(currentClient.getQueryState(key)?.status).toBe('error');
    expect(requests.filter((url) => url === '/alumni/7')).toHaveLength(2);
    expect(screen.getByRole('heading', { level: 1, name: 'Amira Mendes' })).toBeInTheDocument();
    expect(screen.queryByText(LOAD_ERROR_HEADING)).not.toBeInTheDocument();
  });

  it('leaves focus on the Back link when the user tabbed to it while loading', async () => {
    const answer = held(AMIRA);
    mockApi({ profile: { '7': [answer.responder] } });
    const user = userEvent.setup();
    renderAt('/alumni/7');
    await expectFocusAndTitle(LOADING_HEADING, 'Profile · Alma');

    // The Back link sits just before the focused h1.
    await user.tab({ shift: true });
    expect(backLink()).toHaveFocus();

    act(() => {
      answer.release();
    });
    await h1('Amira Mendes');
    expect(backLink()).toHaveFocus();
  });

  it('a 401 ends the session through the existing handler', async () => {
    mockApi({ profile: { '7': [fail(401)] } });
    const router = renderAt('/alumni/7');

    expect(await screen.findByText(SESSION_EXPIRED_MESSAGE)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(getToken()).toBeNull();
  });

  it('a new id shows the loading state, never the previous person', async () => {
    const boris = held(BORIS);
    mockApi({ profile: { '7': [ok(AMIRA)], '8': [boris.responder] } });
    const router = renderAt('/alumni/7');
    await h1('Amira Mendes');

    await act(() => router.navigate('/alumni/8'));
    await expectFocusAndTitle(LOADING_HEADING, 'Profile · Alma');
    expect(screen.queryByText('Amira Mendes')).not.toBeInTheDocument();

    act(() => {
      boris.release();
    });
    await expectFocusAndTitle('Boris Okafor', 'Boris Okafor · Alma');
  });

  it('keeps the profile when the posts fail', async () => {
    mockApi({ profile: { '7': [ok(AMIRA)] }, posts: fail(500) });
    renderAt('/alumni/7');

    const posts = await screen.findByRole('region', { name: 'Recent posts' });
    expect(await within(posts).findByRole('alert')).toHaveTextContent("Posts didn't load");
    expect(screen.getByRole('heading', { level: 1, name: 'Amira Mendes' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'About' })).toBeInTheDocument();
  });

  it('hides every part a sparse profile has no data for', async () => {
    mockApi({ profile: { '8': [ok(BORIS)] }, posts: ok([]) });
    renderAt('/alumni/8');

    await h1('Boris Okafor');
    for (const name of ['About', 'Education', 'Employment']) {
      expect(screen.queryByRole('region', { name })).not.toBeInTheDocument();
    }
    expect(screen.queryByText(/Class of| at /)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /LinkedIn/ })).not.toBeInTheDocument();
    expect(await screen.findByText('No posts yet')).toBeInTheDocument();
  });

  it('shows a javascript: LinkedIn value as no link at all', async () => {
    mockApi({ profile: { '7': [ok({ ...AMIRA, linkedin_url: 'javascript:alert(1)' })] } });
    renderAt('/alumni/7');

    await h1('Amira Mendes');
    expect(screen.queryByRole('link', { name: /LinkedIn/ })).not.toBeInTheDocument();
    expect(document.querySelector('a[href^="javascript"]')).toBeNull();
  });

  it('links back to the directory search the card was clicked from', async () => {
    mockApi({ profile: { '7': [ok(AMIRA)] } });
    const router = renderAt({
      pathname: '/alumni/7',
      state: directoryReturnState('?q=ann&page=2'),
    });

    await h1('Amira Mendes');
    expect(backLink()).toHaveAttribute('href', '/directory?q=ann&page=2');
    await userEvent.setup().click(backLink());
    expect(router.state.location.pathname + router.state.location.search).toBe(
      '/directory?q=ann&page=2',
    );
  });

  it('links back to the plain directory without router state', async () => {
    mockApi({ profile: { '7': [ok(AMIRA)] } });
    renderAt('/alumni/7');

    await h1('Amira Mendes');
    expect(backLink()).toHaveAttribute('href', '/directory');
  });
});
