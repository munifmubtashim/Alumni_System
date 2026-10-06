import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { directoryReturnState } from '@/config/directoryReturn';
import { BackLink } from './BackLink';

function DirectoryProbe() {
  const location = useLocation();
  return <p>At {location.pathname + location.search}</p>;
}

function renderAt(state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/alumni/7', state }]}>
      <Routes>
        <Route path="/alumni/:id" element={<BackLink />} />
        <Route path="/directory" element={<DirectoryProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

const link = () => screen.getByRole('link', { name: 'Back to directory' });

describe('BackLink', () => {
  it('goes back to the search the card was clicked from', async () => {
    renderAt(directoryReturnState('?q=ann&page=2'));
    expect(link()).toHaveAttribute('href', '/directory?q=ann&page=2');

    await userEvent.setup().click(link());
    expect(screen.getByText('At /directory?q=ann&page=2')).toBeInTheDocument();
  });

  it.each([undefined, null, { directorySearch: 'q=ann' }, { directorySearch: '?q=a#x' }])(
    'goes to the plain directory without a usable state (%j)',
    (state) => {
      renderAt(state);
      expect(link()).toHaveAttribute('href', '/directory');
    },
  );

  it('is the only link, named "Back to directory" (its text is in the DOM at every width)', () => {
    renderAt();
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(link()).toHaveAccessibleName('Back to directory');
    expect(screen.getByText('Back to directory')).not.toHaveAttribute('aria-hidden');
  });

  it('puts the phone "Profile" title inside the link, out of the accessibility tree', () => {
    renderAt();
    const title = screen.getByText('Profile');
    expect(title).toHaveAttribute('aria-hidden', 'true');
    expect(link()).toContainElement(title);
  });

  it('follows the link when the "Profile" title is tapped', async () => {
    renderAt(directoryReturnState('?q=ann'));
    await userEvent.setup().click(screen.getByText('Profile'));
    expect(screen.getByText('At /directory?q=ann')).toBeInTheDocument();
  });
});
