import { describe, expect, it, vi } from 'vitest';
import { TOKEN_STORAGE_KEY, clearToken, getToken, setToken } from './authToken';

describe('authToken', () => {
  it('uses the "token" storage key', () => {
    expect(TOKEN_STORAGE_KEY).toBe('token');
  });

  it('returns null when no token is stored', () => {
    expect(getToken()).toBeNull();
  });

  it('stores, reads and clears the token in localStorage', () => {
    setToken('abc');
    expect(getToken()).toBe('abc');
    expect(window.localStorage.getItem('token')).toBe('abc');

    clearToken();
    expect(getToken()).toBeNull();
  });

  it('does not throw when storage is unavailable', () => {
    const fail = () => {
      throw new DOMException('denied', 'SecurityError');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(fail);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(fail);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(fail);

    expect(() => {
      setToken('abc');
    }).not.toThrow();
    expect(getToken()).toBeNull();
    expect(() => {
      clearToken();
    }).not.toThrow();
  });
});
