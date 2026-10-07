import type { MyProfile } from '@alumni/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { useRef } from 'react';
import { createMemoryRouter, Link } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CURRENT_USER_QUERY_KEY } from '@/features/auth';
import { clearToken, setToken } from '@/services/authToken';
import { httpClient } from '@/services/httpClient';
import { LEAVE_PROMPT_TEXT } from './LeavePrompt';
import {
  ALL_SAVED_TEXT,
  PASSWORD_SAVED_TEXT,
  PROFILE_SAVED_TEXT,
  ProfileForm,
  TOAST_DISMISS_LABEL,
  TOAST_MS,
} from './ProfileForm';
import { SAVE_BAR_LABEL } from './SaveBar';

// ---- a live token (the leave guard and the cache write check for one) ----

function signIn(): void {
  const encode = (value: object) => window.btoa(JSON.stringify(value)).replace(/=+$/, '');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  setToken(`${encode({ alg: 'HS256' })}.${encode({ sub: 1, exp })}.sig`);
}

// ---- a fake API: every request is recorded and answered by the test ----

interface Call {
  key: string;
  body: unknown;
}

type Answer = { status: number; data?: unknown } | Promise<{ status: number; data?: unknown }>;

const originalAdapter = httpClient.defaults.adapter;
let calls: Call[] = [];

function api(answer: (config: InternalAxiosRequestConfig) => Answer): void {
  httpClient.defaults.adapter = async (config) => {
    calls.push({
      key: `${config.method ?? ''} ${config.url ?? ''}`,
      body: typeof config.data === 'string' ? JSON.parse(config.data) : undefined,
    });
    const { status, data } = await answer(config);
    const response: AxiosResponse = { data, status, statusText: '', headers: {}, config };
    // A custom adapter must reject non-2xx itself (G26).
    if (status >= 300) {
      throw new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, response);
    }
    return response;
  };
}

beforeEach(() => {
  calls = [];
  signIn();
});

afterEach(() => {
  httpClient.defaults.adapter = originalAdapter;
  clearToken();
  vi.useRealTimers();
});

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
  graduation_year: '2016',
  job_title: 'Product manager',
};

const STUDENT: MyProfile = {
  ...ALUMNI,
  role: 'student',
  alumni_id: null,
  has_alumni_profile: false,
  student_id: 3,
  has_student_profile: true,
  // Stored values the rules now reject: a past expected year, no department.
  expected_graduation_year: '1999',
  department: '',
};

const ADMIN: MyProfile = {
  ...ALUMNI,
  role: 'admin',
  alumni_id: null,
  has_alumni_profile: false,
};

// ---- rendering: the form in a data router (useBlocker needs one) ----

function Page({ profile }: { profile: MyProfile }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  return (
    <>
      <h1 ref={headingRef} tabIndex={-1}>
        My Profile
      </h1>
      <Link to="/elsewhere">Away</Link>
      <ProfileForm profile={profile} headingRef={headingRef} />
    </>
  );
}

function renderForm(profile: MyProfile) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  });
  client.setQueryData(CURRENT_USER_QUERY_KEY, profile);
  const router = createMemoryRouter(
    [
      { path: '/me', element: <Page profile={profile} /> },
      { path: '/elsewhere', element: <p>Elsewhere page</p> },
    ],
    { initialEntries: ['/me'] },
  );
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { client, router };
}

const saveBar = () => screen.queryByRole('region', { name: SAVE_BAR_LABEL });

async function typePassword(
  user: ReturnType<typeof userEvent.setup>,
  current: string,
  next: string,
) {
  await user.type(screen.getByLabelText('Current password'), current);
  await user.type(screen.getByLabelText('New password'), next);
  await user.type(screen.getByLabelText('Confirm new password'), next);
}

