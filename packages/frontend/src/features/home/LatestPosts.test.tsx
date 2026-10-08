import type { Post } from '@alumni/shared';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { fail, mockApi, never, ok, renderHome, requests, resetApi } from './homeTestKit';
import { LatestPosts } from './LatestPosts';

afterEach(resetApi);

const posts: Post[] = [
  {
    id: 3,
    user_id: 30,
    caption: 'Hiring two engineers',
    created_at: new Date(Date.now() - 2 * 60 * 60_000),
    author_name: 'Ada Lovelace',
    author_alumni_id: 12,
  },
  { id: 2, user_id: 20, caption: null, author_name: 'Sam Student', author_alumni_id: null },
  { id: 1, user_id: 10, caption: 'Hello', author_alumni_id: 5 },
];

const region = () => screen.getByRole('region', { name: 'Latest from the feed' });

describe('LatestPosts', () => {
  it('asks for the 3 newest posts and shows each with its author and time', async () => {
    mockApi({ '/posts': ok(posts) });
    renderHome(<LatestPosts />);

    const [first, second, third] = await within(region()).findAllByRole('article');
    if (!first || !second || !third) throw new Error('expected three posts');
    expect(requests).toEqual([{ url: '/posts', params: { limit: 3, offset: 0 } }]);

    expect(within(first).getByRole('link', { name: 'Ada Lovelace' })).toHaveAttribute(
      'href',
      '/alumni/12',
    );
    expect(within(first).getByText('2 hours ago')).toBeInTheDocument();
    expect(within(first).getByText('Hiring two engineers')).toBeInTheDocument();
    // No alumni profile: the name is plain text. A null caption shows nothing (BUG-001).
    expect(within(second).queryByRole('link')).not.toBeInTheDocument();
    expect(within(second).getByText('Sam Student')).toBeInTheDocument();
    // A row without its joined name still reads as someone.
    expect(within(third).getByRole('link', { name: 'Unknown member' })).toBeInTheDocument();
  });

  it('links "See all" to the feed', () => {
    mockApi({ '/posts': never });
    renderHome(<LatestPosts />);
    expect(within(region()).getByRole('link', { name: 'See all posts' })).toHaveAttribute(
      'href',
      '/feed',
    );
  });

  it('caches under the feed root and refetches each time it mounts', async () => {
    mockApi({ '/posts': ok(posts) });
    const { queryClient, rerender } = renderHome(<LatestPosts />);
    await within(region()).findAllByRole('article');
    expect(queryClient.getQueryData(['feed', 'latest'])).toEqual(posts);

    // Feed writes edit only their exact keys, so Home refetches on every visit (ADV-004).
    rerender(<p>Away</p>);
    rerender(<LatestPosts />);
    await waitFor(() => {
      expect(requests).toHaveLength(2);
    });
  });

  it('shows skeletons and an announced loading status while it loads', () => {
    mockApi({ '/posts': never });
    renderHome(<LatestPosts />);
    expect(within(region()).getByRole('status')).toHaveTextContent('Loading posts…');
    const busy = region().querySelector('[aria-busy="true"]');
    expect(busy?.querySelectorAll('[data-skeleton]')).toHaveLength(3);
    expect(busy?.contains(within(region()).getByRole('status'))).toBe(false);
  });

  it('shows a note when there are no posts', async () => {
    mockApi({ '/posts': ok([]) });
    renderHome(<LatestPosts />);
    expect(await within(region()).findByText(/No posts yet/)).toBeInTheDocument();
    expect(within(region()).queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows its own error with Retry, and Retry loads the posts', async () => {
    mockApi({ '/posts': [fail(), ok(posts)] });
    const user = userEvent.setup();
    renderHome(<LatestPosts />);

    expect(await within(region()).findByRole('alert')).toHaveTextContent("Posts didn't load");
    await user.click(within(region()).getByRole('button', { name: 'Retry' }));

    expect(await within(region()).findAllByRole('article')).toHaveLength(3);
    expect(within(region()).queryByRole('alert')).not.toBeInTheDocument();
  });
});
