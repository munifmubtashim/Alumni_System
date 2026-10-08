import type { AlumniListItem } from '@alumni/shared';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SKELETON_COUNT, ResultsGrid } from './ResultsGrid';

const items: AlumniListItem[] = [
  { id: 1, user_id: 10, name: 'Amira Mendes', graduation_year: 2017 },
  { id: 2, user_id: 20, name: 'Jonas Kessler', graduation_year: 2015 },
  { id: 3, user_id: 30, name: 'Priya Rao Shah', graduation_year: 2020 },
];

describe('ResultsGrid', () => {
  it('renders the results as a list of card links, in order', () => {
    render(
      <MemoryRouter>
        <ResultsGrid items={items} />
      </MemoryRouter>,
    );
    const list = screen.getByRole('list');
    const entries = within(list).getAllByRole('listitem');
    expect(entries).toHaveLength(3);
    expect(
      within(list)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/alumni/1', '/alumni/2', '/alumni/3']);
    expect(list.closest('[aria-busy]')).toBeNull();
  });

  it(`shows ${String(DEFAULT_SKELETON_COUNT)} skeleton cards by default while loading`, () => {
    const { container } = render(<ResultsGrid loading />);
    expect(container.querySelectorAll('[data-skeleton]')).toHaveLength(DEFAULT_SKELETON_COUNT);
  });

  it('shows the requested number of skeleton cards', () => {
    const { container } = render(<ResultsGrid loading skeletonCount={12} />);
    expect(container.querySelectorAll('[data-skeleton]')).toHaveLength(12);
  });

  it('marks the loading region busy, announces it, and exposes no list or links', () => {
    const { container } = render(<ResultsGrid loading />);
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Loading alumni…');
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
