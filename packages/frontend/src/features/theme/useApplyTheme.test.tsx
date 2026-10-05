import { act, renderHook } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { setPrefersDark } from '@/test/setup';
import { themePreferenceAtom, type ThemePreference } from '@/store/themeAtom';
import { useApplyTheme } from './useApplyTheme';

function renderWithPreference(preference: ThemePreference) {
  const store = createStore();
  store.set(themePreferenceAtom, preference);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const result = renderHook(useApplyTheme, { wrapper });
  return { store, ...result };
}

function currentTheme() {
  return document.documentElement.dataset.theme;
}

describe('useApplyTheme', () => {
  it.each(['light', 'dark'] as const)('applies an explicit %s choice', (preference) => {
    setPrefersDark(preference === 'light');
    renderWithPreference(preference);
    expect(currentTheme()).toBe(preference);
  });

  it('follows the OS setting live in system mode', () => {
    renderWithPreference('system');
    expect(currentTheme()).toBe('light');

    setPrefersDark(true);
    expect(currentTheme()).toBe('dark');

    setPrefersDark(false);
    expect(currentTheme()).toBe('light');
  });

  it('stops listening to the OS once the user picks a theme', () => {
    const realMatchMedia = window.matchMedia.bind(window);
    const added: unknown[][] = [];
    const removed: unknown[][] = [];
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
      const list = realMatchMedia(query);
      const add = list.addEventListener.bind(list);
      const remove = list.removeEventListener.bind(list);
      list.addEventListener = (...args: Parameters<MediaQueryList['addEventListener']>) => {
        added.push(args);
        add(...args);
      };
      list.removeEventListener = (...args: Parameters<MediaQueryList['removeEventListener']>) => {
        removed.push(args);
        remove(...args);
      };
      return list;
    });

    const { store } = renderWithPreference('system');
    expect(added).toHaveLength(1);
    const [subscription] = added;
    expect(subscription?.[0]).toBe('change');
    expect(removed).toHaveLength(0);

    act(() => {
      store.set(themePreferenceAtom, 'light');
    });

    expect(removed).toEqual([subscription]);
    setPrefersDark(true);
    expect(currentTheme()).toBe('light');
  });

  it('removes the OS listener on unmount', () => {
    const { unmount } = renderWithPreference('system');
    unmount();

    setPrefersDark(true);
    expect(currentTheme()).toBe('light');
  });
});
