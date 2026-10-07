import type { MyProfile } from '@alumni/shared';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearToken } from '@/services/authToken';
import { httpClient } from '@/services/httpClient';
import type { FeedPost, PostsData } from './cacheEdits';
import { POSTS_QUERY_KEY } from './constants';
import { itemKey } from './feedFormat';
import { PostCard } from './PostCard';
import { usePosts } from './usePosts';
import {
  ADMIN,
  fakeApi,
  makeComment,
  makePost,
  ME,
  originalAdapter,
  renderWith,
  signIn,
  testClient,
} from './testKit';

let api: ReturnType<typeof fakeApi>;

beforeEach(() => {
  signIn();
  api = fakeApi();
});

afterEach(() => {
  httpClient.defaults.adapter = originalAdapter;
  clearToken();
});

/** Renders the cached feed as cards, so cache edits show (as FeedPage does). */
function Cards({ me }: { me: MyProfile | undefined }) {
  const posts = usePosts();
  return (
    <>
      {posts.data?.map((post) => (
        <PostCard key={itemKey(post)} post={post} me={me} onDelete={vi.fn()} />
      ))}
    </>
  );
}

function renderCards(posts: FeedPost[], me: MyProfile | null = ME) {
  const client = testClient(me);
  const data: PostsData = { pages: [{ posts, fetched: posts.length }], pageParams: [0] };
  client.setQueryData(POSTS_QUERY_KEY, data);
  api.on('get /posts', { ok: posts });
  renderWith(<Cards me={me ?? undefined} />, client);
  return client;
}

