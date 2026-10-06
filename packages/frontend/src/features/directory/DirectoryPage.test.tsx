import type { AlumniListItem, AlumniListResponse, MyProfile } from '@alumni/shared';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { createStore } from 'jotai';
import { createMemoryRouter } from 'react-router';
// react-router/dom's RouterProvider wires flushSync, as App.tsx does.
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '@/app/providers';
import { createQueryClient } from '@/app/queryClient';
import { createRoutes } from '@/app/router';
import { RequireAuth, SESSION_EXPIRED_MESSAGE } from '@/features/auth';
import { getToken, setToken } from '@/services/authToken';
import { httpClient, setUnauthorizedHandler } from '@/services/httpClient';
import { DIRECTORY_PAGE_SIZE } from './constants';
import { DirectoryPage } from './DirectoryPage';

// ---- a fake API at the axios adapter (the REQ-001 test policy) ----

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

/** `count` alumni named "<prefix> 1" … "<prefix> count". */
function alumni(count: number, prefix = 'Alum'): AlumniListItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    user_id: index + 100,
    name: `${prefix} ${String(index + 1)}`,
    graduation_year: 2015,
    department: 'Economics',
  }));
}

function page(items: AlumniListItem[], total: number): AlumniListResponse {
  return { items, total };
}

const originalAdapter = httpClient.defaults.adapter;
/** The query params of every GET /alumni, in order. */
const searches: Record<string, unknown>[] = [];

/** GET /me answers Amina; GET /alumni goes to `alumniHandler`. */
function mockApi(alumniHandler: Responder): void {
  const adapter: AxiosAdapter = (config) => {
    const key = `${(config.method ?? 'get').toUpperCase()} ${config.url ?? ''}`;
    if (key === 'GET /me') return ok(AMINA)(config);
    if (key === 'GET /alumni') {
      searches.push({ ...(config.params as Record<string, unknown>) });
      return alumniHandler(config);
    }
    return Promise.reject(new Error(`Unmocked request: ${key}`));
  };
  httpClient.defaults.adapter = adapter;
}

/** Answers by the requested page: `pages[n - 1]` for page n. */
function byPage(pages: AlumniListResponse[]): Responder {
  return (config) => {
    const params = config.params as { page: number };
    const data = pages[params.page - 1] ?? page([], pages[0]?.total ?? 0);
    return ok(data)(config);
  };
}

function lastSearch(): Record<string, unknown> | undefined {
  return searches[searches.length - 1];
}

const PAGE_ROUTES = [
  { element: <RequireAuth />, children: [{ path: 'directory', element: <DirectoryPage /> }] },
];

