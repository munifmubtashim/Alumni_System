import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore } from 'jotai';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../providers';
import { createQueryClient } from '../queryClient';
import { createRoutes, routes } from '../router';

function renderAt(path: string, routeTree: RouteObject[] = routes) {
  const router = createMemoryRouter(routeTree, { initialEntries: [path] });
  return render(
    <AppProviders queryClient={createQueryClient()} store={createStore()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
}

function Boom(): never {
  throw new Error('page failed');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AppShell', () => {
  it('renders the header, theme toggle, main area and skip link at /', () => {
    renderAt('/');

    expect(screen.getByRole('banner')).toHaveTextContent('Alumni Network');
    expect(
      within(screen.getByRole('banner')).getByRole('radiogroup', { name: 'Theme' }),
    ).toBeInTheDocument();
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main');
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
  });

  it('applies and saves Dark when it is selected', async () => {
    const user = userEvent.setup();
    renderAt('/');

    await user.click(screen.getByRole('radio', { name: 'Dark' }));

    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem('alumni.theme')).toBe('"dark"');
  });

  it('starts in System mode and follows the OS setting', () => {
    renderAt('/');

    expect(screen.getByRole('radio', { name: 'System' })).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('still renders the empty shell at an unknown path', () => {
    renderAt('/does-not-exist');

    expect(screen.getByRole('banner')).toHaveTextContent('Alumni Network');
    expect(screen.getByRole('main')).toBeEmptyDOMElement();
    expect(screen.queryByText('Something went wrong.')).not.toBeInTheDocument();
  });

  it('shows the route error inside the shell when a page throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    renderAt('/boom', createRoutes([{ path: 'boom', element: <Boom /> }]));

    expect(screen.getByRole('banner')).toHaveTextContent('Alumni Network');
    const main = screen.getByRole('main');
    expect(
      within(main).getByRole('heading', { name: 'Something went wrong.' }),
    ).toBeInTheDocument();
    expect(within(main).getByRole('link', { name: 'Go to the home page' })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
