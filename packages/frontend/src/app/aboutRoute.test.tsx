import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore } from 'jotai';
import { createMemoryRouter } from 'react-router';
// react-router/dom's RouterProvider wires flushSync, as App.tsx does.
import { RouterProvider } from 'react-router/dom';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearToken, setToken } from '@/services/authToken';
import { httpClient } from '@/services/httpClient';
import { AppProviders } from './providers';
import { createQueryClient } from './queryClient';
import { routes } from './router';

/** A JWT-shaped token valid for an hour, so the app sees a live session. */
function makeToken(): string {
  const b64 = (v: object) =>
    window.btoa(JSON.stringify(v)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${b64({ alg: 'HS256' })}.${b64({ sub: 1, exp })}.sig`;
}

const ME = {
  user_id: 1,
  name: 'Amina',
  email: 'amina@example.com',
  role: 'alumni',
  alumni_id: 1,
  has_alumni_profile: true,
  student_id: null,
  has_student_profile: false,
};

/** Records every request; GET /me answers, anything else fails the test. */
const adapter = vi.fn<AxiosAdapter>((config: InternalAxiosRequestConfig) => {
  const reply = (status: number, data: unknown) =>
    Promise.resolve({ status, statusText: '', headers: {}, config, data } as AxiosResponse);
  return config.url === '/me' ? reply(200, ME) : reply(500, {});
});
const originalAdapter = httpClient.defaults.adapter;

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AppProviders queryClient={createQueryClient()} store={createStore()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { router, user: userEvent.setup() };
}

const MISSION = 'A lifelong connection between alumni and the students who follow them.';

describe('/about (public, REQ-014)', () => {
  beforeEach(() => {
    clearToken();
    adapter.mockClear();
    httpClient.defaults.adapter = adapter;
  });

  afterEach(() => {
    httpClient.defaults.adapter = originalAdapter;
    clearToken();
  });

  it('lets a signed-out visitor read the page, with the guest header and the footer', async () => {
    const { router } = renderAt('/about');

    expect(await screen.findByRole('heading', { level: 1, name: MISSION })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/about');
    const header = screen.getByRole('banner');
    expect(within(header).getByRole('link', { name: 'Log in' })).toBeInTheDocument();
    expect(within(header).getByRole('link', { name: 'Sign up' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('main')).getByRole('region', { name: 'How it works' }),
    ).toBeVisible();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    // A guest's visit makes no API request at all (REQ-014 AC1).
    expect(adapter).not.toHaveBeenCalled();
  });

  it('shows a signed-in user the same page inside the header with their account menu', async () => {
    setToken(makeToken());
    const { router } = renderAt('/about');

    expect(await screen.findByRole('heading', { level: 1, name: MISSION })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/about');
    const header = screen.getByRole('banner');
    expect(await within(header).findByRole('button', { name: /Account menu/ })).toBeInTheDocument();
    expect(within(header).queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it.each([
    ['/login', 'Log in'],
    ['/register', 'Sign up'],
  ])('is reached from the "About Alma" link on %s', async (path, title) => {
    const { router, user } = renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'About Alma' }));

    expect(await screen.findByRole('heading', { level: 1, name: MISSION })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/about');
  });

  it('is reached from the footer About link on another app page', async () => {
    const { router, user } = renderAt('/no-such-page');

    await user.click(screen.getByRole('link', { name: 'About' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/about');
    });
    expect(await screen.findByRole('heading', { level: 1, name: MISSION })).toBeInTheDocument();
  });
});