describe('PostCard', () => {
  it('links the author name and avatar to the alumni profile, not the user id', () => {
    renderCards([makePost(1, { user_id: 70, author_alumni_id: 7 })]);
    const link = screen.getByRole('link', { name: 'Amira Mendes' });
    expect(link).toHaveAttribute('href', '/alumni/7');
    // The avatar link is a hidden mouse shortcut to the same page.
    const article = screen.getByRole('article');
    const hrefs = Array.from(article.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/alumni/7', '/alumni/7']);
  });

  it('shows a plain name and no link when the author has no alumni profile', () => {
    renderCards([makePost(1, { author_alumni_id: null, author_name: 'Sam Student' })]);
    expect(screen.getByText('Sam Student')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('article').querySelector('a')).toBeNull();
  });

  it('shows the time in a <time> and "· edited" only after a later save', () => {
    const created = new Date(Date.now() - 3 * 86_400_000).toISOString();
    const later = new Date(Date.now() - 86_400_000).toISOString();
    renderCards([
      makePost(1, {
        created_at: created as unknown as Date,
        updated_at: created as unknown as Date,
      }),
      makePost(2, { created_at: created as unknown as Date, updated_at: later as unknown as Date }),
    ]);
    const [first, second] = screen.getAllByRole('article');
    if (!first || !second) throw new Error('two cards expected');
    const time = first.querySelector('time');
    expect(time).toHaveAttribute('dateTime', created);
    expect(time).toHaveTextContent('3 days ago');
    expect(first).not.toHaveTextContent('edited');
    expect(second).toHaveTextContent('3 days ago · edited');
  });

  it('keeps line breaks and long words in the text (pre-wrap)', () => {
    renderCards([makePost(1, { caption: 'Line one\nLine two' })]);
    expect(screen.getByText(/Line one/).textContent).toBe('Line one\nLine two');
  });

  it.each<[string, MyProfile | null, number, boolean]>([
    ['the author', ME, ME.user_id, true],
    ['an admin', ADMIN, 70, true],
    ['another user', ME, 70, false],
    ['nobody signed in', null, 70, false],
  ])('shows the Post actions menu to %s: %s', (_who, me, authorId, shown) => {
    renderCards([makePost(1, { user_id: authorId })], me);
    expect(screen.queryByRole('button', { name: 'Post actions' }) !== null).toBe(shown);
  });

  it('shows no menu and a disabled toggle on a pending post', () => {
    renderCards([{ ...makePost(-1, { user_id: ME.user_id }), clientKey: 'temp-1' }]);
    expect(screen.queryByRole('button', { name: 'Post actions' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Comment' })).toBeDisabled();
  });

  it('edits inline: Save shows the new text at once and sends it', async () => {
    renderCards([makePost(1, { user_id: ME.user_id, caption: 'Old text' })]);
    api.hold('put /posts/1');

    await userEvent.click(screen.getByRole('button', { name: 'Post actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit post' }));
    const field = await screen.findByRole('textbox', { name: 'Edit post' });
    await waitFor(() => {
      expect(field).toHaveFocus();
    });
    await userEvent.clear(field);
    await userEvent.type(field, '  New text ');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('New text')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Edit post' })).toBeNull();
    await waitFor(() => {
      expect(api.held('put /posts/1')).toBeDefined();
    });
    expect(JSON.parse(String(api.held('put /posts/1')?.config.data))).toEqual({
      caption: 'New text',
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Post actions' })).toHaveFocus();
    });
  });

  it('Cancel (or Escape) leaves the text and returns focus to the menu', async () => {
    renderCards([makePost(1, { user_id: ME.user_id, caption: 'Old text' })]);
    await userEvent.click(screen.getByRole('button', { name: 'Post actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit post' }));
    const field = await screen.findByRole('textbox', { name: 'Edit post' });
    await waitFor(() => {
      expect(field).toHaveFocus();
    });
    await userEvent.type(field, ' more');
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('textbox', { name: 'Edit post' })).toBeNull();
    expect(screen.getByText('Old text')).toBeInTheDocument();
    expect(api.count('put /posts/1')).toBe(0);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Post actions' })).toHaveFocus();
    });
  });

  it('puts the old text back and shows the API message when an edit is refused (403)', async () => {
    renderCards([makePost(1, { user_id: 70, caption: 'Old text' })], ADMIN);
    api.on('put /posts/1', { fail: 403, message: 'You can only change your own posts' });

    await userEvent.click(screen.getByRole('button', { name: 'Post actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit post' }));
    const field = await screen.findByRole('textbox', { name: 'Edit post' });
    await userEvent.clear(field);
    await userEvent.type(field, 'Changed');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('You can only change your own posts')).toBeInTheDocument();
    expect(screen.getByText('Old text')).toBeInTheDocument();
  });

  it('disables Save while the edit is blank', async () => {
    renderCards([makePost(1, { user_id: ME.user_id, caption: 'Old text' })]);
    await userEvent.click(screen.getByRole('button', { name: 'Post actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit post' }));
    await userEvent.clear(await screen.findByRole('textbox', { name: 'Edit post' }));
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('toggles the thread: "N comments" opens it, "Hide comments" closes it', async () => {
    renderCards([makePost(1, { comment_count: 2 })]);
    api.on('get /posts/1/comments', {
      ok: [makeComment(5, { content: 'Would love an intro' }), makeComment(6)],
    });

    const toggle = screen.getByRole('button', { name: '2 comments' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveTextContent('Hide comments');
    expect(await screen.findByText('Would love an intro')).toBeInTheDocument();
    const thread = document.getElementById(toggle.getAttribute('aria-controls') ?? '');
    expect(thread).not.toBeNull();

    await userEvent.click(toggle);
    expect(toggle).toHaveTextContent('2 comments');
    expect(screen.queryByText('Would love an intro')).not.toBeInTheDocument();
  });

  it('reads "Comment" with no comments and opens an empty thread with a reply box', async () => {
    renderCards([makePost(1, { comment_count: 0 })]);
    api.on('get /posts/1/comments', { ok: [] });
    await userEvent.click(screen.getByRole('button', { name: 'Comment' }));
    const article = screen.getByRole('article');
    expect(
      await within(article).findByRole('textbox', { name: 'Write a comment' }),
    ).toHaveAttribute('placeholder', 'Write a comment…');
  });
});
