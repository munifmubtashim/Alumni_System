import type { AlumniListItem, MyProfile } from '@alumni/shared';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { BRAND_NAME } from '@/config/brand';
import { UNREACHABLE_MESSAGE } from '@/features/auth';
import { AdminPage } from './AdminPage';
import { GONE_TEXT } from './AlumniDrawer';
import { DELETE_CONFIRM_LABEL, DELETE_DESCRIPTION } from './DeleteAlumniDialog';
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
const [FIRST, , THIRD] = ROWS as [AlumniListItem, AlumniListItem, AlumniListItem];

const deleted: Responder = (config) =>
  Promise.resolve({
    data: { message: 'Deleted' },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  });

/** Answers every GET /alumni with the rows returned by `rows()` at that moment. */
function liveList(rows: () => AlumniListItem[]): Responder {
  return (config) => byPage([page(rows(), rows().length)])(config);
}

async function renderPage(writes: Record<string, Responder> = {}, list?: Responder, path?: string) {
  const api = mockApi(ok(STATS), list ?? byPage([page(ROWS, ROWS.length)]), writes);
  const user = userEvent.setup();
  const { queryClient, router } = renderAt(<AdminPage />, path);
  await within(await screen.findByRole('table', { name: 'Alumni' })).findByText(
    path === undefined ? 'Alum 1' : /^(Alum|Last) /,
  );
  return { api, user, queryClient, router };
}

const table = () => screen.getByRole('table', { name: 'Alumni' });
const deleteButton = (name: string) =>
  within(table()).getByRole('button', { name: `Delete ${name}` });
const heading = () => screen.getByRole('heading', { level: 2, name: 'Alumni' });

async function openDelete(user: ReturnType<typeof userEvent.setup>, name: string) {
  const trigger = deleteButton(name);
  await user.click(trigger);
  const dialog = await screen.findByRole('alertdialog', { name: `Delete ${name}?` });
  await waitFor(() => {
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });
  return { dialog, trigger };
}

const confirmButton = (dialog: HTMLElement) =>
  within(dialog).getByRole('button', { name: DELETE_CONFIRM_LABEL });

