import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useWideScreen } from './useWideScreen';

type Listener = () => void;

function stubMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<Listener>();
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      get matches() {
        return matches;
      },
      addEventListener: (_type: string, fn: Listener) => listeners.add(fn),
      removeEventListener: (_type: string, fn: Listener) => listeners.delete(fn),
    })),
  );
  return (next: boolean) => {
    matches = next;
    listeners.forEach((fn) => {
      fn();
    });
  };
}

describe('useWideScreen', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is true when matchMedia is missing', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(renderHook(() => useWideScreen()).result.current).toBe(true);
  });

  it('reads the query and follows the window', () => {
    const set = stubMatchMedia(false);
    const { result } = renderHook(() => useWideScreen());
    expect(result.current).toBe(false);
    act(() => {
      set(true);
    });
    expect(result.current).toBe(true);
  });
});
