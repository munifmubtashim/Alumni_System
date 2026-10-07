import type { MyProfile } from '@alumni/shared';
import { render, screen } from '@testing-library/react';
import { createStore } from 'jotai';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/providers';
import { createQueryClient } from '@/app/queryClient';
import { CURRENT_USER_QUERY_KEY } from '@/features/auth';
import { HomePage } from './HomePage';

function profile(name: string, role: MyProfile['role']): MyProfile {
  return {
    user_id: 1,
    name,
    email: `${name.toLowerCase()}@example.com`,
    role,
    alumni_id: role === 'alumni' ? 1 : null,
    has_alumni_profile: role === 'alumni',
    student_id: role === 'student' ? 1 : null,
    has_student_profile: role === 'student',
  };
}

/** HomePage sits under RequireAuth, which has already loaded ['me']. */
function renderWith(user: MyProfile | undefined) {
  const queryClient = createQueryClient();
  if (user) queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user);
  return render(
    <AppProviders queryClient={queryClient} store={createStore()}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </AppProviders>,
  );
}

describe('HomePage', () => {
  it('greets the user by first name with the subtitle', () => {
    renderWith(profile('Amina Rao', 'alumni'));

    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome back, Amina' }),
    ).toBeInTheDocument();
    expect(screen.getByText("Here's what's happening in your alumni network.")).toBeInTheDocument();
  });

  it('uses a one-word name as it is', () => {
    renderWith(profile('Jonas', 'student'));

    expect(screen.getByRole('heading', { name: 'Welcome back, Jonas' })).toBeInTheDocument();
  });

  it('greets without a name when the name is blank', () => {
    renderWith(profile('  ', 'alumni'));

    expect(screen.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeInTheDocument();
  });

  it('shows only the cards for pages that exist: the directory, the feed and My Profile', () => {
    renderWith(profile('Amina', 'alumni'));

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute('href', '/directory');
    expect(links[0]).toHaveTextContent('Browse the directory');
    expect(links[0]).toHaveTextContent('Find classmates by year, department or field');
    expect(links[1]).toHaveAttribute('href', '/feed');
    expect(links[1]).toHaveTextContent('Catch up on the feed');
    expect(links[1]).toHaveTextContent('See what alumni and students are sharing');
    expect(links[2]).toHaveAttribute('href', '/me');
    expect(links[2]).toHaveTextContent('My Profile');
    expect(links[2]).toHaveTextContent('Keep your details current so classmates can find you');
    expect(screen.queryByText('Update your profile')).not.toBeInTheDocument();
  });

  it('drops the old role line and coming-soon note', () => {
    renderWith(profile('Amina', 'alumni'));

    expect(screen.queryByText(/signed in as/)).not.toBeInTheDocument();
    expect(screen.queryByText(/coming soon/)).not.toBeInTheDocument();
  });

  it('renders nothing without a loaded profile', () => {
    const { container } = renderWith(undefined);

    expect(container).toBeEmptyDOMElement();
  });
});