describe('ProfileForm sections', () => {
  it('shows Personal, Education, Career and Password in that order for alumni', () => {
    renderForm(ALUMNI);
    expect(screen.getAllByRole('region')).toHaveLength(4);
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['Personal', 'Education', 'Career', 'Password']);
    expect(screen.queryByText(/Mentorship/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Graduation year')).toHaveValue('2016');
    expect(screen.queryByLabelText('Expected graduation year')).not.toBeInTheDocument();
    expect(screen.getByLabelText('About')).toBeInTheDocument();
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
  });

  it('shows the expected graduation year for a student', () => {
    renderForm(STUDENT);
    expect(screen.getByLabelText('Expected graduation year')).toHaveValue('1999');
    expect(screen.queryByLabelText('Graduation year')).not.toBeInTheDocument();
  });

  it('shows only Personal (name and university) and Password for an account with no profile', () => {
    renderForm(ADMIN);
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['Personal', 'Password']);
    const personal = screen.getByRole('region', { name: 'Personal' });
    expect(within(personal).getByLabelText('University')).toBeInTheDocument();
    expect(screen.queryByLabelText('About')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Current role')).not.toBeInTheDocument();
  });
});

describe('ProfileForm editing', () => {
  it('shows the save bar only while dirty, and Discard restores the saved values', async () => {
    const user = userEvent.setup();
    renderForm(ALUMNI);
    expect(saveBar()).not.toBeInTheDocument();

    const name = screen.getByLabelText('Full name');
    await user.clear(name);
    await user.type(name, 'Sophia M');
    expect(saveBar()).toBeInTheDocument();
    await user.type(screen.getByLabelText('Current password'), 'x');

    await user.click(screen.getByRole('button', { name: 'Discard' }));
    expect(name).toHaveValue('Sophia Martins');
    expect(screen.getByLabelText('Current password')).toHaveValue('');
    expect(saveBar()).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  });

  it('is not dirty when an edit is typed back to the saved value', async () => {
    const user = userEvent.setup();
    renderForm(ALUMNI);
    const role = screen.getByLabelText('Current role');
    await user.type(role, 'x');
    expect(saveBar()).toBeInTheDocument();
    await user.type(role, '{Backspace}');
    expect(saveBar()).not.toBeInTheDocument();
  });

  it('shows a field error when the field is left', async () => {
    const user = userEvent.setup();
    renderForm(ALUMNI);
    await user.clear(screen.getByLabelText('Full name'));
    expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    await user.tab();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  it('sends nothing and focuses the first invalid field when Save fails the checks', async () => {
    const user = userEvent.setup();
    api(() => ({ status: 500 }));
    renderForm(ALUMNI);
    await user.clear(screen.getByLabelText('Full name'));
    await user.type(screen.getByLabelText('Current password'), 'only-this');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(calls).toEqual([]);
    expect(screen.getByLabelText('Full name')).toHaveFocus();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });
});

describe('ProfileForm saving', () => {
  it('sends the profile with the stored photo and no email, then shows the toast', async () => {
    const user = userEvent.setup();
    api(() => ({ status: 200, data: { ...ALUMNI, name: 'Sophia M' } }));
    const { client } = renderForm(ALUMNI);

    const name = screen.getByLabelText('Full name');
    await user.clear(name);
    await user.type(name, 'Sophia M');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText(PROFILE_SAVED_TEXT)).toBeInTheDocument();
    expect(calls.map((call) => call.key)).toEqual(['put /me']);
    expect(calls[0]?.body).toMatchObject({
      name: 'Sophia M',
      photo_url: ALUMNI.photo_url,
      graduation_year: '2016',
      job_title: 'Product manager',
    });
    expect(calls[0]?.body).not.toHaveProperty('email');
    expect(calls[0]?.body).not.toHaveProperty('expected_graduation_year');
    expect(saveBar()).not.toBeInTheDocument();
    expect(client.getQueryData<MyProfile>(CURRENT_USER_QUERY_KEY)?.name).toBe('Sophia M');
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  });

  it('shows the "all saved" caption only after a save, and hides it while dirty', async () => {
    const user = userEvent.setup();
    api(() => ({ status: 200, data: { ...ALUMNI, name: 'Sophia M' } }));
    renderForm(ALUMNI);
    expect(screen.queryByText(ALL_SAVED_TEXT)).not.toBeInTheDocument();

    const name = screen.getByLabelText('Full name');
    await user.clear(name);
    await user.type(name, 'Sophia M');
    expect(screen.queryByText(ALL_SAVED_TEXT)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText(ALL_SAVED_TEXT)).toBeInTheDocument();
    await user.type(name, 'x');
    expect(screen.queryByText(ALL_SAVED_TEXT)).not.toBeInTheDocument();
    await user.type(name, '{Backspace}');
    expect(screen.getByText(ALL_SAVED_TEXT)).toBeInTheDocument();
  });

  it('puts a server field error on its field', async () => {
    const user = userEvent.setup();
    api(() => ({ status: 400, data: { message: 'Company must be at most 100 characters' } }));
    renderForm(ALUMNI);
    await user.type(screen.getByLabelText('Company'), 'Acme');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => {
      expect(screen.getByLabelText('Company')).toHaveFocus();
    });
    expect(screen.getByText('Company must be at most 100 characters')).toBeInTheDocument();
    expect(saveBar()).toBeInTheDocument();
  });

  it('changes only the password for a student whose stored profile would fail the checks', async () => {
    const user = userEvent.setup();
    api(() => ({ status: 204 }));
    renderForm(STUDENT);
    await typePassword(user, 'oldpassword', 'newpassword1');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText(PASSWORD_SAVED_TEXT)).toBeInTheDocument();
    expect(calls.map((call) => call.key)).toEqual(['put /me/password']);
    expect(calls[0]?.body).toEqual({
      current_password: 'oldpassword',
      new_password: 'newpassword1',
    });
    expect(screen.getByLabelText('Current password')).toHaveValue('');
    expect(saveBar()).not.toBeInTheDocument();
  });

  it('puts a wrong current password on that field and keeps what was typed', async () => {
    const user = userEvent.setup();
    api(() => ({ status: 400, data: { message: 'Current password is incorrect' } }));
    renderForm(STUDENT);
    await typePassword(user, 'oldpassword', 'newpassword1');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Current password')).toHaveFocus();
    });
    expect(screen.getByText('Current password is incorrect')).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toHaveValue('newpassword1');
    expect(screen.queryByText(PASSWORD_SAVED_TEXT)).not.toBeInTheDocument();
  });

  it('keeps the saved profile, the typed password and its error when only the password is rejected', async () => {
    const user = userEvent.setup();
    api((config) =>
      config.url === '/me'
        ? { status: 200, data: { ...ALUMNI, job_title: 'Lead' } }
        : { status: 400, data: { message: 'New password must be different from the current one' } },
    );
    const { client } = renderForm(ALUMNI);
    const role = screen.getByLabelText('Current role');
    await user.clear(role);
    await user.type(role, 'Lead');
    await typePassword(user, 'abcdefgh1', 'abcdefgh2');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByText('New password must be different from the current one'),
    ).toBeInTheDocument();
    expect(calls.map((call) => call.key)).toEqual(['put /me', 'put /me/password']);
    expect(screen.getByText(PROFILE_SAVED_TEXT)).toBeInTheDocument();
    // Same input element: the ['me'] cache write did not remount the form.
    expect(screen.getByLabelText('Current role')).toBe(role);
    expect(role).toHaveValue('Lead');
    expect(screen.getByLabelText('New password')).toHaveValue('abcdefgh2');
    expect(screen.getByLabelText('New password')).toHaveFocus();
    expect(client.getQueryData<MyProfile>(CURRENT_USER_QUERY_KEY)?.job_title).toBe('Lead');
    // Only the password is still unsaved.
    expect(saveBar()).toBeInTheDocument();
  });

  it('shows Saving… while the save is in flight', async () => {
    const user = userEvent.setup();
    let answer: (value: { status: number; data?: unknown }) => void = () => undefined;
    api(
      () =>
        new Promise((resolve) => {
          answer = resolve;
        }),
    );
    renderForm(ALUMNI);
    await user.type(screen.getByLabelText('Company'), 'Acme');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Discard' })).toBeDisabled();
    act(() => {
      answer({ status: 200, data: { ...ALUMNI, current_company: 'Acme' } });
    });
    expect(await screen.findByText(PROFILE_SAVED_TEXT)).toBeInTheDocument();
  });
});

