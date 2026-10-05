// Single source of truth for the auth token (ADR-02). Other code may hold
// decoded claims, but never a copy of the token itself.
export const TOKEN_STORAGE_KEY = 'token';

// Treat a token as expired this long before its `exp`, to absorb clock skew.
const EXPIRY_LEEWAY_MS = 10_000;

type Listener = () => void;

const listeners = new Set<Listener>();

function notify(): void {
  for (const listener of [...listeners]) listener();
}

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Storage unavailable (private mode, quota, disabled): the token is not persisted.
  }
  notify();
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Storage unavailable: nothing to clear.
  }
  notify();
}

/**
 * Calls `listener` whenever the token may have changed: on setToken/clearToken
 * in this tab, and on another tab's change to the same key (the `storage`
 * event; `key === null` means that tab cleared all of localStorage).
 * Returns the unsubscribe function.
 */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === TOKEN_STORAGE_KEY || event.key === null) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function decodePayload(token: string): unknown {
  const segment = token.split('.')[1];
  if (!segment) return null;
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = window.atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

/**
 * True when the token can't be trusted as live: malformed payload, missing or
 * non-numeric `exp`, or `exp` within EXPIRY_LEEWAY_MS of `nowMs`.
 * Reads the claim only; the signature is the server's job.
 */
export function isTokenExpired(token: string, nowMs: number = Date.now()): boolean {
  let payload: unknown;
  try {
    payload = decodePayload(token);
  } catch {
    return true;
  }
  if (typeof payload !== 'object' || payload === null) return true;
  const exp = (payload as { exp?: unknown }).exp;
  if (typeof exp !== 'number' || !Number.isFinite(exp)) return true;
  return exp * 1000 <= nowMs + EXPIRY_LEEWAY_MS;
}

/**
 * The stored token if present and not expired, otherwise null.
 * A pure read: it never clears storage or notifies, so it is safe as a
 * useSyncExternalStore snapshot (expired-token cleanup happens elsewhere).
 */
export function getLiveToken(): string | null {
  const token = getToken();
  if (!token || isTokenExpired(token)) return null;
  return token;
}
