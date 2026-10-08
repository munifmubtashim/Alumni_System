import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminPage } from './AdminPage';
import { SEARCH_DEBOUNCE_MS } from './AdminSearch';
import { ADMIN_PAGE_SIZE } from './queries';
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
  vi.useRealTimers();
});

function renderPage(path = '/admin') {
  return renderAt(<AdminPage />, path);
}

const table = () => screen.getByRole('table', { name: 'Alumni' });
const cardList = () => screen.getByRole('list', { name: 'Alumni' });
const searchBox = () => screen.getByRole('searchbox', { name: 'Search alumni' });
const countLine = () => screen.getByText(/^Showing /);
/** The names in the table's rows, in order. */
const tableNames = () =>
  within(table())
    .getAllByRole('rowheader')
    .map((cell) => cell.textContent);

const DEFAULT_REQUEST = { sort: 'name', order: 'asc', page: 1, pageSize: ADMIN_PAGE_SIZE };

describe('AdminPage', () => {
  it('shows the heading, Add alumni, the stats and the first page with default params', async () => {
    const api = mockApi(ok(STATS), byPage([page(alumni(3), 3)]));
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Admin' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add alumni' })).toBeInTheDocument();
    expect(await screen.findByText('1,842')).toBeInTheDocument();
    await within(await screen.findByRole('table', { name: 'Alumni' })).findByText('Alum 1');

    expect(tableNames()).toEqual(['Alum 1', 'Alum 2', 'Alum 3']);
    // The phone card list is rendered from the same data (CSS shows one or the other).
    expect(within(cardList()).getAllByRole('listitem')).toHaveLength(3);
    expect(within(table()).getByRole('button', { name: 'Edit Alum 2' })).toBeInTheDocument();
    expect(within(cardList()).getByRole('button', { name: 'Delete Alum 3' })).toBeInTheDocument();
    expect(api.searches).toEqual([DEFAULT_REQUEST]);
    expect(countLine()).toHaveTextContent('Showing 3 of 3');
  });

  it('shows skeleton rows while the first page loads, then the rows', async () => {
    const request = held();
    mockApi(ok(STATS), request.responder);
    renderPage();

    expect(await screen.findByText('Loading alumni…')).toBeInTheDocument();
    const busy = screen.getByRole('table', { hidden: true });
    expect(busy).toHaveAttribute('aria-busy', 'true');
    expect(busy.querySelectorAll('tbody tr')).toHaveLength(ADMIN_PAGE_SIZE);
    expect(screen.queryByText(/^Showing /)).not.toBeInTheDocument();

    act(() => {
      request.release(ok(page(alumni(2), 2)));
    });
    expect(await within(table()).findByText('Alum 1')).toBeInTheDocument();
    expect(screen.queryByText('Loading alumni…')).not.toBeInTheDocument();
    expect(table()).not.toHaveAttribute('aria-busy');
  });

  it('keeps the table when the stats fail', async () => {
    mockApi(fail(500), byPage([page(alumni(2), 2)]));
    renderPage();

    expect(await screen.findByText("The counts didn't load")).toBeInTheDocument();
    expect(within(table()).getByText('Alum 1')).toBeInTheDocument();
  });

  it('sorts by a header click: URL, aria-sort and request params, back to page 1', async () => {
    const user = userEvent.setup();
    const api = mockApi(ok(STATS), byPage([page(alumni(10), 25), page(alumni(10, 'P2'), 25)]));
    const { router } = renderPage('/admin?page=2');
    await within(await screen.findByRole('table', { name: 'Alumni' })).findByText('P2 1');

    const nameHeader = screen.getByRole('columnheader', { name: /^Name/ });
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

    await user.click(screen.getByRole('button', { name: 'Grad. year' }));
    await waitFor(() => {
      expect(api.searches.at(-1)).toEqual({ ...DEFAULT_REQUEST, sort: 'graduationYear' });
    });
    expect(router.state.location.search).toBe('?sort=graduationYear');
    expect(router.state.historyAction).toBe('PUSH');
    const yearHeader = screen.getByRole('columnheader', { name: /Grad\. year/ });
    expect(yearHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(nameHeader).not.toHaveAttribute('aria-sort');
    // The header button stays mounted, so focus stays on it.
    expect(screen.getByRole('button', { name: 'Grad. year' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Grad. year' }));
    await waitFor(() => {
      expect(api.searches.at(-1)).toEqual({
        ...DEFAULT_REQUEST,
        sort: 'graduationYear',
        order: 'desc',
      });
    });
    expect(router.state.location.search).toBe('?sort=graduationYear&order=desc');
    expect(yearHeader).toHaveAttribute('aria-sort', 'descending');
    expect(yearHeader).toHaveTextContent('Grad. year↑');
  });

  it(`writes typed search to q after ${String(SEARCH_DEBOUNCE_MS)} ms, back to page 1`, async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true });
    const user = userEvent.setup({
      advanceTimers: (ms) => {
        vi.advanceTimersByTime(ms);
      },
    });
    const api = mockApi(ok(STATS), (config) => {
      const params = config.params as { q?: string; page: number };
      if (params.q === 'Ada') return ok(page(alumni(1, 'Ada'), 1))(config);
      return byPage([page(alumni(10), 30), page(alumni(10, 'P2'), 30)])(config);
    });
    const { router } = renderPage('/admin?sort=graduationYear&page=2');
    await within(await screen.findByRole('table', { name: 'Alumni' })).findByText('P2 1');

    await user.type(searchBox(), 'Ada');
    // Real time also moves the clock a little, so leave a margin before the deadline.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS - 100);
    });
    expect(router.state.location.search).toBe('?sort=graduationYear&page=2');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(router.state.location.search).toBe('?q=Ada&sort=graduationYear');
    expect(router.state.historyAction).toBe('REPLACE');
    expect(await within(table()).findByText('Ada 1')).toBeInTheDocument();
    expect(api.searches.at(-1)).toEqual({
      ...DEFAULT_REQUEST,
      q: 'Ada',
      sort: 'graduationYear',
    });
    expect(searchBox()).toHaveValue('Ada');
  });

  it('pages with Prev and Next, disabled at the edges, with the count line', async () => {
    const user = userEvent.setup();
    const api = mockApi(
      ok(STATS),
      byPage([
        page(alumni(10, 'First'), 1205),
        page(alumni(10, 'Second'), 1205),
        ...Array.from({ length: 118 }, () => page(alumni(10, 'Middle'), 1205)),
        page(alumni(5, 'Last'), 1205),
      ]),
    );
    const { router } = renderPage();
    await within(await screen.findByRole('table', { name: 'Alumni' })).findByText('First 1');

    const prev = screen.getByRole('button', { name: 'Previous page' });
    const next = screen.getByRole('button', { name: 'Next page' });
    expect(prev).toBeDisabled();
    expect(next).toBeEnabled();
    expect(countLine()).toHaveTextContent('Showing 10 of 1,205');

    await user.click(next);
    expect(await within(table()).findByText('Second 1')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?page=2');
    expect(router.state.historyAction).toBe('PUSH');
    expect(api.searches.at(-1)).toEqual({ ...DEFAULT_REQUEST, page: 2 });
    expect(prev).toBeEnabled();

    await user.click(prev);
    expect(await within(table()).findByText('First 1')).toBeInTheDocument();
    expect(router.state.location.search).toBe('');
    expect(prev).toBeDisabled();
    // The clicked button went disabled, so focus moved to the other one.
    await waitFor(() => {
      expect(next).toHaveFocus();
    });

    await act(() => router.navigate('/admin?page=120'));
    expect(await within(table()).findByText('Middle 1')).toBeInTheDocument();
    await user.click(next);
    expect(await within(table()).findByText('Last 1')).toBeInTheDocument();
    expect(next).toBeDisabled();
    expect(countLine()).toHaveTextContent('Showing 5 of 1,205');
    await waitFor(() => {
      expect(prev).toHaveFocus();
    });
  });

  it('disables both buttons on a single page', async () => {
    mockApi(ok(STATS), byPage([page(alumni(4), 4)]));
    renderPage();
    await within(await screen.findByRole('table', { name: 'Alumni' })).findByText('Alum 1');

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('shows "No alumni yet" when there are none and no search', async () => {
    mockApi(ok(STATS), byPage([page([], 0)]));
    renderPage();

    expect(await screen.findByRole('heading', { name: 'No alumni yet' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Alumni' })).not.toBeInTheDocument();
    expect(screen.queryByText(/^Showing /)).not.toBeInTheDocument();
  });

  it('shows the no-match state, and Clear search drops q and focuses the box', async () => {
    const user = userEvent.setup();
    const api = mockApi(ok(STATS), (config) => {
      const params = config.params as { q?: string };
      return ok(params.q === undefined ? page(alumni(2), 2) : page([], 0))(config);
    });
    const { router } = renderPage('/admin?q=zzz&order=desc');

    expect(
      await screen.findByRole('heading', { name: 'No alumni match “zzz”' }),
    ).toBeInTheDocument();
    expect(searchBox()).toHaveValue('zzz');

    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(await within(table()).findByText('Alum 1')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?order=desc');
    expect(api.searches.at(-1)).toEqual({ ...DEFAULT_REQUEST, order: 'desc' });
    expect(searchBox()).toHaveValue('');
    expect(searchBox()).toHaveFocus();
  });

  it('shows an error with Retry, and Retry loads the table', async () => {
    const user = userEvent.setup();
    let calls = 0;
    const alumniHandler: Responder = (config) => {
      calls += 1;
      return calls === 1 ? fail(403)(config) : ok(page(alumni(2), 2))(config);
    };
    mockApi(ok(STATS), alumniHandler);
    renderPage();

    expect(await screen.findByText("The alumni list didn't load")).toBeInTheDocument();
    expect(screen.getByText('1,842')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await within(table()).findByText('Alum 1')).toBeInTheDocument();
    expect(screen.queryByText("The alumni list didn't load")).not.toBeInTheDocument();
    expect(calls).toBe(2);
  });

  it('clamps a page past the end to the last page, in place', async () => {
    const api = mockApi(ok(STATS), byPage([page(alumni(10), 14), page(alumni(4, 'Last'), 14)]));
    const { router } = renderPage('/admin?page=7');

    expect(
      await within(await screen.findByRole('table', { name: 'Alumni' })).findByText('Last 1'),
    ).toBeInTheDocument();
    expect(router.state.location.search).toBe('?page=2');
    expect(router.state.historyAction).toBe('REPLACE');
    expect(api.searches.map((search) => search.page)).toEqual([7, 2]);
    expect(screen.queryByRole('heading', { name: /No alumni/ })).not.toBeInTheDocument();
  });

  it('keeps a key typed while its own search write lands', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true });
    const user = userEvent.setup({
      advanceTimers: (ms) => {
        vi.advanceTimersByTime(ms);
      },
    });
    mockApi(ok(STATS), byPage([page(alumni(2), 2)]));
    const { router } = renderPage();
    await within(await screen.findByRole('table', { name: 'Alumni' })).findByText('Alum 1');

    await user.type(searchBox(), 'Ada');
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
      fireEvent.change(searchBox(), { target: { value: 'Adal' } });
    });
    expect(searchBox()).toHaveValue('Adal');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(SEARCH_DEBOUNCE_MS);
    });
    expect(router.state.location.search).toBe('?q=Adal');
    expect(searchBox()).toHaveValue('Adal');
  });
});
