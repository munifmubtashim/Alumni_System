import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FilterBar, SEARCH_DEBOUNCE_MS } from './FilterBar';
import { useDirectoryParams } from './useDirectoryParams';

function Harness() {
  const { params, setFilters, setQuery, clearAll } = useDirectoryParams();
  return (
    <FilterBar
      params={params}
      onQueryChange={setQuery}
      onFilterChange={setFilters}
      onClearAll={clearAll}
    />
  );
}

function setup(initialEntries: string[] = ['/directory'], { fakeTimers = false } = {}) {
  // shouldAdvanceTime keeps waitFor/findBy polling (G12); explicit waits move the clock on.
  if (fakeTimers) {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true });
  }
  const router = createMemoryRouter([{ path: '/directory', Component: Harness }], {
    initialEntries,
    initialIndex: initialEntries.length - 1,
  });
  render(<RouterProvider router={router} />);
  const user = userEvent.setup(
    fakeTimers
      ? {
          advanceTimers: (ms) => {
            vi.advanceTimersByTime(ms);
          },
        }
      : {},
  );
  const search = (): string => router.state.location.search;
  const box = () => screen.getByRole('searchbox', { name: 'Search alumni' });
  const pill = (name: string) => screen.getByRole('button', { name });
  const wait = (ms: number) =>
    act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  return { router, user, search, box, pill, wait };
}

async function applyFilter(
  user: ReturnType<typeof userEvent.setup>,
  pillName: string,
  fieldName: string,
  value: string,
) {
  await user.click(screen.getByRole('button', { name: pillName }));
  const field = await screen.findByRole('textbox', { name: fieldName });
  await waitFor(() => {
    expect(field).toHaveFocus();
  });
  await user.type(field, `${value}{Enter}`);
}

afterEach(() => {
  vi.useRealTimers();
});

