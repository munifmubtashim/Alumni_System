import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { profile, renderHome, resetApi } from './homeTestKit';
import { ProfileCompletenessCard } from './ProfileCompletenessCard';

afterEach(resetApi);

const card = () => screen.queryByRole('region', { name: 'Complete your profile' });

describe('ProfileCompletenessCard', () => {
  it('shows the progress and one next step linking to Account settings', () => {
    renderHome(
      <ProfileCompletenessCard
        profile={profile('alumni', { job_title: 'Engineer', department: 'CS' })}
      />,
    );

    expect(card()).toBeInTheDocument();
    const bar = screen.getByRole('progressbar', { name: 'Profile completeness' });
    expect(bar).toHaveAttribute('value', '33');
    expect(bar).toHaveAttribute('max', '100');
    expect(screen.getByText(/Your profile is 33% complete/)).toBeInTheDocument();
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName('Add a headline');
    expect(links[0]).toHaveAttribute('href', '/me');
  });

  it('starts at 0% with the headline as the next step', () => {
    renderHome(<ProfileCompletenessCard profile={profile('alumni')} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '0');
    expect(screen.getByRole('link', { name: 'Add a headline' })).toBeInTheDocument();
  });

  it('shows no card for a complete profile', () => {
    renderHome(
      <ProfileCompletenessCard
        profile={profile('alumni', {
          photo_url: 'p',
          headline: 'h',
          job_title: 'j',
          current_company: 'c',
          department: 'd',
          graduation_year: '2017',
          bio: 'b',
        })}
      />,
    );
    expect(card()).not.toBeInTheDocument();
  });

  it('never asks a student for a headline', () => {
    renderHome(<ProfileCompletenessCard profile={profile('student', {})} />);
    expect(screen.getByRole('link', { name: 'Add your current role' })).toBeInTheDocument();
    expect(screen.queryByText(/headline/i)).not.toBeInTheDocument();
  });

  it('shows no card for an account without an alumni or student row', () => {
    renderHome(<ProfileCompletenessCard profile={profile('none')} />);
    expect(card()).not.toBeInTheDocument();
  });
});
