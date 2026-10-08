import type { AlumniSort } from '@alumni/shared';
import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { nextSort, parseAdminParams, toSearchParams, type AdminParams } from './params';

export interface AdminParamsApi {
  params: AdminParams;
  /** Changes the typed search text, back to page 1, replacing the history entry. */
  setQuery: (q: string) => void;
  /** A header click: sorts by `column` (flipping it if active), page 1, new history entry. */
  sortBy: (column: AlumniSort) => void;
  /** Goes to `page` as a new history entry. */
  setPage: (page: number) => void;
  /** Moves to `page` in place (replace), e.g. back from a page past the end. */
  clampPage: (page: number) => void;
  /** Drops the search text, back to page 1, keeping the sort; a new history entry. */
  clearSearch: () => void;
}

function withoutQuestionMark(search: string): string {
  return search.startsWith('?') ? search.slice(1) : search;
}

/**
 * The admin table's search, sort and page, read from and written to the URL
 * (ADR-08). Reading never rewrites the URL; invalid values are ignored (see
 * `parseAdminParams`). Writes build on the last URL this hook wrote, not on the
 * last render, so two writes in one tick don't drop each other's values (the
 * same reason as `useDirectoryParams`).
 */
export function useAdminParams(): AdminParamsApi {
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => parseAdminParams(new URLSearchParams(search)), [search]);

  const latestSearch = useRef(withoutQuestionMark(search));
  useLayoutEffect(() => {
    latestSearch.current = withoutQuestionMark(search);
  }, [search]);

  const write = useCallback(
    (update: (current: AdminParams) => AdminParams, replace: boolean) => {
      const current = parseAdminParams(new URLSearchParams(latestSearch.current));
      const next = toSearchParams(update(current)).toString();
      if (next === latestSearch.current) return;
      latestSearch.current = next;
      void navigate({ search: next ? `?${next}` : '' }, { replace });
    },
    [navigate],
  );

  const setQuery = useCallback(
    (q: string) => {
      write((current) => ({ ...current, q, page: 1 }), true);
    },
    [write],
  );

  const sortBy = useCallback(
    (column: AlumniSort) => {
      write((current) => ({ ...current, ...nextSort(current, column), page: 1 }), false);
    },
    [write],
  );

  const setPage = useCallback(
    (page: number) => {
      write((current) => ({ ...current, page }), false);
    },
    [write],
  );

  const clampPage = useCallback(
    (page: number) => {
      write((current) => ({ ...current, page }), true);
    },
    [write],
  );

  const clearSearch = useCallback(() => {
    write((current) => ({ sort: current.sort, order: current.order, page: 1 }), false);
  }, [write]);

  return useMemo(
    () => ({ params, setQuery, sortBy, setPage, clampPage, clearSearch }),
    [params, setQuery, sortBy, setPage, clampPage, clearSearch],
  );
}
