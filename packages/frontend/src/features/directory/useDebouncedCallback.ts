import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

export interface DebouncedCallback<Args extends unknown[]> {
  /** (Re)starts the timer; `fn` runs with these arguments once it ends. */
  run: (...args: Args) => void;
  /** Drops a pending call, if any. */
  cancel: () => void;
}

/**
 * Calls `fn` `delay` ms after the last `run`. Call it from an event handler,
 * not from an effect watching a debounced value: then any outside change can
 * `cancel` the pending call before it overwrites newer state (ADV-001).
 * The latest `fn` is used when the timer fires. Unmounting cancels.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number,
): DebouncedCallback<Args> {
  const fnRef = useRef(fn);
  useLayoutEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const debounced = useMemo<DebouncedCallback<Args>>(() => {
    const cancel = (): void => {
      if (timer.current !== undefined) {
        clearTimeout(timer.current);
        timer.current = undefined;
      }
    };
    const run = (...args: Args): void => {
      cancel();
      timer.current = setTimeout(() => {
        timer.current = undefined;
        fnRef.current(...args);
      }, delay);
    };
    return { run, cancel };
  }, [delay]);

  useEffect(() => debounced.cancel, [debounced]);

  return debounced;
}
