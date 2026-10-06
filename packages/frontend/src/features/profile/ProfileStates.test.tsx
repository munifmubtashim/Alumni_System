import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  LOAD_ERROR_HEADING,
  LOADING_HEADING,
  NOT_FOUND_HEADING,
  ProfileLoadError,
  ProfileNotFound,
  ProfileSkeleton,
} from './ProfileStates';

async function expectTitle(title: string) {
  await waitFor(() => {
    expect(document.title).toBe(title);
  });
}

describe('ProfileSkeleton', () => {
  it('has a hidden h1, a polite status line and a decorative, busy skeleton', async () => {
    const { container } = render(<ProfileSkeleton />);
    const heading = screen.getByRole('heading', { level: 1, name: LOADING_HEADING });
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('status')).toHaveTextContent('Loading profile…');
    const busy = container.querySelector('[aria-busy="true"]');
    expect(busy).toHaveAttribute('aria-hidden', 'true');
    expect(busy).not.toContainElement(screen.getByRole('status'));
    await expectTitle('Profile · Alma');
  });
});

describe('ProfileNotFound', () => {
  it('has its h1, an explanation and a matching title', async () => {
    render(<ProfileNotFound />);
    const heading = screen.getByRole('heading', { level: 1, name: NOT_FOUND_HEADING });
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(screen.getByText(/doesn't exist or was removed/)).toBeInTheDocument();
    await expectTitle('Profile not found · Alma');
  });
});

describe('ProfileLoadError', () => {
  it('has its h1, an error message, a matching title and a Retry that calls back', async () => {
    const onRetry = vi.fn();
    render(<ProfileLoadError onRetry={onRetry} />);
    const heading = screen.getByRole('heading', { level: 1, name: LOAD_ERROR_HEADING });
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    await expectTitle("Couldn't load this profile · Alma");

    await userEvent.setup().click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('marks Retry busy while retrying', () => {
    render(<ProfileLoadError onRetry={vi.fn()} retrying />);
    expect(screen.getByRole('button', { name: /Retry/ })).toBeDisabled();
  });
});
