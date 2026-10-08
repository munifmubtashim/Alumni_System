import { createStore } from 'jotai';
import { describe, expect, it, vi } from 'vitest';
import indexHtml from '../../index.html?raw';
import { setPrefersDark } from '@/test/setup';
import { THEME_STORAGE_KEY, isThemePreference, themePreferenceAtom } from './themeAtom';

// `getOnInit` reads storage when the module loads, so a page reload is modelled
// by re-importing the module after changing localStorage.
async function reloadAtom() {
  vi.resetModules();
  const module = await import('./themeAtom');
  return module.themePreferenceAtom;
}

describe('themePreferenceAtom', () => {
  it('defaults to system', () => {
    expect(createStore().get(themePreferenceAtom)).toBe('system');
  });

  it('writes the JSON-encoded choice to localStorage', () => {
    const store = createStore();
    store.set(themePreferenceAtom, 'dark');

    expect(store.get(themePreferenceAtom)).toBe('dark');
    expect(window.localStorage.getItem('alumni.theme')).toBe('"dark"');
  });

  it('reads a saved choice back after a reload', async () => {
    createStore().set(themePreferenceAtom, 'dark');

    const reloaded = await reloadAtom();
    expect(createStore().get(reloaded)).toBe('dark');
  });

  it.each([
    ['invalid JSON', 'not json{'],
    ['an unknown value', '"purple"'],
    ['a non-string value', '42'],
  ])('reads %s as system', async (_label, stored) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, stored);

    const reloaded = await reloadAtom();
    const store = createStore();
    expect(store.get(reloaded)).toBe('system');

    // Mounting re-reads storage; the value must still be validated.
    const unsubscribe = store.sub(reloaded, () => undefined);
    expect(store.get(reloaded)).toBe('system');
    unsubscribe();
  });

  it('falls back to system and keeps working when storage throws', async () => {
    const fail = () => {
      throw new DOMException('denied', 'SecurityError');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(fail);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(fail);

    const reloaded = await reloadAtom();
    const store = createStore();
    expect(store.get(reloaded)).toBe('system');
    expect(() => {
      store.set(reloaded, 'dark');
    }).not.toThrow();
    expect(store.get(reloaded)).toBe('dark');
  });

  it('accepts only the three preferences', () => {
    expect(['light', 'dark', 'system'].every(isThemePreference)).toBe(true);
    expect(isThemePreference('Dark')).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });
});

describe('index.html no-flash script', () => {
  const inlineScript = new DOMParser()
    .parseFromString(indexHtml, 'text/html')
    .querySelector('head script:not([src])')?.textContent;

  function injectScript(source: string) {
    const script = document.createElement('script');
    script.textContent = source;
    document.head.append(script);
    script.remove();
  }

  function runInlineScript() {
    if (!inlineScript) throw new Error('index.html has no inline <head> script');
    // Injected scripts run in jsdom's inner global, not the test global that
    // setup stubs, so pass the matchMedia stub across through the shared document.
    Object.assign(document, { matchMediaStub: window.matchMedia.bind(window) });
    injectScript('window.matchMedia = document.matchMediaStub;');
    injectScript(inlineScript);
  }

  it('reads the same storage key as the atom', () => {
    expect(inlineScript).toContain(`localStorage.getItem('${THEME_STORAGE_KEY}')`);
  });

  it.each([
    ['"dark"', false, 'dark'],
    ['"light"', true, 'light'],
    ['"system"', true, 'dark'],
    ['"system"', false, 'light'],
    [null, true, 'dark'],
  ])('stored %s with OS dark=%s sets data-theme=%s', (stored, osDark, expected) => {
    if (stored !== null) window.localStorage.setItem(THEME_STORAGE_KEY, stored);
    setPrefersDark(osDark);

    runInlineScript();
    expect(document.documentElement.dataset.theme).toBe(expected);
  });
});
