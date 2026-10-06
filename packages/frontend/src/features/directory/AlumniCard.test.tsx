import type { AlumniListItem } from '@alumni/shared';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AlumniCard, AlumniCardSkeleton } from './AlumniCard';

const amira: AlumniListItem = {
  id: 7,
  user_id: 70,
  name: 'Amira Mendes',
  graduation_year: 2017,
  department: 'Product Design',
  job_title: 'Design Lead',
  current_company: 'Terra Climate',
};

function renderCard(alumnus: AlumniListItem) {
  return render(
    <MemoryRouter>
      <AlumniCard alumnus={alumnus} />
    </MemoryRouter>,
  );
}

describe('AlumniCard', () => {
  it('is one link to the profile, named by its text (not the initials)', () => {
    renderCard(amira);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    const link = links[0];
    expect(link).toHaveAttribute('href', '/alumni/7');
    expect(link).toHaveAccessibleName(
      'Amira Mendes Class of 2017 Product Design Design Lead, Terra Climate',
    );
  });

  it('shows name, class, department and "job title, company"', () => {
    renderCard(amira);
    expect(screen.getByText('Amira Mendes')).toBeInTheDocument();
    expect(screen.getByText('Class of 2017')).toBeInTheDocument();
    expect(screen.getByText('Product Design')).toBeInTheDocument();
    expect(screen.getByText('Design Lead, Terra Climate')).toBeInTheDocument();
  });

  it('carries no Mentor tag', () => {
    renderCard(amira);
    expect(screen.queryByText(/mentor/i)).toBeNull();
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
  ])('leaves out "Class of" when the year is %s', (_label, year) => {
    renderCard({ ...amira, graduation_year: year });
    expect(screen.queryByText(/Class of/)).toBeNull();
  });

  it('leaves out the department when it is missing or blank', () => {
    const { unmount } = renderCard({ ...amira, department: undefined });
    expect(screen.queryByText('Product Design')).toBeNull();
    unmount();
    renderCard({ ...amira, department: '   ' });
    expect(screen.getByRole('link')).toHaveAccessibleName(
      'Amira Mendes Class of 2017 Design Lead, Terra Climate',
    );
  });

  it.each([
    ['job title only', { current_company: undefined }, 'Design Lead'],
    ['company only', { job_title: undefined }, 'Terra Climate'],
    ['blank company', { current_company: ' ' }, 'Design Lead'],
  ])('shows the %s with no stray comma', (_label, patch, expected) => {
    renderCard({ ...amira, ...patch });
    expect(screen.getByText(expected)).toBeInTheDocument();
    expect(screen.queryByText(/,/)).toBeNull();
  });

  it('drops the details block when department and job are both missing', () => {
    renderCard({
      id: 3,
      user_id: 30,
      name: 'Jonas Kessler',
      graduation_year: null,
    });
    expect(screen.getByRole('link')).toHaveAccessibleName('Jonas Kessler');
  });

  it('shows the photo when there is one', () => {
    const { container } = renderCard({ ...amira, photo_url: '/photos/amira.jpg' });
    expect(container.querySelector('img')).toHaveAttribute('src', '/photos/amira.jpg');
  });

  it('shows initials when there is no photo', () => {
    const { container } = renderCard({ ...amira, photo_url: undefined });
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent(/^AM$/);
  });
});

describe('AlumniCard job line', () => {
  it.each([
    [{ job_title: 'Founder', current_company: 'Oliveira Works' }, 'Lena Founder, Oliveira Works'],
    [{ job_title: ' Founder ', current_company: '' }, 'Lena Founder'],
    [{ current_company: 'Oliveira Works' }, 'Lena Oliveira Works'],
    [{}, 'Lena'],
  ])('%j -> link named %j', (patch, expected) => {
    renderCard({ id: 5, user_id: 50, name: 'Lena', ...patch });
    expect(screen.getByRole('link')).toHaveAccessibleName(expected);
  });
});

describe('AlumniCardSkeleton', () => {
  it('is hidden from assistive tech and has no link', () => {
    const { container } = render(<AlumniCardSkeleton />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('link')).toBeNull();
  });
});
