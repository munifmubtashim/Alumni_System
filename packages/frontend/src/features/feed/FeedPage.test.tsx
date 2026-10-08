import type { AlumniListItem } from '@alumni/shared';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearToken } from '@/services/authToken';
import { httpClient } from '@/services/httpClient';
import { FEED_PAGE_SIZE } from './constants';
import { FeedPage } from './FeedPage';
import { EMPTY_HEADING } from './FeedStates';
import { fakeApi, makePost, ME, originalAdapter, renderWith, signIn, testClient } from './testKit';

let api: ReturnType<typeof fakeApi>;

beforeEach(() => {
  signIn();
  api = fakeApi();
});

afterEach(() => {
  httpClient.defaults.adapter = originalAdapter;
  clearToken();
  vi.restoreAllMocks();
});

/** The setup stub answers every width query false (a phone); this makes 48rem+ match. */
function wideScreen() {
  const original = window.matchMedia.bind(window);
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
    const list = original(query);
    if (query !== '(width >= 48rem)') return list;
    return Object.defineProperty(Object.create(list) as MediaQueryList, 'matches', {
      value: true,
    });
  });
}

const SUGGESTION: AlumniListItem = {
  id: 21,
  user_id: 210,
  name: 'Lena Novak',
  job_title: 'Product designer',
  current_company: 'Northwind',
  mentorship_available: true,
};

function renderPage() {
  const client = testClient();
  renderWith(<FeedPage />, client);
  return client;
}

