import type { MyProfile } from '@alumni/shared';
import { render, screen } from '@testing-library/react';
import { createStore } from 'jotai';
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
      <HomePage />
    </AppProviders>,
  );
}

describe('HomePage', () => {
  it('greets an alumnus by name and role', () => {
    renderWith(profile('Amina', 'alumni'));

    expect(screen.getByRole('heading', { level: 1, name: 'Welcome, Amina' })).toBeInTheDocument();
    expect(screen.getByText("You're signed in as an alumnus.")).toBeInTheDocument();
    expect(
      screen.getByText('More is coming soon: the feed, directory and profiles.'),
    ).toBeInTheDocument();
  });

  it('greets a student by name and role', () => {
    renderWith(profile('Jonas', 'student'));

    expect(screen.getByRole('heading', { name: 'Welcome, Jonas' })).toBeInTheDocument();
    expect(screen.getByText("You're signed in as a student.")).toBeInTheDocument();
  });

  it('renders nothing without a loaded profile', () => {
    const { container } = renderWith(undefined);

    expect(container).toBeEmptyDOMElement();
  });
});
