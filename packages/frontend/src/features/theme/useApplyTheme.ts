import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { themePreferenceAtom } from '@/store/themeAtom';

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

/**
 * Applies the saved theme preference to `<html data-theme>`. In `system` mode it
 * follows the OS setting live, listening for changes until the preference
 * changes or the caller unmounts. Call once, from the app shell.
 */
export function useApplyTheme(): void {
  const preference = useAtomValue(themePreferenceAtom);

  useEffect(() => {
    const root = document.documentElement;

    if (preference !== 'system') {
      root.dataset.theme = preference;
      return;
    }

    const darkScheme = window.matchMedia(DARK_SCHEME_QUERY);
    const applySystemTheme = () => {
      root.dataset.theme = darkScheme.matches ? 'dark' : 'light';
    };

    applySystemTheme();
    darkScheme.addEventListener('change', applySystemTheme);
    return () => {
      darkScheme.removeEventListener('change', applySystemTheme);
    };
  }, [preference]);
}
