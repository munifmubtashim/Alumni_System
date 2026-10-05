// Single source of truth for the auth token (ADR-02). Other code may hold
// decoded claims, but never a copy of the token itself.
export const TOKEN_STORAGE_KEY = 'token';

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
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Storage unavailable: nothing to clear.
  }
}
