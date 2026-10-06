import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore } from 'jotai';
import { createMemoryRouter } from 'react-router';
// react-router/dom's RouterProvider wires flushSync, as App.tsx does.
import { RouterProvider } from 'react-router/dom';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../providers';
import { createQueryClient } from '../queryClient';
import { routes } from '../router';

// A guest makes no API calls on these pages, so no adapter mock is needed.
function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AppProviders queryClient={createQueryClient()} store={createStore()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { router, user: userEvent.setup() };
}

describe('AuthShell', () => {
  it.each([
    ['/login', 'Log in'],
    ['/register', 'Sign up'],
  ])('%s has no app header, one theme toggle and the page in main', (path, title) => {
    renderAt(path);

    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Skip to content' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('radiogroup', { name: 'Theme' })).toHaveLength(1);
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main');
    expect(within(main).getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    // The panel's logo names the app, since there's no header to do it.
    expect(within(main).getByText('Alma', { selector: 'span' })).toBeVisible();
  });

  it('applies the theme on the auth pages too', async () => {
    const { user } = renderAt('/login');

    await user.click(screen.getByRole('radio', { name: 'Dark' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('keeps the app header on other pages', () => {
    renderAt('/does-not-exist');

    expect(screen.getByRole('banner')).toHaveTextContent('Alma');
    expect(screen.getAllByRole('radiogroup', { name: 'Theme' })).toHaveLength(1);
  });

  it('uses the compact icon-only toggle on auth pages', () => {
    renderAt('/login');
    expect(screen.getAllByRole('radio').map((radio) => radio.textContent)).toEqual(['', '', '']);
    expect(screen.getByRole('radio', { name: 'System' })).toBeInTheDocument();
  });

  it('keeps the labelled toggle in the app header', () => {
    renderAt('/does-not-exist');
    expect(screen.getAllByRole('radio').map((radio) => radio.textContent)).toEqual([
      'Light',
      'Dark',
      'System',
    ]);
  });
});
