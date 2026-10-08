import type { AlumniListItem } from '@alumni/shared';
import { QueryObserver, type QueryClient } from '@tanstack/react-query';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminPage } from './AdminPage';
import {
  ADD_TITLE,
  CHANGES_SAVED_TEXT,
  DISCARD_CHANGES_TEXT,
  DISCARD_NEW_TEXT,
  EDIT_TITLE,
  GONE_TEXT,
} from './AlumniDrawer';
import {
  alumni,
  byPage,
  fail,
  held,
  mockApi,
  ok,
  page,
  renderAt,
  restoreApi,
  STATS,
  type Responder,
} from './testKit';

afterEach(() => {
  restoreApi();
});

const ROWS = alumni(3);
const [FIRST, SECOND, THIRD] = ROWS as [AlumniListItem, AlumniListItem, AlumniListItem];
const NEW_ROW: AlumniListItem = {
  id: 50,
  user_id: 150,
  name: 'Hana Kobayashi',
  graduation_year: 2021,
  mentorship_available: false,
};

/** Answers every GET /alumni with the pages returned by `rows()` at that moment. */
function liveList(rows: () => typeof ROWS): Responder {
  return (config) => byPage([page(rows(), rows().length)])(config);
}

async function renderPage(writes: Record<string, Responder> = {}, list?: Responder) {
  const api = mockApi(ok(STATS), list ?? byPage([page(ROWS, ROWS.length)]), writes);
  const user = userEvent.setup();
  const { queryClient } = renderAt(<AdminPage />);
  await within(await screen.findByRole('table', { name: 'Alumni' })).findByText('Alum 1');
  return { api, user, queryClient };
}

/** A directory query with a live observer, like an open /directory would have (L-REQ-010-1). */
function watchDirectory(queryClient: QueryClient) {
  const queryFn = vi.fn(() => Promise.resolve(page([], 0)));
  const observer = new QueryObserver(queryClient, {
    queryKey: ['alumni', 'search', {}],
    queryFn,
  });
  const unsubscribe = observer.subscribe(() => undefined);
  return { queryFn, unsubscribe };
}

function backdrop(): HTMLElement {
  const element = document.querySelector<HTMLElement>('.backdrop');
  if (element === null) throw new Error('No backdrop');
  return element;
}

const addButton = () => screen.getByRole('button', { name: 'Add alumni' });
const dialog = (name: string) => screen.getByRole('dialog', { name });
const field = (label: string) => screen.getByLabelText(label);
const editButton = (name: string) =>
  within(screen.getByRole('table', { name: 'Alumni' })).getByRole('button', {
    name: `Edit ${name}`,
  });

async function openAdd(user: ReturnType<typeof userEvent.setup>) {
  await user.click(addButton());
  const drawer = await screen.findByRole('dialog', { name: ADD_TITLE });
  await waitFor(() => {
    expect(field('Full name')).toHaveFocus();
  });
  return drawer;
}

async function openEdit(user: ReturnType<typeof userEvent.setup>, name: string) {
  const trigger = editButton(name);
  await user.click(trigger);
  const drawer = await screen.findByRole('dialog', { name: EDIT_TITLE });
  await waitFor(() => {
    expect(field('Full name')).toHaveFocus();
  });
  return { drawer, trigger };
}

async function fillValidAdd(user: ReturnType<typeof userEvent.setup>) {
  await user.type(field('Full name'), 'Hana Kobayashi');
  await user.type(field('Email'), 'hana@example.com');
  await user.type(field('Graduation year'), '2021');
  await user.type(field('Temporary password'), 'temporary1');
}

/**
 * Presses the footer's submit button. jsdom (user-event) does not submit on
 * Enter here: the button sits outside the <form> (form="…"), which browsers
 * honour for implicit submission but user-event does not.
 */
async function submit(user: ReturnType<typeof userEvent.setup>) {
  const button = screen
    .getByRole('dialog')
    .querySelector<HTMLButtonElement>('button[type="submit"]');
  if (button === null) throw new Error('No submit button');
  await user.click(button);
}

async function expectClosed() {
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
}

