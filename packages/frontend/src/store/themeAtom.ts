import { atomWithStorage, createJSONStorage } from 'jotai/utils';

export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * localStorage key for the saved theme preference. The inline no-flash script
 * in `index.html` reads the same key; a test keeps the two in sync.
 */
export const THEME_STORAGE_KEY = 'alumni.theme';

const DEFAULT_PREFERENCE: ThemePreference = 'system';

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

type ThemeStorage = ReturnType<typeof createJSONStorage<ThemePreference>>;

const jsonStorage = createJSONStorage<unknown>(() => window.localStorage);

// Wraps the JSON storage so a garbled or unknown stored value reads back as the
// default, and storage that throws (private mode, disabled) never breaks the app.
const themeStorage: ThemeStorage = {
  getItem(key, initialValue) {
    try {
      const value = jsonStorage.getItem(key, initialValue);
      return isThemePreference(value) ? value : initialValue;
    } catch {
      return initialValue;
    }
  },
  setItem(key, value) {
    try {
      jsonStorage.setItem(key, value);
    } catch {
      // Storage unavailable: the choice still applies for this page load.
    }
  },
  removeItem(key) {
    try {
      jsonStorage.removeItem(key);
    } catch {
      // Storage unavailable: nothing to remove.
    }
  },
  // Keeps other open tabs in sync when the preference changes in one of them.
  subscribe(key, callback, initialValue) {
    try {
      return jsonStorage.subscribe?.(
        key,
        (value) => {
          callback(isThemePreference(value) ? value : initialValue);
        },
        initialValue,
      );
    } catch {
      return undefined;
    }
  },
};

/**
 * The user's theme choice, persisted in localStorage. `getOnInit` reads storage
 * once when this module loads, so the first render already has the saved value.
 */
export const themePreferenceAtom = atomWithStorage<ThemePreference>(
  THEME_STORAGE_KEY,
  DEFAULT_PREFERENCE,
  themeStorage,
  { getOnInit: true },
);
