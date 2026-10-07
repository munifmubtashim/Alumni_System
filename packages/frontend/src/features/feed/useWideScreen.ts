import { useSyncExternalStore } from 'react';

/** The same breakpoint the feed's CSS uses for its desktop layout (48rem). */
const WIDE_QUERY = '(width >= 48rem)';

function subscribe(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => undefined;
  const list = window.matchMedia(WIDE_QUERY);
  list.addEventListener('change', onChange);
  return () => {
    list.removeEventListener('change', onChange);
  };
}

function getSnapshot(): boolean {
  // Without matchMedia (tests, very old browsers) assume the desktop layout.
  return typeof window.matchMedia !== 'function' || window.matchMedia(WIDE_QUERY).matches;
}

/** True at the desktop layout, false on a phone. Follows the window as it resizes. */
export function useWideScreen(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
