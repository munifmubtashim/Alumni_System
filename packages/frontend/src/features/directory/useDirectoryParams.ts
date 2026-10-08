import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  parseDirectoryParams,
  toSearchParams,
  type DirectoryFilters,
  type DirectoryParams,
} from './params';

/** Keys set to `undefined` (or empty text) are cleared; keys left out stay as they are. */
export type DirectoryFiltersPatch = {
  [K in keyof DirectoryFilters]?: DirectoryFilters[K] | undefined;
};

export interface DirectoryParamsApi {
  params: DirectoryParams;
  /** Changes filters (and optionally `q`), back to page 1, as a new history entry. */
  setFilters: (patch: DirectoryFiltersPatch) => void;
  /** Changes the typed search text, back to page 1, replacing the history entry. */
  setQuery: (q: string) => void;
  /** Goes to `page` as a new history entry. */
  setPage: (page: number) => void;
  /** Drops the search text, every filter and the page, as a new history entry. */
  clearAll: () => void;
}

function withoutQuestionMark(search: string): string {
  return search.startsWith('?') ? search.slice(1) : search;
}

/**
 * The directory's search, filters and page, read from and written to the URL
 * query string (ADR-08). Reading never rewrites the URL; invalid values are
 * simply ignored (see `parseDirectoryParams`).
 *
 * Writes build on the last URL this hook wrote, not on the last render, so two
 * writes in the same tick (e.g. a pending search write and a filter change)
 * don't drop each other's values.
 */
export function useDirectoryParams(): DirectoryParamsApi {
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => parseDirectoryParams(new URLSearchParams(search)), [search]);

  const latestSearch = useRef(withoutQuestionMark(search));
  useLayoutEffect(() => {
    latestSearch.current = withoutQuestionMark(search);
  }, [search]);

  const write = useCallback(
    (update: (current: DirectoryParams) => DirectoryParams, replace: boolean) => {
      const current = parseDirectoryParams(new URLSearchParams(latestSearch.current));
      const next = toSearchParams(update(current)).toString();
      if (next === latestSearch.current) return;
      latestSearch.current = next;
      void navigate({ search: next ? `?${next}` : '' }, { replace });
    },
    [navigate],
  );

  const setFilters = useCallback(
    (patch: DirectoryFiltersPatch) => {
      write((current) => ({ ...current, ...patch, page: 1 }), false);
    },
    [write],
  );

  const setQuery = useCallback(
    (q: string) => {
      write((current) => ({ ...current, q, page: 1 }), true);
    },
    [write],
  );

  const setPage = useCallback(
    (page: number) => {
      write((current) => ({ ...current, page }), false);
    },
    [write],
  );

  const clearAll = useCallback(() => {
    write(() => ({ page: 1 }), false);
  }, [write]);

  return useMemo(
    () => ({ params, setFilters, setQuery, setPage, clearAll }),
    [params, setFilters, setQuery, setPage, clearAll],
  );
}
