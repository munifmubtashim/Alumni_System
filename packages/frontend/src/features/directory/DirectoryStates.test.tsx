import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LoadError, NoResults } from './DirectoryStates';

describe('NoResults filtered text', () => {
  it.each([
    [{ q: 'marine biology' }, '"marine biology"'],
    [{ q: 'marine biology', graduationYear: 2022 }, '"marine biology" with Grad. year 2022'],
    [{ department: 'Economics' }, 'Department Economics'],
    [
      { department: 'Economics', university: 'Oxford' },
      'Department Economics and University Oxford',
    ],
    [
      { q: 'lead', department: 'Economics', university: 'Oxford', graduationYear: 2015 },
      '"lead" with Department Economics, University Oxford and Grad. year 2015',
    ],
  ])('%j names %j', (filters, expected) => {
    render(<NoResults variant="filtered" filters={filters} onClearFilters={vi.fn()} />);
    expect(screen.getByText(`— ${expected} doesn't match`, { exact: false })).toBeInTheDocument();
  });
});

describe('NoResults', () => {
  it('filtered: names the search and filters and clears them', async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();
    render(
      <NoResults
        variant="filtered"
        filters={{ q: 'marine biology', graduationYear: 2022 }}
        onClearFilters={onClearFilters}
      />,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'No alumni match these filters' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Try removing a filter or searching a different term — "marine biology" with Grad. year 2022 doesn\'t match any profiles yet.',
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('filtered with only a search: says "this search"', () => {
    render(<NoResults variant="filtered" filters={{ q: 'zzz' }} onClearFilters={vi.fn()} />);
    expect(
      screen.getByRole('heading', { name: 'No alumni match this search' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/"zzz" doesn't match/)).toBeInTheDocument();
  });

  it('pastEnd: offers a way back to page 1', async () => {
    const user = userEvent.setup();
    const onFirstPage = vi.fn();
    render(<NoResults variant="pastEnd" onFirstPage={onFirstPage} />);
    expect(screen.getByRole('heading', { name: 'Nothing on this page' })).toBeInTheDocument();
    expect(screen.getByText(/past the end of the results/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to page 1' }));
    expect(onFirstPage).toHaveBeenCalledTimes(1);
  });

  it('none: a plain "No alumni yet" with no button', () => {
    render(<NoResults variant="none" />);
    expect(screen.getByRole('heading', { name: 'No alumni yet' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('keeps the icon out of the accessibility tree', () => {
    const { container } = render(<NoResults variant="none" />);
    expect(container.querySelector('svg')?.closest('[aria-hidden="true"]')).not.toBeNull();
  });
});

describe('LoadError', () => {
  it('shows an error alert and calls onRetry from the Retry button', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<LoadError onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent("The directory didn't load");
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('disables Retry and marks it busy while retrying', () => {
    render(<LoadError onRetry={vi.fn()} retrying />);
    const button = screen.getByRole('button', { name: 'Retry' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});
