import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedCallback } from './useDebouncedCallback';

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls fn once, with the last arguments, after the delay', () => {
    const fn = vi.fn<(value: string) => void>();
    const { result } = renderHook(() => useDebouncedCallback(fn, 300));

    result.current.run('a');
    vi.advanceTimersByTime(200);
    result.current.run('ab');
    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('ab');
  });

  it('cancel drops the pending call', () => {
    const fn = vi.fn<(value: string) => void>();
    const { result } = renderHook(() => useDebouncedCallback(fn, 300));

    result.current.run('a');
    result.current.cancel();
    vi.advanceTimersByTime(1000);
    expect(fn).not.toHaveBeenCalled();

    result.current.cancel();
    result.current.run('b');
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledExactlyOnceWith('b');
  });

  it('unmounting cancels the pending call', () => {
    const fn = vi.fn<(value: string) => void>();
    const { result, unmount } = renderHook(() => useDebouncedCallback(fn, 300));

    result.current.run('a');
    unmount();
    vi.advanceTimersByTime(1000);
    expect(fn).not.toHaveBeenCalled();
  });

  it('uses the latest fn when the timer fires', () => {
    const first = vi.fn<(value: string) => void>();
    const second = vi.fn<(value: string) => void>();
    const { result, rerender } = renderHook(({ fn }) => useDebouncedCallback(fn, 300), {
      initialProps: { fn: first },
    });

    result.current.run('a');
    rerender({ fn: second });
    vi.advanceTimersByTime(300);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledExactlyOnceWith('a');
  });

  it('keeps the same run and cancel across renders', () => {
    const { result, rerender } = renderHook(({ fn }) => useDebouncedCallback(fn, 300), {
      initialProps: { fn: vi.fn() },
    });
    const before = result.current;
    rerender({ fn: vi.fn() });
    expect(result.current).toBe(before);
  });
});
