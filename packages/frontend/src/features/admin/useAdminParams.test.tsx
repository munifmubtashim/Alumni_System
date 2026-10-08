import { act, render } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { describe, expect, it } from 'vitest';
import { useAdminParams, type AdminParamsApi } from './useAdminParams';

function setup(initialEntries: string[]) {
  const latest: { api?: AdminParamsApi } = {};
  function Probe() {
    latest.api = useAdminParams();
    return null;
  }
  const router = createMemoryRouter([{ path: '/admin', Component: Probe }], {
    initialEntries,
    initialIndex: initialEntries.length - 1,
  });
  render(<RouterProvider router={router} />);
  const api = (): AdminParamsApi => {
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
  return { router, api, search, change, back };
}

describe('useAdminParams', () => {
  it('parses the URL without rewriting it, even when values are invalid', () => {
    const { api, search, router } = setup(['/admin?q=%20Ada%20&sort=bogus&page=abc']);
    expect(api().params).toEqual({ q: 'Ada', sort: 'name', order: 'asc', page: 1 });
    expect(search()).toBe('?q=%20Ada%20&sort=bogus&page=abc');
    expect(router.state.historyAction).toBe('POP');
  });

  it('setQuery writes q, resets the page and replaces the history entry', async () => {
    const { api, search, router, change } = setup(['/admin?sort=graduationYear&page=3']);

    await change(() => {
      api().setQuery('Ada');
    });
    expect(search()).toBe('?q=Ada&sort=graduationYear');
    expect(router.state.historyAction).toBe('REPLACE');
  });

  it('sortBy flips the active column, starts another ascending, resets the page and pushes', async () => {
    const { api, search, router, change, back } = setup(['/admin?q=Ada&page=3']);

    await change(() => {
      api().sortBy('name');
    });
    expect(search()).toBe('?q=Ada&order=desc');
    expect(router.state.historyAction).toBe('PUSH');

    await change(() => {
      api().sortBy('graduationYear');
    });
    expect(search()).toBe('?q=Ada&sort=graduationYear');
    expect(api().params).toEqual({ q: 'Ada', sort: 'graduationYear', order: 'asc', page: 1 });

    await back();
    expect(search()).toBe('?q=Ada&order=desc');
  });

  it('setPage pushes and clampPage replaces', async () => {
    const { api, search, router, change } = setup(['/admin']);

    await change(() => {
      api().setPage(4);
    });
    expect(search()).toBe('?page=4');
    expect(router.state.historyAction).toBe('PUSH');

    await change(() => {
      api().clampPage(2);
    });
    expect(search()).toBe('?page=2');
    expect(router.state.historyAction).toBe('REPLACE');
  });

  it('clearSearch drops q and the page but keeps the sort', async () => {
    const { api, search, router, change } = setup(['/admin?q=Ada&sort=graduationYear&page=2']);

    await change(() => {
      api().clearSearch();
    });
    expect(search()).toBe('?sort=graduationYear');
    expect(router.state.historyAction).toBe('PUSH');
  });

  it('keeps both of two writes made in the same tick', async () => {
    const { api, search, change } = setup(['/admin']);

    await change(() => {
      api().setQuery('Ada');
      api().sortBy('graduationYear');
    });
    expect(search()).toBe('?q=Ada&sort=graduationYear');
  });
});