describe('AlumniDrawer: add', () => {
  it('shows the S6 fields in order with Cancel and Add alumni', async () => {
    const { user } = await renderPage();
    const drawer = await openAdd(user);

    const labels = within(drawer)
      .getAllByRole('textbox')
      .map((input) => input.getAttribute('name'));
    expect(labels).toEqual([
      'name',
      'email',
      'university',
      'graduation_year',
      'department',
      'job_title',
      'current_company',
    ]);
    expect(within(drawer).getByLabelText('Current role')).toBeInTheDocument();
    expect(within(drawer).getByLabelText('Company')).toBeInTheDocument();
    expect(within(drawer).getByLabelText('Temporary password')).toHaveAttribute('type', 'password');
    expect(within(drawer).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(within(drawer).getByRole('button', { name: 'Add alumni' })).toHaveAttribute(
      'type',
      'submit',
    );
  });

  it('shows required errors on submit and focuses the first invalid field', async () => {
    const { user, api } = await renderPage();
    const drawer = await openAdd(user);

    await user.click(within(drawer).getByRole('button', { name: 'Add alumni' }));

    expect(field('Full name')).toHaveAccessibleDescription('Name is required');
    expect(field('Email')).toHaveAccessibleDescription('Email is required');
    expect(field('Temporary password')).toHaveAccessibleDescription(
      expect.stringContaining('Temporary password must be at least 8 characters'),
    );
    expect(field('Full name')).toHaveFocus();
    expect(api.calls).not.toContain('POST /admin/alumni');
  });

  it('shows a format error when a field is left, and clears it on typing', async () => {
    const { user } = await renderPage();
    await openAdd(user);

    await user.type(field('Full name'), 'Hana');
    await user.type(field('Email'), 'not-an-email');
    await user.type(field('Graduation year'), '20');
    await user.tab();

    expect(field('Email')).toHaveAccessibleDescription('Email is not valid');
    expect(field('Graduation year')).toHaveAccessibleDescription('Graduation year is not valid');
    await user.type(field('Graduation year'), '21');
    expect(field('Graduation year')).not.toHaveAccessibleDescription();
  });

  it('focuses the first invalid field in form order, not the first typed one', async () => {
    const { user } = await renderPage();
    await openAdd(user);
    await user.type(field('Full name'), 'Hana');
    await user.type(field('Email'), 'hana@example.com');
    await user.type(field('Graduation year'), '1800');

    await submit(user);

    expect(field('Graduation year')).toHaveFocus();
    expect(field('Graduation year')).toHaveAccessibleDescription('Graduation year is not valid');
  });

  it('shows a 409 on Email and keeps the drawer open', async () => {
    const { user } = await renderPage({
      'POST /admin/alumni': fail(409, 'An account with this email already exists'),
    });
    await openAdd(user);
    await fillValidAdd(user);

    await user.click(within(dialog(ADD_TITLE)).getByRole('button', { name: 'Add alumni' }));

    await waitFor(() => {
      expect(field('Email')).toHaveAccessibleDescription(
        'An account with this email already exists',
      );
    });
    expect(field('Email')).toHaveFocus();
    expect(field('Email')).not.toBeDisabled();
    expect(dialog(ADD_TITLE)).toBeInTheDocument();
  });

  it('puts a field-named 400 on that field and other errors in an alert', async () => {
    const { user } = await renderPage({
      'POST /admin/alumni': fail(400, 'Job title must be at most 100 characters'),
    });
    await openAdd(user);
    await fillValidAdd(user);
    await submit(user);

    await waitFor(() => {
      expect(field('Current role')).toHaveFocus();
    });
    expect(field('Current role')).toHaveAccessibleDescription(
      'Job title must be at most 100 characters',
    );
  });

  it('shows a server failure in a focused alert', async () => {
    const { user } = await renderPage({ 'POST /admin/alumni': fail(500) });
    await openAdd(user);
    await fillValidAdd(user);
    await submit(user);

    const alert = await within(dialog(ADD_TITLE)).findByRole('alert');
    expect(alert).toHaveTextContent("Couldn't reach the server, try again");
    expect(alert).toHaveFocus();
  });

  it('creates, toasts, refreshes the admin page and the directory, and returns focus', async () => {
    let rows = ROWS;
    const { user, api, queryClient } = await renderPage(
      {
        'POST /admin/alumni': (config) => {
          rows = [...ROWS, NEW_ROW];
          return ok(NEW_ROW)(config);
        },
      },
      liveList(() => rows),
    );
    const directory = watchDirectory(queryClient);
    await waitFor(() => {
      expect(directory.queryFn).toHaveBeenCalledTimes(1);
    });
    const statsBefore = api.calls.filter((call) => call === 'GET /admin/stats').length;

    await openAdd(user);
    await fillValidAdd(user);
    await user.click(within(dialog(ADD_TITLE)).getByRole('button', { name: 'Add alumni' }));

    await expectClosed();
    expect(api.bodies).toEqual([
      {
        name: 'Hana Kobayashi',
        email: 'hana@example.com',
        password: 'temporary1',
        university: '',
        graduation_year: '2021',
        department: '',
        job_title: '',
        current_company: '',
      },
    ]);
    expect(screen.getByRole('status', { name: '' })).toBeInTheDocument();
    expect(await screen.findByText('Hana Kobayashi added')).toBeInTheDocument();
    // The table already shows the new row when the drawer closes.
    expect(
      within(screen.getByRole('table', { name: 'Alumni' })).getByText('Hana Kobayashi'),
    ).toBeInTheDocument();
    expect(api.calls.filter((call) => call === 'GET /admin/stats').length).toBe(statsBefore + 1);
    await waitFor(() => {
      expect(directory.queryFn).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(addButton()).toHaveFocus();
    });
    directory.unsubscribe();
  });

  it('sends one request on a double click and ignores close requests while saving', async () => {
    const pending = held();
    const { user, api } = await renderPage({ 'POST /admin/alumni': pending.responder });
    await openAdd(user);
    await fillValidAdd(user);
    const submitButton = within(dialog(ADD_TITLE)).getByRole('button', { name: 'Add alumni' });

    await user.dblClick(submitButton);
    await user.click(submitButton);

    expect(api.calls.filter((call) => call === 'POST /admin/alumni')).toHaveLength(1);
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveAttribute('aria-busy', 'true');
    expect(field('Full name')).toBeDisabled();
    expect(within(dialog(ADD_TITLE)).getByRole('button', { name: 'Cancel' })).toBeDisabled();

    await user.keyboard('{Escape}');
    await user.click(within(dialog(ADD_TITLE)).getByRole('button', { name: 'Close' }));
    await user.click(backdrop());
    expect(dialog(ADD_TITLE)).toBeInTheDocument();
    expect(screen.queryByText(DISCARD_NEW_TEXT)).not.toBeInTheDocument();

    pending.release(ok(NEW_ROW));
    await expectClosed();
    expect(api.calls.filter((call) => call === 'POST /admin/alumni')).toHaveLength(1);
  });
});

describe('AlumniDrawer: edit', () => {
  it('prefills from the row, hides Email and password, and sends only the editable fields', async () => {
    const row = {
      ...SECOND,
      graduation_year: 2017,
      job_title: 'Engineer',
      current_company: 'Acme',
    };
    const rows = [FIRST, row, THIRD];
    const { user, api } = await renderPage(
      { [`PUT /admin/alumni/${String(row.id)}`]: ok(row) },
      byPage([page(rows, rows.length)]),
    );
    const { drawer, trigger } = await openEdit(user, 'Alum 2');

    expect(field('Full name')).toHaveValue('Alum 2');
    expect(field('University')).toHaveValue('Oxford');
    expect(field('Graduation year')).toHaveValue('2017');
    expect(field('Department')).toHaveValue('Economics');
    expect(field('Current role')).toHaveValue('Engineer');
    expect(field('Company')).toHaveValue('Acme');
    expect(within(drawer).queryByLabelText('Email')).not.toBeInTheDocument();
    expect(within(drawer).queryByLabelText('Temporary password')).not.toBeInTheDocument();

    await user.clear(field('Company'));
    await user.click(within(drawer).getByRole('button', { name: 'Save changes' }));

    await expectClosed();
    expect(api.bodies).toEqual([
      {
        name: 'Alum 2',
        university: 'Oxford',
        graduation_year: '2017',
        department: 'Economics',
        job_title: 'Engineer',
        current_company: '',
      },
    ]);
    expect(await screen.findByText(CHANGES_SAVED_TEXT)).toBeInTheDocument();
    // The row is still on the page, so focus goes back to its Edit button.
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });

  it('returns focus to the list heading when the edited row has left the page', async () => {
    let rows = ROWS;
    const { user } = await renderPage(
      {
        'PUT /admin/alumni/1': (config) => {
          // Renamed to sort onto another page.
          rows = [SECOND, THIRD];
          return ok({ ...FIRST, name: 'Zed' })(config);
        },
      },
      liveList(() => rows),
    );
    await openEdit(user, 'Alum 1');
    await user.clear(field('Full name'));
    await user.type(field('Full name'), 'Zed');
    await submit(user);

    await expectClosed();
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Alumni' })).toHaveFocus();
    });
  });

  it('moves focus to the list heading when the row leaves after focus went back to it', async () => {
    const { user, queryClient } = await renderPage({ 'PUT /admin/alumni/2': ok(SECOND) });
    const { trigger } = await openEdit(user, 'Alum 2');
    await user.type(field('Department'), ' and Law');
    await submit(user);
    await expectClosed();
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });

    // A later refetch drops the row (e.g. deleted in another tab).
    act(() => {
      queryClient.setQueriesData({ queryKey: ['admin', 'alumni'] }, page([FIRST, THIRD], 2));
    });

    await waitFor(() => {
      expect(trigger).not.toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { level: 2, name: 'Alumni' })).toHaveFocus();
  });

  it('on a 404 toasts that the alumni is gone, closes and refetches', async () => {
    let rows = ROWS;
    const { user, api } = await renderPage(
      {
        'PUT /admin/alumni/3': (config) => {
          rows = [FIRST, SECOND];
          return fail(404, 'Alumni not found')(config);
        },
      },
      liveList(() => rows),
    );
    const searchesBefore = api.searches.length;
    await openEdit(user, 'Alum 3');
    await user.type(field('Department'), ' and Law');
    await submit(user);

    await expectClosed();
    expect(await screen.findByText(GONE_TEXT)).toBeInTheDocument();
    expect(api.searches.length).toBeGreaterThan(searchesBefore);
    expect(
      within(screen.getByRole('table', { name: 'Alumni' })).queryByText('Alum 3'),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Alumni' })).toHaveFocus();
    });
  });
});

