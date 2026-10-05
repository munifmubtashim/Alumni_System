import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { createStore } from 'jotai';
import { createMemoryRouter, type InitialEntry, type RouteObject } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/providers';
import { createQueryClient } from '@/app/queryClient';
import { getToken } from '@/services/authToken';
import { httpClient } from '@/services/httpClient';
import { GuestOnly } from './guards';
import { RegisterPage, ROLE_LABEL } from './RegisterPage';

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

const created: Responder = (config) =>
  Promise.resolve({
    data: { token: makeToken(), user: { id: 1, name: 'Amina', email: 'a@b.co', role: 'student' } },
    status: 201,
    statusText: 'Created',
    headers: {},
    config,
  });

function fail(status: number, message: string): Responder {
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
const registerBodies: unknown[] = [];

function mockRegister(respond: Responder): void {
  const adapter: AxiosAdapter = (config) => {
    if (config.method !== 'post' || config.url !== '/auth/register') {
      return Promise.reject(new Error(`Unmocked: ${config.method ?? ''} ${config.url ?? ''}`));
    }
    registerBodies.push(JSON.parse(String(config.data)));
    return respond(config);
  };
  httpClient.defaults.adapter = adapter;
}

afterEach(() => {
  httpClient.defaults.adapter = originalAdapter;
  registerBodies.length = 0;
});

// ---- the page behind the real GuestOnly guard ----

const routes: RouteObject[] = [
  {
    path: '/',
    children: [
      {
        element: <GuestOnly />,
        children: [
          { path: 'login', element: <h1>Login page</h1> },
          { path: 'register', element: <RegisterPage /> },
        ],
      },
      { index: true, element: <h1>Home page</h1> },
      { path: 'posts', element: <h1>Posts page</h1> },
    ],
  },
];

function renderRegister(entry: InitialEntry = '/register') {
  const router = createMemoryRouter(routes, { initialEntries: [entry] });
  render(
    <AppProviders queryClient={createQueryClient()} store={createStore()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { router, user: userEvent.setup() };
}

const thisYear = new Date().getFullYear();

const field = (label: string) => screen.getByLabelText(label);
const queryField = (label: string) => screen.queryByLabelText(label);
const submitButton = () => screen.getByRole('button', { name: 'Sign up' });

type User = ReturnType<typeof userEvent.setup>;

async function fillCommon(user: User): Promise<void> {
  await user.type(field('Name'), ' Amina ');
  await user.type(field('Email'), 'amina@example.com');
  await user.type(field('Password'), 'correct horse');
  await user.type(field('University'), 'Dhaka University');
}

async function fillStudent(user: User): Promise<void> {
  await fillCommon(user);
  await user.type(field('Department'), 'CSE');
  await user.type(field('Expected graduation year'), String(thisYear + 2));
}

describe('RegisterPage', () => {
  it('asks for the role first (Student by default) and shows the student fields', () => {
    renderRegister();

    expect(screen.getByRole('region', { name: 'Sign up' })).toBeInTheDocument();
    const group = screen.getByRole('radiogroup', { name: ROLE_LABEL });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Student' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Alumni' })).not.toBeChecked();
    // The role choice comes before the first text field.
    expect(group.compareDocumentPosition(field('Name'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    expect(field('Name')).toHaveAttribute('autocomplete', 'name');
    expect(field('Email')).toHaveAttribute('type', 'email');
    expect(field('Password')).toHaveAttribute('autocomplete', 'new-password');
    expect(field('Password')).toHaveAccessibleDescription('At least 8 characters');
    expect(field('University')).toBeInTheDocument();
    expect(field('Department')).toBeInTheDocument();
    const year = field('Expected graduation year');
    expect(year).toHaveAttribute('type', 'number');
    expect(year).toHaveAttribute('inputmode', 'numeric');
    expect(year).toHaveAttribute('min', String(thisYear));
    expect(year).toHaveAttribute('max', String(thisYear + 8));

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });

  it('hides the student fields for Alumni and keeps their values for a switch back', async () => {
    const { user } = renderRegister();

    await user.type(field('Department'), 'CSE');
    await user.click(screen.getByRole('radio', { name: 'Alumni' }));
    expect(queryField('Department')).not.toBeInTheDocument();
    expect(queryField('Expected graduation year')).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Student' }));
    expect(field('Department')).toHaveValue('CSE');
  });

  it('signs up a student: sends the student fields, stores the token, lands home', async () => {
    mockRegister(created);
    const { router, user } = renderRegister();

    await fillStudent(user);
    await user.click(submitButton());

    expect(await screen.findByRole('heading', { name: 'Home page' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
    expect(getToken()).not.toBeNull();
    expect(registerBodies).toEqual([
      {
        role: 'student',
        name: 'Amina',
        email: 'amina@example.com',
        password: 'correct horse',
        university: 'Dhaka University',
        department: 'CSE',
        expected_graduation_year: String(thisYear + 2),
      },
    ]);
  });

  it('signs up an alumnus without the hidden student fields, even if they were filled', async () => {
    mockRegister(created);
    const { user } = renderRegister();

    await fillStudent(user);
    await user.click(screen.getByRole('radio', { name: 'Alumni' }));
    await user.click(submitButton());

    expect(await screen.findByRole('heading', { name: 'Home page' })).toBeInTheDocument();
    expect(registerBodies).toEqual([
      {
        role: 'alumni',
        name: 'Amina',
        email: 'amina@example.com',
        password: 'correct horse',
        university: 'Dhaka University',
      },
    ]);
  });

  it('returns the user to a safe `from` after sign-up', async () => {
    mockRegister(created);
    const { router, user } = renderRegister({
      pathname: '/register',
      state: { from: { pathname: '/posts' } },
    });

    await fillStudent(user);
    await user.click(submitButton());

    expect(await screen.findByRole('heading', { name: 'Posts page' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/posts');
  });

  it('catches an empty form before submit and focuses the first invalid field', async () => {
    mockRegister(created);
    const { user } = renderRegister();

    await user.click(submitButton());

    expect(field('Name')).toHaveAccessibleDescription('Name is required');
    expect(field('Email')).toHaveAccessibleDescription('Email is required');
    expect(field('Password')).toHaveAccessibleDescription(
      'Password must be at least 8 characters At least 8 characters',
    );
    expect(field('University')).toHaveAccessibleDescription('University is required');
    expect(field('Department')).toHaveAccessibleDescription('Department is required');
    expect(field('Expected graduation year')).toHaveAccessibleDescription(
      'Expected graduation year is required',
    );
    expect(field('Name')).toHaveFocus();
    expect(registerBodies).toHaveLength(0);
  });

  it('focuses the first invalid field further down the form', async () => {
    mockRegister(created);
    const { user } = renderRegister();

    await fillCommon(user);
    await user.type(field('Department'), 'CSE');
    await user.type(field('Expected graduation year'), String(thisYear + 9));
    await user.click(submitButton());

    const year = field('Expected graduation year');
    expect(year).toHaveAccessibleDescription(
      `Expected graduation year must be between ${String(thisYear)} and ${String(thisYear + 8)}`,
    );
    expect(year).toHaveFocus();
    expect(registerBodies).toHaveLength(0);
  });

  it('checks email shape and the length limits', async () => {
    mockRegister(created);
    const { user } = renderRegister();

    await user.click(screen.getByRole('radio', { name: 'Alumni' }));
    await user.type(field('Name'), 'Amina');
    await user.type(field('Email'), 'amina@');
    await user.type(field('Password'), 'short');
    await user.click(field('University'));
    await user.paste('u'.repeat(151));
    await user.click(submitButton());

    expect(field('Email')).toHaveAccessibleDescription('Email is not valid');
    expect(field('Password')).toHaveAccessibleDescription(
      'Password must be at least 8 characters At least 8 characters',
    );
    expect(field('University')).toHaveAccessibleDescription(
      'University must be at most 150 characters',
    );
    expect(field('Email')).toHaveFocus();
    expect(registerBodies).toHaveLength(0);
  });

  it('does not validate the hidden student fields for Alumni', async () => {
    mockRegister(created);
    const { user } = renderRegister();

    await user.click(submitButton());
    expect(field('Department')).toHaveAttribute('aria-invalid', 'true');

    await user.click(screen.getByRole('radio', { name: 'Alumni' }));
    await fillCommon(user);
    await user.click(submitButton());

    expect(await screen.findByRole('heading', { name: 'Home page' })).toBeInTheDocument();
    expect(registerBodies).toHaveLength(1);
  });

  it('on 409 puts the message on the email field with a link to log in', async () => {
    mockRegister(fail(409, 'Conflict'));
    const { user } = renderRegister();

    await fillStudent(user);
    await user.click(submitButton());

    const email = field('Email');
    await waitFor(() => {
      expect(email).toHaveAttribute('aria-invalid', 'true');
    });
    expect(email).toHaveAccessibleDescription(
      'An account with this email already exists Log in instead',
    );
    expect(email).toHaveFocus();
    expect(screen.getByRole('link', { name: 'Log in instead' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(getToken()).toBeNull();

    // Editing the email clears the message and the link.
    await user.type(email, 'x');
    expect(email).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByRole('link', { name: 'Log in instead' })).not.toBeInTheDocument();
  });

  it('shows a 400 message from the server on the form', async () => {
    mockRegister(fail(400, 'University is required'));
    const { user } = renderRegister();

    await fillStudent(user);
    await user.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('University is required');
    expect(submitButton()).toBeEnabled();
  });

  it.each([
    ['a network failure', networkDown],
    ['a 5xx', fail(500, 'Internal Server Error')],
  ])('on %s says the server could not be reached and stays usable', async (_label, respond) => {
    mockRegister(respond);
    const { user } = renderRegister();

    await fillStudent(user);
    await user.click(submitButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't reach the server, try again",
    );
    expect(field('Password')).toHaveValue('correct horse');
    expect(submitButton()).toBeEnabled();
  });

  it('shows a busy button while submitting and sends only one request', async () => {
    let release!: () => void;
    mockRegister(
      (config) =>
        new Promise((resolve) => {
          release = () => {
            void created(config).then(resolve);
          };
        }),
    );
    const { user } = renderRegister();

    await fillStudent(user);
    await user.click(submitButton());

    await waitFor(() => {
      expect(submitButton()).toHaveAttribute('aria-busy', 'true');
    });
    expect(submitButton()).toBeDisabled();
    await user.click(submitButton());
    await user.type(field('University'), '{Enter}');
    expect(registerBodies).toHaveLength(1);

    release();
    expect(await screen.findByRole('heading', { name: 'Home page' })).toBeInTheDocument();
    expect(registerBodies).toHaveLength(1);
  });
});