async function expectClosed() {
  await waitFor(() => {
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
}

describe('DeleteAlumniDialog', () => {
  it('asks with the S6 text, naming the brand, with focus on Cancel', async () => {
    const { user } = await renderPage();
    const { dialog } = await openDelete(user, 'Alum 2');

    expect(DELETE_DESCRIPTION).toContain(`from ${BRAND_NAME}.`);
    expect(dialog).toHaveAccessibleDescription(DELETE_DESCRIPTION);
    expect(within(dialog).getByRole('heading', { name: 'Delete Alum 2?' })).toBeInTheDocument();
    expect(confirmButton(dialog)).toBeEnabled();
  });

  it.each([
    [
      'Cancel',
      (user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement) =>
        user.click(within(dialog).getByRole('button', { name: 'Cancel' })),
    ],
    ['Escape', (user: ReturnType<typeof userEvent.setup>) => user.keyboard('{Escape}')],
  ])('%s closes without a request and returns focus to the row’s Delete', async (_, close) => {
    const { user, api } = await renderPage({ 'DELETE /admin/alumni/2': deleted });
    const { dialog, trigger } = await openDelete(user, 'Alum 2');

    await close(user, dialog);

    await expectClosed();
    expect(api.calls).not.toContain('DELETE /admin/alumni/2');
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });

  it('shows a busy button while deleting, sends one request and ignores Escape and Cancel', async () => {
    const pending = held();
    const { user, api } = await renderPage({ 'DELETE /admin/alumni/2': pending.responder });
    const { dialog } = await openDelete(user, 'Alum 2');

    await user.dblClick(confirmButton(dialog));
    expect(confirmButton(dialog)).toBeDisabled();
    expect(confirmButton(dialog)).toHaveAttribute('aria-busy', 'true');
    await user.keyboard('{Escape}');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(api.calls.filter((call) => call === 'DELETE /admin/alumni/2')).toHaveLength(1);

    await act(async () => {
      pending.release(deleted);
      await Promise.resolve();
    });
    await expectClosed();
  });

  it('stays open with the server’s message on a refusal, and can try again', async () => {
    let attempts = 0;
    const { user } = await renderPage({
      'DELETE /admin/alumni/2': (config) => {
        attempts += 1;
        return attempts === 1
          ? fail(409, 'This user still has posts or comments')(config)
          : fail(503)(config);
      },
    });
    const { dialog } = await openDelete(user, 'Alum 2');

    await user.click(confirmButton(dialog));

    const alert = await within(dialog).findByRole('alert');
    expect(alert).toHaveTextContent('This user still has posts or comments');
    expect(alert).toHaveFocus();
    expect(confirmButton(dialog)).toBeEnabled();
    // The page behind the modal still shows the row.
    expect(screen.getAllByText('Alum 2')).not.toHaveLength(0);

    await user.click(confirmButton(dialog));
    await waitFor(() => {
      expect(within(dialog).getByRole('alert')).toHaveTextContent(UNREACHABLE_MESSAGE);
    });
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('deletes, refetches, marks the other features stale, toasts and focuses the heading', async () => {
    let rows = ROWS;
    const { user, api, queryClient } = await renderPage(
      {
        'DELETE /admin/alumni/2': (config) => {
          rows = [FIRST, THIRD];
          return deleted(config);
        },
      },
      liveList(() => rows),
    );
    for (const key of [
      ['alumni', 'detail', 2],
      ['posts', 'user', 102],
      ['feed', 'list'],
    ]) {
      queryClient.setQueryData(key, {});
    }
    const statsBefore = api.calls.filter((call) => call === 'GET /admin/stats').length;
    const { dialog } = await openDelete(user, 'Alum 2');

    await user.click(confirmButton(dialog));

    await expectClosed();
    expect(api.calls).toContain('DELETE /admin/alumni/2');
    // The table no longer shows the row when the dialog closes.
    expect(within(table()).queryByText('Alum 2')).not.toBeInTheDocument();
    expect(api.calls.filter((call) => call === 'GET /admin/stats').length).toBe(statsBefore + 1);
    for (const key of [
      ['alumni', 'detail', 2],
      ['posts', 'user', 102],
      ['feed', 'list'],
    ]) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
    }
    expect(await screen.findByText('Alum 2 deleted')).toBeInTheDocument();
    await waitFor(() => {
      expect(heading()).toHaveFocus();
    });
  });

  it('on a 404 closes with "no longer exists" and refetches', async () => {
    let rows = ROWS;
    const { user, api } = await renderPage(
      {
        'DELETE /admin/alumni/3': (config) => {
          rows = [FIRST];
          return fail(404, 'Alumni not found')(config);
        },
      },
      liveList(() => rows),
    );
    const searchesBefore = api.searches.length;
    const { dialog } = await openDelete(user, 'Alum 3');

    await user.click(confirmButton(dialog));

    await expectClosed();
    expect(await screen.findByText(GONE_TEXT)).toBeInTheDocument();
    expect(api.searches.length).toBeGreaterThan(searchesBefore);
    expect(within(table()).queryByText('Alum 3')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(heading()).toHaveFocus();
    });
  });

  it('steps back a page when the delete empties the last one', async () => {
    const firstPage = alumni(10);
    const lastRow = alumni(1, 'Last', 11);
    let total = 11;
    const list: Responder = (config) => {
      const pages = total === 11 ? [page(firstPage, 11), page(lastRow, 11)] : [page(firstPage, 10)];
      return byPage(pages)(config);
    };
    const { user, router } = await renderPage(
      {
        'DELETE /admin/alumni/11': (config) => {
          total = 10;
          return deleted(config);
        },
      },
      list,
      '/admin?page=2',
    );
    const { dialog } = await openDelete(user, 'Last 1');

    await user.click(confirmButton(dialog));

    await expectClosed();
    await waitFor(() => {
      expect(router.state.location.search).toBe('');
    });
    expect(await within(table()).findByText('Alum 10')).toBeInTheDocument();
    await waitFor(() => {
      expect(heading()).toHaveFocus();
    });
  });

  it('hides Delete on the signed-in admin’s own row', async () => {
    const { queryClient } = await renderPage();
    const me: Partial<MyProfile> = { user_id: FIRST.user_id, role: 'admin' };
    act(() => {
      queryClient.setQueryData(['me'], me);
    });

    await waitFor(() => {
      expect(within(table()).queryByRole('button', { name: 'Delete Alum 1' })).toBeNull();
    });
    expect(within(table()).getByRole('button', { name: 'Edit Alum 1' })).toBeInTheDocument();
    expect(deleteButton('Alum 2')).toBeInTheDocument();
    const cards = screen.getAllByRole('list', { name: 'Alumni' })[0];
    if (cards === undefined) throw new Error('No card list');
    expect(within(cards).queryByRole('button', { name: 'Delete Alum 1' })).toBeNull();
  });
});