describe('ProfileForm leave guard', () => {
  it('asks before leaving while dirty; Keep editing stays, Leave goes', async () => {
    const user = userEvent.setup();
    renderForm(ALUMNI);
    await user.type(screen.getByLabelText('Company'), 'Acme');
    await user.click(screen.getByRole('link', { name: 'Away' }));
    expect(screen.getByRole('group', { name: LEAVE_PROMPT_TEXT })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(screen.getByLabelText('Company')).toHaveValue('Acme');
    expect(screen.getByRole('button', { name: 'Save changes' })).toHaveFocus();

    await user.click(screen.getByRole('link', { name: 'Away' }));
    await user.click(screen.getByRole('button', { name: 'Leave' }));
    expect(await screen.findByText('Elsewhere page')).toBeInTheDocument();
  });

  it('does not ask once the session is gone (a 401 logout while dirty)', async () => {
    const user = userEvent.setup();
    const { router } = renderForm(ALUMNI);
    await user.type(screen.getByLabelText('Company'), 'Acme');
    clearToken();
    await act(async () => {
      await router.navigate('/elsewhere');
    });
    expect(screen.getByText('Elsewhere page')).toBeInTheDocument();
  });

  it('blocks leaving while a save is in flight, then drops the prompt once it saves', async () => {
    const user = userEvent.setup();
    let answer: (value: { status: number; data?: unknown }) => void = () => undefined;
    api(
      () =>
        new Promise((resolve) => {
          answer = resolve;
        }),
    );
    renderForm(ALUMNI);
    await user.type(screen.getByLabelText('Company'), 'Acme');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await user.click(screen.getByRole('link', { name: 'Away' }));
    expect(screen.getByRole('group', { name: LEAVE_PROMPT_TEXT })).toBeInTheDocument();

    // The prompt must never be on screen next to the "saved" toast, not even
    // for the one commit before the blocker's reset reaches the router.
    let sawBoth = false;
    const observer = new MutationObserver(() => {
      const toastShown = document.body.textContent.includes(PROFILE_SAVED_TEXT);
      if (toastShown && document.body.textContent.includes(LEAVE_PROMPT_TEXT)) sawBoth = true;
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    act(() => {
      answer({ status: 200, data: { ...ALUMNI, current_company: 'Acme' } });
    });
    expect(await screen.findByText(PROFILE_SAVED_TEXT)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('group', { name: LEAVE_PROMPT_TEXT })).not.toBeInTheDocument();
    });
    observer.disconnect();
    expect(sawBoth).toBe(false);
    expect(saveBar()).not.toBeInTheDocument();
    expect(screen.queryByText('Elsewhere page')).not.toBeInTheDocument();
  });

  it('asks before unload only while dirty', async () => {
    const user = userEvent.setup();
    const fire = () => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };
    renderForm(ALUMNI);
    expect(fire()).toBe(false);
    await user.type(screen.getByLabelText('Company'), 'Acme');
    expect(fire()).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Discard' }));
    expect(fire()).toBe(false);
  });
});

