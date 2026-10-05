import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { createStore } from 'jotai';
import { StrictMode } from 'react';
import { createMemoryRouter, type InitialEntry, type RouteObject } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/providers';
import { createQueryClient } from '@/app/queryClient';
import { getToken } from '@/services/authToken';
import { httpClient } from '@/services/httpClient';
import { sessionNoticeAtom } from '@/store/sessionNoticeAtom';
import { GuestOnly } from './guards';
import { LoginPage, SESSION_EXPIRED_MESSAGE } from './LoginPage';

// ---- a fake API at the axios adapter (the REQ-001 test policy) ----

function base64url(value: object): string {
  return window
    .btoa(JSON.stringify(value))
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/** A JWT-shaped token valid for an hour, so GuestOnly sees a live session. */
function makeToken(): string {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${base64url({ alg: 'HS256' })}.${base64url({ sub: 1, exp })}.sig`;
}

type Responder = (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>;

const ok: Responder = (config) =>
  Promise.resolve({
    data: { token: makeToken() },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  });

function fail(status: number, message = 'Invalid'): Responder {
  return (config) =>
    Promise.reject(
      new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, {
        data: { message },
        status,
        statusText: String(status),
        headers: {},
        config,
      }),
    );
}

const networkDown: Responder = (config) =>
  Promise.reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config));

const originalAdapter = httpClient.defaults.adapter;
const loginBodies: unknown[] = [];

function mockLogin(respond: Responder): void {
  const adapter: AxiosAdapter = (config) => {
    if (config.method !== 'post' || config.url !== '/auth/login') {
      return Promise.reject(new Error(`Unmocked: ${config.method ?? ''} ${config.url ?? ''}`));
    }
    loginBodies.push(JSON.parse(String(config.data)));
    return respond(config);
  };
  httpClient.defaults.adapter = adapter;
}

afterEach(() => {
  httpClient.defaults.adapter = originalAdapter;
  loginBodies.length = 0;
});

// ---- the page behind the real GuestOnly guard ----

const routes: RouteObject[] = [
  {
    path: '/',
    children: [
      {
        element: <GuestOnly />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <h1>Register page</h1> },
        ],
      },
      { index: true, element: <h1>Home page</h1> },
      { path: 'posts', element: <h1>Posts page</h1> },
    ],
  },
];

function renderLogin(entry: InitialEntry = '/login', { strict = false, notice = false } = {}) {
  const store = createStore();
  if (notice) store.set(sessionNoticeAtom, 'expired');
  const router = createMemoryRouter(routes, { initialEntries: [entry] });
  const tree = (
    <AppProviders queryClient={createQueryClient()} store={store}>
      <RouterProvider router={router} />
    </AppProviders>
  );
  render(strict ? <StrictMode>{tree}</StrictMode> : tree);
  return { router, store, user: userEvent.setup() };
}

function emailField() {
  return screen.getByLabelText('Email');
}

function passwordField() {
  return screen.getByLabelText('Password');
}

function submitButton() {
  return screen.getByRole('button', { name: 'Log in' });
}

describe('LoginPage', () => {
  it('shows labeled email and password fields, one Log in button and a sign-up link', () => {
    renderLogin();

    expect(screen.getByRole('region', { name: 'Log in' })).toBeInTheDocument();
    expect(emailField()).toHaveAttribute('type', 'email');
    expect(emailField()).toHaveAttribute('autocomplete', 'email');
    expect(passwordField()).toHaveAttribute('type', 'password');
    expect(passwordField()).toHaveAttribute('autocomplete', 'current-password');
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(submitButton()).toHaveAttribute('type', 'submit');
    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/register');
  });

  it('stores the token on success and GuestOnly sends the user home', async () => {
    mockLogin(ok);
    const { router, user } = renderLogin();

    await user.type(emailField(), '  amina@example.com ');
    await user.type(passwordField(), 'correct horse');
    await user.click(submitButton());

    expect(await screen.findByRole('heading', { name: 'Home page' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
    expect(getToken()).not.toBeNull();
    expect(loginBodies).toEqual([{ email: 'amina@example.com', password: 'correct horse' }]);
  });

  it('returns the user to the page they first asked for', async () => {
    mockLogin(ok);
    const { router, user } = renderLogin({
      pathname: '/login',
      state: { from: { pathname: '/posts', search: '?page=2' } },
    });

    await user.type(emailField(), 'amina@example.com');
    await user.type(passwordField(), 'correct horse');
    await user.click(submitButton());

    expect(await screen.findByRole('heading', { name: 'Posts page' })).toBeInTheDocument();
    expect(router.state.location.pathname + router.state.location.search).toBe('/posts?page=2');
  });

  it('on 401 shows one message, keeps the email and clears the password', async () => {
    mockLogin(fail(401));
    const { user } = renderLogin();

    await user.type(emailField(), 'amina@example.com');
    await user.type(passwordField(), 'wrong password');
    await user.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect');
    expect(emailField()).toHaveValue('amina@example.com');
    expect(passwordField()).toHaveValue('');
    expect(getToken()).toBeNull();
  });

  it.each([
    ['a network failure', networkDown],
    ['a 5xx', fail(503, 'Service Unavailable')],
  ])('on %s says the server could not be reached and stays usable', async (_label, respond) => {
    mockLogin(respond);
    const { user } = renderLogin();

    await user.type(emailField(), 'amina@example.com');
    await user.type(passwordField(), 'correct horse');
    await user.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't reach the server, try again",
    );
    expect(passwordField()).toHaveValue('correct horse');
    expect(submitButton()).toBeEnabled();

    // Trying again works once the server is back.
    mockLogin(ok);
    await user.click(submitButton());
    expect(await screen.findByRole('heading', { name: 'Home page' })).toBeInTheDocument();
  });

  it('shows a 400 message from the server on the form', async () => {
    mockLogin(fail(400, 'Email is not valid'));
    const { user } = renderLogin();

    await user.type(emailField(), 'amina@example.com');
    await user.type(passwordField(), 'pw');
    await user.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('Email is not valid');
  });

  it('catches an empty form before submit and focuses the first invalid field', async () => {
    mockLogin(ok);
    const { user } = renderLogin();

    await user.click(submitButton());

    expect(emailField()).toHaveAccessibleDescription('Email is required');
    expect(emailField()).toHaveAttribute('aria-invalid', 'true');
    expect(passwordField()).toHaveAccessibleDescription('Password is required');
    expect(emailField()).toHaveFocus();
    expect(loginBodies).toHaveLength(0);
  });

  it('flags a badly formed email, and focuses the password when only it is missing', async () => {
    mockLogin(ok);
    const { user } = renderLogin();

    await user.type(emailField(), 'not-an-email');
    await user.type(passwordField(), 'pw');
    await user.click(submitButton());
    expect(emailField()).toHaveAccessibleDescription('Email is not valid');
    expect(emailField()).toHaveFocus();

    await user.clear(emailField());
    await user.type(emailField(), 'amina@example.com');
    // Typing clears that field's message.
    expect(emailField()).not.toHaveAttribute('aria-invalid');
    await user.clear(passwordField());
    await user.click(submitButton());
    expect(passwordField()).toHaveAccessibleDescription('Password is required');
    expect(passwordField()).toHaveFocus();
    expect(loginBodies).toHaveLength(0);
  });

  it('shows a busy button while submitting and sends only one request', async () => {
    let release!: () => void;
    mockLogin(
      (config) =>
        new Promise((resolve) => {
          release = () => {
            void ok(config).then(resolve);
          };
        }),
    );
    const { user } = renderLogin();

    await user.type(emailField(), 'amina@example.com');
    await user.type(passwordField(), 'correct horse');
    await user.click(submitButton());

    await waitFor(() => {
      expect(submitButton()).toHaveAttribute('aria-busy', 'true');
    });
    expect(submitButton()).toBeDisabled();
    await user.click(submitButton());
    await user.type(passwordField(), '{Enter}');
    expect(loginBodies).toHaveLength(1);

    release();
    expect(await screen.findByRole('heading', { name: 'Home page' })).toBeInTheDocument();
    expect(loginBodies).toHaveLength(1);
  });

  it.each([false, true])(
    'shows the session-expired notice once, then not on a return (StrictMode: %s)',
    async (strict) => {
      const { router, store, user } = renderLogin('/login', { strict, notice: true });

      expect(screen.getByRole('status')).toHaveTextContent(SESSION_EXPIRED_MESSAGE);

      await user.click(screen.getByRole('link', { name: 'Sign up' }));
      expect(await screen.findByRole('heading', { name: 'Register page' })).toBeInTheDocument();
      expect(store.get(sessionNoticeAtom)).toBeNull();

      await router.navigate('/login');
      expect(await screen.findByRole('region', { name: 'Log in' })).toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    },
  );

  it('shows no notice when none is set', () => {
    renderLogin('/login', { strict: true });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
