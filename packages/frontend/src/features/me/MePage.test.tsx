import type { Alumni, MyProfile } from '@alumni/shared';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { createStore } from 'jotai';
import { createMemoryRouter, type RouteObject } from 'react-router';
// react-router/dom's RouterProvider wires flushSync, as App.tsx does.
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/providers';
import { createQueryClient } from '@/app/queryClient';
import { createRoutes } from '@/app/router';
import { SESSION_EXPIRED_MESSAGE } from '@/features/auth';
import { getToken, setToken } from '@/services/authToken';
import { httpClient, setUnauthorizedHandler } from '@/services/httpClient';
import { LEAVE_PROMPT_TEXT } from './LeavePrompt';
import { LOAD_ERROR_TEXT, MePage } from './MePage';
import { PROFILE_SAVED_TEXT } from './ProfileForm';
import { SAVE_BAR_LABEL } from './SaveBar';

// The real app routes: /me is the lazy ME_ROUTE behind RequireAuth, inside
// AppShell, with SessionBridge mounted by RootLayout. The API is faked at the
// axios adapter (G11). The token builder repeats the one in ProfilePage.test.tsx (QUAL-002).

function base64url(value: object): string {
  return window
    .btoa(JSON.stringify(value))
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function makeToken(): string {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${base64url({ alg: 'HS256' })}.${base64url({ sub: 1, exp })}.sig`;
}

// ---- fixtures ----

const ALUMNI: MyProfile = {
  user_id: 1,
  name: 'Sophia Martins',
  email: 'sophia@example.com',
  role: 'alumni',
  alumni_id: 11,
  has_alumni_profile: true,
  student_id: null,
  has_student_profile: false,
  photo_url: 'https://example.com/sophia.png',
  university: 'University of Toronto',
  department: 'Computer Science',
  graduation_year: '2016',
  job_title: 'Product manager',
  current_company: 'Northwind',
  bio: 'Builds things.',
};

const STUDENT: MyProfile = {
  ...ALUMNI,
  role: 'student',
  alumni_id: null,
  has_alumni_profile: false,
  student_id: 3,
  has_student_profile: true,
  graduation_year: undefined,
  expected_graduation_year: String(new Date().getFullYear() + 1),
};

const ADMIN: MyProfile = {
  user_id: 1,
  name: 'Ada Admin',
  email: 'ada@example.com',
  role: 'admin',
  alumni_id: null,
  has_alumni_profile: false,
  student_id: null,
  has_student_profile: false,
  photo_url: 'https://example.com/ada.png',
  university: 'University of Toronto',
};

const PUBLIC_PROFILE: Alumni = {
  id: 11,
  user_id: 1,
  name: 'Sophia Martins',
  job_title: 'Product manager',
  current_company: 'Northwind',
  university: 'University of Toronto',
};

// ---- a fake API: every request is recorded and answered by the test ----

interface Reply {
  status: number;
  data?: unknown;
}

type Handler = (config: InternalAxiosRequestConfig) => Reply | Promise<Reply>;

interface Call {
  key: string;
  body: unknown;
}

const originalAdapter = httpClient.defaults.adapter;
let calls: Call[] = [];

/** Answers by "METHOD /url"; anything unlisted fails the request loudly. */
function mockApi(handlers: Record<string, Handler>): void {
  httpClient.defaults.adapter = async (config) => {
    const key = `${(config.method ?? '').toUpperCase()} ${config.url ?? ''}`;
    calls.push({
      key,
      body: typeof config.data === 'string' ? JSON.parse(config.data) : undefined,
    });
    const handler = handlers[key];
    if (handler === undefined) throw new Error(`Unmocked request: ${key}`);
    const { status, data } = await handler(config);
    const response: AxiosResponse = { data, status, statusText: '', headers: {}, config };
    // A custom adapter must reject non-2xx itself (G26).
    if (status >= 300) {
      throw new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, response);
    }
    return response;
  };
}

/** Answers in turn; the last one repeats. */
function inTurn(...replies: Reply[]): Handler {
  let n = 0;
  return () => {
    const reply = replies[Math.min(n, replies.length - 1)];
    n += 1;
    if (reply === undefined) throw new Error('No reply');
    return reply;
  };
}

/** A reply that waits until `release()` is called. */
function held(reply: Reply) {
  let release: () => void = () => undefined;
  const handler: Handler = () =>
    new Promise((resolve) => {
      release = () => {
        resolve(reply);
      };
    });
  return {
    handler,
    release: () => {
      release();
    },
  };
}

/** PUT /api/me echoes what it was sent on top of `profile`, as the server does. */
function echoSave(profile: MyProfile): Handler {
  return (config) => ({
    status: 200,
    data: { ...profile, ...(JSON.parse(String(config.data)) as Partial<MyProfile>) },
  });
}

const putBodies = () => calls.filter((call) => call.key === 'PUT /me').map((call) => call.body);

// ---- rendering ----

/** Signed in at `entry`; `pageRoutes` replaces the app's pages (default: the real ones). */
function renderAt(
  entry: string,
  seed?: (client: ReturnType<typeof createQueryClient>) => void,
  pageRoutes?: RouteObject[],
) {
  setToken(makeToken());
  const client = createQueryClient();
  // Errors end at once here; the app's retry policy is tested in queryClient.test.ts.
  client.setDefaultOptions({ queries: { ...client.getDefaultOptions().queries, retry: false } });
  seed?.(client);
  const router = createMemoryRouter(createRoutes(pageRoutes), { initialEntries: [entry] });
  render(
    <AppProviders queryClient={client} store={createStore()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { client, router };
}

const findForm = () => screen.findByLabelText('Full name');
const saveBar = () => screen.queryByRole('region', { name: SAVE_BAR_LABEL });

function firesBeforeUnload(): boolean {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

async function editRoleAndSave(user: ReturnType<typeof userEvent.setup>, text: string) {
  const role = screen.getByLabelText('Current role');
  await user.clear(role);
  await user.type(role, text);
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(await screen.findByText(PROFILE_SAVED_TEXT)).toBeInTheDocument();
}

beforeEach(() => {
  calls = [];
});

afterEach(() => {
  httpClient.defaults.adapter = originalAdapter;
  setUnauthorizedHandler(null);
});

describe('/me through the real route (RequireAuth)', () => {
  it("waits on the guard's loading line while GET /me loads, then shows the form and title", async () => {
    const me = held({ status: 200, data: ALUMNI });
    mockApi({ 'GET /me': me.handler });
    renderAt('/me');

    const main = screen.getByRole('main');
    expect(await within(main).findByRole('status')).toHaveTextContent('Loading…');
    expect(screen.queryByLabelText('Full name')).not.toBeInTheDocument();

    act(() => {
      me.release();
    });
    expect(await findForm()).toHaveValue('Sophia Martins');
    expect(within(main).getByRole('heading', { level: 1, name: 'My Profile' })).toBeInTheDocument();
    await waitFor(() => {
      expect(document.title).toBe('My Profile · Alma');
    });
  });

  it("shows the guard's error with Retry when GET /me fails, and Retry loads the form", async () => {
    mockApi({ 'GET /me': inTurn({ status: 500 }, { status: 200, data: ALUMNI }) });
    const user = userEvent.setup();
    renderAt('/me');

    expect(await screen.findByText("Couldn't load your account")).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await findForm()).toHaveValue('Sophia Martins');
    expect(calls.filter((call) => call.key === 'GET /me')).toHaveLength(2);
  });
});

// MePage's own loading and error views. Behind RequireAuth (above) they are not
// reached on a first load, because the guard waits for the same ['me'] query;
// here the page is mounted without the guard so the views themselves are pinned.
const UNGUARDED_ME = [{ path: 'me', element: <MePage /> }];

describe('MePage loading and error views', () => {
  it('shows the skeleton, a status line and the title while GET /me loads, then the form', async () => {
    const me = held({ status: 200, data: ALUMNI });
    mockApi({ 'GET /me': me.handler });
    renderAt('/me', undefined, UNGUARDED_ME);

    const main = screen.getByRole('main');
    expect(
      await within(main).findByRole('heading', { level: 1, name: 'My Profile' }),
    ).toBeInTheDocument();
    expect(within(main).getByRole('status')).toHaveTextContent('Loading your profile…');
    expect(main.querySelector('[aria-busy="true"]')).not.toBeNull();
    await waitFor(() => {
      expect(document.title).toBe('My Profile · Alma');
    });

    act(() => {
      me.release();
    });
    expect(await findForm()).toHaveValue('Sophia Martins');
    expect(main.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it('shows the load error with Retry on a 500, and Retry loads the form', async () => {
    mockApi({ 'GET /me': inTurn({ status: 500 }, { status: 200, data: ALUMNI }) });
    const user = userEvent.setup();
    renderAt('/me', undefined, UNGUARDED_ME);

    expect(await screen.findByText(LOAD_ERROR_TEXT)).toBeInTheDocument();
    expect(screen.queryByLabelText('Full name')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await findForm()).toHaveValue('Sophia Martins');
    expect(screen.queryByText(LOAD_ERROR_TEXT)).not.toBeInTheDocument();
    expect(calls.filter((call) => call.key === 'GET /me')).toHaveLength(2);
  });
});

describe('MePage saving', () => {
  it('refreshes a cached /alumni/:id after save, and then leaves without asking', async () => {
    mockApi({
      'GET /me': inTurn({ status: 200, data: ALUMNI }),
      'PUT /me': echoSave(ALUMNI),
      'GET /alumni/11': inTurn({ status: 200, data: { ...PUBLIC_PROFILE, job_title: 'Lead' } }),
      'GET /posts/user/1': inTurn({ status: 200, data: [] }),
    });
    const key = ['alumni', 'profile', '11'];
    const user = userEvent.setup();
    const { client, router } = renderAt('/me', (c) => {
      // Fresh (within staleTime): without the save's invalidation it would be shown as is.
      c.setQueryData(key, PUBLIC_PROFILE);
    });
    await findForm();

    await editRoleAndSave(user, 'Lead');
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(saveBar()).not.toBeInTheDocument();
    expect(firesBeforeUnload()).toBe(false);

    await act(async () => {
      await router.navigate('/alumni/11');
    });
    expect(screen.queryByRole('group', { name: LEAVE_PROMPT_TEXT })).not.toBeInTheDocument();
    const main = screen.getByRole('main');
    expect(await within(main).findByText('Lead at Northwind')).toBeInTheDocument();
    expect(within(main).queryByText(/Product manager/)).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/alumni/11');
    expect(calls.map((call) => call.key)).toContain('GET /alumni/11');
  });

  it('refreshes the directory and profile caches after the new fields and the switch are saved', async () => {
    mockApi({ 'GET /me': inTurn({ status: 200, data: ALUMNI }), 'PUT /me': echoSave(ALUMNI) });
    // The real keys of features/directory/useAlumniSearch and
    // features/profile/useAlumniProfile (string literals: lazy features never
    // import each other; LESSON-REQ-010-1).
    const directoryKey = ['alumni', 'search', { q: '', page: 1 }];
    const profileKey = ['alumni', 'profile', '11'];
    const user = userEvent.setup();
    const { client } = renderAt('/me', (c) => {
      c.setQueryData(directoryKey, { items: [], total: 0 });
      c.setQueryData(profileKey, PUBLIC_PROFILE);
    });
    await findForm();

    await user.type(screen.getByLabelText('Headline'), 'PM at Northwind');
    await user.click(screen.getByRole('switch', { name: 'Available for mentorship' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText(PROFILE_SAVED_TEXT)).toBeInTheDocument();

    expect(putBodies()[0]).toMatchObject({
      headline: 'PM at Northwind',
      mentorship_available: true,
    });
    expect(client.getQueryState(directoryKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(profileKey)?.isInvalidated).toBe(true);
    expect(screen.getByRole('switch', { name: 'Available for mentorship' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(saveBar()).not.toBeInTheDocument();
  });

  it('sends the stored photo_url back on every save, and none when there is none', async () => {
    mockApi({ 'GET /me': inTurn({ status: 200, data: ALUMNI }), 'PUT /me': echoSave(ALUMNI) });
    const user = userEvent.setup();
    renderAt('/me');
    await findForm();

    await editRoleAndSave(user, 'Lead');
    await editRoleAndSave(user, 'Head of product');
    expect(putBodies()).toHaveLength(2);
    for (const body of putBodies()) {
      expect(body).toHaveProperty('photo_url', ALUMNI.photo_url);
    }
  });

  it('never sends photo_url when the profile has no photo', async () => {
    const noPhoto: MyProfile = { ...ALUMNI, photo_url: undefined };
    mockApi({ 'GET /me': inTurn({ status: 200, data: noPhoto }), 'PUT /me': echoSave(noPhoto) });
    const user = userEvent.setup();
    renderAt('/me');
    await findForm();

    await editRoleAndSave(user, 'Lead');
    expect(putBodies()[0]).not.toHaveProperty('photo_url');
  });

  it.each([
    [
      'alumni',
      ALUMNI,
      [
        'bio',
        'current_company',
        'degree',
        'department',
        'experience',
        'graduation_year',
        'headline',
        'job_title',
        'linkedin_url',
        'location',
        'mentorship_available',
        'name',
        'photo_url',
        'start_year',
        'university',
      ],
    ],
    [
      'student',
      STUDENT,
      [
        'bio',
        'current_company',
        'department',
        'expected_graduation_year',
        'experience',
        'job_title',
        'linkedin_url',
        'name',
        'photo_url',
        'university',
      ],
    ],
    ['admin (no profile row)', ADMIN, ['name', 'photo_url', 'university']],
  ])('sends only the fields a %s account can edit', async (_label, profile, keys) => {
    mockApi({ 'GET /me': inTurn({ status: 200, data: profile }), 'PUT /me': echoSave(profile) });
    const user = userEvent.setup();
    renderAt('/me');
    const name = await findForm();

    await user.type(name, ' Jr');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText(PROFILE_SAVED_TEXT)).toBeInTheDocument();
    expect(Object.keys(putBodies()[0] as object).sort()).toEqual(keys);
    expect(putBodies()[0]).toHaveProperty('name', `${profile.name} Jr`);
  });

  it('shows a server message that names no field next to the form, and focuses it', async () => {
    mockApi({
      'GET /me': inTurn({ status: 200, data: ALUMNI }),
      'PUT /me': inTurn({ status: 409, data: { message: 'Email is already in use' } }),
    });
    const user = userEvent.setup();
    renderAt('/me');
    await findForm();

    await user.type(screen.getByLabelText('Current role'), 'x');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    const alert = await screen.findByText('Email is already in use');
    await waitFor(() => {
      expect(alert.closest('[tabindex="-1"]')).toHaveFocus();
    });
    expect(saveBar()).toBeInTheDocument();
    expect(screen.queryByText(PROFILE_SAVED_TEXT)).not.toBeInTheDocument();
  });

  it('logs out on a 401 during save while dirty, with no leave prompt in the way', async () => {
    mockApi({
      'GET /me': inTurn({ status: 200, data: ALUMNI }),
      'PUT /me': inTurn({ status: 401, data: { message: 'Invalid token' } }),
    });
    const user = userEvent.setup();
    const { router } = renderAt('/me');
    await findForm();

    await user.type(screen.getByLabelText('Current role'), 'x');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText(SESSION_EXPIRED_MESSAGE)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(getToken()).toBeNull();
    expect(screen.queryByRole('group', { name: LEAVE_PROMPT_TEXT })).not.toBeInTheDocument();
  });
});
