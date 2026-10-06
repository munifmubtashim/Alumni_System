import type { AlumniListItem } from '@alumni/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { directoryReturnPath } from '@/config/directoryReturn';
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

/** Stands in for the profile page: shows where its back link would go. */
function BackTarget() {
  const location = useLocation();
  return <p data-testid="back">{directoryReturnPath(location.state)}</p>;
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/directory" element={<AlumniCard alumnus={amira} />} />
        <Route path="/alumni/:id" element={<BackTarget />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AlumniCard handover to the profile', () => {
  it('passes the current search as link state', async () => {
    renderAt('/directory?q=ann&page=2');
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/alumni/7');
    await userEvent.click(link);
    expect(screen.getByTestId('back')).toHaveTextContent('/directory?q=ann&page=2');
  });

  it('hands over an empty search when the directory has none', async () => {
    renderAt('/directory');
    await userEvent.click(screen.getByRole('link'));
    expect(screen.getByTestId('back')).toHaveTextContent(/^\/directory$/);
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
