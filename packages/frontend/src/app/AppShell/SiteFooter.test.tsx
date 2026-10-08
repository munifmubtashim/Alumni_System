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

  it('keeps the © and the links in one inner box, the page-width column', () => {
    renderFooter();

    // jsdom has no layout: this pins the structure the --page-max rule in
    // SiteFooter.module.css relies on; the edges are measured in a browser.
    const footer = screen.getByRole('contentinfo');
    const inner = footer.firstElementChild;

    expect(footer.children).toHaveLength(1);
    expect(inner).toHaveClass('inner');
    expect(inner).toContainElement(screen.getByText(new RegExp(`^© .*${BRAND_NAME}$`)));
    expect(inner).toContainElement(screen.getByRole('navigation', { name: 'Footer' }));
  });

  it('does not link Privacy or Terms pages that do not exist', () => {
    renderFooter();

    expect(screen.queryByRole('link', { name: /privacy|terms/i })).not.toBeInTheDocument();
  });
});
