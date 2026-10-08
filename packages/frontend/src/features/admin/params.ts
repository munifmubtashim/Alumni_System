import type { AlumniSort, SortOrder } from '@alumni/shared';

/**
 * The admin table's list state lives in the URL query string (ADR-08): search
 * text, sort column, sort direction and page. These pure helpers read and
 * write it. Anything `GET /api/alumni` would answer 400 to is ignored on read,
 * so a hand-edited or stale URL never breaks the request.
 *
 * The limits are copies of the backend's, not imports (L-REQ-006-3): keep them
 * in sync with `packages/backend/src/businessLogic/src/validation.ts`
 * (`MAX_PAGE`, `NAME_MAX` for `q`, and the `sort` / `order` whitelists in
 * `parseAlumniSearch`). The directory keeps its own copy in
 * `features/directory/params.ts`; lazy features can't import each other.
 */

export const MAX_PAGE = 10000;
export const Q_MAX_LENGTH = 100;

export const DEFAULT_SORT: AlumniSort = 'name';
export const DEFAULT_ORDER: SortOrder = 'asc';

const SORTS: readonly AlumniSort[] = ['name', 'graduationYear'];
const ORDERS: readonly SortOrder[] = ['asc', 'desc'];

export interface AdminParams {
  /** Search text (name, company or job title); absent when empty or invalid. */
  q?: string;
  sort: AlumniSort;
  order: SortOrder;
  /** 1-based; 1 when absent or invalid. */
  page: number;
}

// NUL and other control characters: Postgres rejects NUL, the API answers 400 (G23).
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/g;

/** `value` with each control character (a pasted tab or line break) turned into a space. */
export function stripControlCharacters(value: string): string {
  return value.replace(CONTROL_CHARACTERS, ' ');
}

/** The one value of `key`, or undefined when it is missing or repeated. */
function singleValue(search: URLSearchParams, key: string): string | undefined {
  const values = search.getAll(key);
  return values.length === 1 ? values[0] : undefined;
}

function parseQuery(value: string | undefined): string | undefined {
  if (value === undefined || CONTROL_CHARACTER.test(value)) return undefined;
  const trimmed = value.trim();
  if (trimmed === '' || trimmed.length > Q_MAX_LENGTH) return undefined;
  return trimmed;
}

function parsePage(value: string | undefined): number {
  if (value === undefined || !/^\d+$/.test(value.trim())) return 1;
  const page = Number(value.trim());
  return page >= 1 && page <= MAX_PAGE ? page : 1;
}

function isSort(value: string | undefined): value is AlumniSort {
  return SORTS.some((sort) => sort === value);
}

function isOrder(value: string | undefined): value is SortOrder {
  return ORDERS.some((order) => order === value);
}

export function parseAdminParams(search: URLSearchParams): AdminParams {
  const sort = singleValue(search, 'sort');
  const order = singleValue(search, 'order');
  const params: AdminParams = {
    sort: isSort(sort) ? sort : DEFAULT_SORT,
    order: isOrder(order) ? order : DEFAULT_ORDER,
    page: parsePage(singleValue(search, 'page')),
  };
  const q = parseQuery(singleValue(search, 'q'));
  if (q !== undefined) params.q = q;
  return params;
}

/**
 * The query string for `params`. Defaults (name, asc, page 1) and empty text
 * are left out, so the plain admin URL has no query string at all. Control
 * characters become spaces, since `parseAdminParams` would drop the whole value.
 */
export function toSearchParams(params: AdminParams): URLSearchParams {
  const search = new URLSearchParams();
  const q = params.q === undefined ? '' : stripControlCharacters(params.q).trim();
  if (q !== '') search.set('q', q);
  if (params.sort !== DEFAULT_SORT) search.set('sort', params.sort);
  if (params.order !== DEFAULT_ORDER) search.set('order', params.order);
  if (params.page > 1) search.set('page', String(params.page));
  return search;
}

/**
 * The sort after a click on `column`'s header: the active column flips its
 * direction, another column starts ascending.
 */
export function nextSort(
  current: Pick<AdminParams, 'sort' | 'order'>,
  column: AlumniSort,
): Pick<AdminParams, 'sort' | 'order'> {
  if (current.sort === column) {
    return { sort: column, order: current.order === 'asc' ? 'desc' : 'asc' };
  }
  return { sort: column, order: 'asc' };
}
