import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { ABOUT_PATH } from '@/config/aboutPath';
import { BRAND_NAME, SUPPORT_EMAIL } from '@/config/brand';
import { SiteFooter } from './SiteFooter';

function renderFooter() {
  render(
    <MemoryRouter>
      <SiteFooter />
    </MemoryRouter>,
  );
}

describe('SiteFooter', () => {
  it('is the page footer with the copyright and the brand name', () => {
    renderFooter();

    expect(screen.getByRole('contentinfo')).toHaveTextContent(
      `© ${String(new Date().getFullYear())} ${BRAND_NAME}`,
    );
  });

  it('links About to the About page and Contact to a support email', () => {
    renderFooter();

    const nav = screen.getByRole('navigation', { name: 'Footer' });

    expect(within(nav).getByRole('link', { name: 'About' })).toHaveAttribute('href', ABOUT_PATH);
    expect(within(nav).getByRole('link', { name: 'Contact' }).getAttribute('href')).toMatch(
      new RegExp(`^mailto:${SUPPORT_EMAIL}\\?subject=`),
    );
  });

  it('does not link Privacy or Terms pages that do not exist', () => {
    renderFooter();

    expect(screen.queryByRole('link', { name: /privacy|terms/i })).not.toBeInTheDocument();
  });
});
