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

  it('never shows the email, a location or a mentorship badge', () => {
    const { container } = renderHeader(AMIRA);
    expect(container).not.toHaveTextContent('amira@example.com');
    expect(container).not.toHaveTextContent(/mentor|Lisbon/i);
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
