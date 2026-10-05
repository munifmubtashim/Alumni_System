import { describe, expect, it, vi } from 'vitest';
import {
  TOKEN_STORAGE_KEY,
  clearToken,
  getLiveToken,
  getToken,
  getTokenExpiresAt,
  isTokenExpired,
  setToken,
  subscribe,
} from './authToken';

// Builds an unsigned JWT-shaped token with a base64url (unpadded) payload.
function makeToken(payload: unknown): string {
  const json = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  const base64url = window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `header.${base64url}.signature`;
}

const NOW = 1_800_000_000_000;
const nowSec = NOW / 1000;

describe('authToken', () => {
  it('uses the "token" storage key', () => {
    expect(TOKEN_STORAGE_KEY).toBe('token');
  });

  it('returns null when no token is stored', () => {
    expect(getToken()).toBeNull();
  });

  it('stores, reads and clears the token in localStorage', () => {
    expect(setToken('abc')).toBe(true);
    expect(getToken()).toBe('abc');
    expect(window.localStorage.getItem('token')).toBe('abc');

    clearToken();
    expect(getToken()).toBeNull();
  });

  it('does not throw when storage is unavailable, and reports the failed write', () => {
    const fail = () => {
      throw new DOMException('denied', 'SecurityError');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(fail);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(fail);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(fail);
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    expect(setToken('abc')).toBe(false);
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
    expect(getToken()).toBeNull();
    expect(() => {
      clearToken();
    }).not.toThrow();
  });
});

describe('subscribe', () => {
  it('notifies on setToken and clearToken', () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    setToken('abc');
    expect(listener).toHaveBeenCalledTimes(1);
    clearToken();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it('notifies on a storage event for the token key from another tab', () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    window.dispatchEvent(new StorageEvent('storage', { key: TOKEN_STORAGE_KEY }));
    expect(listener).toHaveBeenCalledTimes(1);

    // Another tab calling localStorage.clear() sends key === null.
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it('ignores storage events for other keys', () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    window.dispatchEvent(new StorageEvent('storage', { key: 'alumni.theme' }));
    expect(listener).not.toHaveBeenCalled();

    unsubscribe();
  });

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    unsubscribe();

    setToken('abc');
    clearToken();
    window.dispatchEvent(new StorageEvent('storage', { key: TOKEN_STORAGE_KEY }));
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('isTokenExpired', () => {
  it('is false for an exp in the future (beyond the leeway)', () => {
    expect(isTokenExpired(makeToken({ exp: nowSec + 3600 }), NOW)).toBe(false);
  });

  it('is true for an exp in the past', () => {
    expect(isTokenExpired(makeToken({ exp: nowSec - 1 }), NOW)).toBe(true);
  });

  it('is true within the 10 s leeway and false just past it', () => {
    expect(isTokenExpired(makeToken({ exp: nowSec + 10 }), NOW)).toBe(true);
    expect(isTokenExpired(makeToken({ exp: nowSec + 5 }), NOW)).toBe(true);
    expect(isTokenExpired(makeToken({ exp: nowSec + 11 }), NOW)).toBe(false);
  });

  it('is true when exp is missing or not a finite number', () => {
    expect(isTokenExpired(makeToken({ sub: 1 }), NOW)).toBe(true);
    expect(isTokenExpired(makeToken({ exp: String(nowSec + 3600) }), NOW)).toBe(true);
    expect(isTokenExpired(makeToken({ exp: null }), NOW)).toBe(true);
    // JSON can't carry Infinity; 1e400 parses to it.
    expect(isTokenExpired(makeToken('{"exp":1e400}'), NOW)).toBe(true);
  });

  it('is true for malformed tokens', () => {
    expect(isTokenExpired('', NOW)).toBe(true);
    expect(isTokenExpired('not-a-jwt', NOW)).toBe(true);
    expect(isTokenExpired('a.!!!.c', NOW)).toBe(true);
    expect(isTokenExpired(makeToken('not json'), NOW)).toBe(true);
    expect(isTokenExpired(makeToken('null'), NOW)).toBe(true);
    expect(isTokenExpired(makeToken('42'), NOW)).toBe(true);
  });

  it('decodes unpadded base64url payloads that use - and _', () => {
    // '?>?' encodes to base64 'Pz4/' → base64url 'Pz4_'; payload lengths vary the padding.
    for (const filler of ['', 'a', 'ab', '?>?', 'ü']) {
      const token = makeToken({ exp: nowSec + 3600, filler });
      expect(token.split('.')[1]).not.toMatch(/=/);
      expect(isTokenExpired(token, NOW)).toBe(false);
    }
    const urlSafe = makeToken({ exp: nowSec + 3600, filler: '?>?>?>' });
    expect(urlSafe).toMatch(/[-_]/);
    expect(isTokenExpired(urlSafe, NOW)).toBe(false);
  });

  it('defaults nowMs to the current time', () => {
    const realNowSec = Math.floor(Date.now() / 1000);
    expect(isTokenExpired(makeToken({ exp: realNowSec + 3600 }))).toBe(false);
    expect(isTokenExpired(makeToken({ exp: realNowSec - 3600 }))).toBe(true);
  });
});

describe('getTokenExpiresAt', () => {
  it('is exp minus the 10 s leeway, in milliseconds', () => {
    expect(getTokenExpiresAt(makeToken({ exp: nowSec + 3600 }))).toBe(NOW + 3_590_000);
  });

  it('is null for a malformed token or a missing exp', () => {
    expect(getTokenExpiresAt('not-a-jwt')).toBeNull();
    expect(getTokenExpiresAt(makeToken({ sub: 1 }))).toBeNull();
  });
});

describe('getLiveToken', () => {
  const live = () => makeToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
  const expired = () => makeToken({ exp: Math.floor(Date.now() / 1000) - 3600 });

  it('returns null when no token is stored', () => {
    expect(getLiveToken()).toBeNull();
  });

  it('returns a stored live token', () => {
    const token = live();
    setToken(token);
    expect(getLiveToken()).toBe(token);
  });

  it('returns null for an expired or malformed token without side effects', () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    for (const token of [expired(), 'garbage']) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
      listener.mockClear();

      expect(getLiveToken()).toBeNull();
      expect(getToken()).toBe(token);
      expect(listener).not.toHaveBeenCalled();
    }

    unsubscribe();
  });
});