/** Signed in, at `path`, with the real shells, session bridge and login page. */
function renderAt(path: string) {
  setToken(makeToken());
  const router = createMemoryRouter(createRoutes(PAGE_ROUTES), { initialEntries: [path] });
  render(
    <AppProviders queryClient={createQueryClient()} store={createStore()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return router;
}

/** A result card's link, by the alumnus' exact name. */
const card = (name: string) => new RegExp(`^${name} Class of`);

const heading = () => screen.findByRole('heading', { level: 1, name: 'Alumni Directory' });
const countRegion = () => {
  const region = document.querySelector('[aria-live="polite"]');
  if (!(region instanceof HTMLElement)) throw new Error('no count region');
  return region;
};

const scrollIntoView = vi.fn();

beforeEach(() => {
  searches.length = 0;
  // jsdom has no scrollIntoView; the page calls it on a page change.
  scrollIntoView.mockReset();
  Element.prototype.scrollIntoView = scrollIntoView;
});

afterEach(() => {
  httpClient.defaults.adapter = originalAdapter;
  setUnauthorizedHandler(null);
});

describe('DirectoryPage', () => {
  it('shows skeleton cards while loading, and no count', async () => {
    let answer: (data: AlumniListResponse) => void = () => undefined;
    mockApi(
      (config) =>
        new Promise((resolve) => {
          answer = (data) => {
            resolve({ data, status: 200, statusText: 'OK', headers: {}, config });
          };
        }),
    );
    renderAt('/directory');

    expect(await screen.findByText('Loading alumni…')).toBeInTheDocument();
    const busy = document.querySelector('[aria-busy="true"]');
    expect(busy).not.toBeNull();
    expect(busy?.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
    expect(countRegion()).toBeEmptyDOMElement();
    expect(screen.queryByRole('link', { name: /Class of/ })).not.toBeInTheDocument();

    act(() => {
      answer(page(alumni(2), 2));
    });
    expect(await screen.findByRole('link', { name: card('Alum 1') })).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it('shows the results, the count line for both widths and pagination', async () => {
    mockApi(byPage([page(alumni(DIRECTORY_PAGE_SIZE), 26)]));
    renderAt('/directory');

    await heading();
    await screen.findByRole('link', { name: card('Alum 1') });
    expect(screen.getAllByRole('link', { name: /Class of/ })).toHaveLength(DIRECTORY_PAGE_SIZE);
    expect(countRegion()).toHaveTextContent('Showing 1–12 of 26 alumni');
    expect(countRegion()).toHaveTextContent(/^Showing 1–12 of 26 alumni26 alumni$/);
    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    expect(nav).toHaveTextContent('Page 1 of 3');
    expect(within(nav).getByRole('button', { name: 'Page 1' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('counts the last, partial page', async () => {
    mockApi(byPage([page(alumni(12), 13), page(alumni(1, 'Last'), 13)]));
    renderAt('/directory?page=2');

    await screen.findByRole('link', { name: card('Last 1') });
    expect(countRegion()).toHaveTextContent('Showing 13–13 of 13 alumni');
  });

  it('says "alumnus" for one, and hides pagination for one page', async () => {
    mockApi(byPage([page(alumni(1), 1)]));
    renderAt('/directory');

    await screen.findByRole('link', { name: card('Alum 1') });
    expect(countRegion()).toHaveTextContent(/^Showing 1–1 of 1 alumnus1 alumnus$/);
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
  });

  it('sends the URL state as request params, with the fixed page size', async () => {
    mockApi(byPage([page([], 0)]));
    renderAt('/directory?q=ana&department=Economics&university=Oxford&graduationYear=2020&page=2');

    await waitFor(() => {
      expect(lastSearch()).toEqual({
        q: 'ana',
        department: 'Economics',
        university: 'Oxford',
        graduationYear: 2020,
        page: 2,
        pageSize: DIRECTORY_PAGE_SIZE,
      });
    });
  });

  it('leaves out empty and invalid URL values', async () => {
    mockApi(byPage([page(alumni(1), 1)]));
    renderAt('/directory?q=%20&department=&graduationYear=20&page=abc&pageSize=99');

    await screen.findByRole('link', { name: card('Alum 1') });
    expect(lastSearch()).toEqual({ page: 1, pageSize: DIRECTORY_PAGE_SIZE });
  });

  it('shows the filtered empty state, and Clear filters drops every filter', async () => {
    const user = userEvent.setup();
    mockApi((config) => {
      const params = config.params as Record<string, unknown>;
      return ok('department' in params ? page([], 0) : page(alumni(3), 3))(config);
    });
    const router = renderAt('/directory?department=Marine%20Biology');

    expect(
      await screen.findByRole('heading', { name: 'No alumni match these filters' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Department Marine Biology doesn't match/)).toBeInTheDocument();
    expect(countRegion()).toBeEmptyDOMElement();
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(await screen.findByRole('link', { name: card('Alum 1') })).toBeInTheDocument();
    expect(router.state.location.search).toBe('');
    expect(lastSearch()).toEqual({ page: 1, pageSize: DIRECTORY_PAGE_SIZE });
  });

  it('shows "No alumni yet" with no search or filter and nothing to show', async () => {
    mockApi(byPage([page([], 0)]));
    renderAt('/directory');

    expect(await screen.findByRole('heading', { name: 'No alumni yet' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
    expect(countRegion()).toBeEmptyDOMElement();
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
  });

  it('shows a way back from a page past the end, with no count', async () => {
    const user = userEvent.setup();
    mockApi(byPage([page(alumni(12), 20), page(alumni(8, 'Second'), 20)]));
    const router = renderAt('/directory?page=5');

    expect(
      await screen.findByRole('heading', { name: 'Nothing on this page' }),
    ).toBeInTheDocument();
    expect(countRegion()).toBeEmptyDOMElement();
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to page 1' }));

    expect(await screen.findByRole('link', { name: card('Alum 1') })).toBeInTheDocument();
    expect(lastSearch()).toMatchObject({ page: 1 });
    expect(router.state.location.search).toBe('');
    expect(countRegion()).toHaveTextContent('Showing 1–12 of 20 alumni');
  });

  // A 4xx, so the client doesn't retry on its own (5xx retries twice, with
  // 1 s and 2 s delays); the state is the same whatever the status.
  it('shows an error with Retry, and Retry loads the page', async () => {
    const user = userEvent.setup();
    let calls = 0;
    mockApi((config) => {
      calls += 1;
      return calls === 1 ? fail(400)(config) : ok(page(alumni(2), 2))(config);
    });
    renderAt('/directory');

    expect(await screen.findByText("The directory didn't load")).toBeInTheDocument();
    expect(countRegion()).toBeEmptyDOMElement();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('link', { name: card('Alum 1') })).toBeInTheDocument();
    expect(screen.queryByText("The directory didn't load")).not.toBeInTheDocument();
    expect(countRegion()).toHaveTextContent('Showing 1–2 of 2 alumni');
    expect(calls).toBe(2);
  });

  it('goes to another page, scrolls to the top, and Back restores the previous results', async () => {
    const user = userEvent.setup();
    mockApi(byPage([page(alumni(12, 'First'), 20), page(alumni(8, 'Second'), 20)]));
    const router = renderAt('/directory');

    await screen.findByRole('link', { name: card('First 1') });
    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(await screen.findByRole('link', { name: card('Second 1') })).toBeInTheDocument();
    expect(router.state.location.search).toBe('?page=2');
    expect(lastSearch()).toMatchObject({ page: 2 });
    expect(scrollIntoView).toHaveBeenCalled();
    expect(countRegion()).toHaveTextContent('Showing 13–20 of 20 alumni');

    await act(() => router.navigate(-1));

    expect(await screen.findByRole('link', { name: card('First 1') })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: card('Second 1') })).not.toBeInTheDocument();
    expect(countRegion()).toHaveTextContent('Showing 1–12 of 20 alumni');

    await act(() => router.navigate(1));
    expect(await screen.findByRole('link', { name: card('Second 1') })).toBeInTheDocument();
  });

  it('changing a filter goes back to page 1', async () => {
    const user = userEvent.setup();
    mockApi(byPage([page(alumni(12), 30), page(alumni(12, 'Second'), 30)]));
    const router = renderAt('/directory?department=Economics&page=2');

    await screen.findByRole('link', { name: card('Second 1') });
    await user.click(screen.getByRole('button', { name: 'Remove Department: Economics' }));

    expect(await screen.findByRole('link', { name: card('Alum 1') })).toBeInTheDocument();
    expect(router.state.location.search).toBe('');
    expect(lastSearch()).toEqual({ page: 1, pageSize: DIRECTORY_PAGE_SIZE });
  });

  it('typing a search sends it after the pause, from page 1', async () => {
    const user = userEvent.setup();
    mockApi(byPage([page(alumni(12), 30), page(alumni(12, 'Second'), 30)]));
    const router = renderAt('/directory?page=2');

    await screen.findByRole('link', { name: card('Second 1') });
    await user.type(screen.getByRole('searchbox', { name: 'Search alumni' }), 'ana');

    await waitFor(() => {
      expect(lastSearch()).toEqual({ q: 'ana', page: 1, pageSize: DIRECTORY_PAGE_SIZE });
    });
    expect(router.state.location.search).toBe('?q=ana');
    // Only the full text was sent, not every keystroke.
    expect(searches.filter((s) => 'q' in s)).toHaveLength(1);
  });

  it('a 401 ends the session through the existing handler', async () => {
    mockApi(fail(401));
    const router = renderAt('/directory');

    expect(await screen.findByText(SESSION_EXPIRED_MESSAGE)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(getToken()).toBeNull();
  });
});
