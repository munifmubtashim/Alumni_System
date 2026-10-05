// Pages a signed-in user must never be sent back to.
const AUTH_PATHS = new Set(['/login', '/register']);

function stringOr(value: unknown, fallback: string): string | null {
  if (value === undefined) return fallback;
  return typeof value === 'string' ? value : null;
}

/**
 * Where to go after logging in: the in-app `state.from` location saved by
 * RequireAuth, or null when there is none or it isn't safe. Only an app path
 * qualifies: it must start with one `/` (not `//` or `/\`, which a browser
 * reads as another host) and must not be the login or sign-up page.
 * Search and hash are kept.
 */
export function resolveFrom(state: unknown): string | null {
  if (typeof state !== 'object' || state === null || !('from' in state)) return null;
  const from: unknown = state.from;
  if (typeof from !== 'object' || from === null || !('pathname' in from)) return null;

  const { pathname } = from;
  if (typeof pathname !== 'string' || !/^\/(?![/\\])/.test(pathname)) return null;

  // Route matching ignores case and a trailing slash, so this check does too.
  const normalized = pathname.toLowerCase().replace(/\/+$/, '');
  if (AUTH_PATHS.has(normalized)) return null;

  const search = stringOr('search' in from ? from.search : undefined, '');
  const hash = stringOr('hash' in from ? from.hash : undefined, '');
  if (search === null || hash === null) return null;
  if (search !== '' && !search.startsWith('?')) return null;
  if (hash !== '' && !hash.startsWith('#')) return null;

  return pathname + search + hash;
}
