import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

type ChangeListener = (event: MediaQueryListEvent) => void;

const DARK_QUERY = '(prefers-color-scheme: dark)';

let prefersDark = false;
const listeners = new Set<{ query: string; listener: ChangeListener }>();

function matches(query: string): boolean {
  return query === DARK_QUERY ? prefersDark : false;
}

function createMediaQueryList(query: string): MediaQueryList {
  const mql = {
    media: query,
    get matches() {
      return matches(query);
    },
    onchange: null as MediaQueryList['onchange'],
    addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
      if (type === 'change' && typeof listener === 'function') {
        listeners.add({ query, listener });
      }
    },
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
      if (type !== 'change') return;
      for (const entry of listeners) {
        if (entry.query === query && entry.listener === listener) listeners.delete(entry);
      }
    },
    // Deprecated aliases some libraries still call.
    addListener(listener: ChangeListener | null) {
      if (listener) listeners.add({ query, listener });
    },
    removeListener(listener: ChangeListener | null) {
      for (const entry of listeners) {
        if (entry.query === query && entry.listener === listener) listeners.delete(entry);
      }
    },
    dispatchEvent() {
      return true;
    },
  };
  return mql;
}

/**
 * Flips the stubbed `prefers-color-scheme: dark` media query and fires its
 * `change` listeners, the way a browser does when the OS theme changes.
 * jsdom has no `matchMedia`, so every jsdom test gets this stub from setup.
 */
export function setPrefersDark(value: boolean): void {
  if (value === prefersDark) return;
  prefersDark = value;
  for (const { query, listener } of [...listeners]) {
    if (query !== DARK_QUERY) continue;
    listener({ matches: value, media: query } as MediaQueryListEvent);
  }
}

// Node-environment tests (scripts/**) load this file too; only touch the DOM
// when there is one.
const hasDom = typeof window !== 'undefined';

if (hasDom) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => createMediaQueryList(query),
  });
}

function resetDomState(): void {
  if (!hasDom) return;
  prefersDark = false;
  listeners.clear();
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
}

beforeEach(resetDomState);

afterEach(() => {
  if (hasDom) cleanup();
  resetDomState();
});
