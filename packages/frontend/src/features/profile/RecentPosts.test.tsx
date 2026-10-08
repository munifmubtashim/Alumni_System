import type { Post } from '@alumni/shared';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createQueryClient } from '@/app/queryClient';
import { httpClient } from '@/services/httpClient';
import { RecentPosts, RECENT_POSTS_LIMIT } from './RecentPosts';

// ---- a fake API at the axios adapter (the REQ-001 test policy) ----

type Responder = (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>;

const ok =
  (data: unknown): Responder =>
  (config) =>
    Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });

const fail =
  (status: number): Responder =>
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
const never: Responder = () => new Promise<AxiosResponse>(() => undefined);

const originalAdapter = httpClient.defaults.adapter;
const requests: string[] = [];

/** Each GET /posts/user/:id takes the next responder; the last one repeats. */
function mockPosts(...responders: Responder[]): void {
  const adapter: AxiosAdapter = (config) => {
    const url = config.url ?? '';
    if (!url.startsWith('/posts/user/')) return Promise.reject(new Error(`Unmocked: ${url}`));
    requests.push(url);
    const responder = responders[Math.min(requests.length, responders.length) - 1];
    if (responder === undefined) return Promise.reject(new Error('no responder'));
    return responder(config);
  };
  httpClient.defaults.adapter = adapter;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** A post `daysAgo` days old. */
function post(id: number, overrides: Partial<Post> = {}, daysAgo = 3): Post {
  return {
    id,
    user_id: 7,
    caption: `Post ${String(id)}`,
    comment_count: 2,
    created_at: new Date(Date.now() - daysAgo * DAY_MS).toISOString() as unknown as Date,
    ...overrides,
  };
}

function renderPosts(userId = 7) {
  const client = createQueryClient();
  // Errors end at once here; the app's retry policy is tested in queryClient.test.ts.
  client.setDefaultOptions({
    queries: { ...client.getDefaultOptions().queries, retry: false },
  });
  render(
    <QueryClientProvider client={client}>
      <RecentPosts userId={userId} />
    </QueryClientProvider>,
  );
  return client;
}

const region = () => screen.getByRole('region', { name: 'Recent posts' });

beforeEach(() => {
  requests.length = 0;
});

afterEach(() => {
  httpClient.defaults.adapter = originalAdapter;
});

describe('RecentPosts', () => {
  it("asks for the profile's user id", async () => {
    mockPosts(ok([post(1)]));
    renderPosts(42);
    await screen.findByText('Post 1');
    expect(requests).toEqual(['/posts/user/42']);
  });

  it('shows skeleton cards and a loading status while posts load', () => {
    mockPosts(never);
    renderPosts();
    expect(screen.getByRole('heading', { level: 2, name: 'Recent posts' })).toBeInTheDocument();
    expect(within(region()).getByRole('status')).toHaveTextContent('Loading posts…');
    const busy = region().querySelector('[aria-busy="true"]');
    expect(busy).not.toBeNull();
    // A live region inside a busy subtree may not be announced (REFL-004).
    expect(busy?.contains(within(region()).getByRole('status'))).toBe(false);
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('shows an inline error with Retry, and Retry loads the posts', async () => {
    mockPosts(fail(500), ok([post(1)]));
    const user = userEvent.setup();
    renderPosts();

    const alert = await within(region()).findByRole('alert');
    expect(alert).toHaveTextContent("Posts didn't load");
    await user.click(within(region()).getByRole('button', { name: 'Retry' }));

    expect(await within(region()).findByText('Post 1')).toBeInTheDocument();
    expect(within(region()).queryByRole('alert')).not.toBeInTheDocument();
    expect(requests).toHaveLength(2);
  });

  it('keeps the loaded posts when a background refetch fails', async () => {
    mockPosts(ok([post(1)]), fail(500));
    const client = renderPosts();
    await within(region()).findByText('Post 1');

    await act(() => client.refetchQueries({ queryKey: ['posts', 'user', 7] }));

    expect(client.getQueryState(['posts', 'user', 7])?.status).toBe('error');
    expect(requests).toHaveLength(2);
    expect(within(region()).getByText('Post 1')).toBeInTheDocument();
    expect(within(region()).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('says "No posts yet" when the person has none', async () => {
    mockPosts(ok([]));
    renderPosts();
    expect(await within(region()).findByText('No posts yet')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it(`shows only the newest ${String(RECENT_POSTS_LIMIT)} of 7 posts, in API order`, async () => {
    mockPosts(ok([1, 2, 3, 4, 5, 6, 7].map((id) => post(id))));
    renderPosts();
    await screen.findByText('Post 1');
    const articles = within(region()).getAllByRole('article');
    expect(articles).toHaveLength(5);
    expect(articles.map((a) => a.querySelector('p')?.textContent)).toEqual([
      'Post 1',
      'Post 2',
      'Post 3',
      'Post 4',
      'Post 5',
    ]);
    expect(screen.queryByText('Post 6')).not.toBeInTheDocument();
  });

  it('says "1 comment" for one and "14 comments" for many', async () => {
    mockPosts(ok([post(1, { comment_count: 1 }), post(2, { comment_count: 14 })]));
    renderPosts();
    await screen.findByText('Post 1');
    const [first, second] = within(region()).getAllByRole('article');
    expect(first).toHaveTextContent('3 days ago · 1 comment');
    expect(first).not.toHaveTextContent('1 comments');
    expect(second).toHaveTextContent('3 days ago · 14 comments');
  });

  it('puts the date in a <time> element with a machine-readable dateTime', async () => {
    const created = '2026-10-01T09:30:00.000Z';
    mockPosts(ok([post(1, { created_at: created as unknown as Date })]));
    renderPosts();
    await screen.findByText('Post 1');
    const time = region().querySelector('time');
    expect(time?.getAttribute('dateTime')).toBe(created);
  });

  it('leaves out the caption of a post without one, keeping time and count', async () => {
    mockPosts(ok([post(1, { caption: '   ', comment_count: 0 })]));
    renderPosts();
    const article = await within(region()).findByRole('article');
    expect(article.querySelectorAll('p')).toHaveLength(1);
    expect(article).toHaveTextContent(/^3 days ago · 0 comments$/);
  });

  it('leaves out the time and its separator when the date is missing or invalid', async () => {
    mockPosts(
      ok([
        post(1, { created_at: undefined, comment_count: 3 }),
        post(2, { created_at: 'not a date' as unknown as Date, comment_count: 1 }),
      ]),
    );
    renderPosts();
    await screen.findByText('Post 1');
    const [first, second] = within(region()).getAllByRole('article');
    expect(first?.querySelector('time')).toBeNull();
    expect(first).toHaveTextContent(/3 comments$/);
    expect(first).not.toHaveTextContent('·');
    expect(second).not.toHaveTextContent(/·|NaN|Invalid/);
  });

  it('renders markup in a caption as literal text and is not a link', async () => {
    mockPosts(ok([post(1, { caption: '<b>x</b>' })]));
    renderPosts();
    expect(await within(region()).findByText('<b>x</b>')).toBeInTheDocument();
    expect(region().querySelector('b')).toBeNull();
    expect(within(region()).queryByRole('link')).not.toBeInTheDocument();
  });
});
