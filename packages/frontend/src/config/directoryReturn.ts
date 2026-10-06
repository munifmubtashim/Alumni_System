/**
 * The handover between the directory and the profile page (REQ-008).
 *
 * A directory card passes its current search string (`?q=…&page=…`) as router
 * state; the profile's "Back to directory" link reads it back so the search,
 * filters and page come back. This file is the only place that knows the
 * state's shape, so the two lazy features never import each other (ADR-08).
 */

/** Where the directory lives. */
export const DIRECTORY_PATH = '/directory';

/** Router state a directory card hands to the profile page. */
export interface DirectoryReturnState {
  directorySearch: string;
}

/** The state to put on a link from the directory, given `location.search`. */
export function directoryReturnState(search: string): DirectoryReturnState {
  return { directorySearch: search };
}

/**
 * The "Back to directory" target for some router `state`. Restores the stored
 * search only when it is a string that is empty or starts with `?` and has no
 * `#`; anything else (no state, a reload in a fresh tab, tampered state) gives
 * the plain directory.
 */
export function directoryReturnPath(state: unknown): string {
  if (typeof state !== 'object' || state === null || !('directorySearch' in state)) {
    return DIRECTORY_PATH;
  }
  const search = state.directorySearch;
  if (typeof search !== 'string' || search.includes('#')) return DIRECTORY_PATH;
  if (search !== '' && !search.startsWith('?')) return DIRECTORY_PATH;
  return DIRECTORY_PATH + search;
}
