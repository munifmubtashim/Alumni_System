import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AboutPage } from './AboutPage';

describe('AboutPage', () => {
  it('has the mission line as the one h1, with the lead under it', () => {
    render(<AboutPage />);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'A lifelong connection between alumni and the students who follow them.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Find mentors, share opportunities/)).toBeInTheDocument();
  });

  it('shows "How it works" as three numbered steps in order', () => {
    render(<AboutPage />);

    const section = screen.getByRole('region', { name: 'How it works' });
    const steps = within(section).getAllByRole('listitem');

    expect(steps).toHaveLength(3);
    expect(
      steps.map((step) => within(step).getByRole('heading', { level: 3 }).textContent),
    ).toEqual(['Create your profile', 'Find your people', 'Connect and share']);
    expect(steps.map((step) => step.textContent)).toEqual([
      expect.stringMatching(/^1Create your profile/),
      expect.stringMatching(/^2Find your people/),
      expect.stringMatching(/^3Connect and share/),
    ]);
  });

  it('has a card for students and one for alumni', () => {
    render(<AboutPage />);

    const section = screen.getByRole('region', { name: 'Who Alma is for' });

    expect(within(section).getByRole('heading', { level: 3, name: 'For students' })).toBeVisible();
    expect(within(section).getByRole('heading', { level: 3, name: 'For alumni' })).toBeVisible();
  });

  it('states no counts or statistics, and promises no feature Alma lacks', () => {
    const { container } = render(<AboutPage />);
    // The step numbers 1 to 3 (aria-hidden) are the only digits on the page.
    const copy = container.cloneNode(true) as HTMLElement;
    copy.querySelectorAll('[aria-hidden="true"]').forEach((node) => {
      node.remove();
    });
    const text = copy.textContent;

    expect(text).not.toMatch(/\d/);
    expect(text).not.toMatch(/\b(thousands?|millions?|hundreds?|\d+\+?\s*(members|alumni))\b/i);
    expect(text).not.toMatch(/\bhires?\b|direct messag|reach out/i);
  });

  it('renders no link or button, so it needs no router and makes no API call', () => {
    render(<AboutPage />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
