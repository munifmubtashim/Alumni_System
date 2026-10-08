import { act, render } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { describe, expect, it } from 'vitest';
import { useDirectoryParams, type DirectoryParamsApi } from './useDirectoryParams';

function setup(initialEntries: string[]) {
  const latest: { api?: DirectoryParamsApi } = {};
  function Probe() {
    latest.api = useDirectoryParams();
    return null;
  }
  const router = createMemoryRouter(
    [{ path: '/directory', Component: Probe }, { path: '/start' }],
    {
      initialEntries,
      initialIndex: initialEntries.length - 1,
    },
  );
  render(<RouterProvider router={router} />);
  const api = (): DirectoryParamsApi => {
    if (!latest.api) throw new Error('hook not rendered');
    return latest.api;
  };
  const search = (): string => router.state.location.search;
  const change = (fn: () => void) =>
    act(async () => {
      fn();
      await Promise.resolve();
    });
  const back = () => act(() => router.navigate(-1));
  const forward = () => act(() => router.navigate(1));
  return { router, api, search, change, back, forward };
}

describe('useDirectoryParams', () => {
  it('parses the URL without rewriting it, even when values are invalid', () => {
    const { api, search, router } = setup(['/directory?q=%20Ada%20&page=abc&graduationYear=20']);
    expect(api().params).toEqual({ q: 'Ada', page: 1 });
    expect(search()).toBe('?q=%20Ada%20&page=abc&graduationYear=20');
    expect(router.state.historyAction).toBe('POP');
  });

  it('setFilters sets a filter, resets the page and pushes a history entry', async () => {
    const { api, search, router, change, back } = setup(['/directory?q=Ada&page=3']);

    await change(() => {
      api().setFilters({ department: 'Computer Science' });
    });
    expect(search()).toBe('?q=Ada&department=Computer+Science');
    expect(router.state.historyAction).toBe('PUSH');
    expect(api().params).toEqual({ q: 'Ada', department: 'Computer Science', page: 1 });

    await back();
    expect(search()).toBe('?q=Ada&page=3');
    expect(api().params).toEqual({ q: 'Ada', page: 3 });
  });

  it('setFilters clears a filter set to undefined or empty text and keeps the others', async () => {
    const { api, change, search } = setup([
      '/directory?department=CS&university=MIT&graduationYear=2017&page=2',
    ]);

    await change(() => {
      api().setFilters({ graduationYear: undefined, university: '' });
    });
    expect(search()).toBe('?department=CS');
  });

  it('setQuery replaces the history entry and resets the page', async () => {
    const { api, search, router, change, back } = setup([
      '/start',
      '/directory?department=CS&page=4',
    ]);

    await change(() => {
      api().setQuery('Ada');
    });
    expect(search()).toBe('?q=Ada&department=CS');
    expect(router.state.historyAction).toBe('REPLACE');

    await back();
    expect(router.state.location.pathname).toBe('/start');
  });

  it('setQuery with blank text drops q', async () => {
    const { api, change, search } = setup(['/directory?q=Ada']);
    await change(() => {
      api().setQuery('   ');
    });
    expect(search()).toBe('');
  });

  it('setPage pushes the page and keeps the filters', async () => {
    const { api, search, router, change, back } = setup(['/directory?q=Ada']);

    await change(() => {
      api().setPage(2);
    });
    expect(search()).toBe('?q=Ada&page=2');
    expect(router.state.historyAction).toBe('PUSH');

    await change(() => {
      api().setPage(1);
    });
    expect(search()).toBe('?q=Ada');

    await back();
    expect(api().params.page).toBe(2);
  });

  it('clearAll drops all five params as a new history entry', async () => {
    const { api, search, router, change, back } = setup([
      '/directory?q=Ada&department=CS&university=MIT&graduationYear=2017&page=2',
    ]);

    await change(() => {
      api().clearAll();
    });
    expect(search()).toBe('');
    expect(router.state.historyAction).toBe('PUSH');
    expect(api().params).toEqual({ page: 1 });

    await back();
    expect(api().params).toEqual({
      q: 'Ada',
      department: 'CS',
      university: 'MIT',
      graduationYear: 2017,
      page: 2,
    });
  });

  it('back and forward restore each state', async () => {
    const { api, change, back, forward } = setup(['/directory']);

    await change(() => {
      api().setFilters({ university: 'MIT' });
    });
    await change(() => {
      api().setPage(3);
    });
    expect(api().params).toEqual({ university: 'MIT', page: 3 });

    await back();
    expect(api().params).toEqual({ university: 'MIT', page: 1 });
    await back();
    expect(api().params).toEqual({ page: 1 });
    await forward();
    await forward();
    expect(api().params).toEqual({ university: 'MIT', page: 3 });
  });

  it('does not push an entry when nothing changes', async () => {
    const { api, router, change, search } = setup(['/start', '/directory?department=CS']);

    await change(() => {
      api().setFilters({ department: 'CS' });
    });
    expect(search()).toBe('?department=CS');
    expect(router.state.historyAction).toBe('POP');
  });

  it('two writes in the same tick keep both values', async () => {
    const { api, change, search } = setup(['/directory']);

    await change(() => {
      const { setQuery, setFilters } = api();
      setQuery('Ada');
      setFilters({ department: 'CS' });
    });
    expect(search()).toBe('?q=Ada&department=CS');
  });

  it('writes a clean URL, dropping invalid values, on the first change', async () => {
    const { api, change, search } = setup(['/directory?page=abc&graduationYear=20&pageSize=50']);

    await change(() => {
      api().setFilters({ university: 'MIT' });
    });
    expect(search()).toBe('?university=MIT');
  });
});