describe('FilterBar', () => {
  it('shows a labeled search box and a pill per filter, no chips and no Clear all', () => {
    const { box, pill } = setup();

    expect(box()).toHaveAttribute('maxLength', '100');
    expect(box()).toHaveValue('');
    for (const name of ['University', 'Department', 'Grad. year']) {
      expect(pill(name)).toHaveAttribute('aria-haspopup', 'dialog');
    }
    expect(screen.queryByRole('button', { name: /^Remove / })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Field/ })).not.toBeInTheDocument();
  });

  it('restores the box and the chips from the URL', () => {
    setup(['/directory?q=Ada&department=Computer+Science&graduationYear=2017']);

    expect(screen.getByRole('searchbox', { name: 'Search alumni' })).toHaveValue('Ada');
    expect(screen.getByText('Department: Computer Science')).toBeInTheDocument();
    expect(screen.getByText('Grad. year: 2017')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove Department: Computer Science' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Grad. year: 2017' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'University' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Department' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear all' })).toBeInTheDocument();
  });

  it.each([
    [
      'University',
      'University',
      'Oslo University',
      'university=Oslo+University',
      'University: Oslo University',
    ],
    [
      'Department',
      'Department',
      'Computer Science',
      'department=Computer+Science',
      'Department: Computer Science',
    ],
    ['Grad. year', 'Graduation year', '2017', 'graduationYear=2017', 'Grad. year: 2017'],
  ])(
    'sets %s with Enter: URL, chip, page reset and focus on the chip remove button',
    async (pillName, fieldName, value, param, chip) => {
      const { user, search, router } = setup(['/directory?page=3']);

      await applyFilter(user, pillName, fieldName, value);

      expect(search()).toBe(`?${param}`);
      expect(router.state.historyAction).toBe('PUSH');
      const remove = await screen.findByRole('button', { name: `Remove ${chip}` });
      await waitFor(() => {
        expect(remove).toHaveFocus();
      });
      expect(screen.queryByRole('button', { name: pillName })).not.toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    },
  );

  it('sets a filter by clicking Apply', async () => {
    const { user, search } = setup();

    await user.click(screen.getByRole('button', { name: 'Department' }));
    await user.type(await screen.findByRole('textbox', { name: 'Department' }), 'Economics');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(search()).toBe('?department=Economics');
    expect(
      await screen.findByRole('button', { name: 'Remove Department: Economics' }),
    ).toHaveFocus();
  });

  it.each([
    ['three digits', '201'],
    ['letters', '20ab'],
    ['too early', '1899'],
    ['too far ahead', String(new Date().getFullYear() + 11)],
  ])('a graduation year with %s blocks Apply and says why', async (_case, value) => {
    const { user, search } = setup();

    await applyFilter(user, 'Grad. year', 'Graduation year', value);

    const field = screen.getByRole('textbox', { name: 'Graduation year' });
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription(/Enter a 4-digit year from 1900 to \d{4}\./);
    expect(screen.getByRole('dialog', { name: 'Grad. year filter' })).toBeInTheDocument();
    expect(search()).toBe('');
  });

  it('an empty department or one with a tab character is not applied', async () => {
    const { user, search } = setup();

    await applyFilter(user, 'Department', 'Department', ' ');
    const field = screen.getByRole('textbox', { name: 'Department' });
    expect(field).toHaveAccessibleDescription(/Enter a department name\./);

    // A tab can't be typed into the field (it moves focus), but it can be pasted.
    await user.clear(field);
    await user.paste('Computer\tScience');
    await user.keyboard('{Enter}');

    expect(field).toHaveAccessibleDescription(/special characters/);
    expect(search()).toBe('');
  });

  it('shows text-filter helper text', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'University' }));

    expect(await screen.findByRole('textbox', { name: 'University' })).toHaveAccessibleDescription(
      "The exact name; capitals don't matter.",
    );
  });

  it('removing a chip clears that filter, keeps the others and focuses its pill', async () => {
    const { user, search, router } = setup([
      '/directory?q=Ada&department=Economics&graduationYear=2017&page=2',
    ]);

    await user.click(screen.getByRole('button', { name: 'Remove Department: Economics' }));

    expect(search()).toBe('?q=Ada&graduationYear=2017');
    expect(router.state.historyAction).toBe('PUSH');
    const pill = await screen.findByRole('button', { name: 'Department' });
    await waitFor(() => {
      expect(pill).toHaveFocus();
    });
  });

  it('Clear all drops the search and every filter and focuses the search box', async () => {
    const { user, search, box } = setup([
      '/directory?q=Ada&university=Oslo&department=Economics&graduationYear=2017&page=4',
    ]);

    await user.click(screen.getByRole('button', { name: 'Clear all' }));

    expect(search()).toBe('');
    expect(box()).toHaveValue('');
    await waitFor(() => {
      expect(box()).toHaveFocus();
    });
    expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Remove / })).not.toBeInTheDocument();
  });

  it('Escape in a panel returns focus to its pill', async () => {
    const { user, pill } = setup();

    await user.click(pill('University'));
    const field = await screen.findByRole('textbox', { name: 'University' });
    await waitFor(() => {
      expect(field).toHaveFocus();
    });
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(pill('University')).toHaveFocus();
    });
  });

  describe('search debounce', () => {
    it(`writes q only after ${String(SEARCH_DEBOUNCE_MS)} ms of quiet, replacing history and resetting the page`, async () => {
      const { user, search, box, wait, router } = setup(['/directory?page=3'], {
        fakeTimers: true,
      });

      await user.type(box(), 'Ada');
      // Real time also moves the clock a little, so leave a margin before the deadline.
      await wait(SEARCH_DEBOUNCE_MS - 100);
      expect(search()).toBe('?page=3');

      await wait(100);
      expect(search()).toBe('?q=Ada');
      expect(router.state.historyAction).toBe('REPLACE');
      expect(box()).toHaveValue('Ada');
    });

    it('keeps a trailing space in the box after its own write', async () => {
      const { user, search, box, wait } = setup(['/directory'], { fakeTimers: true });

      await user.type(box(), 'Ada ');
      await wait(SEARCH_DEBOUNCE_MS);

      expect(search()).toBe('?q=Ada');
      expect(box()).toHaveValue('Ada ');
    });

    it('an outside change of q (e.g. Back) updates the box', async () => {
      const { router, box } = setup(['/directory?q=Ada']);

      await act(() => router.navigate('/directory?q=Grace'));
      expect(box()).toHaveValue('Grace');

      await act(() => router.navigate(-1));
      expect(box()).toHaveValue('Ada');
    });

    it('Back while a write is pending is not undone', async () => {
      const { user, router, search, box, wait } = setup(['/directory?q=old', '/directory?q=new'], {
        fakeTimers: true,
      });

      await user.type(box(), 'x');
      await act(() => router.navigate(-1));
      expect(box()).toHaveValue('old');

      await wait(SEARCH_DEBOUNCE_MS * 2);
      expect(search()).toBe('?q=old');
      expect(box()).toHaveValue('old');
    });

    it('Clear all while a write is pending is not undone', async () => {
      const { user, search, box, wait } = setup(['/directory?q=abc&department=Economics'], {
        fakeTimers: true,
      });

      await user.type(box(), 'd');
      await user.click(screen.getByRole('button', { name: 'Clear all' }));
      await wait(SEARCH_DEBOUNCE_MS * 2);

      expect(search()).toBe('');
      expect(box()).toHaveValue('');
    });

    it('Apply while a write is pending keeps the typed text in the same history entry', async () => {
      const { user, router, search, box, wait } = setup(['/directory'], { fakeTimers: true });

      await user.type(box(), 'Ada');
      await applyFilter(user, 'Department', 'Department', 'Economics');

      expect(search()).toBe('?q=Ada&department=Economics');
      expect(router.state.historyAction).toBe('PUSH');

      await wait(SEARCH_DEBOUNCE_MS * 2);
      expect(search()).toBe('?q=Ada&department=Economics');
      expect(box()).toHaveValue('Ada');

      await act(() => router.navigate(-1));
      expect(search()).toBe('');
    });
  });
});
