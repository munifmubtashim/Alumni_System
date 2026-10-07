import type { Comment, MyProfile, Post } from '@alumni/shared';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearToken } from '@/services/authToken';
import { httpClient } from '@/services/httpClient';
import { feedPosts, type PostsData } from './cacheEdits';
import { CommentThread, POST_GONE_MESSAGE } from './CommentThread';
import { POSTS_QUERY_KEY } from './constants';
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

function renderThread(comments: Comment[] | null, options: { me?: MyProfile; post?: Post } = {}) {
  const me = options.me ?? ME;
  const post = options.post ?? makePost(1, { comment_count: comments?.length ?? 0 });
  const client = testClient(me);
  const data: PostsData = { pages: [{ posts: [post], fetched: 1 }], pageParams: [0] };
  client.setQueryData(POSTS_QUERY_KEY, data);
  api.on('get /posts', { ok: [post] });
  if (comments === null) api.hold('get /posts/1/comments');
  else api.on('get /posts/1/comments', { ok: comments });
  renderWith(<CommentThread postId={1} me={me} />, client);
  return {
    client,
    count: () => {
      const cached = client.getQueryData<PostsData>(POSTS_QUERY_KEY);
      return cached ? feedPosts(cached)[0]?.comment_count : undefined;
    },
  };
}

