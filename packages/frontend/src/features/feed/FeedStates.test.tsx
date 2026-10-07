import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EMPTY_HEADING, EmptyFeed, FeedLoadError, FeedSkeleton, LoadMore } from './FeedStates';

describe('FeedSkeleton', () => {
  it('announces loading outside the busy, hidden skeletons', () => {
    const { container } = render(<FeedSkeleton />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading posts…');
    expect(status.closest('[aria-busy="true"]')).toBeNull();
    const busy = container.querySelector('[aria-busy="true"]');
    expect(busy?.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });
});

describe('EmptyFeed', () => {
  it('shows the S4-EmptyFeed heading and text', () => {
    render(<EmptyFeed />);
    expect(screen.getByRole('heading', { level: 2, name: EMPTY_HEADING })).toBeInTheDocument();
    expect(
      screen.getByText(
        "When alumni and students start sharing updates, they'll show up here. Be the first to post something.",
      ),
    ).toBeInTheDocument();
  });
});

describe('FeedLoadError', () => {
  it('shows an alert and calls onRetry', async () => {
    const onRetry = vi.fn();
    render(<FeedLoadError onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent("The feed didn't load");
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows Retry busy while retrying', () => {
    render(<FeedLoadError onRetry={vi.fn()} retrying />);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeDisabled();
  });
});

describe('LoadMore', () => {
  it('calls onLoadMore, is busy while loading and says when a page failed', async () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(
      <LoadMore onLoadMore={onLoadMore} loading={false} failed={false} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(onLoadMore).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alert')).toBeNull();

    rerender(<LoadMore onLoadMore={onLoadMore} loading failed={false} />);
    expect(screen.getByRole('button', { name: 'Load more' })).toHaveAttribute('aria-busy', 'true');

    rerender(<LoadMore onLoadMore={onLoadMore} loading={false} failed />);
    expect(screen.getByRole('alert')).toHaveTextContent("More posts didn't load");
  });
});
