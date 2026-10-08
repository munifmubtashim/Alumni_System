import type { AlumniListItem } from '@alumni/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { PersonRow, PersonRowSkeleton } from './PersonRow';

const amira: AlumniListItem = {
  id: 7,
  user_id: 70,
  name: 'Amira Mendes',
  job_title: 'Design Lead',
  current_company: 'Terra Climate',
  mentorship_available: true,
};

function renderRow(person: AlumniListItem) {
  return render(
    <MemoryRouter>
      <PersonRow person={person} />
    </MemoryRouter>,
  );
}

describe('PersonRow', () => {
  it('is one link to /alumni/<id>, named by its text with spaces between lines', () => {
    renderRow(amira);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/alumni/7');
    expect(links[0]).toHaveAccessibleName('Amira Mendes Design Lead, Terra Climate Mentor');
  });

  it('shows the initials avatar when there is no photo, and the photo when there is', () => {
    const { container, rerender } = renderRow(amira);
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('AM');

    rerender(
      <MemoryRouter>
        <PersonRow person={{ ...amira, photo_url: 'https://example.com/a.png' }} />
      </MemoryRouter>,
    );
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/a.png');
  });

  it.each([
    ['only the job title', { current_company: '  ' }, 'Design Lead'],
    ['only the company', { job_title: undefined }, 'Terra Climate'],
  ])('shows %s with no stray comma', (_label, overrides, line) => {
    renderRow({ ...amira, ...overrides });
    expect(screen.getByText(line)).toBeInTheDocument();
    expect(screen.queryByText(/,/)).not.toBeInTheDocument();
  });

  it('leaves the role line out when both parts are missing', () => {
    renderRow({ ...amira, job_title: '', current_company: undefined });
    expect(screen.getByRole('link')).toHaveAccessibleName('Amira Mendes Mentor');
  });

  it.each([
    ['false', false],
    ['missing', undefined],
  ])('has no Mentor tag when mentorship_available is %s', (_label, flag) => {
    renderRow({ ...amira, mentorship_available: flag });
    expect(screen.queryByText('Mentor')).not.toBeInTheDocument();
  });

  it('opens the profile with no directory router state', async () => {
    let seenState: unknown = 'unset';
    function Profile() {
      const location = useLocation();
      seenState = location.state as unknown;
      return <p>Profile page</p>;
    }
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/?q=ada']}>
        <Routes>
          <Route path="/" element={<PersonRow person={amira} />} />
          <Route path="/alumni/:id" element={<Profile />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('link'));

    expect(await screen.findByText('Profile page')).toBeInTheDocument();
    expect(seenState).toBeNull();
  });
});

describe('PersonRowSkeleton', () => {
  it('is hidden from assistive tech and is not a link', () => {
    const { container } = render(<PersonRowSkeleton />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
