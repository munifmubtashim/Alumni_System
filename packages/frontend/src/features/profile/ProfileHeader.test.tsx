import type { Alumni } from '@alumni/shared';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProfileHeader, UNNAMED_PROFILE, type ProfileHeaderProps } from './ProfileHeader';

const AMIRA: Alumni = {
  id: 7,
  user_id: 70,
  name: 'Amira Mendes',
  email: 'amira@example.com',
  job_title: 'Design Lead',
  current_company: 'Terra Climate',
  graduation_year: 2017,
  linkedin_url: 'https://www.linkedin.com/in/amira',
};

function renderHeader(alumni: ProfileHeaderProps['alumni']) {
  return render(<ProfileHeader alumni={alumni} />);
}

describe('ProfileHeader', () => {
  it('shows the name as the one h1, focusable by script only', () => {
    renderHeader(AMIRA);
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Amira Mendes');
    expect(headings[0]).toHaveAttribute('tabindex', '-1');
  });

  it('shows the headline "Job title at Company · Class of YYYY"', () => {
    renderHeader(AMIRA);
    expect(screen.getByText('Design Lead at Terra Climate · Class of 2017')).toBeInTheDocument();
  });

  it('sets the tab title to "<name> · Alma"', async () => {
    renderHeader(AMIRA);
    await waitFor(() => {
      expect(document.title).toBe('Amira Mendes · Alma');
    });
  });

  it('links LinkedIn in a new tab, safely, with a decorative icon', () => {
    renderHeader(AMIRA);
    const link = screen.getByRole('link', { name: 'LinkedIn (opens in a new tab)' });
    expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/amira');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it.each(['javascript:alert(1)', 'data:text/html,x', 'linkedin.com/in/x', '', undefined])(
    'shows no LinkedIn link for %j',
    (linkedin_url) => {
      renderHeader({ ...AMIRA, linkedin_url });
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.queryByText('LinkedIn')).not.toBeInTheDocument();
    },
  );

  it('never shows the email', () => {
    const { container } = renderHeader({
      ...AMIRA,
      location: 'Lisbon',
      mentorship_available: true,
    });
    expect(container).not.toHaveTextContent('amira@example.com');
  });

  it('looks as before REQ-011 when none of the new values are set', () => {
    const { container } = renderHeader({
      ...AMIRA,
      headline: null,
      location: '  ',
      mentorship_available: false,
    });
    expect(container).not.toHaveTextContent(/mentor|Location/i);
    expect(screen.getByText('Design Lead at Terra Climate · Class of 2017')).toBeInTheDocument();
    expect(container.querySelectorAll('svg')).toHaveLength(1);
  });

  it('shows the headline under the name in place of job title and company', () => {
    renderHeader({ ...AMIRA, headline: 'Climate-tech design lead' });
    expect(screen.getByText('Climate-tech design lead · Class of 2017')).toBeInTheDocument();
    expect(screen.queryByText(/Terra Climate/)).not.toBeInTheDocument();
  });

  it('shows the location, named for screen readers, with a decorative pin', () => {
    renderHeader({ ...AMIRA, location: ' Lisbon, Portugal ' });
    const location = screen.getByText(/Lisbon, Portugal/);
    expect(location).toHaveTextContent(/^Location: Lisbon, Portugal$/);
    expect(location.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows the location even without a LinkedIn link', () => {
    renderHeader({ ...AMIRA, linkedin_url: undefined, location: 'Lisbon' });
    expect(screen.getByText(/Lisbon/)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows the "Available for mentorship" badge only when the flag is true', () => {
    const { unmount } = renderHeader({ ...AMIRA, mentorship_available: true });
    expect(screen.getByText('Available for mentorship')).toBeInTheDocument();
    unmount();
    renderHeader({ ...AMIRA, mentorship_available: false });
    expect(screen.queryByText('Available for mentorship')).not.toBeInTheDocument();
  });

  it('draws the badge as its own pill with a hidden dot, not a Tag (S3)', () => {
    renderHeader({ ...AMIRA, mentorship_available: true });
    const badge = screen.getByText('Available for mentorship');
    expect(badge).toHaveTextContent(/^Available for mentorship$/);
    expect(badge).not.toHaveAttribute('data-tone');
    const dot = badge.querySelector('svg');
    expect(dot).toHaveAttribute('aria-hidden', 'true');
    expect(dot).toHaveAttribute('fill', 'currentColor');
  });

  it('shows no badge when the flag is missing', () => {
    renderHeader(AMIRA);
    expect(screen.queryByText(/mentor/i)).not.toBeInTheDocument();
  });

  it('uses the large avatar, hidden from assistive tech', () => {
    const { container } = renderHeader(AMIRA);
    const avatar = container.querySelector('[data-size="lg"]');
    expect(avatar).toHaveAttribute('aria-hidden', 'true');
    expect(avatar).toHaveTextContent('AM');
  });

  it('hides the headline when job, company and year are empty', () => {
    renderHeader({ name: 'Amira Mendes', job_title: ' ', graduation_year: null });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Amira Mendes');
    expect(screen.queryByText(/Class of| at /)).not.toBeInTheDocument();
  });

  it(`falls back to "${UNNAMED_PROFILE}" for a blank name`, async () => {
    renderHeader({ name: '  ' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(UNNAMED_PROFILE);
    await waitFor(() => {
      expect(document.title).toBe(`${UNNAMED_PROFILE} · Alma`);
    });
  });
});