describe('CommentThread', () => {
  it('shows a status line outside the busy skeleton while loading', () => {
    renderThread(null);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading comments…');
    expect(status.closest('[aria-busy="true"]')).toBeNull();
  });

  it('lists comments with replies indented under their comment', async () => {
    renderThread([
      makeComment(5, { content: 'First' }),
      makeComment(6, { content: 'Second' }),
      makeComment(7, { content: 'Answer to first', parent_id: 5 }),
    ]);
    const answer = await screen.findByText('Answer to first');
    const first = screen.getByText('First').closest('li');
    expect(first).not.toBeNull();
    if (!first) return;
    // The reply sits in a nested list inside the first comment's item.
    expect(within(first).getByText('Answer to first')).toBe(answer);
    expect(answer.closest('ul')?.closest('li')).toBe(first);
    for (const link of screen.getAllByRole('link', { name: 'Jonas Kessler' })) {
      expect(link).toHaveAttribute('href', '/alumni/8');
    }
  });

  it('shows the comment author as plain text without an alumni profile', async () => {
    renderThread([makeComment(5, { author_alumni_id: null, author_name: 'Sam Student' })]);
    expect(await screen.findByText('Sam Student')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows Edit and Delete only to the author or an admin', async () => {
    renderThread([
      makeComment(5, { user_id: ME.user_id, author_name: ME.name }),
      makeComment(6, { user_id: 80 }),
    ]);
    await screen.findByText('Comment 6');
    expect(screen.getAllByRole('button', { name: /^Reply to/ })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /^Edit comment/ })).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: `Delete comment by ${ME.name}` }),
    ).toBeInTheDocument();
  });

  it('lets an admin edit and delete anyone', async () => {
    renderThread([makeComment(6, { user_id: 80 })], { me: ADMIN });
    await screen.findByText('Comment 6');
    expect(screen.getByRole('button', { name: 'Edit comment by Jonas Kessler' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Delete comment by Jonas Kessler' })).toBeVisible();
  });

  it('shows a new comment at once, bumps the count, and clears the box', async () => {
    const { count } = renderThread([makeComment(5)]);
    api.hold('post /posts/1/comments');
    await screen.findByText('Comment 5');

    const box = screen.getByRole('textbox', { name: 'Write a comment' });
    await userEvent.type(box, 'Great news{Enter}');

    expect(await screen.findByText('Great news')).toBeInTheDocument();
    expect(box).toHaveValue('');
    expect(count()).toBe(2);
    // Pending: no Reply, Edit or Delete on it.
    const row = screen.getByText('Great news').closest('li');
    if (!row) throw new Error('row expected');
    expect(within(row).queryByRole('button')).toBeNull();
  });

  it('takes a refused comment back with the API message and puts the text back', async () => {
    const { count } = renderThread([]);
    api.on('post /posts/1/comments', { fail: 400, message: 'Comment is required' });
    const box = await screen.findByRole('textbox', { name: 'Write a comment' });
    await userEvent.type(box, 'Nope{Enter}');

    expect(await screen.findByText('Comment is required')).toBeInTheDocument();
    expect(screen.getByText("Your comment wasn't posted")).toBeInTheDocument();
    expect(screen.queryByText('Nope', { selector: 'p' })).toBeNull();
    expect(box).toHaveValue('Nope');
    expect(count()).toBe(0);
  });

  it('Reply targets the top-level comment and sends parent_id', async () => {
    renderThread([makeComment(5), makeComment(7, { parent_id: 5, author_name: 'Lena Novak' })]);
    api.on('post /posts/1/comments', { ok: makeComment(9, { parent_id: 5 }) });
    await screen.findByText('Comment 7');

    // Replying to a reply still goes under its top-level comment.
    await userEvent.click(screen.getByRole('button', { name: 'Reply to Lena Novak' }));
    const box = screen.getByRole('textbox', { name: 'Reply to Lena Novak' });
    expect(box).toHaveFocus();
    expect(box).toHaveAttribute('placeholder', 'Reply to Lena…');
    await userEvent.type(box, 'Thanks{Enter}');

    await waitFor(() => {
      expect(api.count('post /posts/1/comments')).toBe(1);
    });
    const sent = api.calls.find((c) => c.method === 'post');
    expect(JSON.parse(String(sent?.data))).toEqual({ content: 'Thanks', parent_id: 5 });
    expect(screen.getByRole('textbox', { name: 'Write a comment' })).toBeInTheDocument();
  });

  it('Cancel reply goes back to a plain comment', async () => {
    renderThread([makeComment(5)]);
    await userEvent.click(await screen.findByRole('button', { name: 'Reply to Jonas Kessler' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel reply' }));
    expect(screen.getByRole('textbox', { name: 'Write a comment' })).toHaveFocus();
  });

  it('edits a comment inline and sends PUT /comments/:id', async () => {
    renderThread([makeComment(5, { user_id: ME.user_id, author_name: ME.name, content: 'Old' })]);
    api.hold('put /comments/5');
    await userEvent.click(
      await screen.findByRole('button', { name: `Edit comment by ${ME.name}` }),
    );
    const field = screen.getByRole('textbox', { name: 'Edit comment' });
    await waitFor(() => {
      expect(field).toHaveFocus();
    });
    await userEvent.clear(field);
    await userEvent.type(field, 'New');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('New')).toBeInTheDocument();
    await waitFor(() => {
      expect(api.held('put /comments/5')).toBeDefined();
    });
    expect(JSON.parse(String(api.held('put /comments/5')?.config.data))).toEqual({
      content: 'New',
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: `Edit comment by ${ME.name}` })).toHaveFocus();
    });
  });

  it('deletes a comment at once, drops the count and keeps focus in the thread', async () => {
    const { count } = renderThread([
      makeComment(5, { user_id: ME.user_id, author_name: ME.name }),
      makeComment(6),
    ]);
    api.hold('delete /comments/5');
    await userEvent.click(
      await screen.findByRole('button', { name: `Delete comment by ${ME.name}` }),
    );
    expect(screen.queryByText('Comment 5')).not.toBeInTheDocument();
    expect(count()).toBe(1);
    expect(screen.getByRole('textbox', { name: 'Write a comment' })).toHaveFocus();
  });

  it('puts a comment back with the API message when the delete is refused (403)', async () => {
    renderThread([makeComment(5, { user_id: 80 })], { me: ADMIN });
    api.on('delete /comments/5', { fail: 403, message: 'You can only change your own comments' });
    await userEvent.click(
      await screen.findByRole('button', { name: 'Delete comment by Jonas Kessler' }),
    );
    expect(await screen.findByText('You can only change your own comments')).toBeInTheDocument();
    expect(screen.getByText('Comment 5')).toBeInTheDocument();
  });

  it('says the post is gone on a 404 and marks the feed for a refetch', async () => {
    const client = testClient(ME);
    client.setQueryData<PostsData>(POSTS_QUERY_KEY, {
      pages: [{ posts: [makePost(1)], fetched: 1 }],
      pageParams: [0],
    });
    api.on('get /posts/1/comments', { fail: 404, message: 'Post not found' });
    renderWith(<CommentThread postId={1} me={ME} />, client);

    expect(await screen.findByText(POST_GONE_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
    // Invalidated: the page's own posts query (active there) refetches.
    await waitFor(() => {
      expect(client.getQueryState(POSTS_QUERY_KEY)?.isInvalidated).toBe(true);
    });
  });

  it('shows an error with Retry for other failures', async () => {
    api.on('get /posts/1/comments', { fail: 400 }, { ok: [makeComment(5)] });
    const client = testClient(ME);
    renderWith(<CommentThread postId={1} me={ME} />, client);
    expect(await screen.findByText("Comments didn't load")).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Comment 5')).toBeInTheDocument();
  });
});