describe('ProfileForm toast', () => {
  it('is a status message that goes after TOAST_MS or when dismissed', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    api(() => ({ status: 204 }));
    renderForm(ALUMNI);

    await typePassword(user, 'oldpassword', 'newpassword1');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('status')).toHaveTextContent(PASSWORD_SAVED_TEXT);
    act(() => {
      vi.advanceTimersByTime(TOAST_MS - 100);
    });
    expect(screen.getByText(PASSWORD_SAVED_TEXT)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.queryByText(PASSWORD_SAVED_TEXT)).not.toBeInTheDocument();

    await typePassword(user, 'newpassword1', 'newpassword2');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await user.click(await screen.findByRole('button', { name: TOAST_DISMISS_LABEL }));
    expect(screen.queryByText(PASSWORD_SAVED_TEXT)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  });

  it('keeps an empty status region in the page before and after the toast', async () => {
    const user = userEvent.setup();
    api(() => ({ status: 204 }));
    renderForm(ALUMNI);
    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();

    await typePassword(user, 'oldpassword', 'newpassword1');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => {
      expect(status).toHaveTextContent(PASSWORD_SAVED_TEXT);
    });
    await user.click(screen.getByRole('button', { name: TOAST_DISMISS_LABEL }));
    expect(screen.getByRole('status')).toBe(status);
    expect(status).toBeEmptyDOMElement();
  });

  it('does not close while hovered, then closes TOAST_MS after the pointer leaves', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    api(() => ({ status: 204 }));
    renderForm(ALUMNI);

    await typePassword(user, 'oldpassword', 'newpassword1');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    const dismiss = await screen.findByRole('button', { name: TOAST_DISMISS_LABEL });
    await user.hover(dismiss);
    act(() => {
      vi.advanceTimersByTime(TOAST_MS * 3);
    });
    expect(screen.getByRole('status')).toHaveTextContent(PASSWORD_SAVED_TEXT);

    await user.unhover(dismiss);
    act(() => {
      vi.advanceTimersByTime(TOAST_MS - 100);
    });
    expect(screen.getByRole('status')).toHaveTextContent(PASSWORD_SAVED_TEXT);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('does not close while Dismiss has focus, and focus goes to the heading when it does', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    api(() => ({ status: 204 }));
    renderForm(ALUMNI);

    await typePassword(user, 'oldpassword', 'newpassword1');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    const dismiss = await screen.findByRole('button', { name: TOAST_DISMISS_LABEL });
    act(() => {
      dismiss.focus();
    });
    act(() => {
      vi.advanceTimersByTime(TOAST_MS * 3);
    });
    expect(dismiss).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent(PASSWORD_SAVED_TEXT);

    await user.keyboard('{Enter}');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  });

  it('closes TOAST_MS after focus leaves it', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    api(() => ({ status: 204 }));
    renderForm(ALUMNI);

    await typePassword(user, 'oldpassword', 'newpassword1');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    const dismiss = await screen.findByRole('button', { name: TOAST_DISMISS_LABEL });
    act(() => {
      dismiss.focus();
    });
    act(() => {
      vi.advanceTimersByTime(TOAST_MS * 2);
    });
    act(() => {
      screen.getByLabelText('Company').focus();
    });
    act(() => {
      vi.advanceTimersByTime(TOAST_MS);
    });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByLabelText('Company')).toHaveFocus();
  });
});