describe('AlumniDrawer: closing', () => {
  it.each([
    [
      'Cancel',
      (user: ReturnType<typeof userEvent.setup>) =>
        user.click(screen.getByRole('button', { name: 'Cancel' })),
    ],
    ['Escape', (user: ReturnType<typeof userEvent.setup>) => user.keyboard('{Escape}')],
    [
      'the close button',
      (user: ReturnType<typeof userEvent.setup>) =>
        user.click(screen.getByRole('button', { name: 'Close' })),
    ],
  ])('closes at once with %s when nothing was typed', async (_label, press) => {
    const { user } = await renderPage();
    await openAdd(user);

    await press(user);

    await expectClosed();
    await waitFor(() => {
      expect(addButton()).toHaveFocus();
    });
  });

  it('asks before discarding typed input; Keep editing goes back to the form', async () => {
    const { user } = await renderPage();
    await openAdd(user);
    await user.type(field('Full name'), 'Hana');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    const group = screen.getByRole('group', { name: DISCARD_NEW_TEXT });
    const keep = within(group).getByRole('button', { name: 'Keep editing' });
    expect(keep).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();

    await user.click(keep);

    expect(dialog(ADD_TITLE)).toBeInTheDocument();
    expect(screen.queryByText(DISCARD_NEW_TEXT)).not.toBeInTheDocument();
    expect(field('Full name')).toHaveValue('Hana');
  });

  it('Discard closes without saving and the next open starts empty', async () => {
    const { user, api } = await renderPage();
    await openAdd(user);
    await user.type(field('Full name'), 'Hana');
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Discard' }));

    await expectClosed();
    expect(api.calls).not.toContain('POST /admin/alumni');
    await waitFor(() => {
      expect(addButton()).toHaveFocus();
    });
    await openAdd(user);
    expect(field('Full name')).toHaveValue('');
  });

  it('Escape on the question goes back to editing and never closes the drawer', async () => {
    const { user } = await renderPage();
    await openAdd(user);
    await user.type(field('Full name'), 'Hana');
    await user.keyboard('{Escape}');
    expect(screen.getByText(DISCARD_NEW_TEXT)).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(dialog(ADD_TITLE)).toBeInTheDocument();
    expect(screen.queryByText(DISCARD_NEW_TEXT)).not.toBeInTheDocument();
    // Back where the user was when the question appeared.
    expect(field('Full name')).toHaveFocus();
  });

  it('keeps the question when the backdrop or × is pressed while it shows', async () => {
    const { user } = await renderPage();
    await openAdd(user);
    await user.type(field('Full name'), 'Hana');
    await user.click(backdrop());
    expect(screen.getByText(DISCARD_NEW_TEXT)).toBeInTheDocument();

    await user.click(backdrop());
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(dialog(ADD_TITLE)).toBeInTheDocument();
    expect(screen.getByText(DISCARD_NEW_TEXT)).toBeInTheDocument();
  });

  it('asks "Discard changes?" on edit only once a field differs from the row', async () => {
    const { user } = await renderPage();
    const { trigger } = await openEdit(user, 'Alum 1');

    // Spaces only: not a change.
    await user.type(field('Department'), '  ');
    await user.keyboard('{Escape}');
    await expectClosed();
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });

    await openEdit(user, 'Alum 1');
    await user.type(field('Department'), ' and Law');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('group', { name: DISCARD_CHANGES_TEXT })).toBeInTheDocument();
  });
});
