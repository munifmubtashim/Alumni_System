import axios from 'axios';
import { getToken } from './authToken';

export const httpClient = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },
});

// The only place the auth header is attached.
httpClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type UnauthorizedHandler = (requestToken: string) => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

/**
 * Registers the one function called when an authed request gets a 401 (ADR-03).
 * It receives the token the failed request carried, so the caller can ignore a
 * late 401 from an older token. Pass null to unregister. This module never
 * logs out or navigates itself.
 */
export function setUnauthorizedHandler(fn: UnauthorizedHandler | null): void {
  unauthorizedHandler = fn;
}

// A 401 from these means "wrong credentials", not "session ended".
const CREDENTIAL_URLS = new Set(['/auth/login', '/auth/register']);

function bearerToken(header: unknown): string | null {
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length);
  return token || null;
}

// Re-throwing inside the interceptor rejects the request's promise, the same
// as returning Promise.reject(error); the caller still sees the original error.
httpClient.interceptors.response.use(undefined, (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401 && error.config) {
    const path = (error.config.url ?? '').split('?')[0] ?? '';
    const token = bearerToken(error.config.headers.Authorization);
    if (token && !CREDENTIAL_URLS.has(path)) {
      unauthorizedHandler?.(token);
    }
  }
  throw error;
});