describe('FeedPage', () => {
  it('shows a status line and skeletons while loading, then the posts', async () => {
    api.hold('get /posts');
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Feed' })).toBeInTheDocument();
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading posts…');
    expect(status.closest('[aria-busy="true"]')).toBeNull();

    await waitFor(() => {
      expect(api.held('get /posts')).toBeDefined();
    });
    api.held('get /posts')?.ok([makePost(2, { caption: 'Hiring a designer' }), makePost(1)]);
    expect(await screen.findByText('Hiring a designer')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  // BUG-001: one null-caption post used to replace the whole feed with the error page.
  it('renders the feed when one post among others has a null caption', async () => {
    api.on('get /posts', {
      ok: [
        makePost(3, { caption: 'Newest' }),
        makePost(2, { caption: null }),
        makePost(1, { caption: 'Oldest' }),
      ],
    });
    renderPage();
    expect(await screen.findByText('Newest')).toBeInTheDocument();
    expect(screen.getByText('Oldest')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });

  it('shows the empty state when there are no posts', async () => {
    api.on('get /posts', { ok: [] });
    renderPage();
    expect(await screen.findByRole('heading', { name: EMPTY_HEADING })).toBeInTheDocument();
    expect(screen.getByText(/Be the first to post something/)).toBeInTheDocument();
  });

  it('shows an error with Retry, and Retry loads the feed', async () => {
    api.on('get /posts', { fail: 400 }, { ok: [makePost(1, { caption: 'Back again' })] });
    renderPage();
    expect(await screen.findByText("The feed didn't load")).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Back again')).toBeInTheDocument();
  });

  it('loads more until a short page comes back', async () => {
    const first = Array.from({ length: FEED_PAGE_SIZE }, (_, i) => makePost(100 - i));
    api.on('get /posts', { ok: first }, { ok: [makePost(50, { caption: 'Older post' })] });
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Load more' }));
    expect(await screen.findByText('Older post')).toBeInTheDocument();
    const last = api.calls.filter((c) => c.url === '/posts').at(-1);
    expect(last?.params).toEqual({ limit: FEED_PAGE_SIZE, offset: FEED_PAGE_SIZE });
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('shows a new post before the server answers', async () => {
    api.on('get /posts', { ok: [makePost(1)] });
    api.hold('post /posts');
    renderPage();
    await screen.findByText('Post 1');

    await userEvent.type(screen.getByLabelText('Write a post'), 'Hello alumni');
    await userEvent.click(screen.getByRole('button', { name: 'Post' }));

    const article = (await screen.findByText('Hello alumni')).closest('article');
    expect(article).not.toBeNull();
    if (!article) return;
    expect(within(article).getByText(ME.name)).toBeInTheDocument();
    // Pending: no menu, toggle disabled.
    expect(within(article).queryByRole('button', { name: 'Post actions' })).toBeNull();
    expect(within(article).getByRole('button', { name: 'Comment' })).toBeDisabled();
    expect(screen.getByLabelText('Write a post')).toHaveValue('');
  });

  it('takes a refused post back, puts the text back and shows the API message', async () => {
    api.on('get /posts', { ok: [makePost(1)] });
    api.hold('post /posts');
    renderPage();
    await screen.findByText('Post 1');

    await userEvent.type(screen.getByLabelText('Write a post'), 'Hello alumni');
    await userEvent.click(screen.getByRole('button', { name: 'Post' }));
    await screen.findByText('Hello alumni');
    await waitFor(() => {
      expect(api.held('post /posts')).toBeDefined();
    });
    api.held('post /posts')?.fail(400, 'Caption is required');

    expect(await screen.findByText('Caption is required')).toBeInTheDocument();
    expect(screen.queryByText('Hello alumni', { selector: 'p' })).toBeNull();
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByLabelText('Write a post')).toHaveValue('Hello alumni');
  });

  it('deletes a post without comments at once and moves focus to the heading', async () => {
    // The refetch after the delete no longer has it.
    api.on(
      'get /posts',
      { ok: [makePost(1, { user_id: ME.user_id, author_name: ME.name })] },
      { ok: [] },
    );
    api.on('delete /posts/1', { ok: { message: 'Post deleted' } });
    renderPage();
    await screen.findByText('Post 1');

    await userEvent.click(screen.getByRole('button', { name: 'Post actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete post' }));

    await waitFor(() => {
      expect(screen.queryByText('Post 1')).not.toBeInTheDocument();
    });
    expect(api.count('delete /posts/1')).toBe(1);
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Feed' })).toHaveFocus();
    });
  });

  it('asks before deleting a post with comments; Cancel keeps it', async () => {
    api.on('get /posts', {
      ok: [makePost(1, { user_id: ME.user_id, comment_count: 3 })],
    });
    api.on('delete /posts/1', { ok: {} });
    renderPage();
    await screen.findByText('Post 1');

    await userEvent.click(screen.getByRole('button', { name: 'Post actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete post' }));

    const group = await screen.findByRole('group', {
      name: 'Delete this post and its 3 comments?',
    });
    await waitFor(() => {
      expect(within(group).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    });
    await userEvent.click(within(group).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(screen.getByText('Post 1')).toBeInTheDocument();
    expect(api.count('delete /posts/1')).toBe(0);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Post actions' })).toHaveFocus();
    });
  });

  it('deletes a post with comments after the inline confirm', async () => {
    api.on(
      'get /posts',
      { ok: [makePost(1, { user_id: ME.user_id, comment_count: 1 })] },
      { ok: [] },
    );
    api.on('delete /posts/1', { ok: {} });
    renderPage();
    await screen.findByText('Post 1');

    await userEvent.click(screen.getByRole('button', { name: 'Post actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete post' }));
    const group = await screen.findByRole('group', {
      name: 'Delete this post and its 1 comment?',
    });
    await userEvent.click(within(group).getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(screen.queryByText('Post 1')).not.toBeInTheDocument();
    });
    expect(api.count('delete /posts/1')).toBe(1);
  });

  it('puts a post back with the API message when the delete is refused (403)', async () => {
    api.on('get /posts', { ok: [makePost(1, { user_id: ME.user_id })] });
    api.hold('delete /posts/1');
    renderPage();
    await screen.findByText('Post 1');

    await userEvent.click(screen.getByRole('button', { name: 'Post actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete post' }));
    await waitFor(() => {
      expect(screen.queryByText('Post 1')).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(api.held('delete /posts/1')).toBeDefined();
    });
    api.held('delete /posts/1')?.fail(403, 'You can only change your own posts');

    expect(await screen.findByText('You can only change your own posts')).toBeInTheDocument();
    expect(screen.getByText("The post wasn't deleted")).toBeInTheDocument();
    expect(await screen.findByText('Post 1')).toBeInTheDocument();
  });

  it('a thread that answers 404 refetches the feed, which drops the post', async () => {
    api.on('get /posts', { ok: [makePost(1, { comment_count: 2 })] }, { ok: [] });
    api.on('get /posts/1/comments', { fail: 404, message: 'Post not found' });
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: '2 comments' }));
    // The notice itself is covered in CommentThread.test; here the card goes.
    expect(await screen.findByRole('heading', { name: EMPTY_HEADING })).toBeInTheDocument();
    expect(api.count('get /posts/1/comments')).toBe(1);
    expect(api.count('get /posts')).toBe(2);
  });

  it('a new comment bumps the count on the card at once', async () => {
    api.on('get /posts', { ok: [makePost(1, { comment_count: 1 })] });
    api.on('get /posts/1/comments', { ok: [] });
    api.hold('post /posts/1/comments');
    renderPage();
    const toggle = await screen.findByRole('button', { name: '1 comment' });
    await userEvent.click(toggle);
    await userEvent.type(
      await screen.findByRole('textbox', { name: 'Write a comment' }),
      'Congrats{Enter}',
    );
    expect(await screen.findByText('Congrats')).toBeInTheDocument();
    await userEvent.click(toggle);
    expect(toggle).toHaveTextContent('2 comments');
  });

  describe('Suggested alumni sidebar (REQ-016)', () => {
    it('shows the sidebar with its people from 48rem', async () => {
      wideScreen();
      api.on('get /posts', { ok: [makePost(1)] });
      api.on('get /alumni/suggestions', { ok: [SUGGESTION] });
      renderPage();
      const aside = screen.getByRole('region', { name: 'Suggested alumni' });
      const link = await within(aside).findByRole('link', { name: /Lena Novak/ });
      expect(link).toHaveAttribute('href', '/alumni/21');
      expect(within(aside).getByText('Mentor')).toBeInTheDocument();
      expect(await screen.findByText('Post 1')).toBeInTheDocument();
      expect(api.count('get /alumni/suggestions')).toBe(1);
    });

    it('renders no sidebar and sends no request on a phone', async () => {
      api.on('get /posts', { ok: [makePost(1)] });
      api.on('get /alumni/suggestions', { ok: [SUGGESTION] });
      renderPage();
      expect(await screen.findByText('Post 1')).toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Suggested alumni' })).not.toBeInTheDocument();
      expect(screen.queryByText('Suggested alumni')).not.toBeInTheDocument();
      expect(api.count('get /alumni/suggestions')).toBe(0);
    });

    it('a failed sidebar shows its own error and leaves the feed working', async () => {
      wideScreen();
      api.on('get /posts', { ok: [makePost(1)] });
      api.on('get /alumni/suggestions', { fail: 500 });
      api.hold('post /posts');
      renderPage();
      const aside = screen.getByRole('region', { name: 'Suggested alumni' });
      expect(await within(aside).findByText("Suggestions didn't load")).toBeInTheDocument();
      expect(within(aside).getByRole('button', { name: 'Retry' })).toBeInTheDocument();
      expect(await screen.findByText('Post 1')).toBeInTheDocument();

      await userEvent.type(screen.getByLabelText('Write a post'), 'Still posting');
      await userEvent.click(screen.getByRole('button', { name: 'Post' }));
      expect(await screen.findByText('Still posting')).toBeInTheDocument();
      expect(screen.getAllByRole('article')).toHaveLength(2);
    });
  });
});
